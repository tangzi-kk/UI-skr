# Polaris × 小米手环 11 NFC：Health Connect → 飞书多维表格

> **状态：第一阶段（需要设备及飞书授权才能验收）**。已接入 REDMI K80 Android 原生 Health Connect 的**昨日步数与心率均值**读取、手机端手动上传、Mac 接收/本地去重/飞书 Webhook 转发及 Mac 健康全景。没有接入任何小米非公开 API，没有读取 NFC 卡。**尚未实现后台定时同步、睡眠分期、历史自动导入及真实设备验证。**

## 0. 现有架构不变

- 手机：`mobile-app/android-project` Java WebView 原生容器，Health Connect 的读取由 `HealthConnectBridge.java` 完成；`polaris-health.js` 是独立的底部健康交互抽屉，不改变既有三中枢和日程逻辑。
- Mac：`mac-app/serve.js` 在现有 8080/8088 服务增加 `/api/health/*`；`health.html` 负责大屏全景。旧 `/api/pull`、`/api/push`、日程时间轴没有改动。
- 数据：真实健康数据不进入 Git 仓库；Mac 缓存位于 `~/.polaris-health/daily.json`，仅用户文件权限。飞书多维表格是跨端长期业务数据端，Mac 缓存是同步中转与离线快照。

```text
小米手环 11 NFC
   ↓ 蓝牙
小米运动健康 (Mi Fitness)
   ↓ 需在机型/地区/版本上验证 Health Connect 写入
Android Health Connect (系统, Android 14+)
   ↓ 用户授权 + 点击“读取昨日”
Polaris K80 原生 Java HealthConnectBridge
   ↓ 手动点击“同步到飞书”，局域网令牌保护
Mac /api/health/daily
   ├─ ~/.polaris-health/daily.json  按日期+设备合并
   └─ 飞书 Webhook (HTTPS) → 工作流 Upsert → Polaris_Health_Daily
Mac /health.html ← 本地缓存读取（需相同令牌）
```

## 1. 准备手环与安卓手机

1. 小米运动健康中绑定 **小米手环 11 NFC**，先确认「健康」里确实有最近的步数和心率。
2. 在小米运动健康的「第三方数据」或同类设置中，尝试授权 **Health Connect** 写入步数、心率。路径可能随地区、Mi Fitness 版本和系统版本改变。
3. 在 REDMI K80 的 **系统设置 → 隐私 → Health Connect → 应用权限**，检查小米运动健康是否存在且有写入记录。若它没有提供 Health Connect 写入，Polaris 无法绕开限制获取这些指标；可先使用小米官方历史数据导出做手动迁移。
4. 本阶段只调用 Android 14+ 系统 Health Connect API；系统升级/权限设置后，请在真实 K80 上编译安装并验证。

**关键：** 可佩戴设备支持某指标，未必意味着小米运动健康向 Health Connect 写入该指标。没有真实样本时显示「—」，不伪造零。

## 2. 创建飞书表格

在你已有的北极星飞书 Base 下增加表格 **`Polaris_Health_Daily`**（不会改动 05 日程表等现有 29 张业务表）。先建立：

| 字段名（建议） | 类型 | 说明 |
| --- | --- | --- |
| `Record_Key` | 文本 | 唯一业务键，例如 `2026-10-19_xiaomi_band_11_nfc` |
| `Date_Key` | 文本 | `YYYY-MM-DD`，避免日期类型格式转换问题 |
| `Steps` | 数字 | 可空 |
| `Avg_HR` | 数字 | 可空，Health Connect 心率样本聚合均值，不等于静息心率 |
| `Active_KCAL` | 数字 | 可空，预留 |
| `Sleep_Minutes` | 数字 | 可空，预留 |
| `Resting_HR` | 数字 | 可空，预留 |
| `Deep_Sleep` | 数字 | 可空，预留 |
| `REM_Sleep` | 数字 | 可空，预留 |
| `SpO2` | 数字 | 可空，预留 |
| `Energy_Level` | 数字 | 1–5，主观记录，预留 |
| `Mood` | 数字 | 1–5，主观记录，预留 |
| `Source` | 文本 | `health_connect` |
| `Synced_At` | 文本 | 接收到的 UTC 时间 |

不要把未授权、缺失的指标写成 0。

再新建工作流 `Health_Sync_Inbound`：

1. 触发器选择「**接收到 Webhook 时**」；开启 Bearer Token 校验。
2. 从示例 JSON 建立输出字段。
3. 「查找记录」：`Record_Key` 等于请求中的 `record_key`。
4. 找到 → 修改该记录；未找到 → 新增记录。将 `date` → `Date_Key`，`steps` → `Steps`，`avg_hr` → `Avg_HR` 等逐项映射。
5. 在飞书运行日志确认记录真正完成写入。Webhook 返回 2xx 只表示已接收，**不代表异步工作流必然写入成功**。

