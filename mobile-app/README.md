# 📱 北极星多端看板 · 移动端工程 (Mobile App)

> **定位**：针对 REDMI K80（澎湃 OS 3.0）与移动端触屏深度优化的单体原生体验工程，解决移动端滑屏粘连、手势冲突与沉浸交互。

---

## 核心技术攻坚规范 (v1.5.6)

1. **触屏滑屏彻底解封**：
   - 彻底解除桌面端遗留的 `height: 100vh; overflow: hidden` 强制锁定；
   - 全链路放行原生 `touch-action: pan-y`，单指自然顺畅滚动。
2. **手势冲突消除**：
   - 为左右全屏切日/切周手势设立 10px 判定死区；
   - 时间块拖拽长按阈值精细调优为 **320ms**，彻底消除长按穿透与误触。
3. **卡片物理回弹**：
   - 底部抽屉与弹窗支持 **Pull-down to dismiss（下拉阻尼收起）** 交互动效。

---

## 目录结构

- **`mobile-app.html`**：移动端三中枢（⚡效率 / 🌱灵气 / 📊看板）单体架构主页；
- **`schedule.html`**：移动端沉浸日程流；
- **`mobile-style.css`**：移动端专属响应式样式；
- **`android-project/`**：Android 原生源码工程（包含 Java Native WebView 容器、`AndroidManifest.xml`、资源文件与内嵌离线 Web 资源包）。

---

## Android 工程编译指引

在 `android-project/` 目录下：
```bash
./gradlew assembleRelease
```
即可构建适配澎湃 OS 与标准 Android 设备的无边框沉浸式 APK。

---

## 🎨 ORBIT · K80 图标极简空间交互预览

- **[打开预览源码 / 下载单文件 HTML](previews/polaris-orbit-k80.html)** — 图标优先、低文字密度、深墨绿空间仪表；左侧四快捷图标、底部长胶囊与圆胶囊、可拖动快捷球、长按滑选花瓣菜单。
- 在 GitHub 文件详情页点击 **Download raw file** 保存到手机或电脑，然后用浏览器打开，即可实际体验手势和动效。此 HTML **无外部资源依赖**，支持离线打开。
- **这是独立可交互的设计原型**，操作数据仅留在当前浏览器本地；它不是正式 Android APK，不连接 Mac/飞书，不会替换移动 App 的正式入口。
