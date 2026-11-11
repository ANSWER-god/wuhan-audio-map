/**
 * 语料清单生成脚本
 *
 * 扫描 public/media/<区名>/[小地名/]<文件>，生成 public/data/corpus.json。
 * 在 npm run dev / npm run build 之前自动执行（predev / prebuild 钩子）。
 *
 * 目录结构（音频 / 视频 / 图片均可）：
 *   public/media/武昌区/户部巷叫卖声.mp3        ← 直接放区目录下，表示区级素材
 *   public/media/洪山区/光谷/光谷街景.jpg       ← 放在小地名文件夹下
 *   public/media/江汉区/江汉关/江汉关钟声.wav
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const MEDIA_DIR = 'public/media'
const OUT_FILE = 'public/data/corpus.json'

const TYPE_BY_EXT = {
  audio: ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.opus', '.wma'],
  video: ['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic'],
}

function mediaTypeOf(file) {
  const ext = extname(file).toLowerCase()
  for (const [type, exts] of Object.entries(TYPE_BY_EXT)) {
    if (exts.includes(ext)) return type
  }
  return null
}

const clips = []

if (existsSync(MEDIA_DIR)) {
  for (const district of readdirSync(MEDIA_DIR)) {
    const districtDir = join(MEDIA_DIR, district)
    if (!statSync(districtDir).isDirectory()) continue

    for (const entry of readdirSync(districtDir)) {
      const entryPath = join(districtDir, entry)
      const stat = statSync(entryPath)

      if (stat.isFile()) {
        // 区级素材：public/media/<区名>/<文件>
        const type = mediaTypeOf(entry)
        if (!type) continue
        clips.push(makeClip(district, null, entry, stat.size, type))
      } else if (stat.isDirectory()) {
        // 小地名素材：public/media/<区名>/<小地名>/<文件>
        for (const file of readdirSync(entryPath)) {
          const filePath = join(entryPath, file)
          if (!statSync(filePath).isFile()) continue
          const type = mediaTypeOf(file)
          if (!type) continue
          clips.push(makeClip(district, entry, file, statSync(filePath).size, type))
        }
      }
    }
  }
} else {
  mkdirSync(MEDIA_DIR, { recursive: true })
}

function makeClip(district, place, file, size, mediaType) {
  const segs = place ? [district, place, file] : [district, file]
  return {
    id: `static-${segs.join('-')}`,
    district,
    place,
    name: file.replace(/\.[^.]+$/, ''),
    url: `media/${segs.map(encodeURIComponent).join('/')}`,
    size,
    mediaType,
  }
}

clips.sort(
  (a, b) =>
    a.district.localeCompare(b.district, 'zh') ||
    String(a.place ?? '').localeCompare(String(b.place ?? ''), 'zh') ||
    a.name.localeCompare(b.name, 'zh'),
)

writeFileSync(
  OUT_FILE,
  JSON.stringify({ generatedAt: new Date().toISOString(), clips }, null, 2),
  'utf-8',
)
console.log(`[corpus] 已生成清单：${clips.length} 条静态语料 -> ${OUT_FILE}`)
