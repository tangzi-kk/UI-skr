// 年度看板 · 严格区分【UI 界面容器】与【设计元素】的双轨官方资产库 (统一设计语言版)

// 一、UI 界面容器库 (扩充至 22 款精选容器，全部接入统一设计系统与 CSS 变量)
const UI_CONTAINERS = [
  // ================= 1. 年度全景与概览类 (4款) =================
  {
    id: "ui_year_mosaic_grid",
    name: "01 全景年度 365 天色块矩阵",
    source: "01_全景年度日历热力_AnyLog",
    category: "年度全景",
    type: "UI 容器",
    desc: "Mac 端核心移动重构版：365天全景色块矩阵，12个月份横排，支持今日高亮与完成度色标",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-year-mosaic-container" data-instance-id="${instanceId}">
        <div class="card-unified-header">
          <div class="card-title-group">
            <span class="card-main-title">2026 年度热力全景</span>
            <span class="card-sub-title">第 40 周 · 已打卡 278 天</span>
          </div>
          <span class="theme-badge-pill">78% 完成</span>
        </div>
        <div class="year-mosaic-months-grid">
          ${Array.from({length: 12}).map((_, m) => `
            <div class="month-col">
              <span class="m-label">${m+1}月</span>
              <div class="m-cells">
                ${Array.from({length: 28}).map((_, d) => {
                  const lvl = (m * 29 + d) % 5;
                  const isToday = (m === 9 && d === 2);
                  return `<span class="heat-c lvl-${lvl} ${isToday ? 'today-glow' : ''}"></span>`;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  },
  {
    id: "ui_year_progress_bar",
    name: "2026 年度时间流向与倒计时卡",
    source: "年度核心指标",
    category: "年度全景",
    type: "UI 容器",
    desc: "直观展示 2026 年度进度百分比、已过去天数、剩余天数及核心季度节点",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-year-progress-box" data-instance-id="${instanceId}">
        <div class="card-unified-header">
          <div class="card-title-group">
            <span class="card-main-title">2026 年程进度</span>
            <span class="card-sub-title">距离 2027 年还有 89 天</span>
          </div>
          <span class="progress-percent-val">75.6%</span>
        </div>
        <div class="unified-progress-bar-outer">
          <div class="unified-progress-fill" style="width: 75.6%;"></div>
        </div>
        <div class="quarters-indicator-row">
          <span class="q-node passed">Q1·春</span>
          <span class="q-node passed">Q2·夏</span>
          <span class="q-node active">Q3·秋</span>
          <span class="q-node future">Q4·冬</span>
        </div>
      </div>
    `
  },
  {
    id: "ui_quarter_quadrant",
    name: "四象限年度核心目标卡",
    source: "年度看板Mac端移植",
    category: "年度全景",
    type: "UI 容器",
    desc: "将年度拆分为工作成就、身体健康、财务积累、家庭成长四个方块，清晰罗列关键进展",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-quadrant-box" data-instance-id="${instanceId}">
        <div class="card-unified-header">
          <span class="card-main-title">年度四大战略象限</span>
          <span class="theme-icon-btn">🎯</span>
        </div>
        <div class="quadrant-grid">
          <div class="quad-item quad-work">
            <div class="q-tag"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; display:inline-block;"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> 事业</div>
            <div class="q-text" contenteditable="true">年度产品安卓端上线</div>
            <div class="q-stat">进度 80%</div>
          </div>
          <div class="quad-item quad-health">
            <div class="q-tag"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; display:inline-block;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> 健康</div>
            <div class="q-text" contenteditable="true">游泳跑步每周三次</div>
            <div class="q-stat">已完成 94 次</div>
          </div>
          <div class="quad-item quad-finance">
            <div class="q-tag"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; display:inline-block;"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/></svg> 资产</div>
            <div class="q-text" contenteditable="true">定投基金储蓄计划</div>
            <div class="q-stat">达成 92%</div>
          </div>
          <div class="quad-item quad-life">
            <div class="q-tag"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; display:inline-block;"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="5"/><line x1="10" y1="2" x2="10" y2="5"/><line x1="14" y1="2" x2="14" y2="5"/></svg> 生活</div>
            <div class="q-text" contenteditable="true">带家人露营旅行2次</div>
            <div class="q-stat">已打卡 2/2</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_month_heatmap_card",
    name: "本月高密度 30 天打卡热度卡",
    source: "01_全景年度日历热力_AnyLog",
    category: "年度全景",
    type: "UI 容器",
    desc: "当月 30 天方块热力与微打卡统计，紧凑精致",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-month-heatmap-box" data-instance-id="${instanceId}">
        <div class="card-unified-header">
          <span class="card-main-title">10月专注热力</span>
          <span class="theme-badge-pill">连续打卡 12 天</span>
        </div>
        <div class="month-dots-matrix">
          ${Array.from({length: 31}).map((_, i) => `
            <div class="month-dot-cell ${i < 3 ? 'active-today' : (i < 20 ? 'filled' : '')}">
              <span class="dot-day">${i+1}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `
  },

  // ================= 2. 时钟与环形日程类 (5款) =================
  {
    id: "ui_02_ring_dial",
    name: "02 小初 环形日程外圈表盘",
    source: "02_时钟外圈日程Todo_小初",
    category: "时钟与日程",
    type: "UI 容器",
    desc: "1:1 复刻 02 创意表盘：表盘外圈环绕 Lunch/Beach/Dinner 彩色便签弧形日程块，指针动态旋转",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-02-dial-container" data-instance-id="${instanceId}">
        <div class="dial-clock-outer">
          <svg class="dial-arc-svg" viewBox="0 0 260 260">
            <!-- 12:00-13:30 Lunch 弧块 -->
            <path d="M 130,22 A 108,108 0 0,1 180,36" fill="none" stroke="var(--theme-accent-pink)" stroke-width="16" stroke-linecap="round"/>
            <!-- 17:30-19:00 Beach 弧块 -->
            <path d="M 85,225 A 108,108 0 0,0 175,225" fill="none" stroke="var(--theme-accent-yellow)" stroke-width="16" stroke-linecap="round"/>
            <!-- 19:30-21:00 Dinner 弧块 -->
            <path d="M 28,150 A 108,108 0 0,0 55,200" fill="none" stroke="var(--theme-accent-orange)" stroke-width="16" stroke-linecap="round"/>
            <!-- 9:00 晨间专注点 -->
            <circle cx="22" cy="130" r="10" fill="var(--theme-accent-blue)"/>
          </svg>
          <div class="dial-face-inner">
            <div class="clock-numbers">
              <span class="num n12">12</span><span class="num n3">3</span>
              <span class="num n6">6</span><span class="num n9">9</span>
            </div>
            <div class="hand hour-hand" style="transform: rotate(125deg);"></div>
            <div class="hand min-hand" style="transform: rotate(20deg);"></div>
            <div class="hand sec-hand" style="transform: rotate(200deg);"></div>
            <div class="dial-center-dot"></div>
          </div>
          <div class="badge-tag lunch-tag">工作午餐</div>
          <div class="badge-tag beach-tag">户外漫步</div>
          <div class="badge-tag dinner-tag">温馨晚餐</div>
          <div class="badge-tag anne-tag">专注时空</div>
          <div class="badge-tag heart-pin">💖</div>
        </div>
      </div>
    `
  },
  {
    id: "ui_04_clock_arc",
    name: "04 极简大数字时钟与闹钟弧",
    source: "04_黑色极简时钟闹钟_Clock",
    category: "时钟与日程",
    type: "UI 容器",
    desc: "1:1 复刻 04 大字号 08:30 时钟，带闹钟扇形渐变指示弧与 09:00am 标记",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-04-clock-card" data-instance-id="${instanceId}">
        <div class="clock-date-sub">Sunday · Sep 24, 2026</div>
        <div class="clock-huge-time">08<span class="colon">:</span>30</div>
        <div class="clock-sector-arc">
          <svg viewBox="0 0 200 110" style="width:170px; height:85px; margin:0 auto; display:block;">
            <path d="M 30,15 A 75,75 0 0,0 170,15" fill="none" stroke="var(--theme-accent-soft)" stroke-width="2" stroke-dasharray="3,3"/>
            <path d="M 30,15 L 100,85 L 140,25" fill="var(--theme-accent-soft)" stroke="var(--theme-accent)" stroke-width="2"/>
            <circle cx="100" cy="85" r="3.5" fill="var(--theme-accent)"/>
          </svg>
          <div class="alarm-tag">⏰ 09:00 am 早会</div>
        </div>
      </div>
    `
  },
  {
    id: "ui_notion_timeline",
    name: "Notion 24H 垂直日程流时间轴",
    source: "截图导入 Notion日历",
    category: "时钟与日程",
    type: "UI 容器",
    desc: "1:1 复刻 Notion 手机日历：带 08:00/10:00/14:00 时间槽与淡绿高亮日程卡片",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-notion-timeline-card" data-instance-id="${instanceId}">
        <div class="card-unified-header">
          <span class="card-main-title">今日日程时间轴</span>
          <span class="theme-badge-pill">GMT+8 · 周五</span>
        </div>
        <div class="timeline-slot-list">
          <div class="time-row">
            <span class="t-hour">08:00</span>
            <div class="t-block green-block" contenteditable="true">晨间冥想与年度目标复盘 ☀️</div>
          </div>
          <div class="time-row">
            <span class="t-hour">10:00</span>
            <div class="t-block blue-block" contenteditable="true">年度看板移动端 UI 原型评审 📱</div>
          </div>
          <div class="time-row">
            <span class="t-hour">14:00</span>
            <div class="t-block orange-block" contenteditable="true">核心代码架构重构与组件测试 💻</div>
          </div>
          <div class="time-row">
            <span class="t-hour">17:00</span>
            <div class="t-block empty-slot">点击添加下午日程...</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_adhd_timer_card",
    name: "ADHD 沉浸专注计时卡",
    source: "截图导入 ADHDpal",
    category: "时钟与日程",
    type: "UI 容器",
    desc: "1:1 复刻 ADHD 专注打卡：大倒计时 25:00、专注金句、状态图标",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-adhd-focus-card" data-instance-id="${instanceId}">
        <div class="focus-timer-num">25:00</div>
        <div class="focus-session-tag">🏊 深度心流周期 #3</div>
        <div class="focus-quote-text" contenteditable="true">
          “我专注起来就像油门踩到底，但请按时提醒我休息。”
        </div>
        <div class="focus-mini-tools">
          <span>📋</span><span>🎲</span><span>🎹</span><span>🎮</span><span>🧊</span>
        </div>
      </div>
    `
  },
  {
    id: "ui_compact_strip_clock",
    name: "极简胶囊双时区横条时钟",
    source: "系统状态与工具",
    category: "时钟与日程",
    type: "UI 容器",
    desc: "紧凑单行：北京时间 / 伦敦时间，带秒表动画与日期标签",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-strip-clock-card" data-instance-id="${instanceId}">
        <div class="strip-left">
          <span class="city-name">北京</span>
          <span class="clock-time-val">10:24<small>:38</small></span>
        </div>
        <div class="strip-divider"></div>
        <div class="strip-right">
          <span class="city-name">伦敦</span>
          <span class="clock-time-val">02:24</span>
        </div>
      </div>
    `
  },

  // ================= 3. 心情日记与打卡类 (6款) =================
  {
    id: "ui_april_mood_cal",
    name: "13 April 经典表情心情打卡日历",
    source: "13_表情心情日历打卡与日记_April",
    category: "心情系统",
    type: "UI 容器",
    desc: "1:1 复刻参考图 13：极简圆角白卡、Mon-Sun 星期表头、30个打卡圆圈贴上黑白经典微表情",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-april-cal-box" data-instance-id="${instanceId}">
        <div class="april-header-title">2026年 4月</div>
        <div class="april-week-head">
          <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
        </div>
        <div class="april-days-grid">
          <div class="c-cell empty"></div><div class="c-cell empty"></div>
          <div class="c-cell"><span class="d-n">1</span></div>
          <div class="c-cell"><span class="d-n">2</span></div>
          <div class="c-cell"><span class="d-n">3</span></div>
          <div class="c-cell"><span class="d-n">4</span></div>
          <div class="c-cell"><span class="d-n">5</span></div>
          <div class="c-cell"><span class="d-n">6</span></div>
          <div class="c-cell emoji-fill"><img src="./assets/emojis/mooda_classic_02_feichangbang.png" /><span class="d-n">7</span></div>
          <div class="c-cell"><span class="d-n">8</span></div>
          <div class="c-cell emoji-fill"><img src="./assets/emojis/mooda_classic_05_nanguo.png" /><span class="d-n">9</span></div>
          <div class="c-cell emoji-fill"><img src="./assets/emojis/mooda_classic_06_kaixin.png" /><span class="d-n">10</span></div>
          <div class="c-cell emoji-fill"><img src="./assets/emojis/mooda_dress_06_yuyue.png" /><span class="d-n">11</span></div>
          <div class="c-cell"><span class="d-n">12</span></div>
          <div class="c-cell emoji-fill"><img src="./assets/emojis/capsule_pet_05_chaokaixin.png" /><span class="d-n">13</span></div>
          <div class="c-cell emoji-fill"><img src="./assets/emojis/capsule_pet_04_kaixin.png" /><span class="d-n">14</span></div>
          <div class="c-cell emoji-fill"><img src="./assets/emojis/capsule_pet_03_fangkong.png" /><span class="d-n">15</span></div>
          <div class="c-cell emoji-fill"><img src="./assets/emojis/capsule_pet_01_qifen.png" /><span class="d-n">16</span></div>
          <div class="c-cell"><span class="d-n">17</span></div>
          <div class="c-cell"><span class="d-n">18</span></div>
          <div class="c-cell"><span class="d-n">19</span></div>
          <div class="c-cell"><span class="d-n">20</span></div>
          <div class="c-cell"><span class="d-n">21</span></div>
          <div class="c-cell"><span class="d-n">22</span></div>
          <div class="c-cell"><span class="d-n">23</span></div>
          <div class="c-cell"><span class="d-n">24</span></div>
          <div class="c-cell"><span class="d-n">25</span></div>
          <div class="c-cell"><span class="d-n">26</span></div>
          <div class="c-cell"><span class="d-n">27</span></div>
          <div class="c-cell"><span class="d-n">28</span></div>
          <div class="c-cell"><span class="d-n">29</span></div>
          <div class="c-cell"><span class="d-n">30</span></div>
        </div>
      </div>
    `
  },
  {
    id: "ui_retro_tinytype_phone",
    name: "TinyType 复古手机液晶日记卡",
    source: "截图导入 TinyType",
    category: "心情系统",
    type: "UI 容器",
    desc: "1:1 复刻按键诺基亚小手机：中置绿色液晶屏可打字记录，带九宫格键盘与小黄笑脸贴纸",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-retro-phone-card" data-instance-id="${instanceId}">
        <div class="phone-speaker-bar"></div>
        <div class="phone-brand-title">微型随身机 <span class="sticker-smile">😊</span></div>
        <div class="phone-lcd-screen">
          <div class="lcd-header">
            <span>📶 ✉️</span>
            <span>🔋 100%</span>
          </div>
          <div class="lcd-body" contenteditable="true" placeholder="写点什么吧...">
            今天完成了年度看板移动端全套 22 款容器统一配色设计！心情超棒 ✨
          </div>
          <div class="lcd-footer">
            <span>2026/10/03</span>
            <span>石柯然</span>
          </div>
        </div>
        <div class="phone-keypad-mini">
          <div class="nav-keys">
            <span class="btn-blue">—</span>
            <span class="btn-ctrl">⬭</span>
            <span class="btn-red">—</span>
          </div>
          <div class="num-grid">
            <span>1</span><span>2</span><span>3</span>
            <span>4</span><span>5</span><span>6</span>
            <span>7</span><span>8</span><span>9</span>
            <span>*</span><span>0</span><span>#</span>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_mood_wheel_arc",
    name: "情绪轮盘半圆交互底座",
    source: "截图导入 情绪轮盘",
    category: "心情系统",
    type: "UI 容器",
    desc: "1:1 复刻轮盘：下半圆环轨道底座，表情沿弧线排列，中心大黑圆 + 按钮，左侧滑块设置钮",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-mood-wheel-box" data-instance-id="${instanceId}">
        <div class="wheel-track-arc">
          <div class="wheel-emoji-node pos-1" onclick="selectWheelMood(this)"><img src="./assets/emojis/wheel_01_freeze_weijin.png" /></div>
          <div class="wheel-emoji-node pos-2" onclick="selectWheelMood(this)"><img src="./assets/emojis/wheel_02_annoyed_shengqi.png" /></div>
          <div class="wheel-emoji-node pos-3 active" onclick="selectWheelMood(this)"><img src="./assets/emojis/wheel_03_smile_dingbu.png" /></div>
          <div class="wheel-emoji-node pos-4" onclick="selectWheelMood(this)"><img src="./assets/emojis/wheel_04_furious_penhuo.png" /></div>
          <div class="wheel-emoji-node pos-5" onclick="selectWheelMood(this)"><img src="./assets/emojis/wheel_05_egg_more.png" /></div>
        </div>
        <div class="wheel-controls">
          <button class="wheel-side-btn">🎛️</button>
          <button class="wheel-center-plus-btn">+</button>
          <button class="wheel-side-btn">✨</button>
        </div>
      </div>
    `
  },
  {
    id: "ui_pet_capsule_dock",
    name: "TinyType 萌宠心情胶囊栏",
    source: "截图导入 胶囊表情",
    category: "心情系统",
    type: "UI 容器",
    desc: "白色圆角微胶囊底槽，内置 5 个精抠萌宠表情，支持一键点击切换今日心情",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-capsule-mood-dock" data-instance-id="${instanceId}">
        <div class="capsule-item" onclick="pickCapsule(this, '气愤')">
          <img src="./assets/emojis/capsule_pet_01_qifen.png" />
          <span>气愤</span>
        </div>
        <div class="capsule-item" onclick="pickCapsule(this, '伤心')">
          <img src="./assets/emojis/capsule_pet_02_shangxin.png" />
          <span>伤心</span>
        </div>
        <div class="capsule-item" onclick="pickCapsule(this, '放空')">
          <img src="./assets/emojis/capsule_pet_03_fangkong.png" />
          <span>放空</span>
        </div>
        <div class="capsule-item active" onclick="pickCapsule(this, '开心')">
          <img src="./assets/emojis/capsule_pet_04_kaixin.png" />
          <span>开心</span>
        </div>
        <div class="capsule-item" onclick="pickCapsule(this, '超开心')">
          <img src="./assets/emojis/capsule_pet_05_chaokaixin.png" />
          <span>超开心</span>
        </div>
      </div>
    `
  },
  {
    id: "ui_spring_letter_card",
    name: "Spring 春意手账锯齿信笺卡",
    source: "截图导入 手账素材",
    category: "心情系统",
    type: "UI 容器",
    desc: "撕纸锯齿票根、春意燕印邮戳、带金属铭牌 [T] 编织皮筋束带，可手写心情记录",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-spring-card" data-instance-id="${instanceId}">
        <div class="spring-card-header">
          <div class="title-en">春意盎然</div>
          <div class="title-cn">- 春意纪事 -</div>
          <div class="spring-stamp">燕印</div>
        </div>
        <div class="spring-card-body" contenteditable="true">
          愿所有美好的目标，都如春天般破土新生。在年度看板里，记录每一个闪光的日子。
        </div>
        <div class="spring-band-buckle">
          <span class="band-stripe"></span>
          <span class="metal-tag">春</span>
          <span class="band-stripe"></span>
        </div>
      </div>
    `
  },
  {
    id: "ui_bubble_journal_card",
    name: "Mooda 气泡心情随笔纸片卡",
    source: "Mooda 经典随笔",
    category: "心情系统",
    type: "UI 容器",
    desc: "轻量气泡卡片，包含当前心情大脸、天气标签与两行微随笔",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-bubble-journal-box" data-instance-id="${instanceId}">
        <div class="journal-emoji-avatar">
          <img src="./assets/emojis/mooda_dress_02_memeda.png" />
        </div>
        <div class="journal-content-right">
          <div class="journal-meta-row">
            <span class="journal-time">今天 09:42</span>
            <span class="journal-weather">☀️ 晴朗微风</span>
          </div>
          <div class="journal-note-body" contenteditable="true">
            阳光洒在书桌上，一切都刚刚好。新的一天，继续专注前行！
          </div>
        </div>
      </div>
    `
  },

  // ================= 4. Todo与清单管理类 (4款) =================
  {
    id: "ui_priority_todo_card",
    name: "优先级 Todo 任务清单卡",
    source: "北极星任务体系与小初Todo",
    category: "待办清单",
    type: "UI 容器",
    desc: "包含 P0/P1/P2 优先级色彩小标，带圆形打勾交互动效与任务名称",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-todo-list-box" data-instance-id="${instanceId}">
        <div class="card-unified-header">
          <span class="card-main-title">今日待办事项</span>
          <span class="theme-badge-pill">3/4 完成</span>
        </div>
        <div class="todo-items-list">
          <div class="todo-row done" onclick="toggleTodoItem(this)">
            <span class="todo-check-circle">✓</span>
            <span class="todo-p-tag p0">P0</span>
            <span class="todo-text">完成年度看板移动端全套容器</span>
          </div>
          <div class="todo-row done" onclick="toggleTodoItem(this)">
            <span class="todo-check-circle">✓</span>
            <span class="todo-p-tag p1">P1</span>
            <span class="todo-text">统一设计系统全局拟物配色</span>
          </div>
          <div class="todo-row" onclick="toggleTodoItem(this)">
            <span class="todo-check-circle"></span>
            <span class="todo-p-tag p2">P2</span>
            <span class="todo-text">验证多屏幕自由拖拽与缩放</span>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_today_three_things",
    name: "今日三件事黄金专注便签",
    source: "高产专注法则",
    category: "待办清单",
    type: "UI 容器",
    desc: "精选三项当日决定性目标，便签纸材质，避免信息过载",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-three-things-box" data-instance-id="${instanceId}">
        <div class="three-things-title"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; display:inline-block;"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-2l-2-2V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v8l-2 2v2z"/></svg> 今日最重要的 3 件事</div>
        <div class="thing-slot" contenteditable="true">1. 上线移动端 5 个全套界面原型</div>
        <div class="thing-slot" contenteditable="true">2. 检查 41 款表情单体透明质量</div>
        <div class="thing-slot" contenteditable="true">3. 保持早睡早起，跑步 5 公里</div>
      </div>
    `
  },
  {
    id: "ui_anylog_double_card",
    name: "AnyLog 双列打卡卡片组",
    source: "截图导入 AnyLog",
    category: "待办清单",
    type: "UI 容器",
    desc: "1:1 复刻 AnyLog：双列卡片（App使用记录、喝咖啡打卡，带+号）",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-anylog-grid-box" data-instance-id="${instanceId}">
        <div class="anylog-col-card">
          <div class="anylog-head"><span>📱</span> <strong>应用记录</strong></div>
          <div class="anylog-cnt">2 <small>条</small></div>
          <div class="anylog-foot"><span>总计 · 全部</span> <button class="mini-plus-btn" onclick="handleAnyLogPlus(this)">+</button></div>
        </div>
        <div class="anylog-col-card">
          <div class="anylog-head"><span>☕</span> <strong>健康咖啡</strong></div>
          <div class="anylog-cnt">1 <small>杯</small></div>
          <div class="anylog-foot"><span>总计 · 今日</span> <button class="mini-plus-btn" onclick="handleAnyLogPlus(this)">+</button></div>
        </div>
      </div>
    `
  },
  {
    id: "ui_category_pills",
    name: "AnyLog 分类切换药丸栏",
    source: "截图导入 AnyLog",
    category: "待办清单",
    type: "UI 容器",
    desc: "全部 / 未分组 / 重点 / 习惯，胶囊切换药丸",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-category-pills-bar" data-instance-id="${instanceId}">
        <span class="cat-pill active">全部 12</span>
        <span class="cat-pill">日常习惯 5</span>
        <span class="cat-pill">工作重点 4</span>
        <span class="cat-pill">待归档 3</span>
      </div>
    `
  },

  // ================= 5. 导航、卡片与底部悬浮控制类 (5款) =================
  {
    id: "ui_04_countdown_card",
    name: "04 倒计时事件圆角卡片",
    source: "04_黑色极简时钟闹钟_Clock",
    category: "卡片与列表",
    type: "UI 容器",
    desc: "1:1 复刻 04 倒计时卡片（雪糕图标、182d until Honey birthday）",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-04-countdown-box" data-instance-id="${instanceId}">
        <div class="countdown-icon-badge">🍦</div>
        <div class="countdown-info">
          <div class="countdown-days">距离目标还有 182 天</div>
          <div class="countdown-event" contenteditable="true">宝贝生日倒计时 🎂</div>
        </div>
      </div>
    `
  },
  {
    id: "ui_02_top_date",
    name: "02 顶部日期与下拉切换条",
    source: "02_时钟外圈日程Todo_小初",
    category: "导航与状态",
    type: "UI 容器",
    desc: "Wednesday 29 ▾ 日期选择，右侧更多操作菜单",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-02-top-bar" data-instance-id="${instanceId}">
        <div class="date-dropdown"><strong>10月29日 周三</strong> <span class="arrow">▾</span></div>
        <div class="more-dots">•••</div>
      </div>
    `
  },
  {
    id: "ui_04_header_info",
    name: "04 顶部极简天气风速行",
    source: "04_黑色极简时钟闹钟_Clock",
    category: "导航与状态",
    type: "UI 容器",
    desc: "气温 7°、风速 19 km/h、极简信息图标与设置滑块",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-04-header-bar" data-instance-id="${instanceId}">
        <span class="info-tag"><i class="dot"></i> 7°C 🌧️</span>
        <span class="info-tag">💨 19 km/h</span>
        <span class="info-tag right-btn">⚙️ 设置</span>
      </div>
    `
  },
  {
    id: "ui_anylog_dock",
    name: "AnyLog 悬浮胶囊 Dock 导航栏",
    source: "截图导入 AnyLog",
    category: "导航与状态",
    type: "UI 容器",
    desc: "1:1 复刻 AnyLog：首页、日历、统计、设置图标，右侧独立白色大圆加号按钮",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-anylog-dock-container" data-instance-id="${instanceId}">
        <div class="dock-pill-bar">
          <button class="dock-btn active">🏠</button>
          <button class="dock-btn">📅</button>
          <button class="dock-btn">📊</button>
          <button class="dock-btn">⚙️</button>
        </div>
        <button class="dock-fab-plus">+</button>
      </div>
    `
  },
  {
    id: "ui_02_stationery_dock",
    name: "02 拟物文具工具托盘",
    source: "02_时钟外圈日程Todo_小初",
    category: "工具与便签",
    type: "UI 容器",
    desc: "排列黄色、天蓝、粉色荧光笔、渐变笔身与立体爱心便签的文具托盘",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-stationery-tray" data-instance-id="${instanceId}">
        <div class="tray-inner">
          <img src="./assets/design-elements/pen_yellow.png" class="tray-pen" title="黄荧光笔" />
          <img src="./assets/design-elements/pen_cyan.png" class="tray-pen" title="蓝荧光笔" />
          <img src="./assets/design-elements/pen_pink.png" class="tray-pen" title="粉荧光笔" />
          <img src="./assets/design-elements/heart_3d.png" class="tray-heart" title="立体爱心" />
        </div>
      </div>
    `
  },

  // ================= 6. 日程排程与时间流类 (Jul26 / rsuyoy) =================
  {
    id: "ui_09_color_timeblock_stream",
    name: "09 彩色时间块堆叠排程日程流",
    source: "09_彩色时间块堆叠排程_Jul26",
    category: "日程与时间流",
    type: "UI 容器",
    desc: "1:1 复刻 Jul26：顶部日期胶囊导航、周胶囊联动、3列半透果冻堆叠时间块、当前时间 12:55 红色游标横线",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-jul26-timeblock-stream" data-instance-id="${instanceId}">
        <div class="jul26-header-row">
          <div class="jul26-date-title">
            <strong>7月26日 · 今天</strong>
          </div>
          <div class="jul26-actions">
            <span class="jul26-pill-select" onclick="toggleViewSpanDropdown(this)">3天视图 ▾</span>
            <button class="jul26-plus-btn" onclick="openAddScheduleModal()">+</button>
          </div>
        </div>

        <div class="jul26-week-capsules-bar">
          <div class="jul26-w-item" onclick="selectDayCapsule(this)"><span class="w-d">一</span><span class="w-n">20</span></div>
          <div class="jul26-w-item" onclick="selectDayCapsule(this)"><span class="w-d">二</span><span class="w-n">21</span></div>
          <div class="jul26-w-item" onclick="selectDayCapsule(this)"><span class="w-d">三</span><span class="w-n">22</span></div>
          <div class="jul26-w-item" onclick="selectDayCapsule(this)"><span class="w-d">二</span><span class="w-n">23</span></div>
          <div class="jul26-w-cluster">
            <div class="jul26-w-item cluster-f"><span class="w-d">五</span><span class="w-n">24</span></div>
            <div class="jul26-w-item cluster-s"><span class="w-d">六</span><span class="w-n">25</span></div>
            <div class="jul26-w-item cluster-today"><span class="w-d">六</span><span class="w-n">26</span></div>
          </div>
        </div>

        <div class="jul26-stream-body">
          <div class="jul26-time-axis">
            <span class="t-mark">10:00</span>
            <span class="t-mark">11:00</span>
            <span class="t-mark">12:00</span>
            <span class="t-mark">14:00</span>
          </div>

          <div class="jul26-columns-area">
            <!-- 红色横贯当前时间游标 -->
            <div class="jul26-now-indicator" style="top: 175px;">
              <span class="now-badge">12:55</span>
              <div class="now-line"></div>
            </div>

            <!-- 列 1 -->
            <div class="jul26-col">
              <div class="jul26-block block-outdoor block-orange-large" style="top: 10px; height: 95px;">
                <div class="b-title">户外运动</div>
                <div class="b-dur">1小时13分</div>
              </div>
              <div class="jul26-block block-outdoor block-orange-mid" style="top: 110px; height: 35px;">
                <div class="b-title">户外运动</div>
                <div class="b-dur">20分钟</div>
              </div>
              <div class="jul26-block block-babytime block-pink" style="top: 195px; height: 38px;">
                <div class="b-title">亲子陪伴</div>
                <div class="b-dur">25分钟</div>
              </div>
              <div class="jul26-block block-housework block-green" style="top: 245px; height: 50px;">
                <div class="b-title">家务整理</div>
                <div class="b-dur">35分钟</div>
              </div>
              <div class="jul26-block block-break block-purple" style="top: 300px; height: 50px;">
                <div class="b-title">微休放松</div>
                <div class="b-dur">39分钟</div>
              </div>
            </div>

            <!-- 列 2 -->
            <div class="jul26-col">
              <div class="jul26-block block-outdoor block-orange-mid" style="top: 95px; height: 70px;">
                <div class="b-title">户外运动</div>
                <div class="b-dur">52分钟</div>
              </div>
              <div class="jul26-block block-babysleep block-teal" style="top: 168px; height: 50px;">
                <div class="b-title">深度睡眠</div>
                <div class="b-dur">30分钟</div>
              </div>
            </div>

            <!-- 列 3 -->
            <div class="jul26-col">
              <div class="jul26-block block-outdoor block-orange-mid" style="top: 80px; height: 100px;">
                <div class="b-title">户外运动</div>
                <div class="b-dur">1小时19分</div>
              </div>
              <div class="jul26-block block-babysleep block-teal" style="top: 185px; height: 80px;">
                <div class="b-title">深度睡眠</div>
                <div class="b-dur">55分钟</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_11_multiday_timeband_calendar",
    name: "11 多日横向时间带日历面板",
    source: "11_多日横向时间带日历_rsuyoy",
    category: "日程与时间流",
    type: "UI 容器",
    desc: "1:1 复刻 rsuyoy：19-25 July 极简周排程、纵向7天横向时间带、彩色药丸日程胶囊与刻度轴",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-rsuyoy-timeband-panel" data-instance-id="${instanceId}">
        <div class="rsuyoy-header">
          <span class="rsuyoy-title">7月19日 – 7月25日</span>
          <div class="rsuyoy-actions">
            <span class="icon-dot-btn" onclick="openMoreMenuModal()">•••</span>
            <span class="icon-gear-btn" onclick="openSettingsModal()">⚙️</span>
          </div>
        </div>

        <div class="rsuyoy-timeline-scale">
          <span class="scale-sp"></span>
          <div class="scale-marks">
            <span>03</span><span>06</span><span>09</span><span>12</span><span>15</span><span>18</span><span>21</span>
          </div>
        </div>

        <div class="rsuyoy-days-rows">
          <div class="rsuyoy-row">
            <div class="rsuyoy-day-tag">
              <small>日</small><strong>19</strong>
            </div>
            <div class="rsuyoy-band-slot">
              <span class="rsuyoy-event-pill p-orange" style="left: 45%;">早午餐</span>
              <span class="rsuyoy-event-pill p-gray" style="left: 60%;">观展</span>
              <span class="rsuyoy-event-pill p-purple" style="left: 72%;">聚餐</span>
            </div>
          </div>

          <div class="rsuyoy-row active-day">
            <div class="rsuyoy-day-tag active">
              <small>一</small><strong>20</strong>
            </div>
            <div class="rsuyoy-band-slot">
              <span class="rsuyoy-event-pill p-blue" style="left: 36%;">学习</span>
              <span class="rsuyoy-event-pill p-gray" style="left: 52%;">午餐</span>
              <div class="rsuyoy-now-vline" style="left: 65%;"></div>
              <span class="rsuyoy-event-pill p-blue" style="left: 75%;">喝茶</span>
            </div>
          </div>

          <div class="rsuyoy-row">
            <div class="rsuyoy-day-tag">
              <small>二</small><strong>21</strong>
            </div>
            <div class="rsuyoy-band-slot">
              <span class="rsuyoy-event-pill p-green" style="left: 2%;">晨跑</span>
              <span class="rsuyoy-event-pill p-blue" style="left: 8%;">喝茶</span>
              <span class="rsuyoy-event-pill p-purple" style="left: 15%;">午餐</span>
              <span class="rsuyoy-event-pill p-blue" style="left: 24%;">项目</span>
              <span class="rsuyoy-event-pill p-green" style="left: 36%;">晨跑</span>
              <span class="rsuyoy-event-pill p-blue" style="left: 50%;">学习</span>
              <span class="rsuyoy-event-pill p-blue" style="left: 58%;">研讨</span>
              <span class="rsuyoy-event-pill p-orange" style="left: 85%;">晚餐</span>
            </div>
          </div>

          <div class="rsuyoy-row">
            <div class="rsuyoy-day-tag">
              <small>三</small><strong>22</strong>
            </div>
            <div class="rsuyoy-band-slot">
              <span class="rsuyoy-event-pill p-blue" style="left: 48%;">学习</span>
              <span class="rsuyoy-event-pill p-blue" style="left: 56%;">研讨</span>
              <span class="rsuyoy-event-pill p-green" style="left: 85%;">健身</span>
            </div>
          </div>

          <div class="rsuyoy-row">
            <div class="rsuyoy-day-tag">
              <small>四</small><strong>23</strong>
            </div>
            <div class="rsuyoy-band-slot">
              <span class="rsuyoy-event-pill p-green" style="left: 35%;">健身</span>
              <span class="rsuyoy-event-pill p-blue" style="left: 48%;">慢跑</span>
            </div>
          </div>

          <div class="rsuyoy-row">
            <div class="rsuyoy-day-tag">
              <small>五</small><strong>24</strong>
            </div>
            <div class="rsuyoy-band-slot">
              <span class="rsuyoy-event-pill p-blue" style="left: 48%;">学习</span>
              <span class="rsuyoy-event-pill p-orange" style="left: 85%;">观影</span>
            </div>
          </div>

          <div class="rsuyoy-row">
            <div class="rsuyoy-day-tag">
              <small>六</small><strong>25</strong>
            </div>
            <div class="rsuyoy-band-slot">
              <span class="rsuyoy-event-pill p-gray" style="left: 65%;">观展</span>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_11_natural_language_bar",
    name: "11 自然语言日程智能输入与切换栏",
    source: "11_多日横向时间带日历_rsuyoy",
    category: "日程与时间流",
    type: "UI 容器",
    desc: "1:1 复刻 rsuyoy：视图切换胶囊(D/W/M/Y)与自然语言智能日程添加输入框",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-rsuyoy-bottom-suite" data-instance-id="${instanceId}">
        <div class="rsuyoy-view-switch-row">
          <div class="view-icons-pill">
            <button class="v-btn" onclick="switchScheduleViewType('list', this)">☰ 列表</button>
            <button class="v-btn active" onclick="switchScheduleViewType('cal', this)">📅 日历</button>
          </div>
          <div class="view-modes-pill">
            <button class="m-btn" onclick="switchScheduleViewMode('day', this)">日</button>
            <button class="m-btn active" onclick="switchScheduleViewMode('week', this)">周</button>
            <button class="m-btn" onclick="switchScheduleViewMode('month', this)">月</button>
            <button class="m-btn" onclick="switchScheduleViewMode('year', this)">年</button>
          </div>
        </div>
        <div class="rsuyoy-smart-input-box">
          <span class="plus-icon">+</span>
          <input type="text" class="nl-input" placeholder="输入排程，如：明天下午3点例会..." value="明天下午3点 团队项目研讨例会" />
          <button class="mic-btn" onclick="toggleVoiceInputModal()">🎙️ 语音</button>
        </div>
      </div>
    `
  },

  // ================= 7. 太极睡眠、时钟与拟物音频类 (yiiiii / 04 Clock / 06 GalihWardana / 12 猫咪音频台) =================
  {
    id: "ui_01_taiji_sleep_clock",
    name: "01 太极日月双鱼昼夜睡眠表盘",
    source: "01_手持时钟日历双卡片_yiiiii",
    category: "时钟与睡眠",
    type: "UI 容器",
    desc: "1:1 复刻 yiiiii：阴阳双鱼弧、夜间刻度与睡眠白弧(带🌙弯月)、中央睡眠时长分析与打卡",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-taiji-sleep-container" data-instance-id="${instanceId}">
        <div class="taiji-dial-wrapper">
          <div class="taiji-outer-ring">
            <div class="taiji-moon-arc">
              <span class="moon-icon">🌙</span>
              <span class="wake-dot"></span>
            </div>
            <div class="taiji-center-card">
              <div class="sleep-time-stat">睡觉 23:15</div>
              <div class="wake-time-stat">起床 07:00</div>
              <div class="total-sleep-badge">共 7 小时 45 分</div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_01_circle_month_cal_card",
    name: "01 圆形月视图日历与双卡片容器",
    source: "01_手持时钟日历双卡片_yiiiii",
    category: "时钟与睡眠",
    type: "UI 容器",
    desc: "1:1 复刻 yiiiii：三月 2026 圆形波点日历小格子、左侧微浮雕立式药丸滑块、深紫高质感底座",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-yiiiii-circle-cal-card" data-instance-id="${instanceId}">
        <div class="yiiiii-top-bar">
          <button class="yiiiii-circle-btn close-btn">✕</button>
          <span class="yiiiii-month-title">三月 2026</span>
          <div class="yiiiii-nav-arrows">
            <button class="yiiiii-circle-btn nav-btn">‹</button>
            <button class="yiiiii-circle-btn nav-btn">›</button>
          </div>
        </div>
        <div class="yiiiii-cal-body">
          <div class="yiiiii-slider-col">
            <div class="embossed-pill-track">
              <div class="embossed-pill-thumb"></div>
            </div>
          </div>
          <div class="yiiiii-matrix-col">
            <div class="matrix-week-labels">
              <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
            </div>
            <div class="matrix-dots-grid">
              ${[23,24,25,26,27,28,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,1,2,3,4,5].map((d, i) => {
                const isCur = i >= 6 && i <= 36;
                const isToday = (d === 31 && isCur);
                return `<span class="c-dot ${isCur ? 'cur-month' : 'other-month'} ${isToday ? 'today-glow' : ''}">${d}</span>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_01_breathing_relax_card",
    name: "01 呼吸放松与专注调节卡片",
    source: "01_手持时钟日历双卡片_yiiiii",
    category: "时钟与睡眠",
    type: "UI 容器",
    desc: "1:1 复刻 yiiiii：呼吸放松模式切换(放松/精力/日常)、时长标尺刻度滑块与确定胶囊",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-breathing-card" data-instance-id="${instanceId}">
        <div class="breathe-title">呼吸放松</div>
        <div class="breathe-modes-row">
          <div class="b-mode-tile">
            <span class="m-ico">😌</span>
            <span class="m-txt">放松情绪</span>
          </div>
          <div class="b-mode-tile">
            <span class="m-ico">🎯</span>
            <span class="m-txt">集中精力</span>
          </div>
          <div class="b-mode-tile active">
            <span class="m-ico">🌱</span>
            <span class="m-txt">日常练习</span>
          </div>
        </div>
        <div class="breathe-controls-row">
          <div class="b-ctrl-box box-duration">
            <div class="ctrl-label">时长</div>
            <div class="ctrl-val">05 分钟</div>
            <div class="ruler-ticks">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>
          <div class="b-ctrl-box box-volume">
            <div class="ctrl-label">音量</div>
            <div class="volume-waves">
              <span class="v-bar h1"></span><span class="v-bar h2"></span><span class="v-bar h3"></span><span class="v-bar h4"></span><span class="v-bar h2"></span>
            </div>
          </div>
        </div>
        <button class="breathe-confirm-btn">确定</button>
      </div>
    `
  },
  {
    id: "ui_04_alarm_list",
    name: "04 黑色极简多闹钟与计时聚合列表",
    source: "04_黑色极简时钟闹钟_Clock",
    category: "时钟与睡眠",
    type: "UI 容器",
    desc: "1:1 复刻 04：大字 09:30/06:30 闹钟列表带粉红开关、05:00 计时器、悬浮加号导航",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-04-alarm-suite" data-instance-id="${instanceId}">
        <div class="alarm-suite-header">
          <span class="suite-title">排程事项清单</span>
        </div>
        
        <div class="alarm-group-section">
          <div class="sec-label-row">
            <span>闹钟提醒</span>
            <button class="mini-add-btn">+</button>
          </div>
          <div class="alarm-item-row">
            <div class="time-col">
              <div class="time-digits">09:30</div>
              <div class="time-repeat">周末唤醒</div>
            </div>
            <label class="coral-switch">
              <input type="checkbox" checked />
              <span class="slider round"></span>
            </label>
          </div>
          <div class="alarm-item-row">
            <div class="time-col">
              <div class="time-digits">06:30</div>
              <div class="time-repeat">周一至周五</div>
            </div>
            <label class="coral-switch">
              <input type="checkbox" checked />
              <span class="slider round"></span>
            </label>
          </div>
        </div>

        <div class="alarm-group-section">
          <div class="sec-label-row">
            <span>计时闹钟</span>
            <button class="mini-add-btn">+</button>
          </div>
          <div class="alarm-item-row">
            <div class="time-col">
              <div class="time-digits">05:00</div>
              <div class="time-repeat">溏心蛋计时 (6分钟)</div>
            </div>
            <div class="timer-play-controls">
              <button class="t-ctrl-btn">⏸️</button>
              <button class="t-ctrl-btn active">▶️</button>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_06_ring_digit_countdown",
    name: "06 环形数字矩阵散聚动效倒计时盘",
    source: "06_环形数字倒计时动效_GalihWardana",
    category: "时钟与睡眠",
    type: "UI 容器",
    desc: "1:1 复刻 GalihWardana：中央大字 00:10、环形发散聚拢数字粒子矩阵与旋转刻度动效",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-galih-countdown-board" data-instance-id="${instanceId}">
        <div class="galih-ring-stage">
          <div class="galih-particles-orbit">
            ${[1,2,3,4,5,6,7,8,9,10,11,12].map((num, i) => {
              const angle = i * 30;
              return `<span class="orbit-num" style="--rot: ${angle}deg; transform: rotate(${angle}deg) translate(0, -90px) rotate(-${angle}deg);">${num < 10 ? '0' + num : num}</span>`;
            }).join('')}
          </div>
          <div class="galih-center-core">
            <div class="core-digits">00:10</div>
            <div class="core-sub">心流专注中...</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_12_cat_audio_console",
    name: "12 猫咪手账留声机 · 今日白噪音",
    source: "12_拟物环形音频控制台_CatVolume",
    category: "音频与拟物",
    type: "UI 容器",
    desc: "日系手账黑胶留声机：温润黑胶唱片微转、黑白奶牛猫手绘头像、真实细雨/篝火/海风白噪音与平滑音量控制",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-cat-vinyl-player" data-instance-id="${instanceId}">
        <div class="vinyl-player-header">
          <div class="player-title-box">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--accent, #ff8833)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="4"/></svg>
            <span class="player-main-title">猫咪留声机 · 今日专注白噪音</span>
          </div>
          <span class="noise-status-badge" id="cat-noise-mode-label">细雨心流</span>
        </div>

        <div class="vinyl-turntable-stage">
          <!-- 左侧：拟物黑胶唱盘与奶牛猫 -->
          <div class="vinyl-disc-container" onclick="toggleWhiteNoise()" title="轻点切换播放/暂停">
            <div class="vinyl-disc" id="vinyl-disc-mesh">
              <div class="vinyl-grooves"></div>
              <div class="vinyl-center-label">
                <!-- 黑白奶牛猫手绘头像 -->
                <svg viewBox="0 0 36 36" width="30" height="30" fill="none" style="vertical-align:middle; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));">
                  <path d="M7 11C7 6 10 3 14 6L18 8L22 6C26 3 29 6 29 11C29 20 25 28 18 28C11 28 7 20 7 11Z" fill="#1e293b"/>
                  <polygon points="11,5 14,9 9,9" fill="#fda4af"/>
                  <polygon points="25,5 27,9 22,9" fill="#fda4af"/>
                  <path d="M12 28C14 26 15 20 18 16C21 20 22 26 24 28C21 29 15 29 12 28Z" fill="#ffffff"/>
                  <ellipse cx="14" cy="15" rx="2" ry="2.5" fill="#facc15"/>
                  <ellipse cx="22" cy="15" rx="2" ry="2.5" fill="#facc15"/>
                  <circle cx="14" cy="15" r="1.1" fill="#0f172a"/>
                  <circle cx="22" cy="15" r="1.1" fill="#0f172a"/>
                  <polygon points="18,19 17,17.5 19,17.5" fill="#f43f5e"/>
                  <path d="M16.5 20.5C17.2 21.2 18.8 21.2 19.5 20.5" stroke="#475569" stroke-width="0.8" stroke-linecap="round"/>
                  <line x1="12" y1="18" x2="6" y2="17" stroke="#cbd5e1" stroke-width="0.8"/>
                  <line x1="12" y1="19.5" x2="6" y2="20" stroke="#cbd5e1" stroke-width="0.8"/>
                  <line x1="24" y1="18" x2="30" y2="17" stroke="#cbd5e1" stroke-width="0.8"/>
                  <line x1="24" y1="19.5" x2="30" y2="20" stroke="#cbd5e1" stroke-width="0.8"/>
                </svg>
              </div>
            </div>
            <!-- 机械唱针 -->
            <div class="vinyl-tonearm" id="vinyl-tonearm">
              <div class="tonearm-base"></div>
              <div class="tonearm-pole"></div>
              <div class="tonearm-head"></div>
            </div>
          </div>

          <!-- 右侧：控制与状态 -->
          <div class="vinyl-controls-panel">
            <div class="vinyl-cat-quote">
              <span class="cat-paw-icon">🐾</span>
              <span id="cat-companion-quote">奶牛猫正伴着细雨声打呼噜...</span>
            </div>

            <button class="vinyl-main-play-btn" id="cat-vinyl-play-toggle" onclick="toggleWhiteNoise()">
              <svg id="vinyl-btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4"/>
              </svg>
              <span id="vinyl-btn-label">开启白噪音陪伴</span>
            </button>

            <!-- 音量线性控制器 -->
            <div class="vinyl-volume-control">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              <input type="range" class="vinyl-vol-slider" min="0" max="100" value="40" oninput="changeNoiseVolume(this.value)" />
              <span class="vol-label" id="vinyl-vol-val">40%</span>
            </div>
          </div>
        </div>

        <!-- 底部：三款声音场景快速切换 -->
        <div class="vinyl-sound-chips">
          <button class="sound-chip active" data-type="rain" onclick="switchNoiseType('rain', this)">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><line x1="12" y1="21" x2="12" y2="23"/></svg>
            <span>窗外细雨</span>
          </button>
          <button class="sound-chip" data-type="fire" onclick="switchNoiseType('fire', this)">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            <span>温暖篝火</span>
          </button>
          <button class="sound-chip" data-type="wave" onclick="switchNoiseType('wave', this)">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3"/></svg>
            <span>慢潮海风</span>
          </button>
        </div>
      </div>
    `
  },
  {
    id: "ui_kanban_habit_freq",
    name: "习惯与频次打卡点阵",
    source: "看板子板块·频率",
    category: "看板",
    type: "UI 容器",
    desc: "高密度习惯频率追踪点阵：记录晨跑、早起、冥想、复盘等核心微习惯的 7 天连击点阵与达成率",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-habit-freq-container" data-instance-id="${instanceId}">
        <div class="card-unified-header">
          <div class="card-title-group">
            <span class="card-main-title">频次追踪 · 核心微习惯</span>
            <span class="card-sub-title">连续打卡 24 天 · 本周达成率 88%</span>
          </div>
          <span class="theme-badge-pill">🔥 连击中</span>
        </div>
        <div class="habit-freq-list">
          ${[
            { name: "早起 07:00", icon: "07:00", days: [1,1,1,1,1,0,1], streak: 18 },
            { name: "正念冥想 15m", icon: "15m", days: [1,1,0,1,1,1,1], streak: 12 },
            { name: "喝水 2000ml", icon: "2L", days: [1,1,1,1,1,1,1], streak: 30 },
            { name: "运动健身", icon: "Fit", days: [1,0,1,0,1,1,0], streak: 5 },
            { name: "睡前闭环复盘", icon: "Rev", days: [1,1,1,1,1,1,1], streak: 24 }
          ].map(h => `
            <div class="habit-freq-row">
              <div class="h-info">
                <span class="h-ico">${h.icon}</span>
                <span class="h-name">${h.name}</span>
              </div>
              <div class="h-dots">
                ${h.days.map((d) => `
                  <span class="h-dot ${d ? 'checked' : ''}" onclick="this.classList.toggle('checked')">${d ? '✓' : ''}</span>
                `).join('')}
              </div>
              <span class="h-streak">${h.streak}天</span>
            </div>
          `).join('')}
        </div>
      </div>
    `
  },
  {
    id: "ui_kanban_annual_review",
    name: "高光时刻与深度复盘卡",
    source: "看板子板块·复盘",
    category: "看板",
    type: "UI 容器",
    desc: "周期度复盘模版：精选成就高光时刻、未竟之事诊断、核心心流反思与下一步行动对齐",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-annual-review-box" data-instance-id="${instanceId}">
        <div class="card-unified-header">
          <div class="card-title-group">
            <span class="card-main-title">周期复盘 · 心流与洞察</span>
            <span class="card-sub-title">2026 年第 40 周反思结案</span>
          </div>
          <span class="theme-icon-btn">✨ 高光</span>
        </div>
        <div class="review-sections-list">
          <div class="review-block highlight">
            <div class="rb-title">★ 本周 3 大成就突破</div>
            <ul class="rb-items">
              <li>红米 K80 专属原生体验版编译上线</li>
              <li>完成 33 款高精 UI 容器与微表情双轨资产解耦</li>
              <li>坚持晨跑 15km，精力与注意力显著提升</li>
            </ul>
          </div>
          <div class="review-block obstacle">
            <div class="rb-title">● 认知迭代与避坑心得</div>
            <p class="rb-p">“过多的底层导航只会增加认知负荷，隐藏底栏并提供随需应变的悬浮中枢才是 零摩擦极简友好交互的解法。”</p>
          </div>
          <div class="review-block next-step">
            <div class="rb-title">▲ 下一步关键战役</div>
            <div class="rb-badge-row">
              <span class="rb-badge">真机流畅度实测</span>
              <span class="rb-badge">桌面端平滑联动</span>
              <span class="rb-badge">离线数据持久化</span>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_kanban_smart_notif",
    name: "晨夕智能简报与通知气泡",
    source: "看板子板块·通知",
    category: "看板",
    type: "UI 容器",
    desc: "时间感知动态通知卡：晨间日历日程要点速递、午间精力校准、晚间睡眠熄灯倒计时、待办催办气泡",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-smart-notif-box" data-instance-id="${instanceId}">
        <div class="card-unified-header">
          <div class="card-title-group">
            <span class="card-main-title">智能通知流 · 日程速递</span>
            <span class="card-sub-title">系统已同步 3 条即时动态</span>
          </div>
          <span class="notif-live-badge">实时</span>
        </div>
        <div class="notif-bubbles-stack">
          <div class="notif-bubble-item morning">
            <div class="nb-icon">☀️</div>
            <div class="nb-content">
              <div class="nb-head"><span class="nb-title">晨间焦点简报</span><span class="nb-time">08:00</span></div>
              <div class="nb-desc">今天共 4 项排程，上午 10:00 有「手机端UI交互评审」，建议预留 15 分钟专注缓冲。</div>
            </div>
          </div>
          <div class="notif-bubble-item focus">
            <div class="nb-icon">⏳</div>
            <div class="nb-content">
              <div class="nb-head"><span class="nb-title">精力黄金期提醒</span><span class="nb-time">14:30</span></div>
              <div class="nb-desc">当前处于下午最高专注窗口，推荐启动 25 分钟太极深度番茄钟。</div>
            </div>
          </div>
          <div class="notif-bubble-item night">
            <div class="nb-icon">🌙</div>
            <div class="nb-content">
              <div class="nb-head"><span class="nb-title">晚间熄灯仪式准备</span><span class="nb-time">22:00</span></div>
              <div class="nb-desc">距离目标入睡时间还有 45 分钟，建议开启猫咪拟物白噪音进入放松状态。</div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_ideas_scratchpad",
    name: "灵感便笺与随手速记墙",
    source: "想法板块",
    category: "想法",
    type: "UI 容器",
    desc: "ADHD 零摩擦想法捕捉板：拟物便签、随手手账碎片便笺，支持点选转入行动清单",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-ideas-scratchpad-card" data-instance-id="${instanceId}">
        <div class="card-unified-header">
          <div class="card-title-group">
            <span class="card-main-title">想法便笺墙 · 随手捕捉</span>
            <span class="card-sub-title">不让任何灵感在脑中溜走</span>
          </div>
          <button class="theme-icon-btn" onclick="addQuickIdea(this)">✏️ 速写</button>
        </div>
        <div class="ideas-notes-grid">
          <div class="sticky-memo yellow">
            <div class="sticky-tape"></div>
            <div class="memo-text" contenteditable="true">给看板加上 120Hz 滑动微触感，REDMI K80 澎湃 OS 肯定很爽！</div>
            <div class="memo-footer">
              <span class="memo-time">10:24</span>
              <span class="memo-action-btn" onclick="turnIdeaToAction(this)">转行动</span>
            </div>
          </div>
          <div class="sticky-memo blue">
            <div class="sticky-clip"></div>
            <div class="memo-text" contenteditable="true">年度日历的 365 天色块，可以根据当天心情微表情的主题色自动渐变。</div>
            <div class="memo-footer">
              <span class="memo-time">14:15</span>
              <span class="memo-action-btn" onclick="turnIdeaToAction(this)">转行动</span>
            </div>
          </div>
          <div class="sticky-memo green">
            <div class="sticky-pin"></div>
            <div class="memo-text" contenteditable="true">拟物文具盒里添加一把小剪刀和一个削铅笔卷笔刀动效。</div>
            <div class="memo-footer">
              <span class="memo-time">昨天</span>
              <span class="memo-action-btn" onclick="turnIdeaToAction(this)">转行动</span>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: "ui_actions_gtd_matrix",
    name: "即刻行动与吃青蛙清单",
    source: "行动板块",
    category: "行动",
    type: "UI 容器",
    desc: "消除拖延的高确定性行动面板：P0核心青蛙、今日必达、待打勾微行动，支持火漆徽章盖章",
    renderHtml: (instanceId) => `
      <div class="live-ui-card ui-actions-gtd-card" data-instance-id="${instanceId}">
        <div class="card-unified-header">
          <div class="card-title-group">
            <span class="card-main-title">即刻行动 · 战胜拖延</span>
            <span class="card-sub-title">锁定当下最小下一步动作</span>
          </div>
          <span class="theme-badge-pill">3/5 已击破</span>
        </div>
        <div class="gtd-action-items">
          <div class="gtd-item frog-item">
            <span class="gtd-frog-badge"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" style="vertical-align:middle; display:inline-block;"><path d="M3.5 11C2.5 11 2 12 2 13.5C2 17 6.5 20 12 20C17.5 20 22 17 22 13.5C22 12 21.5 11 20.5 11C20.5 8 18 6 15 6C13.5 6 12.5 7 12 7.5C11.5 7 10.5 6 9 6C6 6 3.5 8 3.5 11Z" fill="#10b981" stroke="#047857" stroke-width="1.6"/><circle cx="8" cy="7.5" r="2.4" fill="#ffffff" stroke="#047857" stroke-width="1.3"/><circle cx="8" cy="7.5" r="1.1" fill="#064e3b"/><circle cx="16" cy="7.5" r="2.4" fill="#ffffff" stroke="#047857" stroke-width="1.3"/><circle cx="16" cy="7.5" r="1.1" fill="#064e3b"/><path d="M9.5 15C10.5 16.2 13.5 16.2 14.5 15" stroke="#064e3b" stroke-width="1.5" stroke-linecap="round"/></svg> 核心破局青蛙</span>
            <div class="gtd-text-box">
              <div class="gtd-item-title">重构隐藏底栏与右下角悬浮交互体系</div>
              <div class="gtd-item-sub">预计耗时 25分钟in · 难度 ★★☆</div>
            </div>
            <button class="gtd-stamp-btn" onclick="this.classList.toggle('stamped')">
              <span class="stamp-txt">盖印</span>
            </button>
          </div>
          <div class="gtd-item normal done" onclick="toggleTodoItem(this)">
            <span class="todo-check-circle">✓</span>
            <div class="gtd-text-box">
              <div class="gtd-item-title">桌面端代码完整冷备份与安全隔离</div>
              <div class="gtd-item-sub">已在本地备份目录下归档快照</div>
            </div>
          </div>
          <div class="gtd-item normal" onclick="toggleTodoItem(this)">
            <span class="todo-check-circle"></span>
            <div class="gtd-text-box">
              <div class="gtd-item-title">看板 4 大子板块（频率/统计/复盘/通知）装配</div>
              <div class="gtd-item-sub">高密度微组件布局</div>
            </div>
          </div>
          <div class="gtd-item normal" onclick="toggleTodoItem(this)">
            <span class="todo-check-circle"></span>
            <div class="gtd-text-box">
              <div class="gtd-item-title">编译最新版手机安装包并扫码真机测试</div>
              <div class="gtd-item-sub">REDMI K80 澎湃 OS 3.0</div>
            </div>
          </div>
        </div>
      </div>
    `
  }
];

// 二、设计元素库 (41款高精单体透明表情包 + 拟物工具零件)
const DESIGN_ELEMENTS = [
  // --- 分组 A: Mooda 趣味装扮表情 (15个单体) ---
  { id: "e_dress_01", name: "晕 (贝雷帽)", group: "装扮表情", file: "mooda_dress_01_yun.png" },
  { id: "e_dress_02", name: "么么哒 (派对帽)", group: "装扮表情", file: "mooda_dress_02_memeda.png" },
  { id: "e_dress_03", name: "wink (魔法帽)", group: "装扮表情", file: "mooda_dress_03_wink.png" },
  { id: "e_dress_04", name: "好气哦 (皇冠火)", group: "装扮表情", file: "mooda_dress_04_haoqio.png" },
  { id: "e_dress_05", name: "无语 (保暖围巾)", group: "装扮表情", file: "mooda_dress_05_wuyu.png" },
  { id: "e_dress_06", name: "愉悦 (小熊耳朵)", group: "装扮表情", file: "mooda_dress_06_yuyue.png" },
  { id: "e_dress_07", name: "爱了 (头顶小黄鸡)", group: "装扮表情", file: "mooda_dress_07_aileaile.png" },
  { id: "e_dress_08", name: "快哭了 (绅士领结)", group: "装扮表情", file: "mooda_dress_08_kuaikule.png" },
  { id: "e_dress_09", name: "害羞 (白兔耳朵)", group: "装扮表情", file: "mooda_dress_09_haixiu.png" },
  { id: "e_dress_10", name: "hahahh (圣诞帽)", group: "装扮表情", file: "mooda_dress_10_hahahh.png" },
  { id: "e_dress_11", name: "醉了 (青蛙眼罩)", group: "装扮表情", file: "mooda_dress_11_zuile.png" },
  { id: "e_dress_12", name: "邪恶 (黑发小尖牙)", group: "装扮表情", file: "mooda_dress_12_xie_e.png" },
  { id: "e_dress_13", name: "哇 (奋斗红白头巾)", group: "装扮表情", file: "mooda_dress_13_wa.png" },
  { id: "e_dress_14", name: "发呆 (粉嫩小猪帽)", group: "装扮表情", file: "mooda_dress_14_fadai.png" },
  { id: "e_dress_15", name: "纠结 (小鹿角)", group: "装扮表情", file: "mooda_dress_15_jiujie.png" },

  // --- 分组 B: Mooda 经典心情表情 (9个单体) ---
  { id: "e_classic_01", name: "担心 (灰紫小脸)", group: "经典心情", file: "mooda_classic_01_danxin.png" },
  { id: "e_classic_02", name: "非常棒 (元气橙眨眼)", group: "经典心情", file: "mooda_classic_02_feichangbang.png" },
  { id: "e_classic_03", name: "累 (淡蓝垂眼)", group: "经典心情", file: "mooda_classic_03_lei.png" },
  { id: "e_classic_04", name: "平静 (安心绿脸)", group: "经典心情", file: "mooda_classic_04_pingjing.png" },
  { id: "e_classic_05", name: "难过 (深青忧郁)", group: "经典心情", file: "mooda_classic_05_nanguo.png" },
  { id: "e_classic_06", name: "开心 (亮蓝欢喜)", group: "经典心情", file: "mooda_classic_06_kaixin.png" },
  { id: "e_classic_07", name: "焦虑 (红脸慌张)", group: "经典心情", file: "mooda_classic_07_jiaolv.png" },
  { id: "e_classic_08", name: "差劲 (紫灰无精打采)", group: "经典心情", file: "mooda_classic_08_chajin.png" },
  { id: "e_classic_09", name: "苦涩 (深灰失落)", group: "经典心情", file: "mooda_classic_09_kuse.png" },

  // --- 分组 C: TinyType 萌宠表情 (卷毛小狗 5个 + 橡果小象 5个) ---
  { id: "e_pet_01", name: "萌犬·气愤 (皱眉撇嘴)", group: "萌宠胶囊", file: "capsule_pet_01_qifen.png" },
  { id: "e_pet_02", name: "萌犬·伤心 (流眼泪)", group: "萌宠胶囊", file: "capsule_pet_02_shangxin.png" },
  { id: "e_pet_03", name: "萌犬·放空 (呆呆平视)", group: "萌宠胶囊", file: "capsule_pet_03_fangkong.png" },
  { id: "e_pet_04", name: "萌犬·开心 (眯眯眼)", group: "萌宠胶囊", file: "capsule_pet_04_kaixin.png" },
  { id: "e_pet_05", name: "萌犬·超开心 (狂笑飙泪)", group: "萌宠胶囊", file: "capsule_pet_05_chaokaixin.png" },
  { id: "e_ele_01", name: "小象·气愤", group: "萌宠胶囊", file: "capsule_elephant_01_qifen.png" },
  { id: "e_ele_02", name: "小象·伤心", group: "萌宠胶囊", file: "capsule_elephant_02_shangxin.png" },
  { id: "e_ele_03", name: "小象·平静", group: "萌宠胶囊", file: "capsule_elephant_03_pingjing.png" },
  { id: "e_ele_04", name: "小象·开心", group: "萌宠胶囊", file: "capsule_elephant_04_kaixin.png" },
  { id: "e_ele_05", name: "小象·超开心", group: "萌宠胶囊", file: "capsule_elephant_05_chaokaixin.png" },

  // --- 分组 D: 情绪轮盘专属单体 (7个) ---
  { id: "e_wheel_01", name: "轮盘·受冻围巾", group: "轮盘交互", file: "wheel_01_freeze_weijin.png" },
  { id: "e_wheel_02", name: "轮盘·不满生气", group: "轮盘交互", file: "wheel_02_annoyed_shengqi.png" },
  { id: "e_wheel_03", name: "轮盘·明媚大笑", group: "轮盘交互", file: "wheel_03_smile_dingbu.png" },
  { id: "e_wheel_04", name: "轮盘·暴怒喷火", group: "轮盘交互", file: "wheel_04_furious_penhuo.png" },
  { id: "e_wheel_05", name: "轮盘·荷包蛋更多", group: "轮盘交互", file: "wheel_05_egg_more.png" },
  { id: "e_wheel_06", name: "轮盘·中置加号大圆钮", group: "轮盘交互", file: "wheel_btn_plus_center.png" },
  { id: "e_wheel_07", name: "轮盘·滑块设置钮", group: "轮盘交互", file: "wheel_btn_settings_left.png" },

  // --- 分组 E: 拟物文具与便签零件 (AI 高质感原创创作，无缝透明) ---
  { id: "tool_highlighter_yellow", name: "柠檬黄斜头荧光笔", group: "文具便签", file: "pen_highlighter_yellow.png", path: "./assets/design-elements/pen_highlighter_yellow.png", defW: 36, defH: 88 },
  { id: "tool_highlighter_blue", name: "晴空蓝斜头荧光笔", group: "文具便签", file: "pen_highlighter_blue.png", path: "./assets/design-elements/pen_highlighter_blue.png", defW: 36, defH: 88 },
  { id: "tool_highlighter_pink", name: "樱花粉斜头荧光笔", group: "文具便签", file: "pen_highlighter_pink.png", path: "./assets/design-elements/pen_highlighter_pink.png", defW: 36, defH: 88 },
  { id: "tool_highlighter_green", name: "薄荷绿斜头荧光笔", group: "文具便签", file: "pen_highlighter_green.png", path: "./assets/design-elements/pen_highlighter_green.png", defW: 36, defH: 88 },
  { id: "tool_highlighter_orange", name: "暖日橙斜头荧光笔", group: "文具便签", file: "pen_highlighter_orange.png", path: "./assets/design-elements/pen_highlighter_orange.png", defW: 36, defH: 88 },
  { id: "tool_clip_rose_gold", name: "玫瑰金金属回形针", group: "文具便签", file: "clip_rose_gold.png", path: "./assets/design-elements/clip_rose_gold.png", defW: 24, defH: 52 },
  { id: "tool_pin_brass_tack", name: "复古黄铜立体工字钉", group: "文具便签", file: "pin_brass_tack.png", path: "./assets/design-elements/pin_brass_tack.png", defW: 32, defH: 34 },
  { id: "tool_washi_tape_grid", name: "米灰方格和纸胶带", group: "文具便签", file: "washi_tape_grid.png", path: "./assets/design-elements/washi_tape_grid.png", defW: 92, defH: 26 },
  { id: "tool_washi_tape_dot", name: "奶油波点和纸胶带", group: "文具便签", file: "washi_tape_dot.png", path: "./assets/design-elements/washi_tape_dot.png", defW: 92, defH: 26 },
  { id: "tool_stamp_wax_done", name: "青铜 DONE 封蜡火漆", group: "文具便签", file: "stamp_wax_done.png", path: "./assets/design-elements/stamp_wax_done.png", defW: 46, defH: 46 },
  { id: "tool_stamp_wax_today", name: "绯红 TODAY 封蜡火漆", group: "文具便签", file: "stamp_wax_today.png", path: "./assets/design-elements/stamp_wax_today.png", defW: 46, defH: 46 },
  { id: "tool_badge_star_3d", name: "3D 鎏金立体星徽", group: "文具便签", file: "badge_star_3d.png", path: "./assets/design-elements/badge_star_3d.png", defW: 40, defH: 40 },
  { id: "p_heart_3d", name: "立体高光爱心便签", group: "文具便签", file: "heart_3d.png", path: "./assets/design-elements/heart_3d.png", defW: 38, defH: 38 },
  { id: "p_btn_add", name: "大黑圆极简加号按钮", group: "文具便签", file: "btn_add.png", path: "./assets/design-elements/btn_add.png", defW: 48, defH: 48 },
  { id: "p_pen_yellow", name: "圆头黄荧光记号笔", group: "文具便签", file: "pen_yellow.png", path: "./assets/design-elements/pen_yellow.png", defW: 36, defH: 88 },
  { id: "p_pen_cyan", name: "圆头天蓝荧光笔", group: "文具便签", file: "pen_cyan.png", path: "./assets/design-elements/pen_cyan.png", defW: 36, defH: 88 },
  { id: "p_pen_pink", name: "圆头樱花粉荧光笔", group: "文具便签", file: "pen_pink.png", path: "./assets/design-elements/pen_pink.png", defW: 36, defH: 88 }
];

// 三、统一风格的 6 大预设移动端屏幕定义 (五维时空树枝架构 + 用户自定义白板)
const APP_SCREENS = [
  {
    id: "screen_year_overview",
    name: "1. 全景年度热力盘",
    tag: "全局年景",
    desc: "Mac 桌面端年度日历移动版：365天色块热力 + 年度进度流向卡 + 象限目标 + 萌宠打卡胶囊 + 拟物手账胶带/回形针点缀",
    initialElements: [
      { type: "container", compId: "ui_02_top_date", x: 20, y: 32, w: 320, h: 42, z: 2 },
      { type: "container", compId: "ui_year_progress_bar", x: 20, y: 82, w: 320, h: 96, z: 3 },
      { type: "element", compId: "tool_washi_tape_grid", x: 22, y: 72, w: 90, h: 26, z: 15, rotate: -4 },
      { type: "element", compId: "tool_clip_rose_gold", x: 298, y: 74, w: 22, h: 50, z: 16, rotate: 6 },
      { type: "container", compId: "ui_year_mosaic_grid", x: 15, y: 188, w: 330, h: 320, z: 2 },
      { type: "element", compId: "tool_stamp_wax_done", x: 278, y: 196, w: 46, h: 46, z: 15, rotate: 12 },
      { type: "element", compId: "tool_highlighter_yellow", x: 250, y: 440, w: 36, h: 88, z: 12, rotate: -20 },
      { type: "container", compId: "ui_pet_capsule_dock", x: 15, y: 520, w: 330, h: 85, z: 4 },
      { type: "container", compId: "ui_anylog_dock", x: 20, y: 620, w: 320, h: 62, z: 20 }
    ]
  },
  {
    id: "screen_week_timeband",
    name: "2. 周视图横向时间带",
    tag: "周排程流",
    desc: "1:1 复刻 11 rsuyoy：19-25 July 极简周排程、多日横向时间带、彩色胶囊事件分布、自然语言智能输入栏",
    initialElements: [
      { type: "container", compId: "ui_02_top_date", x: 20, y: 32, w: 320, h: 42, z: 2 },
      { type: "container", compId: "ui_11_multiday_timeband_calendar", x: 15, y: 82, w: 330, h: 410, z: 3 },
      { type: "element", compId: "tool_clip_rose_gold", x: 295, y: 80, w: 22, h: 50, z: 15, rotate: 8 },
      { type: "container", compId: "ui_11_natural_language_bar", x: 15, y: 505, w: 330, h: 125, z: 4 },
      { type: "container", compId: "ui_anylog_dock", x: 20, y: 645, w: 320, h: 60, z: 20 }
    ]
  },
  {
    id: "screen_today_stream",
    name: "3. 今日彩色时间块流",
    tag: "今日糖果流",
    desc: "1:1 复刻 09 Jul26：顶部周日期高亮粘连胶囊、3列半透果冻堆叠时间块、当前时间 12:55 红色游标线",
    initialElements: [
      { type: "container", compId: "ui_09_color_timeblock_stream", x: 15, y: 32, w: 330, h: 470, z: 3 },
      { type: "element", compId: "tool_pin_brass_tack", x: 22, y: 28, w: 30, h: 32, z: 16 },
      { type: "element", compId: "tool_washi_tape_dot", x: 220, y: 30, w: 90, h: 26, z: 15, rotate: 4 },
      { type: "container", compId: "ui_priority_todo_card", x: 15, y: 512, w: 330, h: 125, z: 4 },
      { type: "container", compId: "ui_anylog_dock", x: 20, y: 648, w: 320, h: 60, z: 20 }
    ]
  },
  {
    id: "screen_focus_sleep",
    name: "4. 专注时钟与太极睡眠",
    tag: "专注与睡眠",
    desc: "融合 01 yiiiii + 04 Clock + 06 Galih：太极日月双鱼睡眠表盘、04黑色多闹钟列表、呼吸放松调节卡片",
    initialElements: [
      { type: "container", compId: "ui_04_header_info", x: 20, y: 32, w: 320, h: 38, z: 2 },
      { type: "container", compId: "ui_01_taiji_sleep_clock", x: 20, y: 78, w: 320, h: 235, z: 3 },
      { type: "container", compId: "ui_04_alarm_list", x: 20, y: 325, w: 320, h: 235, z: 4 },
      { type: "container", compId: "ui_01_breathing_relax_card", x: 20, y: 572, w: 320, h: 140, z: 5 }
    ]
  },
  {
    id: "screen_mood_retro",
    name: "5. 心情日记与拟物声波",
    tag: "心情与音频",
    desc: "融合 13 表情打卡日历 + 12 猫咪音频台 拟物音频控制台：像素黑白小猫+20dB滑块、紫色麦克风、心情打卡",
    initialElements: [
      { type: "container", compId: "ui_02_top_date", x: 20, y: 32, w: 320, h: 42, z: 2 },
      { type: "container", compId: "ui_april_mood_cal", x: 20, y: 80, w: 320, h: 275, z: 3 },
      { type: "element", compId: "tool_badge_star_3d", x: 280, y: 85, w: 40, h: 40, z: 15, rotate: 12 },
      { type: "container", compId: "ui_12_cat_audio_console", x: 15, y: 365, w: 330, h: 255, z: 4 },
      { type: "container", compId: "ui_anylog_dock", x: 20, y: 635, w: 320, h: 60, z: 20 }
    ]
  },
  {
    id: "screen_custom_sandbox",
    name: "6. 自由组装白板 (Sandbox)",
    tag: "您的专属配置",
    desc: "载入您已导出的专属配置：365天热力矩阵 + 进度条 + 10月热力 + 四象限，可无限自由拖拽！",
    initialElements: [
      { type: "container", compId: "ui_year_mosaic_grid", x: 15, y: 35, w: 320, h: 130, z: 5 },
      { type: "container", compId: "ui_year_progress_bar", x: 14, y: 188, w: 320, h: 130, z: 5 },
      { type: "container", compId: "ui_month_heatmap_card", x: 9, y: 341, w: 320, h: 130, z: 5 },
      { type: "container", compId: "ui_quarter_quadrant", x: 9, y: 505, w: 320, h: 130, z: 5 }
    ]
  }
];

// 辅助选择轮盘心情交互
function selectWheelMood(node) {
  document.querySelectorAll('.wheel-emoji-node').forEach(n => n.classList.remove('active'));
  node.classList.add('active');
}

// 辅助选择胶囊心情交互
function pickCapsule(node, moodName) {
  document.querySelectorAll('.capsule-item').forEach(n => n.classList.remove('active'));
  node.classList.add('active');
  const toast = document.createElement('div');
  toast.className = 'canvas-live-toast';
  toast.innerText = `已打卡今日心情：${moodName}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1600);
}

// 辅助 Todo 打勾切换
function toggleTodoItem(row) {
  row.classList.toggle('done');
  const check = row.querySelector('.todo-check-circle');
  if (check) {
    check.innerText = row.classList.contains('done') ? '✓' : '';
  }
}

// 辅助想法便笺速写
function addQuickIdea(btn) {
  const container = btn.closest('.ui-ideas-scratchpad-card')?.querySelector('.ideas-notes-grid');
  if (!container) return;
  const colors = ['yellow', 'blue', 'green', 'pink'];
  const rndColor = colors[Math.floor(Math.random() * colors.length)];
  const memo = document.createElement('div');
  memo.className = `sticky-memo ${rndColor}`;
  memo.innerHTML = `
    <div class="sticky-tape"></div>
    <div class="memo-text" contenteditable="true">点击输入新的灵感...</div>
    <div class="memo-footer">
      <span class="memo-time">刚刚</span>
      <span class="memo-action-btn" onclick="turnIdeaToAction(this)">转行动</span>
    </div>
  `;
  container.prepend(memo);
  memo.querySelector('.memo-text').focus();
}

// 辅助想法转行动
function turnIdeaToAction(btn) {
  const memo = btn.closest('.sticky-memo');
  const text = memo?.querySelector('.memo-text')?.innerText || '新想法任务';
  const toast = document.createElement('div');
  toast.className = 'canvas-live-toast';
  toast.innerText = `已将想法转为行动任务！`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1600);
}

// 确保在全局 window 对象挂载双轨资产库
if (typeof window !== 'undefined') {
  window.UI_CONTAINERS = UI_CONTAINERS;
  if (typeof DESIGN_ELEMENTS !== 'undefined') {
    window.DESIGN_ELEMENTS = DESIGN_ELEMENTS;
  }
}


