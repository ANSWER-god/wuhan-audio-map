import { useCallback, useMemo, useState } from 'react'
import { AudioLines, Database, MapPinned } from 'lucide-react'
import WuhanMap from '@/components/WuhanMap'
import DistrictPanel from '@/components/DistrictPanel'
import PlayerBar from '@/components/PlayerBar'
import MediaViewer from '@/components/MediaViewer'
import { useCorpus, formatSize } from '@/hooks/useCorpus'
import type { CorpusItem } from '@/types'

export default function Home() {
  const { clips, counts, totalSize, removeClip } = useCorpus()
  const [selected, setSelected] = useState<string | null>(null)
  const [currentClipId, setCurrentClipId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewItem, setViewItem] = useState<CorpusItem | null>(null)

  /** 当前选中区的全部素材（面板展示用） */
  const districtItems = useMemo(
    () => clips.filter((c) => c.district === selected),
    [clips, selected],
  )

  /** 底部播放器的音频队列（仅音频参与上一条/下一条） */
  const audioQueue = useMemo(
    () => districtItems.filter((c) => c.mediaType === 'audio'),
    [districtItems],
  )

  /** 当前区可弹窗查看的素材（图片 / 视频） */
  const viewableItems = useMemo(
    () => districtItems.filter((c) => c.mediaType !== 'audio'),
    [districtItems],
  )

  /** 点击城区只展开右侧素材列表；点击具体素材后才播放或查看 */
  const handleSelectDistrict = useCallback((name: string) => {
    setSelected(name)
    setViewItem(null)
  }, [])

  /** 返回七区导览目录 */
  const handleBack = useCallback(() => {
    setSelected(null)
    setViewItem(null)
  }, [])

  const currentIndex = useMemo(
    () => audioQueue.findIndex((c) => c.id === currentClipId),
    [audioQueue, currentClipId],
  )
  const currentClip = currentIndex >= 0 ? audioQueue[currentIndex] : null

  const handlePlay = useCallback((clip: CorpusItem) => {
    setSelected(clip.district)
    setCurrentClipId(clip.id)
  }, [])

  const handleRemove = useCallback(
    (clip: CorpusItem) => {
      if (clip.id === currentClipId) setCurrentClipId(null)
      if (viewItem?.id === clip.id) setViewItem(null)
      void removeClip(clip.id)
    },
    [currentClipId, viewItem, removeClip],
  )

  const step = useCallback(
    (delta: number) => {
      if (audioQueue.length === 0) return
      const next =
        currentIndex < 0 ? 0 : (currentIndex + delta + audioQueue.length) % audioQueue.length
      setCurrentClipId(audioQueue[next].id)
    },
    [audioQueue, currentIndex],
  )

  const coveredDistricts = Object.values(counts).filter((n) => n > 0).length

  return (
    <div className="ink-app flex h-screen flex-col text-[#2b2622]">
      {/* 顶栏 */}
      <header className="flex h-24 shrink-0 items-center justify-between border-b border-[#cbb899] bg-[#faf6ec]/80 px-7 backdrop-blur">
        <div className="flex items-center gap-4">
          {/* 印章式标识 */}
          <div className="flex h-14 w-14 rotate-3 items-center justify-center rounded-md bg-[#a63a2a] shadow-md">
            <span className="font-kai text-4xl leading-none text-[#faf6ec]">语</span>
          </div>
          <div>
            <h1 className="gilt-text font-kai text-4xl leading-tight tracking-[0.08em]" data-text="武汉语料库地图">武汉语料库地图</h1>
            <p className="mt-1 text-base text-[#756650]">
              <span className="font-kai text-[#a63a2a]">语脉寻根团队</span>
              <span className="mx-1.5 text-[#b49a6c]">·</span>
              江城声韵 · 方言存真 —— 按城区采集与回放
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-base">
          <div className="flex items-center gap-2 text-[#756650]">
            <AudioLines className="h-5 w-5 text-[#a63a2a]" />
            <span>
              语料 <strong className="font-kai text-[#2b2622]">{clips.length}</strong> 条
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#756650]">
            <MapPinned className="h-5 w-5 text-[#a63a2a]" />
            <span>
              覆盖 <strong className="font-kai text-[#2b2622]">{coveredDistricts}</strong> / 7 区
            </span>
          </div>
          <div className="hidden items-center gap-2 text-[#756650] sm:flex">
            <Database className="h-5 w-5 text-[#a63a2a]" />
            <span>
              存储 <strong className="font-kai text-[#2b2622]">{formatSize(totalSize)}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* 主区域 */}
      <main className="flex min-h-0 flex-1">
        {/* 地图 */}
        <div className="relative flex-1">
          <WuhanMap counts={counts} selected={selected} onSelect={handleSelectDistrict} />
          {/* 图例 */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-lg border border-[#d8cbb2] bg-[#faf6ec]/90 px-3 py-2 text-xs text-[#8a7a64] shadow-sm backdrop-blur">
            <p className="mb-1.5 font-kai text-[#5c4f3e]">各区语料数量</p>
            <div className="flex items-center gap-2">
              <span>少</span>
              <div
                className="h-2.5 w-28 rounded-full"
                style={{
                  background:
                    'linear-gradient(to right, #e6dcc4, #d9b48a, #a63a2a)',
                }}
              />
              <span>多</span>
            </div>
          </div>
        </div>

        {/* 区域面板 */}
        <div className="w-[420px] shrink-0">
          <DistrictPanel
            district={selected}
            clips={districtItems}
            counts={counts}
            currentClipId={currentClipId}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onView={setViewItem}
            onRemove={handleRemove}
            onSelectDistrict={handleSelectDistrict}
            onBack={handleBack}
          />
        </div>
      </main>

      {/* 播放器 */}
      <PlayerBar
        clip={currentClip}
        hasPrev={audioQueue.length > 1}
        hasNext={audioQueue.length > 1}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onPlayStateChange={setIsPlaying}
      />

      {/* 图片 / 视频查看器（仅点击具体素材后打开） */}
      <MediaViewer
        items={viewableItems}
        currentId={viewItem?.id ?? null}
        onNavigate={setViewItem}
        onClose={() => setViewItem(null)}
      />
    </div>
  )
}
