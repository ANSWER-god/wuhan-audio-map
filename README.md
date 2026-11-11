# 武汉语料库地图 · Wuhan Audio Corpus Atlas

以武汉市 13 个行政区地图为基底的交互式语料库网站：点击地图上的城区，
即可查看、播放该区域收录的语料音频。

## 功能

- 🗺️ 武汉 13 区交互式地图，各区按音频数量自动着色
- 🎵 按区组织语料音频，点击即播，支持上一条/下一条连续播放
- 📦 语料随网站静态发布，所有访客均可收听（无需后端服务器）
- 💾 支持本机临时导入音频试听（IndexedDB 存储，仅当前浏览器可见）
- 📊 顶栏实时统计：音频总数、覆盖区数、总存储量

## 技术栈

React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Leaflet

## 快速开始

```bash
npm install
npm run dev      # 开发预览，默认 http://localhost:3000
npm run build    # 生产构建，输出 dist/
```

## 收录语料（重要）

将素材按「区名 / 小地名」两级目录放入 `public/media/`（音频、视频、图片均可）：

```
public/media/武昌区/户部巷叫卖声.mp3        ← 直接放区目录下 = 区级素材
public/media/洪山区/光谷/光谷街景.jpg       ← 放在小地名文件夹下
```

- 区名文件夹必须是以下 13 个之一：
  江岸区 / 江汉区 / 硚口区 / 汉阳区 / 武昌区 / 青山区 / 洪山区 /
  东西湖区 / 汉南区 / 蔡甸区 / 江夏区 / 黄陂区 / 新洲区
- 小地名文件夹可自由命名（如 光谷、户部巷）
- 支持格式：音频 mp3/wav/m4a/aac/ogg/flac/opus/wma；
  视频 mp4/webm/mov 等；图片 jpg/png/gif/webp 等
- 每次 `npm run dev` / `npm run build` 会自动扫描该目录并重新生成
  语料清单 `public/data/corpus.json`，无需手工维护列表

当前武昌区下有一条 3 秒测试音，用于演示，收录真实语料后删除即可。

## 发布到公共网络

见 [DEPLOY.md](./DEPLOY.md)。

## 目录结构

```
├── public/
│   ├── audio/            # 语料音频（按区名分文件夹）
│   └── data/
│       ├── wuhan.json    # 武汉 13 区 GeoJSON 边界
│       └── corpus.json   # 语料清单（自动生成，勿手改）
├── scripts/generate-manifest.mjs  # 清单生成脚本
└── src/
    ├── pages/Home.tsx            # 主页面
    ├── components/
    │   ├── WuhanMap.tsx          # Leaflet 交互地图
    │   ├── DistrictPanel.tsx     # 区域音频面板
    │   └── PlayerBar.tsx         # 底部播放器
    ├── hooks/useCorpus.ts        # 语料数据管理（static + local）
    ├── lib/db.ts                 # IndexedDB（本机临时导入）
    └── types.ts
```
