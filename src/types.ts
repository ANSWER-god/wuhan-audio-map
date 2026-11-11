/** 素材类型 */
export type MediaType = 'audio' | 'video' | 'image'

/** 一条语料素材记录（音频 / 视频 / 图片） */
export interface CorpusItem {
  /** 唯一 ID */
  id: string
  /** 所属行政区名称，如「武昌区」 */
  district: string
  /** 小地名，如「光谷」；区级素材为 null */
  place?: string | null
  /** 展示标题（默认取文件名去掉扩展名） */
  name: string
  /** 素材类型 */
  mediaType: MediaType
  /** MIME 类型 */
  mimeType: string
  /** 文件大小（字节） */
  size: number
  /** 时长（秒），音频加载时自动探测，可能为空 */
  duration?: number
  /** 导入/收录时间戳 */
  createdAt: number
  /**
   * 数据来源：
   * - static：随网站发布的内置语料（public/media/ 目录），所有访客可见
   * - local：本机浏览器临时导入的素材（IndexedDB），仅当前浏览器可见
   */
  source: 'static' | 'local'
  /** static 语料的访问路径（相对站点根目录） */
  url?: string
  /** local 语料的二进制内容（存入 IndexedDB） */
  blob?: Blob
}

/** 兼容旧引用 */
export type AudioClip = CorpusItem

/** 静态语料清单文件（public/data/corpus.json）的结构 */
export interface CorpusManifest {
  generatedAt: string
  clips: Array<{
    id: string
    district: string
    place?: string | null
    name: string
    url: string
    size: number
    mediaType: MediaType
  }>
}

/** 武汉 GeoJSON 中每个区要素的属性 */
export interface DistrictProperties {
  name: string
  adcode: number
  center?: [number, number]
  centroid?: [number, number]
  [key: string]: unknown
}
