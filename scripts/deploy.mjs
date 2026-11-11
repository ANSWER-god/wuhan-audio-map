/**
 * 一键更新公网网站：
 *   npm run deploy
 *
 * 流程：重新构建（自动重扫语料清单）→ 同步 dist 到部署目录 → 发布到 Vercel 生产环境。
 * 需要本机已登录 Vercel（vercel login）。
 */
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const DEPLOY_DIR = '.deploy-tmp/wuhan-corpus-map'

console.log('[deploy] 1/3 构建中…')
execSync('npm run build', { stdio: 'inherit' })

console.log('[deploy] 2/3 同步产物…')
mkdirSync(DEPLOY_DIR, { recursive: true })
for (const entry of readdirSync(DEPLOY_DIR)) {
  if (entry === '.vercel') continue // 保留项目链接
  rmSync(join(DEPLOY_DIR, entry), { recursive: true, force: true })
}
cpSync('dist', DEPLOY_DIR, { recursive: true })

console.log('[deploy] 3/3 发布到 Vercel…')
execSync('vercel deploy --prod --yes', { stdio: 'inherit', cwd: DEPLOY_DIR })

console.log('[deploy] 完成 → https://wuhan-corpus-map.vercel.app')
