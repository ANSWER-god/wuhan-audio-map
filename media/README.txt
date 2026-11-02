# 语料素材放这里

按「区名 / 小地名」两级目录存放音频、视频、图片，例如：

```
public/media/武昌区/户部巷叫卖声.mp3        ← 直接放区目录下 = 区级素材
public/media/洪山区/光谷/光谷街景.jpg       ← 放在小地名文件夹下
public/media/江汉区/江汉关/江汉关钟声.wav
```

区名文件夹必须与地图数据中的名称完全一致，可选值：

江岸区 / 江汉区 / 硚口区 / 汉阳区 / 武昌区 / 青山区 / 洪山区 /
东西湖区 / 汉南区 / 蔡甸区 / 江夏区 / 黄陂区 / 新洲区

小地名文件夹可自由命名（如 光谷、户部巷、江汉关）。

支持格式：
- 音频：mp3 / wav / m4a / aac / ogg / flac / opus / wma
- 视频：mp4 / webm / mov / m4v / avi / mkv
- 图片：jpg / jpeg / png / gif / webp / bmp / heic

每次运行 `npm run dev` 或 `npm run build` 时会自动重新扫描本目录并生成语料清单，
无需手动维护任何列表文件。
