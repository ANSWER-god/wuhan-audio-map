import { useMemo } from 'react'
import { ChevronRight, MapPin, Music, Play, Trash2, Pause, Film, Image as ImageIcon, Landmark, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { CorpusItem } from '@/types'
import { formatDuration, formatSize } from '@/hooks/useCorpus'
import { DISTRICT_CARDS } from '@/lib/districtCards'
import { CORE_DISTRICTS } from '@/lib/districts'

interface DistrictPanelProps {
  district: string | null
  clips: CorpusItem[]
  counts: Record<string, number>
  currentClipId: string | null
  isPlaying: boolean
  onPlay: (clip: CorpusItem) => void
  onView: (clip: CorpusItem) => void
  onRemove: (clip: CorpusItem) => void
  onSelectDistrict: (district: string) => void
  onBack: () => void
}

const TYPE_META = {
  audio: { icon: Music, label: '音频' },
  video: { icon: Film, label: '视频' },
  image: { icon: ImageIcon, label: '图片' },
} as const

export default function DistrictPanel({
  district,
  clips,
  counts,
  currentClipId,
  isPlaying,
  onPlay,
  onView,
  onRemove,
  onSelectDistrict,
  onBack,
}: DistrictPanelProps) {

  /** 按小地名分组：null 组（区级素材）在前，其余按小地名音序 */
  const groups = useMemo(() => {
    const map = new Map<string | null, CorpusItem[]>()
    for (const c of clips) {
      const key = c.place ?? null
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === null) return -1
      if (b === null) return 1
      return a.localeCompare(b, 'zh')
    })
  }, [clips])

  let rowIndex = 0

  if (!district) {
    return (
      <aside className="relative flex h-full w-full flex-col overflow-hidden border-l border-[#d8cbb2] bg-[#faf6ec]/70">
        <span
          aria-hidden="true"
          className="absolute right-5 top-10 font-kai text-base tracking-[0.35em] text-[#cbb899] [writing-mode:vertical-rl]"
        >
          江城声韵
        </span>

        <div className="px-7 pb-5 pt-6">
          <div className="mb-4 flex h-14 w-14 rotate-3 items-center justify-center rounded-md border border-[#a63a2a]/30 bg-[#f2ecdd] shadow-sm">
            <MapPin className="h-7 w-7 text-[#a63a2a]" />
          </div>
          <p className="text-sm tracking-[0.18em] text-[#a63a2a]">语脉寻根 · 田野采音</p>
          <h2 className="mt-2 font-kai text-3xl leading-snug tracking-wide text-[#2b2622]">
            择一方水土
            <br />
            听一城回声
          </h2>
          <p className="mt-2 max-w-[290px] text-base leading-relaxed text-[#756650]">
            从街巷与市井出发，收藏武汉城区里的声音记忆。
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="mb-3 flex items-center justify-between border-t border-[#e0d3b8] pt-4">
            <h3 className="font-kai text-lg text-[#5c4f3e]">七区导览</h3>
            <span className="text-sm text-[#756650]">点击直接进入</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pb-2">
            {CORE_DISTRICTS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onSelectDistrict(name)}
                className="chu-list-button group flex min-h-16 cursor-pointer flex-col justify-center rounded-md border border-[#e0d3b8] bg-[#f2ecdd]/60 px-4 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#a63a2a]/45 hover:bg-[#f2ecdd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a63a2a]/60"
              >
                <span className="flex w-full items-center justify-between pl-3 font-kai text-base text-[#2b2622] group-hover:text-[#a63a2a]">
                  {name}
                  <ChevronRight className="h-4 w-4 text-[#cbb899] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#a63a2a]" />
                </span>
                <span className="mt-1 pl-3 text-xs text-[#756650]">{counts[name] ?? 0} 条语料</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mx-6 shrink-0 border-t border-[#e0d3b8] py-3">
          <div className="panel-food-stickers" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}images/hot-dry-noodles.svg`} alt="" />
            <img src={`${import.meta.env.BASE_URL}images/doupi.svg`} alt="" />
            <img src={`${import.meta.env.BASE_URL}images/mianwo.svg`} alt="" />
          </div>
          <p className="font-kai text-lg leading-relaxed text-[#5c4f3e]">
            “每一条乡音，都是城市留下的指纹。”
          </p>
          <p className="mt-1 text-xs tracking-[0.14em] text-[#756650]">语脉寻根团队 · 武汉语料采集计划</p>
        </div>
      </aside>
    )
  }

  const renderItem = (clip: CorpusItem) => {
    rowIndex += 1
    const isCurrent = clip.id === currentClipId
    const meta = TYPE_META[clip.mediaType]
    const TypeIcon = meta.icon
    const isAudio = clip.mediaType === 'audio'
    return (
      <li
        key={clip.id}
        className={`group flex items-center gap-3 px-4 py-3 transition-colors ${
          isCurrent ? 'bg-[#a63a2a]/10' : 'hover:bg-[#f2ecdd]'
        }`}
      >
        <Button
          size="icon"
          variant="ghost"
          className={`h-8 w-8 shrink-0 rounded-full ${
            isCurrent
              ? 'bg-[#a63a2a] text-[#faf6ec] hover:bg-[#8f3123]'
              : 'bg-[#e6dcc4] text-[#5c4f3e] hover:bg-[#a63a2a] hover:text-[#faf6ec]'
          }`}
          onClick={() => (isAudio ? onPlay(clip) : onView(clip))}
          title={isAudio ? '播放' : meta.label === '视频' ? '播放视频' : '查看图片'}
        >
          {isAudio ? (
            isCurrent && isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 translate-x-[1px]" />
            )
          ) : (
            <TypeIcon className="h-4 w-4" />
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <p
            className={`flex items-center gap-1.5 truncate text-sm ${
              isCurrent ? 'font-medium text-[#a63a2a]' : 'text-[#2b2622]'
            }`}
            title={clip.name}
          >
            <span className="truncate">
              {rowIndex}. {clip.name}
            </span>
            {clip.source === 'local' && (
              <span className="shrink-0 rounded bg-[#b98a2e]/15 px-1 py-px text-[10px] text-[#96702a]">
                本机
              </span>
            )}
          </p>
          <p className="text-xs text-[#8a7a64]">
            {meta.label}
            {isAudio ? ` · ${formatDuration(clip.duration)}` : ''} · {formatSize(clip.size)}
          </p>
        </div>
        {clip.source === 'local' && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-[#cbb899] opacity-0 transition-opacity hover:text-[#a63a2a] group-hover:opacity-100"
            onClick={() => onRemove(clip)}
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </li>
    )
  }

  return (
    <aside className="flex h-full w-full flex-col border-l border-[#d8cbb2] bg-[#faf6ec]/70">
      {/* 头部 */}
      <div className="border-b border-[#d8cbb2] p-5">
        <button
          type="button"
          onClick={onBack}
          className="group mb-3 flex cursor-pointer items-center gap-1.5 rounded-md border border-[#d8cbb2] bg-[#f2ecdd]/70 px-3 py-1.5 font-kai text-sm text-[#5c4f3e] transition-all duration-200 hover:-translate-x-0.5 hover:border-[#a63a2a]/50 hover:text-[#a63a2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a63a2a]/60"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          返回目录
        </button>
        <div className="flex items-center justify-between">
          <h2 className="font-kai text-3xl text-[#2b2622]">{district}</h2>
          <span className="rounded-md border border-[#a63a2a]/30 bg-[#a63a2a]/10 px-2 py-0.5 font-kai text-sm text-[#a63a2a]">
            {clips.length} 条语料
          </span>
        </div>
        {/* 方言名片 */}
        {(() => {
          const card = DISTRICT_CARDS[district]
          if (!card) return null
          return (
            <div className="mt-3 rounded-lg border border-[#e0d3b8] border-l-4 border-l-[#a63a2a] bg-[#f2ecdd]/90 px-3.5 py-3 shadow-sm">
              <p className="font-kai text-base leading-snug text-[#a63a2a]">「{card.phrase}」</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#5c4f3e]">{card.meaning}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#8a7a64]">{card.note}</p>
            </div>
          )
        })()}
        <p className="mt-3 text-xs text-[#8a7a64]">此地收录的方言语料（音频 / 视频 / 图片）</p>
      </div>

      {/* 语料列表（按小地名分组） */}
      <ScrollArea className="flex-1">
        {clips.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Music className="h-8 w-8 text-[#cbb899]" />
            <p className="font-kai text-sm text-[#8a7a64]">此地尚未收录素材，静候佳音</p>
          </div>
        ) : (
          groups.map(([place, items]) => (
            <div key={place ?? '_root'}>
              {place !== null && (
                <p className="flex items-center gap-1.5 border-b border-[#e6dcc4] bg-[#f2ecdd]/60 px-4 pb-1.5 pt-3 font-kai text-sm text-[#a63a2a]">
                  <Landmark className="h-3.5 w-3.5" />
                  {place}
                </p>
              )}
              <ul className="divide-y divide-[#e6dcc4]">{items.map(renderItem)}</ul>
            </div>
          ))
        )}
      </ScrollArea>
    </aside>
  )
}
