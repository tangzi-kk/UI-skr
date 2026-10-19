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
