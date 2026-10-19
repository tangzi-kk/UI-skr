# Polaris Mobile Art Direction 2.0

## 目的
面向 REDMI K80/澎湃 OS 的 **Visual First / Art Direction First / Motion First** UI 迭代。基于已运行的 mobile-app 与 PolarisStore，保留 mac-app MVP 原样。

## 本轮实现
- 手机主导航重组为 **今日 / 效率 / 灵气 / 看板**；原始七个业务页面仍在，同步保留。`效率`内为日程、行动、提醒、专注；`灵气`内为想法、心情、亲密、休息。看板保留频率、统计、复盘、通知的既有子页。
- 今日新封面采用鼠尾草绿 `#99B396`、真正存在的手绘表情素材、纸张撕边；只显示 PolarisStore 中实际的当天日程和未完成任务，不展示编造的数据。
- 时间艺术：以现有日程的开始/结束时刻计算 24 小时环形时间分布（无有效时间数据时为空环）。
- 情绪、便笺、年度看板的美术形态基于仓库 `materials` 与 `assets/emojis`，未新增第三方依赖。
- 新增灵气中的 **亲密** 私密草稿与 **休息** 4-7-8 呼吸节奏；亲密草稿严格标注为 **仅本机保存**，不进入飞书同步队列。
- 主导航提供触控热区和底部 safe-area，动画尊重 `prefers-reduced-motion`；旧的 PolarisStore、任务编辑、日程编辑、同步和组件挂载不作替换。
- Android 原生容器默认入口由 `schedule.html` 改为 `mobile-app.html`，完整三中枢视图首次成为启动主界面。
- 修正同步提示：`idle` 显示“离线可用”，不再虚称“已连接飞书”；最后同步时间必须来自真实同步状态。

## 兼容边界和待验证内容
- Android WebView 真机启动、状态栏与返回、机型键盘顶起、局域网飞书同步都需要 REDMI K80 实机复测；本轮不改 `serve.js` 和 Base Schema。
- 私密草稿使用 `localStorage` 本机存储，没有加密、云备份或跨端同步，不能保存敏感信息。
- 4-7-8 呼吸为引导动效，不采集传感器数据。用户可立即停止。
- 用户从快捷 FAB/旧导航打开子模块时，Polaris 主导航会同步高亮当前中枢。
- `mobile-app.html` 和 Android assets 目录为双份入口，均已同步更新；新增 CSS/JS 无构建依赖。
- 本轮属于真正的移动工程 UI 实现，不是独立 HTML 设计稿。
