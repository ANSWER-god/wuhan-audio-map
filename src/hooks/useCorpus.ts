import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CorpusItem, CorpusManifest, MediaType } from '@/types'
import { deleteClip, getAllClips, saveClip } from '@/lib/db'

const AUDIO_EXTS = /\.(mp3|wav|m4a|aac|ogg|flac|opus|wma)$/i
const VIDEO_EXTS = /\.(mp4|webm|mov|m4v|avi|mkv)$/i
const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|bmp|heic)$/i

export function mediaTypeOf(file: File): MediaType | null {
  if (file.type.startsWith('audio/') || AUDIO_EXTS.test(file.name)) return 'audio'
  if (file.type.startsWith('video/') || VIDEO_EXTS.test(file.name)) return 'video'
  if (file.type.startsWith('image/') || IMAGE_EXTS.test(file.name)) return 'image'
  return null
}

const EXT_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  opus: 'audio/opus',
  wma: 'audio/x-ms-wma',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

function mimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_MIME[ext] ?? 'application/octet-stream'
}

/** 通过临时 <audio> 元素探测音频时长（秒），接受 Blob 或 URL */
function probeDuration(source: Blob | string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const isBlob = typeof source !== 'string'
    const url = isBlob ? URL.createObjectURL(source as Blob) : (source as string)
    const audio = new Audio()
    const finish = (d?: number) => {
      if (isBlob) URL.revokeObjectURL(url)
      resolve(d)
    }
    audio.onloadedmetadata = () =>
      finish(Number.isFinite(audio.duration) ? audio.duration : undefined)
    audio.onerror = () => finish(undefined)
    audio.src = url
  })
}

/** 可选的独立媒体地址：用于 GitHub Pages 网页 + 国内 COS 素材的部署组合 */
const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined)?.replace(/\/+$/, '')

function staticMediaSrc(url: string): string {
  return MEDIA_BASE ? `${MEDIA_BASE}/${url}` : `${import.meta.env.BASE_URL}${url}`
}

/** 静态语料的完整访问地址 */
export function clipSrc(clip: CorpusItem): string {
  if (clip.source === 'static' && clip.url) return staticMediaSrc(clip.url)
  return ''
}

/**
 * 语料库数据 Hook：
 * - static：加载 public/data/corpus.json 中的内置语料（随站点发布，全员可见）
 * - local：本机浏览器通过面板导入的素材（IndexedDB 持久化，仅本机可见）
 */
export function useCorpus() {
  const [staticClips, setStaticClips] = useState<CorpusItem[]>([])
  const [localClips, setLocalClips] = useState<CorpusItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loadStatic = fetch(`${import.meta.env.BASE_URL}data/corpus.json`)
      .then((r) => (r.ok ? r.json() : { clips: [] }))
      .then(async (manifest: CorpusManifest) => {
        const clips: CorpusItem[] = await Promise.all(
          manifest.clips.map(async (c, i) => ({
            id: c.id,
            district: c.district,
            place: c.place ?? null,
            name: c.name,
            mediaType: c.mediaType,
            mimeType: mimeFromName(c.url),
            size: c.size,
            // 仅音频探测时长
            duration: c.mediaType === 'audio' ? await probeDuration(staticMediaSrc(c.url)) : undefined,
            createdAt: i, // 保持清单顺序
            source: 'static' as const,
            url: c.url,
          })),
        )
        setStaticClips(clips)
      })
      .catch(() => setStaticClips([]))

    const loadLocal = getAllClips()
      .then((list) => setLocalClips(list.map((c) => ({ ...c, source: 'local' as const }))))
      .catch(() => setLocalClips([]))

    Promise.all([loadStatic, loadLocal]).finally(() => setLoaded(true))
  }, [])

  /** 将一批素材文件临时导入到指定区（仅存本机浏览器） */
  const importFiles = useCallback(async (district: string, files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => mediaTypeOf(f) !== null)
    const added: CorpusItem[] = []
    for (const file of list) {
      const mediaType = mediaTypeOf(file)!
      const duration = mediaType === 'audio' ? await probeDuration(file) : undefined
      const clip: CorpusItem = {
        id: crypto.randomUUID(),
        district,
        place: null,
        name: file.name.replace(/\.[^.]+$/, ''),
        mediaType,
        mimeType: file.type || mimeFromName(file.name),
        size: file.size,
        duration,
        createdAt: Date.now(),
        source: 'local',
        blob: file,
      }
      await saveClip(clip)
      added.push(clip)
    }
    if (added.length > 0) setLocalClips((prev) => [...prev, ...added])
    return added.length
  }, [])

  /** 删除本机导入的素材（static 语料不可删除） */
  const removeClip = useCallback(async (id: string) => {
    await deleteClip(id)
    setLocalClips((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const clips = useMemo(() => [...staticClips, ...localClips], [staticClips, localClips])

  /** 每个区的素材数量 */
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of clips) map[c.district] = (map[c.district] ?? 0) + 1
    return map
  }, [clips])

  const totalSize = useMemo(() => clips.reduce((sum, c) => sum + c.size, 0), [clips])

  return { clips, loaded, counts, totalSize, importFiles, removeClip }
}

export function formatDuration(seconds?: number): string {
  if (seconds == null || !Number.isFinite(seconds)) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
