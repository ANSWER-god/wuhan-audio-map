import { useEffect, useMemo, useState } from 'react'
import { MapContainer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { DistrictProperties } from '@/types'
import { CORE_DISTRICT_SET } from '@/lib/districts'

type DistrictFeature = Feature<Geometry, DistrictProperties>
type DistrictFC = FeatureCollection<Geometry, DistrictProperties>

interface WuhanMapProps {
  /** 每个区的音频数量，用于着色 */
  counts: Record<string, number>
  /** 当前选中的区名 */
  selected: string | null
  /** 点击某个区时回调 */
  onSelect: (district: string) => void
}

/**
 * 根据音频数量在宣纸米白 → 赭石 → 朱砂之间插值
 * 无音频：淡宣纸色，勾勒墨线即可
 */
function fillColor(count: number, max: number): string {
  if (count <= 0) return '#e9dfc9'
  const t = Math.min(1, 0.3 + (0.7 * count) / Math.max(max, 1))
  // 赭石 #d9b48a -> 朱砂 #a63a2a
  const from = [217, 180, 138]
  const to = [166, 58, 42]
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

function FitBounds({ data }: { data: DistrictFC }) {
  const map = useMap()
  useEffect(() => {
    const bounds = L.geoJSON(data).getBounds()
    map.fitBounds(bounds, { padding: [48, 48], animate: false })
    map.setMaxBounds(bounds.pad(0.35))
  }, [data, map])
  return null
}

export default function WuhanMap({ counts, selected, onSelect }: WuhanMapProps) {
  const [geoData, setGeoData] = useState<DistrictFC | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/wuhan.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d: DistrictFC) =>
        setGeoData({
          ...d,
          features: d.features.filter((feature) => CORE_DISTRICT_SET.has(feature.properties.name)),
        }),
      )
      .catch((e: Error) => setError(e.message))
  }, [])

  const maxCount = useMemo(() => Math.max(0, ...Object.values(counts)), [counts])

  /** 选中态/数量变化时整体重挂 GeoJSON 层；悬停态在事件里就地 setStyle，避免闪烁 */
  const layerKey = useMemo(
    () => `${selected ?? ''}|${maxCount}|${Object.values(counts).reduce((a, b) => a + b, 0)}`,
    [selected, maxCount, counts],
  )

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#a63a2a]">
        地图数据加载失败：{error}
      </div>
    )
  }
  if (!geoData) {
    return (
      <div className="flex h-full items-center justify-center font-kai text-sm text-[#8a7a64]">
        正在铺展江城舆图……
      </div>
    )
  }

  const baseStyle = (feature?: DistrictFeature): L.PathOptions => {
    const name = feature?.properties.name ?? ''
    const count = counts[name] ?? 0
    const isSelected = name === selected
    return {
      fillColor: fillColor(count, maxCount),
      fillOpacity: isSelected ? 0.96 : 0.8,
      color: isSelected ? '#8f3123' : '#a5947a',
      weight: isSelected ? 2.5 : 1,
      opacity: 1,
    }
  }

  return (
    <div className="map-stage relative h-full w-full overflow-hidden">
      <MapContainer
        className="map-canvas h-full w-full"
        zoomControl={true}
        attributionControl={false}
        scrollWheelZoom={true}
        minZoom={8}
        zoomSnap={0.25}
        zoomDelta={0.5}
      >
        <FitBounds data={geoData} />
        <GeoJSON
          key={layerKey}
          data={geoData}
          style={baseStyle}
          onEachFeature={(feature: DistrictFeature, layer: L.Layer) => {
            const name = feature.properties.name
            const count = counts[name] ?? 0
            const path = layer as L.Path

            layer.bindTooltip(
              `<div class="district-label-inner"><strong>${name}</strong><span>${count} 条语料</span></div>`,
              {
                permanent: true,
                direction: 'center',
                className: 'district-label',
                interactive: false,
                opacity: 1,
              },
            )

            layer.on({
              add: () => {
                const element = path.getElement()
                if (!element) return
                element.classList.add('district-shape')
                if (name === selected) element.classList.add('is-selected')
                element.setAttribute('tabindex', '0')
                element.setAttribute('role', 'button')
                element.setAttribute('aria-label', `${name}，${count} 条语料`)
                element.addEventListener('keydown', (event) => {
                  const key = (event as KeyboardEvent).key
                  if (key === 'Enter' || key === ' ') {
                    event.preventDefault()
                    onSelect(name)
                  }
                })
              },
              mouseover: () => {
                path.setStyle({ fillOpacity: 0.96, color: '#a63a2a', weight: 2 })
                path.getElement()?.classList.add('is-hovered')
                path.bringToFront()
              },
              mouseout: () => {
                path.setStyle(baseStyle(feature))
                path.getElement()?.classList.remove('is-hovered')
              },
              click: () => onSelect(name),
            })
          }}
        />
      </MapContainer>

      <div className="pointer-events-none absolute left-16 top-5 z-[500] border-l border-[#a63a2a]/40 pl-3">
        <p className="gilt-text font-kai text-4xl tracking-[0.18em]" data-text="江城舆图">江城舆图</p>
        <p className="mt-1 text-base tracking-[0.16em] text-[#756650]">七区有声 · 一步一乡音</p>
      </div>

      <figure className="map-food-sticker" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}images/hot-dry-noodles.svg`} alt="" />
        <figcaption>过早热干面</figcaption>
      </figure>

      <figure className="map-tower-sticker" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}images/yellow-crane-tower.svg`} alt="" />
        <figcaption>黄鹤楼</figcaption>
      </figure>

      <figure className="map-sakura-sticker" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}images/sakura.svg`} alt="" />
        <figcaption>珞珈樱花</figcaption>
      </figure>

      <figure className="map-bianzhong-sticker" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}images/bianzhong.svg`} alt="" />
        <figcaption>编钟</figcaption>
      </figure>

      <figure className="map-soup-sticker" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}images/lotus-soup.svg`} alt="" />
        <figcaption>排骨藕汤</figcaption>
      </figure>

      <figure className="map-bridge-sticker" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}images/yangtze-bridge.svg`} alt="" />
        <figcaption>长江大桥</figcaption>
      </figure>

      <div className="pointer-events-none absolute bottom-6 right-6 z-[500] flex items-end gap-3 text-right">
        <div>
          <p className="font-kai text-xl tracking-[0.12em] text-[#5c4f3e]">一街一巷，皆有回声</p>
          <p className="mt-1 text-sm tracking-[0.12em] text-[#756650]">语脉寻根 · 田野采音</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#a63a2a]/60 font-kai text-base leading-none text-[#a63a2a]">
          语脉
        </span>
      </div>
    </div>
  )
}
