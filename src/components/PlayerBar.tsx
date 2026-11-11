import { useEffect, useRef, useState } from 'react'
import { Pause, Play, SkipBack, SkipForward, Volume2, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { AudioClip } from '@/types'
import { clipSrc, formatDuration } from '@/hooks/useCorpus'

interface PlayerBarProps {
  clip: AudioClip | null
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  onPlayStateChange?: (playing: boolean) => void
}

export default function PlayerBar({
  clip,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onPlayStateChange,
}: PlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)

  const setPlayingBoth = (p: boolean) => {
    setPlaying(p)
    onPlayStateChange?.(p)
  }

  // 切换音频时重建播放元素
  useEffect(() => {
    if (!clip) return
    // static 语料直接引用站点资源；local 语料从 Blob 生成临时地址
    const blobUrl = clip.blob ? URL.createObjectURL(clip.blob) : null
    const url = blobUrl ?? clipSrc(clip)
    const audio = new Audio(url)
    audioRef.current = audio
    audio.volume = volume
    setCurrentTime(0)
    setDuration(clip.duration ?? 0)

    audio.ontimeupdate = () => setCurrentTime(audio.currentTime)
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }
    audio.onended = () => onNext()
    audio
      .play()
      .then(() => setPlayingBoth(true))
      .catch(() => setPlayingBoth(false))

    return () => {
      audio.pause()
      audioRef.current = null
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip?.id])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlayingBoth(false)
    } else {
      void audio.play().then(() => setPlayingBoth(true))
    }
  }

  const seek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(duration) || duration <= 0) return
    audio.currentTime = (value[0] / 100) * duration
    setCurrentTime(audio.currentTime)
  }

  const changeVolume = (value: number[]) => {
    const v = value[0] / 100
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }

  return (
    <footer className="flex h-20 items-center gap-4 border-t border-[#d8cbb2] bg-[#faf6ec]/90 px-5 backdrop-blur">
      {/* 当前音频信息 */}
      <div className="flex w-64 min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            clip ? 'bg-[#a63a2a]/15 text-[#a63a2a]' : 'bg-[#e6dcc4] text-[#cbb899]'
          }`}
        >
          <Music className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-kai text-sm text-[#2b2622]">
            {clip ? clip.name : '未在播放'}
          </p>
          <p className="truncate text-xs text-[#8a7a64]">
            {clip ? clip.district : '点击舆图区域或列表中的音频，即可聆听'}
          </p>
        </div>
      </div>

      {/* 播放控制 */}
      <div className="flex flex-1 flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-[#8a7a64] hover:bg-[#a63a2a]/10 hover:text-[#a63a2a] disabled:opacity-30"
            disabled={!hasPrev}
            onClick={onPrev}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-[#a63a2a] text-[#faf6ec] shadow-md hover:bg-[#8f3123] disabled:opacity-30"
            disabled={!clip}
            onClick={togglePlay}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-[#8a7a64] hover:bg-[#a63a2a]/10 hover:text-[#a63a2a] disabled:opacity-30"
            disabled={!hasNext}
            onClick={onNext}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2">
          <span className="w-10 text-right text-xs tabular-nums text-[#8a7a64]">
            {formatDuration(currentTime)}
          </span>
          <Slider
            value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
            onValueChange={seek}
            max={100}
            step={0.1}
            disabled={!clip}
            className="flex-1 [&_[data-slot=slider-range]]:bg-[#a63a2a] [&_[data-slot=slider-thumb]]:border-[#a63a2a]"
          />
          <span className="w-10 text-xs tabular-nums text-[#8a7a64]">
            {formatDuration(duration || clip?.duration)}
          </span>
        </div>
      </div>

      {/* 音量 */}
      <div className="hidden w-40 items-center gap-2 md:flex">
        <Volume2 className="h-4 w-4 shrink-0 text-[#8a7a64]" />
        <Slider
          value={[volume * 100]}
          onValueChange={changeVolume}
          max={100}
          step={1}
          className="[&_[data-slot=slider-range]]:bg-[#a63a2a] [&_[data-slot=slider-thumb]]:border-[#a63a2a]"
        />
      </div>
    </footer>
  )
}
