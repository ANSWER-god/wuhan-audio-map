import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CorpusItem } from '@/types'
import { clipSrc, formatSize } from '@/hooks/useCorpus'

interface MediaViewerProps {
  /** 当前区可查看的素材（图片 / 视频） */
  items: CorpusItem[]
  /** 当前展示的素材 ID */
  currentId: string | null
  onNavigate: (item: CorpusItem) => void
  onClose: () => void
}

/** 图片 / 视频查看器：仅点击具体素材后打开，多张素材可左右翻页 */
export default function MediaViewer({ items, currentId, onNavigate, onClose }: MediaViewerProps) {
  const item = items.find((c) => c.id === currentId) ?? null
  const index = item ? items.findIndex((c) => c.id === item.id) : -1
  const [src, setSrc] = useState<string>('')

  const step = useCallback(
    (delta: number) => {
      if (!item || items.length < 2) return
      const next = (index + delta + items.length) % items.length
      onNavigate(items[next])
    },
    [item, items, index, onNavigate],
  )

  // 左右方向键翻页，Esc 关闭
  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item, step, onClose])

  useEffect(() => {
    if (!item) {
      setSrc('')
      return
    }
    if (item.blob) {
      const url = URL.createObjectURL(item.blob)
      setSrc(url)
      return () => URL.revokeObjectURL(url)
    }
    setSrc(clipSrc(item))
  }, [item])

  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#d8cbb2] bg-[#faf6ec] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-[#d8cbb2] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-kai text-lg text-[#2b2622]">{item.name}</p>
            <p className="flex items-center gap-1 text-xs text-[#8a7a64]">
              <MapPin className="h-3 w-3" />
              {item.district}
              {item.place ? ` · ${item.place}` : ''} · {formatSize(item.size)}
              {items.length > 1 && (
                <span className="ml-2 font-kai text-[#a63a2a]">
                  第 {index + 1} / {items.length} 件
                </span>
              )}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 text-[#8a7a64] hover:bg-[#a63a2a]/10 hover:text-[#a63a2a]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 内容 */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[#171310] p-2">
          {item.mediaType === 'image' && src && (
            <img
              src={src}
              alt={item.name}
              className="max-h-[70vh] w-auto max-w-full object-contain"
            />
          )}
          {item.mediaType === 'video' && src && (
            <video key={item.id} src={src} controls autoPlay className="max-h-[70vh] w-auto max-w-full" />
          )}

          {/* 翻页按钮 */}
          {items.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-[#faf6ec]/90 text-[#5c4f3e] shadow-md hover:bg-[#a63a2a] hover:text-[#faf6ec]"
                onClick={() => step(-1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-[#faf6ec]/90 text-[#5c4f3e] shadow-md hover:bg-[#a63a2a] hover:text-[#faf6ec]"
                onClick={() => step(1)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
