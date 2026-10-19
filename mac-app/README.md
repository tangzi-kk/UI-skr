# 🖥️ 北极星多端看板 · macOS 桌面端工程 (Mac App)

> **定位**：运行于 macOS 桌面优先（支持浏览器与 AppKit/Menubar 独立包装）的高确定性执行看板，无构建依赖纯原生 React 架构。

---

## 核心页面与功能导航

| 页面文件 | 定位与核心功能 | 运行方式 |
| :--- | :--- | :--- |
| **`architecture.html`** | **全系统字符线框检视台**：4 级目录树、三大中枢 17 个子页面 Unicode 线框，**支持网页直接打字编辑并按 Cmd+S 永久落盘服务器磁盘**。 | 访问 `http://192.168.1.5:8080/architecture.html` |
| **`index.html`** | **桌面端主控台**：年度 365 天像素全景、24 小时微色条时间块流、Things 3 式“今日吃青蛙”P0 任务看板。 | 访问 `http://192.168.1.5:8080/` |
| **`menubar.html`** | **macOS 顶部状态栏悬浮窗**：紧凑视图，快捷记录工时与闪念便笺。 | 独立窗口打开或 WebView 内嵌 |
| **`schedule.html`** | **全交互日程与工时流**：Notion 规范时间轴，支持拖拽创建时间块、四象限分类。 | 访问 `/schedule.html` |
| **`ui-composer-board.html`** | **组件编排画布**：自由组合卡片与布局调优。 | 访问 `/ui-composer-board.html` |
| **`download.html`** | **局域网真机分发页**：提供移动端 APK 安装包二维码与无线下载通道。 | 访问 `/download.html` |

---

## 本地启动与服务

1. **一键启动**：
   - 双击运行 `start.command`；
2. **终端启动**：
   ```bash
   node serve.js
   ```
   默认启动在局域网 `http://0.0.0.0:8080`，提供静态资源托管与 `/api/save-architecture` 架构落盘 API。

3. **编译流水线**：
   ```bash
   node build.js
   ```
   执行 Babel 转译与 AST 静态变量检查，并将核心文件分发至 `/Applications/年度看板.app`。