请求示例（仅演示，非真实健康数据）：

```json
{"record_key":"2026-10-19_xiaomi_band_11_nfc","date":"2026-10-19","steps":8562,"avg_hr":75,"source":"health_connect","synced_at":"2026-10-20T00:10:00.000Z"}
```

**去重约束：** 第一阶段 Mac 会串行合并本地同一天记录；飞书工作流的“查找→新增”并非原子写入，多个发送端同时写入的最终强唯一性留待后续专用 API 服务解决。

## 3. 在 Mac 启动私有健康中转

> 必须为私有环境设置以下三个变量。不要提交真实 URL/Token 到 GitHub 或写死到 APK。

在 Mac 终端：

```sh
cd mac-app
export POLARIS_HEALTH_INGEST_TOKEN="$(openssl rand -hex 24)"
# 把上面生成的令牌安全保存到本地密码管理器，手机需要同一令牌。
export POLARIS_HEALTH_WEBHOOK_URL="https://<飞书工作流生成的地址>"
export POLARIS_HEALTH_WEBHOOK_TOKEN="<飞书 Webhook Bearer Token>"
node serve.js
```

Mac 服务使用已存在的 8080 端口。第一次可以不设置两个 `WEBHOOK_*` 变量，只验证本地缓存；这时返回 `feishu_synced:false`，**不能宣称飞书同步成功**。

建议运行：`node --test health-service.test.js`。不需要 npm 安装新的依赖，要求 Node.js 18+。

请求验证：

```sh
curl -s -X POST "http://127.0.0.1:8080/api/health/daily" \
  -H "Authorization: Bearer <POLARIS_HEALTH_INGEST_TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-10-19","steps":8562,"avg_hr":75}'
```

执行两次后访问 `GET /api/health/daily` 并带相同 Bearer Token，应该只有一条该日期记录。删除测试数据时请谨慎操作本地缓存文件。

### 网络与安全

本项目旧服务仍在局域网的 **HTTP 8080** 运行。该端口虽然使用强随机 Bearer Token 验证健康接口，但普通 HTTP **不加密传输**；只能在自己可信的私有局域网测试，**不要在公共 Wi-Fi、互联网端口映射或不受控网络上传个人健康数据**。

正式长期运行请通过 HTTPS 反向代理/可信零信任隧道传输；或者改为在可信服务端走 HTTPS 飞书 OpenAPI。不要把飞书 App Secret 或 Token 写进前端代码。

`health.html` 对健康记录的读取同样要求 Bearer Token；输入框中的令牌仅保留在当前浏览器页面，不写入仓库。

## 4. 在 K80 APK 中使用

1. 在 `mobile-app/android-project` 用 Android Studio/已安装的 Gradle 构建 Debug APK（仓库目前无 `gradlew` wrapper，需本地 Gradle 和 Android SDK 35）。例如有 Gradle 时使用 `gradle assembleDebug`。
2. 安装后进入北极星首页，点击右侧的 **♡** 圆形健康入口。
3. 点击「**授权**」，在系统授权弹窗中允许读取步数、心率。
4. 点击「**读取昨日**」。成功后展示真实步数、心率均值；睡眠仍显示「—」。
5. 在面板中输入 `http://<Mac 局域网IP>:8080/api/health/daily`、上面 Mac 的健康同步令牌，点击「**同步到飞书**」。
6. 在 Mac 打开 `http://<Mac IP>:8080/health.html`，输入相同的令牌，点击「读取健康记录」查看概览与趋势。
7. 检查飞书工作流运行记录，确认最终写入；不同步时先检查 Mac 返回消息及飞书 Webhook 配置。

**不要发送真实健康数据到任何陌生域名。** 目前 Native bridge 只允许 `/api/health/daily` 路径，且 URL 必须使用 HTTPS 或 RFC1918 私有局域网 HTTP。

## 5. 验收与后续

第一阶段验收：
- 手机在 Mi Fitness 中先同步后，Health Connect 能读到昨日**真实**步数（与源系统核对数据来源）；
- 未授权与无样本均能明确提示，不填入虚假数字；
- Mac 未配置令牌返回 401；重复上传同一天只保留一条记录；
- 飞书未配置时明确标明尚未同步；配置后飞书工作流成功 Upsert；
- 原有 Mac 日程 `/api/pull`、`/api/push` 不变，手机三中枢入口不被替换。

待下一阶段处理：睡眠跨日与分期、静息心率、能量、历史 CSV 导入、后台 WorkManager 重试队列、跨网 HTTPS、飞书双向查询和主观心情记录。不应把这些尚未实现的部分标为已上线。

**重要限制：** 目前为可编译方向的增量实现，尚未在 REDMI K80 + 小米手环 11 NFC 真机上构建/授权/验证；需要设备端完成第一轮联调。
