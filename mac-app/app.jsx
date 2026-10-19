/* ============================================================
   年度一天总结看板 — 无限画板应用
   年份自适应网格 · 点击编辑 · 拖拽平移 · 滚轮/双指缩放
   ============================================================ */

var { useRef, useEffect, useMemo, useState, useCallback } = React;

/* 基础数据（北极星 Base 快照）：字段规整化，note/status 缺省补空串 */
const BASE_RECORDS = (window.BOARD_DATA && window.BOARD_DATA.records ? window.BOARD_DATA.records : [])
  .filter((r) => !r.markedDelete)
  .map((r) => ({
    date: r.date,
    text: r.text || "",
    category: r.category || "生活",
    note: r.note || "",
    status: r.status || "",
    record_id: r.record_id || "",
    type: r.type || "自己安排",
  }));
/* 全量基础记录按日期索引（仅收录「一天总结」）：字段级 diff 与写回包 create/update 判别都靠它 */
const BASE_BY_DATE = {};
BASE_RECORDS.forEach((r) => {
  if (r.type === "一天总结") {
    BASE_BY_DATE[r.date] = r;
  }
});

const DEFAULT_YEAR = 2026;
const YEAR_MIN = 2024;
const YEAR_MAX = 2035;

const MONTHS = [
  { n: "一月", en: "JAN" },
  { n: "二月", en: "FEB" },
  { n: "三月", en: "MAR" },
  { n: "四月", en: "APR" },
  { n: "五月", en: "MAY" },
  { n: "六月", en: "JUN" },
  { n: "七月", en: "JUL" },
  { n: "八月", en: "AUG" },
  { n: "九月", en: "SEP" },
  { n: "十月", en: "OCT" },
  { n: "十一月", en: "NOV" },
  { n: "十二月", en: "DEC" },
];

const WD_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/* 板块色（全面严格遵循 Apple Human Interface Guidelines 官方系统色与 12% 动态半透明层级） */
const CATS = {
  工作: { cls: "work", solid: "#007AFF", tint: "rgba(0, 122, 255, 0.12)", solidTint: "#e6f2ff", text: "#0050a6", classic: "#0071e3" },
  生活: { cls: "life", solid: "#34C759", tint: "rgba(52, 199, 89, 0.12)", solidTint: "#eaf8ee", text: "#1c6b2e", classic: "#248a3d" },
  学习: { cls: "study", solid: "#AF52DE", tint: "rgba(175, 82, 222, 0.12)", solidTint: "#f6ecfc", text: "#6e2d94", classic: "#8944ab" },
  运动: { cls: "sport", solid: "#FF9500", tint: "rgba(255, 149, 0, 0.12)", solidTint: "#fff4e6", text: "#995700", classic: "#c77500" },
  娱乐: { cls: "fun", solid: "#FF2D55", tint: "rgba(255, 45, 85, 0.12)", solidTint: "#ffedf1", text: "#b81436", classic: "#d61b42" },
  睡眠: { cls: "sleep", solid: "#8E8E93", tint: "rgba(142, 142, 147, 0.14)", solidTint: "#f1f1f3", text: "#48484a", classic: "#636366" },
  无匹配标签: { cls: "other", solid: "#EDE8DF", tint: "rgba(247, 245, 240, 0.95)", solidTint: "#F7F5F0", text: "#5C5852", border: "#E6E2D8", activeText: "#262b33", activeBorder: "#C8C3B8", activeDot: "#48484a", classic: "#DCD8CF" },
  其他: { cls: "other", solid: "#EDE8DF", tint: "rgba(247, 245, 240, 0.95)", solidTint: "#F7F5F0", text: "#5C5852", border: "#E6E2D8", activeText: "#262b33", activeBorder: "#C8C3B8", activeDot: "#48484a", classic: "#DCD8CF" },
};

/* 兼容支持“睡觉”板块别名，完全等同于“睡眠” */
CATS["睡觉"] = CATS["睡眠"];

const CATEGORY_LIST = ["工作", "生活", "学习", "运动", "娱乐", "睡眠", "其他"];

/* 关联多维表格任务与打卡 ID 映射字典 (解码 Base link 原始记录 ID 为人类可读名称) */
const TASK_ID_MAP = {
  "recvbb65P8qTkq": "身体锻炼",
  "recvbb65P8IAaL": "痘痘康复",
  "recvbb65P8KPIT": "管理表实用性改进（待优化）",
  "recvbb65P8I4qk": "完善文档（亲密关系）",
  "recvbb65P8trLL": "小红书店铺运营设计",
  "recvgBkQlIElCn": "国学清单-O1：一天三条图文笔记",
  "recvgBkQlI5NLH": "国学清单-O2：截流",
  "recvgBkQlIjXlH": "国学清单-O3：账号创新",
  "recvgBkQlIktTZ": "国学清单-O4：素材库整理",
  "recvgBkQlI9W2f": "素材库整理-O1：文案库",
  "recvgBkQlIUlxf": "素材库整理-O2：话题库",
  "recvgBkQlIT62i": "素材库整理-O3：对标库",
  "recvgBkQlI1gW6": "素材库整理-O4：违规内参心法",
  "recvgBkQlID0pJ": "购物清单-O1：化妆相关整理",
  "recvgBkQlIyYF8": "购物清单-O2：生活日用整理",
  "recvgBkQlIWeuz": "购物清单-O3：工作道具整理",
  "recvgQLlBKr1Ed": "一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvgQLobE2kHI": "一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvgQLrgoTZeg": "一天三条图文笔记-O3：晚上发（17:48-21:09）",
  "recvgQLH24oiUa": "截流-O4：截流sop、回复 sop",
  "recvgQLI85yz1k": "截流-O5：小号拓展",
  "recvgQLMnoUOYB": "账号创新-O1：露脸视频demo",
  "recvgQLOQLdpJJ": "账号创新-O2：AI视频制作demo",
  "recvgQLQkmTYZ9": "账号创新-O3：B站教学视频demo",
  "recvgQLR2ci6qj": "账号创新-O4：公众号计划",
  "recvgQLTd7RhsM": "账号创新-O5：售后设计",
  "recvgQNPzbbFL8": "一天三条图文笔记-O4：总结生成排期sop&经验表",
  "recvgQQZGnOK3t": "生活清单",
  "recvgQQZGn35D5": "租房清单",
  "recvgQQZGn5dFZ": "购物清单",
  "recvgQQZGn3nTd": "个人管理清单",
  "recvgQQZGnsW9T": "截流 sop 文档",
  "recvgQQZGnigfb": "小号拓展",
  "recvgQQZGnZBOs": "发布进度表",
  "recvgQV7Llmgv6": "截流-O2：中午（12:28、11:30-12:30）",
  "recvgQWJ3SePt4": "截流-O3：晚上（18:18、23:18等）",
  "recvgQXmrCNcCL": "截流-O1：早上（06:18、05:52、06:48）",
  "recvgQZvVXxaaF": "0415-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvgQZvVXIjlZ": "0415-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvgQZvVXWakA": "0415-一天三条图文笔记-O3：晚上发（17:48-21:09）",
  "recvgR1wQTmAiH": "0415-截流-O1：早上（06:18、05:52、06:48）",
  "recvgR4bUvkstY": "0415-截流-O2：中午（12:28、11:30-12:30）",
  "recvgR4bUvewDZ": "0415-截流-O3：晚上（18:18、23:18等）",
  "recvgT6YsUWQWi": "0417-截流-O1：早上（06:18、05:52、06:48）",
  "recvgT6YsUjN2y": "0417-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvgTBjRSEzH3": "0416-截流-O1：早上（06:18、05:52、06:48）",
  "recvgTBjRSGeLT": "0416-截流-O2：中午",
  "recvgTBjRStZIr": "0416-截流-O3：晚上",
  "recvgTBjRS40CS": "0416-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvgTBjRSZt9o": "0416-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvgTBjRSSBPF": "0416-一天三条图文笔记-O3：晚上发（17:48-21:09）",
  "recvgY0OvODAVD": "0417-截流-O2：中午（12:28、11:30-12:30）",
  "recvgY0OvOxWcf": "0417-截流-O3：晚上（18:18、23:18等）",
  "recvgY0OvOmTK0": "0417-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvgY0OvODwxw": "0417-一天三条图文笔记-O3：晚上发（17:48-21:09）",
  "recvgYeN0giJxf": "0418-截流-O1：早上（06:18、05:52、06:48）",
  "recvgYeN0gearG": "0418-截流-O2：中午（12:28、11:30-12:30）",
  "recvgYeN0gdcPC": "0418-截流-O3：晚上（18:18、23:18等）",
  "recvgYeN0gK3DY": "0418-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvgYeN0g59cB": "0418-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvgYeN0gQGyD": "0418-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvgZs37zkzM3": "0418-一天三条图文笔记-O4：总结生成排期sop&经验表",
  "recvh4lqB2TA3d": "0419-截流-O1：早上（06:18、05:52、06:48）",
  "recvh4lqB2HJFU": "0419-截流-O2：中午（12:28、11:30-12:30）",
  "recvh4lqB2o870": "0419-截流-O3：晚上（18:18、23:18等）",
  "recvh4lqB22UJ5": "0419-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvh4lqB2e2R5": "0419-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvh4lqB20pJJ": "0419-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvh508YwdbHJ": "风格设计",
  "recvh509lDhIja": "内容规划",
  "recvh509EVEZbg": "排版布局",
  "recvh509YXglfw": "素材准备",
  "recvhg2Xdsv6QU": "0420-截流-O1：早上（06:18、05:52、06:48）",
  "recvhg2XdszFEn": "0420-截流-O2：中午（12:28、11:30-12:30）",
  "recvhg2XdseiO3": "0420-截流-O3：晚上（18:18、23:18等）",
  "recvhg2XdseaNE": "0420-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvhg2XdsFVkH": "0420-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvhg2XdsZ9Ge": "0420-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvhlS3mcutNJ": "0421-截流-O3：晚上（18:18、23:18等）",
  "recvhlS3mcYZDX": "0421-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvhxzZ4BuduY": "0423-截流-O1：早上（06:18、05:52、06:48）",
  "recvhxzZ4BV47I": "0423-截流-O2：中午（12:28、11:30-12:30）",
  "recvhxzZ4BubsQ": "0423-截流-O3：晚上（18:18、23:18等）",
  "recvhxzZ4BCswv": "0423-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvhxzZ4BShdQ": "0423-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvhxzZ4B6l0V": "0423-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvhDpDZrsUS7": "0424-截流-O1：早上（06:18、05:52、06:48）",
  "recvhDpDZruie0": "0424-截流-O2：中午（12:28、11:30-12:30）",
  "recvhDpDZrQs6K": "0424-截流-O3：晚上（18:18、23:18等）",
  "recvhDpDZrI1Wh": "0424-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvhDpDZrzLNB": "0424-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvhDpDZrCr8p": "0424-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvhJhvtnQvcW": "0425-截流-O1：早上（06:18、05:52、06:48）",
  "recvhJhvtnmnHe": "0425-截流-O2：中午（12:28、11:30-12:30）",
  "recvhJhvtn33qa": "0425-截流-O3：晚上（18:18、23:18等）",
  "recvhJhvtnentt": "0425-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvhJhvtnVOVC": "0425-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvhJhvtnSJu5": "0425-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvhP7SCWTqCs": "0426-截流-O1：早上（06:18、05:52、06:48）",
  "recvhP7SCWY6DU": "0426-截流-O2：中午（12:28、11:30-12:30）",
  "recvhP7SCWdzQX": "0426-截流-O3：晚上（18:18、23:18等）",
  "recvhP7SCWsYps": "0426-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvhP7SCWEDCX": "0426-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvhP7SCWEItP": "0426-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvhUXCstomEj": "0427-截流-O1：早上（06:18、05:52、06:48）",
  "recvhUXCst65V4": "0427-截流-O2：中午（12:28、11:30-12:30）",
  "recvhUXCst4SGQ": "0427-截流-O3：晚上（18:18、23:18等）",
  "recvhUXCstHRSk": "0427-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvhUXCstaQAs": "0427-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvhUXCstdxI5": "0427-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvi0NL2fKnPf": "0428-截流-O1：早上（06:18、05:52、06:48）",
  "recvi0NL2fFTlJ": "0428-截流-O2：中午（12:28、11:30-12:30）",
  "recvi0NL2feo3p": "0428-截流-O3：晚上（18:18、23:18等）",
  "recvi0NL2fICmR": "0428-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvi0NL2fFHCK": "0428-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvi0NL2f2elD": "0428-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvicuoi5aqs3": "0430-截流-O1：早上（06:18、05:52、06:48）",
  "recvicuoi5lio3": "0430-截流-O2：中午（12:28、11:30-12:30）",
  "recvicuoi5dhFf": "0430-截流-O3：晚上（18:18、23:18等）",
  "recvicuoi5c2dj": "0430-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvicuoi5MljK": "0430-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvicuoi5wQ13": "0430-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recviduyHaRY8V": "公众号-O1：风格设计",
  "recviduyHatZYN": "公众号-O2：内容规划",
  "recviduyHaJDXq": "公众号-O3：排版布局",
  "recviduyHa5rbg": "公众号-O4：素材准备",
  "recviilTGkJpUA": "0501-截流-O1：早上（06:18、05:52、06:48）",
  "recviilTGkFsm3": "0501-截流-O2：中午（12:28、11:30-12:30）",
  "recviilTGkVicE": "0501-截流-O3：晚上（18:18、23:18等）",
  "recviilTGk7uTx": "0501-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recviilTGk01DW": "0501-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recviilTGkESp7": "0501-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recviobM8GYZ9d": "0502-截流-O1：早上",
  "recviobM8GxUQE": "0502-截流-O2：中午",
  "recviobM8GV94E": "0502-截流-O3：晚上",
  "recviobM8GWB73": "0502-一天三条图文笔记-O1：早上发",
  "recviobM8G5Gtp": "0502-一天三条图文笔记-O2：中午发",
  "recviobM8GiUfH": "0502-一天三条图文笔记-O3：晚上发",
  "recviu2iTVopKr": "0503-截流-O1：早上（06:18、05:52、06:48）",
  "recviu2iTVznbd": "0503-截流-O2：中午（12:28、11:30-12:30）",
  "recviu2iTVGTnQ": "0503-截流-O3：晚上（18:18、23:18等）",
  "recviu2iTVoMio": "0503-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recviu2iTVlrRz": "0503-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recviu2iTVqtpr": "0503-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvizTQIZJDGE": "0504-截流-O1：早上（06:18、05:52、06:48）",
  "recvizTWR2FmXz": "0504-截流-O2：中午（12:28、11:30-12:30）",
  "recvizTWR2yY4Z": "0504-截流-O3：晚上（18:18、23:18等）",
  "recvizTWR2036v": "0504-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvizTWR2PlvK": "0504-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvizTWR2JN2E": "0504-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recviFJNP6X8rI": "0505-截流-O1：早上（06:18、05:52、06:48）",
  "recviFJNP6FjRK": "0505-截流-O2：中午（12:28、11:30-12:30）",
  "recviFJNP65FOl": "0505-截流-O3：晚上（18:18、23:18等）",
  "recviFJNP6qXdE": "0505-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recviFJNP6LKuT": "0505-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recviFJNP69Ego": "0505-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recviYZqWr0syj": "0506-截流-O1：早上（06:18、05:52、06:48）",
  "recvj45LwcpF3P": "0509-截流-O1：早上（06:18、05:52、06:48）",
  "recvj45LwcD2UR": "0509-截流-O2：中午（12:28、11:30-12:30）",
  "recvj45LwcjJZ6": "0509-截流-O3：晚上（18:18、23:18等）",
  "recvj45Lwcjoly": "0509-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvj45LwciRBT": "0509-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvj45LwcyvrE": "0509-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvmh58jN6NRS": "[RC-EVAL-20260612] 明天下午整理 RC 测试报告",
  "recvmpJhIbFUHA": "0613-截流-O1：早上（06:18、05:52、06:48）",
  "recvmpJhIbLEhR": "0613-截流-O2：中午（12:28、11:30-12:30）",
  "recvmpJhIbDlzR": "0613-截流-O3：晚上（18:18、23:18等）",
  "recvmpJhIblaBY": "0613-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvmpJhIbCBWT": "0613-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvmpJhIbDjwE": "0613-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvmrD3LutnWs": "0614-截流-O1：早上（06:18、05:52、06:48）",
  "recvmrD3LuWTuT": "0614-截流-O2：中午（12:28、11:30-12:30）",
  "recvmrD3LuaByI": "0614-截流-O3：晚上（18:18、23:18等）",
  "recvmsE68cC3xG": "0614-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvmsE68c7UfN": "0614-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvmsE68cJuQY": "0614-一天三条图文笔记-O3：晚上发（17:48、18:28、20:16、21:09）",
  "recvmxt5F1zq2K": "0615-截流-O1：早上（06:18、05:52、06:48）",
  "recvmxt5F1EjTF": "0615-截流-O2：中午（12:28、11:30-12:30）",
  "recvmxt5F1E5uZ": "0615-一天三条图文笔记-O1：早上发（05:48、06:18、07:08）",
  "recvmxt5F11GoS": "0615-一天三条图文笔记-O2：中午发（09:26、10:16、11:42、12:36）",
  "recvn2fWM62GAx": "搜集笔记素材 20 条",
  "recvo6EScJfuuA": "[RC-X-TEST] 飞书任务联动验收",
  "recvtbJY1LdcQo": "下载桥接 GPTweb",
  "recvtbJY1GhLZl": "下载素材管理软件 Serpent",
  "recvtbK0ldc8Fl": "下载素材管理软件 Serpent",
  "recvtHZTVFFG1b": "下载任务",
  "recvtWsDvq1dU1": "动图工作流：MacBook 上线后补跑代码门禁并三方对齐 Git",
  "recvtWsDTUvOYC": "动图工作流：收口工作树修改并补打 4.1.0 Release",
  "recvtWsEfHBlM7": "动图工作流：配置 Mac mini 自动登录",
  "recvtWsEBggJgI": "动图工作流：观察磁盘/matcher/补库冷却恢复情况",
  "recvtYqlqNtyfa": "自媒体视频稳定产出",
  "recvtYqmbO3uTw": "时间规划落地",
  "recvukk90yygV1": "0905-知识库规范及内容梳理",
  "recvukk90ycbjZ": "0905-新账号demo设计实施文档",
  "recvukk90yAEXC": "0905-奖惩系统设计",
  "recvuvEWMCuMbe": "0908-交稿②AI起号连载开篇（主发公众号）",
  "recvuvEWMCkvTH": "0911-交稿①AI一周做完学期笔记实测（主发小红书）",
  "recvuvEWMCpGjf": "0915-交稿③通信工程×AI科普第1期（主发知乎）",
  "recvuvEWMCzqQy": "0918-交稿④AI替我运营账号一周实验（主发公众号）",
  "recvuvEWMCvwmd": "0922-交稿⑤AI新工具24h速递首期（主发小红书）",
  "recvuvEWMC5ZeA": "0925-交稿⑥通信工程学生的AI副业路线图（主发知乎）",
  "recvuvEWMCONBE": "0929-交稿⑦0粉到第一笔收入复盘收官（主发公众号）",
  "recvuvEWMCSMsW": "1002-交稿⑧一周学会一个可变现技能打卡（主发小红书）",
  "recvuvEWMCm14k": "0921-内容日历试行复盘（×运伴数据周报）",
  "recvuyyIdqapcX": "填写坚毅测试",
  "recvuL7pFvZ6I3": "知识库重构·建表与迁移施工（码伴）",
  "recvuL7pFvIn6w": "知识库重构·登记工作流与护栏施工（效伴）",
  "recvuTFT7BdvZC": "填写精力管理",
  "recvv7bVkUs7ly": "填写三件事",
  "recvv7chAKU8B4": "好习惯打卡",
  "recvvKTXiSqR2c": "福柴柴-O1：搭建选题库（30个对标高赞选题）",
  "recvvKTXiSSuma": "福柴柴-O2：固定每周产出并发布3条内容",
  "recvvKTXiSUvWt": "福柴柴-O3：每条内容带关注钩子+评论区维护",
  "recvvKTXiSjvIU": "福柴柴-O4：周日20:00数据复盘（播放/涨粉/爆款拆解）"
};

const HABIT_ID_MAP = {
  "recvvcVHOi2gSF": "🦌戒断·第10天·当日打卡",
  "recvviM6yLemct": "🦌·第11天·当日打卡（破戒纠正）",
  "recvviM6yLsp32": "不早起·第1天·当日打卡",
  "recvviM6yLjXya": "熬夜·第1天·当日打卡",
  "recvvoCyBIZdJz": "🦌·第1天·当日打卡（失败）",
  "recvvoCyBIwJz8": "不早起·第2天·当日打卡",
  "recvvoCyBI7oNq": "熬夜·第1天·当日打卡",
  "recvvusGpljZpm": "🦌·第1天·当日打卡",
  "recvvusGpl4BIL": "不早起·第1天·当日打卡",
  "recvvusGplxRMm": "熬夜·第1天·当日打卡",
  "recvvAjUNON8ga": "🦌·第1天·当日打卡",
  "recvvAjUNOAwnx": "不早起·第1天·当日打卡",
  "recvvAjUNOL28a": "熬夜·第1天·当日打卡",
  "recvvG9Dmq3R0A": "🦌·第2天·当日打卡",
  "recvvG9DmqohPq": "不早起·第1天·当日打卡",
  "recvvG9Dmqhd87": "熬夜·第2天·当日打卡",
  "recvvImmHDtmPE": "不早起·第2天·当日打卡",
  "recvvM0LiXSTOs": "🦌·第3天·当日打卡",
  "recvvM0LiXBHEi": "熬夜·第1天·当日打卡",
  "recvvRRRUyokHy": "🦌·第1天·当日打卡",
  "recvvRRRUyz6HC": "不早起·第3天·当日打卡",
  "recvvRRRUyuRs4": "熬夜·第1天·当日打卡",
  "recvvXHPi1JZGJ": "🦌·第2天·当日打卡",
  "recvvXHPi1up8R": "不早起·第4天·当日打卡",
  "recvvXHPi1ohEy": "熬夜·第1天·当日打卡",
  "recvw3yf87DeKx": "🦌·第3天·当日打卡",
  "recvw3yf87KkOD": "不早起·第1天·当日打卡",
  "recvw3yf87cgh4": "熬夜·第2天·当日打卡",
  "recvw9oBmEG0dK": "🦌·第4天·当日打卡",
  "recvw9oBmEf4lK": "不早起·第2天·当日打卡",
  "recvw9oBmEfiql": "熬夜·第3天·当日打卡",
  "recvwfeJ7S548n": "🦌·第5天·当日打卡",
  "recvwfeJ7S4K9W": "不早起·第3天·当日打卡",
  "recvwfeJ7SyZfG": "熬夜·第4天·当日打卡",
  "recvwl5xh0R6VD": "🦌·第6天·当日打卡",
  "recvwl5xh0Aacd": "不早起·第4天·当日打卡",
  "recvwl5xh0Jbud": "熬夜·第5天·当日打卡",
  "recvwqWwnn92vA": "🦌·第7天·当日打卡",
  "recvwqWwnnGJTG": "不早起·第5天·当日打卡",
  "recvwqWwnn5p7r": "熬夜·第6天·当日打卡",
  "recvwwMQSSNDHW": "🦌·第8天·当日打卡",
  "recvwwMQSSXaGk": "不早起·第6天·当日打卡",
  "recvwwMQSS0tl9": "熬夜·第7天·当日打卡",
  "recvwCDZjk1u2I": "🦌·第9天·当日打卡",
  "recvwCDZjkPI9W": "不早起·第7天·当日打卡",
  "recvwCDZjkfuOs": "熬夜·第8天·当日打卡",
  "recvwItLJNkUjm": "🦌·第10天·当日打卡",
  "recvwItLJNgPJM": "不早起·第8天·当日打卡",
  "recvwItLJN88Bn": "熬夜·第9天·当日打卡",
  "recvwMaqj7fdms": "早起",
  "recvwOkSbuRCiM": "🦌·第11天·当日打卡",
  "recvwOkSbuXoFy": "不早起·第9天·当日打卡",
  "recvwOkSbu7h62": "熬夜·第10天·当日打卡",
  "recvwUbfyuwV5p": "🦌·第12天·当日打卡",
  "recvwUbfyu2EHR": "不早起·第10天·当日打卡",
  "recvwUbfyuNTCS": "熬夜·第11天·当日打卡",
  "recvx01gDD5A76": "🦌·第13天·当日打卡",
  "recvx01gDDgTd0": "不早起·第11天·当日打卡",
  "recvx01gDD5Pag": "熬夜·第12天·当日打卡",
  "recvx5RWPGcHEr": "🦌·第14天·当日打卡",
  "recvx5RWPGP7JX": "不早起·第12天·当日打卡",
  "recvx5RWPG9hub": "熬夜·第13天·当日打卡",
  "recvxbIR9nMzP3": "🦌·第15天·当日打卡",
  "recvxbIR9nTMgt": "不早起·第13天·当日打卡",
  "recvxbIR9nL1M0": "熬夜·第14天·当日打卡",
  "recvv7psu5aEw6": "坚持锻炼身体",
  "recvv7psu57AA6": "规律饮食",
  "recvv7psu5JWbN": "每天练字",
  "recvv7psu5mfaD": "每天看书",
  "recvv7psu5iLnZ": "避免打游戏",
  "recvv7psu5ia8g": "保持专注",
  "recvv7psu5lBVV": "早起",
  "recvv7psu5wmsA": "不熬夜",
  "recvv7psu5pLRt": "不刷视频",
  "recvv7psu5qdwl": "健身",
  "recvv7psu5aXyM": "表达能力练习",
  "recvv7psu5F127": "🦌戒断"
};

const TASK_NAME_TO_ID = Object.fromEntries(Object.entries(TASK_ID_MAP).map(([k, v]) => [v, k]));
const HABIT_NAME_TO_ID = Object.fromEntries(Object.entries(HABIT_ID_MAP).map(([k, v]) => [v, k]));

function formatLinkedTaskName(val) {
  if (!val) return "";
  let s = String(val).trim();
  try {
    const obj = JSON.parse(s);
    if (obj && obj.id) s = obj.id;
  } catch (e) {}
  return TASK_ID_MAP[s] || s;
}

function formatLinkedHabitName(val) {
  if (!val) return "";
  let s = String(val).trim();
  try {
    const obj = JSON.parse(s);
    if (obj && obj.id) s = obj.id;
  } catch (e) {}
  return HABIT_ID_MAP[s] || s;
}

function buildPushFields(item) {
  const isSummary = item.type === "一天总结" || item.isDaySummary;
  let cat = item.category || "生活";
  if (cat === "睡觉") cat = "睡眠";
  return {
    "日程标题": item.text || item.title || "",
    "开始时间": item.startTime || "",
    "结束时间": item.endTime || "",
    "板块": cat,
    "完成状态": item.status === "完成" ? "完成" : (item.status || "未完成"),
    "日程类型": item.type || "自己安排",
    "提醒时间": item.reminder || "提前 5 分钟",
    "重复规则": item.repeatRule || "不重复",
    "计入时间记录": isSummary ? false : (item.trackTime !== undefined ? !!item.trackTime : true),
    "备注": item.note || "",
    "关联任务": item.linkedTask ? (formatLinkedTaskName(item.linkedTask) || item.linkedTask) : "",
    "关联打卡": item.linkedHabit ? (formatLinkedHabitName(item.linkedHabit) || item.linkedHabit) : "",
  };
}

/* 校验日程板块是否与当前过滤条件匹配 (Focus & Fade 核心判据) */
function isEventMatchCategory(evCategory, filter) {
  if (!filter || filter === "all") return true;
  let c = evCategory || "其他";
  if (c === "睡觉") c = "睡眠";
  let f = filter;
  if (f === "睡觉") f = "睡眠";
  if (f === "其他") {
    return c === "其他" || c === "无匹配标签" || !CATS[c];
  }
  return c === f;
}

const THEME_CLS = {
  墨韵纸感: "",
  经典蓝: " theme-classic",
  松烟绿: " theme-pine",
  玄夜: " theme-night",
};

const STORE_KEY = "board2026-view-v3";

/* 构建号：部署完整性探针。index.html 握手校验用，左下角常驻显示便于用户回报。
   每次部署必须同步 bump：这里、index.html 的 __EXPECT_BUILD 与全部 ?v= 参数 */
const APP_BUILD = "20260916-notion-v1";
window.__APP_BUILD = APP_BUILD;
const editsKey = (year) => "board-edits-" + year;
const MIN_S = 0.12;
const MAX_S = 5;

function pad2(n) {
  return String(n).padStart(2, "0");
}

/* 动态时间工具与实时今天（支持跨夜自动感知与动态校准） */
function getNow() {
  return new Date();
}

function getToday(d = new Date()) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

function formatDate(d = new Date()) {
  return getToday(d);
}

let NOW = getNow();
let TODAY = getToday(NOW);

function refreshToday() {
  NOW = getNow();
  TODAY = getToday(NOW);
  return TODAY;
}

function monthDays(year, mi) {
  return new Date(year, mi + 1, 0).getDate();
}

function weekdayOf(year, mi, d) {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][new Date(year, mi, d).getDay()];
}

/* 星期中文标记（随列内日期逐日递增：周一→周日） */
const WD_ZH_SHORT = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/* 节假日角标：固定公历节日全年通用 */
const FEST_FIXED = {
  "01-01": "元旦",
  "03-08": "妇女节",
  "05-01": "劳动节",
  "05-04": "青年节",
  "06-01": "儿童节",
  "08-01": "建军节",
  "09-10": "教师节",
  "10-01": "国庆节",
};

/* 2026 年农历核心传统节日与法定节假日（经紫金山天文台历表校准） */
const FEST_2026 = {
  "2026-02-16": "除夕",
  "2026-02-17": "春节",
  "2026-03-03": "元宵节",
  "2026-04-05": "清明节",
  "2026-06-19": "端午节",
  "2026-08-19": "七夕节",
  "2026-08-27": "中元节",
  "2026-09-25": "中秋节",
  "2026-10-18": "重阳节",
};

/* 中国法定节假日与调休补班字典 (包含休/班状态及节日名称) */
const HOLIDAY_SCHEDULE = {
  // 2026 年法定节假日与周末调休补班
  "2026-01-01": { type: "rest", name: "元旦" },
  "2026-01-02": { type: "rest", name: "元旦" },
  "2026-01-03": { type: "rest", name: "元旦" },
  "2026-01-04": { type: "work", name: "调休" },
  "2026-02-15": { type: "work", name: "调休" },
  "2026-02-16": { type: "rest", name: "除夕" },
  "2026-02-17": { type: "rest", name: "春节" },
  "2026-02-18": { type: "rest", name: "春节" },
  "2026-02-19": { type: "rest", name: "春节" },
  "2026-02-20": { type: "rest", name: "春节" },
  "2026-02-21": { type: "rest", name: "春节" },
  "2026-02-22": { type: "rest", name: "春节" },
  "2026-02-28": { type: "work", name: "调休" },
  "2026-04-04": { type: "rest", name: "清明" },
  "2026-04-05": { type: "rest", name: "清明" },
  "2026-04-06": { type: "rest", name: "清明" },
  "2026-04-26": { type: "work", name: "调休" },
  "2026-05-01": { type: "rest", name: "劳动节" },
  "2026-05-02": { type: "rest", name: "劳动节" },
  "2026-05-03": { type: "rest", name: "劳动节" },
  "2026-05-04": { type: "rest", name: "劳动节" },
  "2026-05-05": { type: "rest", name: "劳动节" },
  "2026-05-09": { type: "work", name: "调休" },
  "2026-06-19": { type: "rest", name: "端午" },
  "2026-06-20": { type: "rest", name: "端午" },
  "2026-06-21": { type: "rest", name: "端午" },
  "2026-09-20": { type: "work", name: "调休" },
  "2026-09-25": { type: "rest", name: "中秋" },
  "2026-09-26": { type: "rest", name: "中秋" },
  "2026-09-27": { type: "rest", name: "中秋" },
  "2026-10-01": { type: "rest", name: "国庆" },
  "2026-10-02": { type: "rest", name: "国庆" },
  "2026-10-03": { type: "rest", name: "国庆" },
  "2026-10-04": { type: "rest", name: "国庆" },
  "2026-10-05": { type: "rest", name: "国庆" },
  "2026-10-06": { type: "rest", name: "国庆" },
  "2026-10-07": { type: "rest", name: "国庆" },
  "2026-10-10": { type: "work", name: "调休" },
  // 2025 年法定节假日与调休补班
  "2025-01-01": { type: "rest", name: "元旦" },
  "2025-01-26": { type: "work", name: "调休" },
  "2025-01-28": { type: "rest", name: "除夕" },
  "2025-01-29": { type: "rest", name: "春节" },
  "2025-01-30": { type: "rest", name: "春节" },
  "2025-01-31": { type: "rest", name: "春节" },
  "2025-02-01": { type: "rest", name: "春节" },
  "2025-02-02": { type: "rest", name: "春节" },
  "2025-02-03": { type: "rest", name: "春节" },
  "2025-02-04": { type: "rest", name: "春节" },
  "2025-02-08": { type: "work", name: "调休" },
  "2025-04-04": { type: "rest", name: "清明" },
  "2025-04-05": { type: "rest", name: "清明" },
  "2025-04-06": { type: "rest", name: "清明" },
  "2025-04-27": { type: "work", name: "调休" },
  "2025-05-01": { type: "rest", name: "劳动节" },
  "2025-05-02": { type: "rest", name: "劳动节" },
  "2025-05-03": { type: "rest", name: "劳动节" },
  "2025-05-04": { type: "rest", name: "劳动节" },
  "2025-05-05": { type: "rest", name: "劳动节" },
  "2025-05-10": { type: "work", name: "调休" },
  "2025-05-31": { type: "rest", name: "端午" },
  "2025-06-01": { type: "rest", name: "端午" },
  "2025-06-02": { type: "rest", name: "端午" },
  "2025-09-28": { type: "work", name: "调休" },
  "2025-10-01": { type: "rest", name: "国庆" },
  "2025-10-02": { type: "rest", name: "国庆" },
  "2025-10-03": { type: "rest", name: "国庆" },
  "2025-10-04": { type: "rest", name: "国庆" },
  "2025-10-05": { type: "rest", name: "国庆" },
  "2025-10-06": { type: "rest", name: "中秋" },
  "2025-10-07": { type: "rest", name: "国庆" },
  "2025-10-08": { type: "rest", name: "国庆" },
  "2025-10-11": { type: "work", name: "调休" },
};

function getHolidayBadge(ds) {
  if (!ds) return null;
  return HOLIDAY_SCHEDULE[ds] || null;
}

function getLunarInfo(ds) {
  if (!ds) return null;
  try {
    const sl = typeof window !== "undefined" && window.solarLunar
      ? (window.solarLunar.default || window.solarLunar)
      : null;
    if (!sl || typeof sl.solar2lunar !== "function") return null;
    const parts = ds.split("-").map(Number);
    if (parts.length < 3 || isNaN(parts[0])) return null;
    return sl.solar2lunar(parts[0], parts[1], parts[2]);
  } catch (err) {
    return null;
  }
}

function getLunarDayText(ds) {
  const info = getLunarInfo(ds);
  if (!info) return "";
  // 1. 逢二十四节气优先显示（如立春、清明、秋分）
  if (info.term) return info.term;
  // 2. 初一显示月名（如“八月”或“闰八月”）
  if (info.dayCn === "初一") {
    return (info.isLeap ? "闰" : "") + info.monthCn;
  }
  // 3. 普通农历日（如“初八”、“十五”、“廿八”）
  return info.dayCn || "";
}

function getLunarFullDesc(ds) {
  const info = getLunarInfo(ds);
  if (!info) return "";
  return `农历${info.gzYear}年(${info.animal})【${info.isLeap ? "闰" : ""}${info.monthCn}】${info.dayCn}${info.term ? " · " + info.term : ""}`;
}

function festivalOf(ds) {
  if (!ds) return "";
  const fest = FEST_2026[ds] || FEST_FIXED[ds.slice(5)] || "";
  if (fest) return fest;
  const info = getLunarInfo(ds);
  if (info && info.term) return info.term;
  return "";
}


/* 覆盖层条目规范化＝方案口径「只提交改动字段」的本地实现：
   已有记录 → 只保留与 Base 不同的字段（全同＝null 清除条目）；
   新增日 → 四字段全量保留（create 需要）；deleted 条目原样保留。
   同时兼容旧版全量形态（text/category/status/note 全量存储），载入时自动迁移。 */
const EDIT_FIELDS = ["text", "category", "status", "note"];
function normalizeEditEntry(ds, entry) {
  if (!entry) return null;
  if (entry.deleted) return { deleted: true };
  const base = BASE_BY_DATE[ds];
  const out = {};
  if (!base) {
    EDIT_FIELDS.forEach((k) => {
      let v = entry[k] == null ? "" : String(entry[k]);
      if (k === "category" && v === "睡觉") v = "睡眠";
      out[k] = v;
    });
    return out.text.trim() ? out : null;
  }
  EDIT_FIELDS.forEach((k) => {
    if (!(k in entry)) return;
    let v = entry[k] == null ? "" : String(entry[k]);
    if (k === "category" && v === "睡觉") v = "睡眠";
    let bv = base[k] == null ? "" : String(base[k]);
    if (k === "category" && bv === "睡觉") bv = "睡眠";
    if (v !== bv) out[k] = v;
  });
  return Object.keys(out).length ? out : null;
}

function loadEdits(year) {
  try {
    const raw = localStorage.getItem(editsKey(year));
    if (!raw) return {};
    const parsed = JSON.parse(raw) || {};
    const next = {};
    let migrated = false;
    Object.keys(parsed).forEach((ds) => {
      const entry = parsed[ds];
      // 专向清理：彻底清除 2026-10-04 误存的「媒体制作」重复项
      if (ds === "2026-10-04" && entry && entry.text === "媒体制作") {
        migrated = true;
        return;
      }
      // 数据清洗守卫：如果被误存为具有时段/起止时间的日程，或明确标明不是一天总结，则从 edits 中剔除
      if (entry && typeof entry === "object") {
        if (entry.type && entry.type !== "一天总结") {
          migrated = true;
          return;
        }
        if (entry.startTime && entry.startTime.includes(":") && !entry.isAllDay && entry.type !== "一天总结") {
          migrated = true;
          return;
        }
      }
      const n = normalizeEditEntry(ds, entry);
      if (n) next[ds] = n;
      if (JSON.stringify(n) !== JSON.stringify(parsed[ds])) migrated = true;
    });
    if (migrated) persistEdits(year, next); // 旧版全量形态或误存日程静默清洗迁移为纯净一天总结
    return next;
  } catch (err) {
    return {};
  }
}

function persistEdits(year, edits) {
  try {
    localStorage.setItem(editsKey(year), JSON.stringify(edits));
    return true;
  } catch (err) {
    return false; // 隐私模式/配额不足：调用方提示用户
  }
}

/* ------------------------------------------------------------
   年墙板面（随年份自适应：闰年、各月天数、星期对位）
   ------------------------------------------------------------ */

function Board({ t, year, byDate, fillSel, cutDs, onJump, onJumpDay, categoryFilter, active = true }) {
  const boardCls =
    "board" +
    (t.density === "紧凑" ? " density-compact" : " density-comfy") +
    (t.colorMode === "单色" ? " mono" : "") +
    (t.weekend ? "" : " no-weekend") +
    (t.missed === false ? " no-missed" : "") +
    (t.chipShow === false ? " no-chips" : "") +
    (t.chipPos === "居中" ? " chip-center" : t.chipPos === "左下" ? " chip-left" : "");

  // 当前月份（年份对上时）表头与日期块用更深一档的主题色突出
  const curMi = String(year) === TODAY.slice(0, 4) ? Number(TODAY.slice(5, 7)) - 1 : -1;

  const cells = [];

  MONTHS.forEach((m, mi) => {
    cells.push(
      <div
        className={"m-head" + (mi === 5 ? " q-v" : "") + (mi === curMi ? " cur" : "")}
        key={"m" + mi}
        onClick={() => onJump(mi)}
        title={"跳到" + m.n}
      >
        <span className="m-name">{m.n}</span>
        <span className="m-en">{m.en}</span>
        {byDate.monthCounts[mi] > 0 ? (
          <span className="m-count">{byDate.monthCounts[mi]} 条</span>
        ) : null}
      </div>
    );
  });

  for (let d = 1; d <= 31; d++) {
    MONTHS.forEach((m, mi) => {
      const days = monthDays(year, mi);
      const ds = year + "-" + pad2(mi + 1) + "-" + pad2(d);
      const isToday = ds === TODAY;

      // 每月三列：序号列（蓝色日期块）+ 星期列（周一~周日）+ 内容列
      const wdi = new Date(year, mi, d).getDay();
      cells.push(
        <div
          className={
            "mk" +
            (d > days ? " filler" : "") +
            (isToday ? " today" : "") +
            (mi === curMi ? " cur" : "") +
            (d <= days && wdi === 6
              ? " wend-sat"
              : d <= days && wdi === 0
                ? " wend-sun"
                : "") +
            (mi === 5 ? " q-v" : "") +
            (d === 15 ? " q-h" : "")
          }
          key={"k" + mi + "-" + d}
        >
          {d <= days ? <span className="mk-d">{d}</span> : null}
        </div>
      );
      cells.push(
        <div
          className={
            "wd" +
            (isToday && d <= days ? " today" : "") +
            (d > days
              ? " filler"
              : wdi === 6
                ? " wend-sat"
                : wdi === 0
                  ? " wend-sun"
                  : "") +
            (mi === 5 ? " q-v" : "") +
            (d === 15 ? " q-h" : "")
          }
          key={"w" + mi + "-" + d}
        >
          {d <= days ? <span className="wd-txt">{WD_ZH_SHORT[wdi]}</span> : null}
        </div>
      );

      // 该月不存在的日期（含平/闰年二月）：填充块
      if (d > days) {
        cells.push(<div className="cell filler" key={"f" + mi + "-" + d}></div>);
        return;
      }

      const rec = byDate.map[ds];
      const wdName = rec && rec.weekday ? rec.weekday : weekdayOf(year, mi, d);
      const cat = rec ? CATS[rec.category] : null;
      const fest = festivalOf(ds);
      const hBadge = getHolidayBadge(ds);
      const lText = getLunarDayText(ds);
      const lFull = getLunarFullDesc(ds);

      let cls = "cell";
      if (wdName === "周六") cls += " wend-sat";
      if (wdName === "周日") cls += " wend-sun";
      if (rec) {
        cls += " has" + (cat ? " c-" + cat.cls : "");
        if (!isEventMatchCategory(rec.category, categoryFilter)) {
          cls += " is-category-dimmed";
        }
      } else if (ds < TODAY) cls += " missed"; // 过去未填写（今天尚未结束，不算）
      if (isToday) cls += " today-cell"; // 今天
      if (mi === 5) cls += " q-v";
      if (d === 15) cls += " q-h";
      /* 下拉填充高亮：源格实线框，划选范围半透明描边 */
      if (fillSel && mi === fillSel.mi) {
        const flo = Math.min(fillSel.from, fillSel.to);
        const fhi = Math.max(fillSel.from, fillSel.to);
        if (ds === fillSel.src) cls += " fill-src";
        else if (d >= flo && d <= fhi) cls += " fill-range";
      }
      /* 剪切/粘贴：源格虚线呼吸框 */
      if (cutDs === ds) cls += " fill-cut";

      cells.push(
        <div
          className={cls}
          key={ds}
          data-date={ds}
          title={`${ds} ${WD_ZH_SHORT[wdi]} ${lFull ? "· " + lFull : ""}${hBadge ? ` [${hBadge.name}${hBadge.type === "rest" ? "休" : "班"}]` : ""}${rec ? " · " + rec.text : " (双击钻入日视图，⌥双击快速新建)"}`}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (e.altKey && window._openCreateModalGlobal) {
              window._openCreateModalGlobal({ date: ds, isAllDay: true, type: "一天总结", isDaySummary: true });
            } else if (rec && onJumpDay) {
              onJumpDay(ds);
            } else if (!rec && window._openCreateModalGlobal) {
              window._openCreateModalGlobal({ date: ds, isAllDay: true, type: "一天总结", isDaySummary: true });
            } else if (onJumpDay) {
              onJumpDay(ds);
            }
          }}
        >
          {hBadge ? (
            <span className={"notion-holiday-badge badge-" + hBadge.type} title={hBadge.name + (hBadge.type === "rest" ? "放假" : "补班")}>
              {hBadge.type === "rest" ? "休" : "班"}
            </span>
          ) : null}
          {fest ? (
            <span className="fest">{fest}</span>
          ) : lText ? (
            <span className="fest lunar-sub">{lText}</span>
          ) : null}
          {rec ? (

            <div className="body">
              <div className="cell-marks">
                {(rec.status || "").trim() !== "完成" ? (
                  <span className="mk-dot mk-pending" title={"状态：" + ((rec.status || "").trim() || "未标记完成")}></span>
                ) : null}
                {rec.note ? <span className="mk-dot mk-note" title={"备注：" + rec.note}></span> : null}
                {rec._local ? <span className="mk-dot mk-local" title="本地编辑"></span> : null}
              </div>
              <div className="cell-title">{rec.text}</div>
              <div className="cell-tags">
                {cat ? (
                  <span className={"cat-chip k-" + cat.cls}>{rec.category}</span>
                ) : null}
              </div>
            </div>
          ) : isToday ? (
            <div className="body">
              <div className="cell-tags">
                <span className="cat-chip today-chip">今天</span>
              </div>
            </div>
          ) : null}
        </div>
      );
    });
  }

  return <div className={boardCls}>{cells}</div>;
}

/* 365天年看板性能隔离层 (Dormant Zero-Rerender Architecture)
   在非年看板视图下，年看板完全静默休眠，跳过 1100+ DOM 单元格的虚拟比对，释放主线程 CPU */
const MemoizedBoard = React.memo(Board, (prevProps, nextProps) => {
  if (!nextProps.active && !prevProps.active) {
    return true; // 双非激活态，绝对静默
  }
  return (
    prevProps.active === nextProps.active &&
    prevProps.year === nextProps.year &&
    prevProps.t === nextProps.t &&
    prevProps.byDate === nextProps.byDate &&
    prevProps.categoryFilter === nextProps.categoryFilter &&
    prevProps.fillSel === nextProps.fillSel &&
    prevProps.cutDs === nextProps.cutDs
  );
});

/* ------------------------------------------------------------
   信息卡（年份切换 / 统计 / 板块图例）
   ------------------------------------------------------------ */

function InfoCard({
  open,
  onToggle,
  year,
  onYear,
  stats,
  sync,
  onExport,
  onExportData,
  onImport,
  pendingImport,
  importMsg,
  onConfirmImport,
  onCancelImport,
  feishuStatus,
  syncing,
  onPullFromBase,
  onPushToBase,
  categoryFilter,
  onCategoryFilterChange,
}) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const enterTimer = useRef(null);
  const leaveTimer = useRef(null);

  const onMouseEnter = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    if (!enterTimer.current) {
      enterTimer.current = setTimeout(() => {
        setHovered(true);
        enterTimer.current = null;
      }, 70);
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    leaveTimer.current = setTimeout(() => {
      setHovered(false);
      leaveTimer.current = null;
    }, 280);
  }, []);

  const togglePin = (e) => {
    e.stopPropagation();
    setPinned((v) => !v);
  };

  const hasData = stats.total > 0;
  const pct = stats.total > 0 ? Math.min(100, Math.round((stats.done / stats.total) * 100)) : 0;
  return (
    <div
      className={"hud info-card" + (pinned || hovered ? " revealed" : "")}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className="info-tab sfx-knock"
        onClick={togglePin}
        title={pinned ? "点击收起面板" : "点击常驻展开面板"}
        aria-label={pinned ? "收起信息卡" : "展开信息卡"}
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          {pinned ? <polyline points="15 6 9 12 15 18"></polyline> : <polyline points="9 6 15 12 9 18"></polyline>}
        </svg>
        <span className="info-tab-txt">{year} · 统计</span>
      </button>
      <div className="info-main">
        <div>
          <div className="year-stepper">
            <button
              className="yr-btn"
              onClick={() => onYear(year - 1)}
              disabled={year <= YEAR_MIN}
              aria-label="上一年"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 6 9 12 15 18"></polyline>
              </svg>
            </button>
            <span className="info-year">{year}</span>
            <button
              className="yr-btn"
              onClick={() => onYear(year + 1)}
              disabled={year >= YEAR_MAX}
              aria-label="下一年"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 6 15 12 9 18"></polyline>
              </svg>
            </button>
          </div>
          <div className="info-sub">年度看板</div>
        </div>
        <button className="info-toggle" onClick={onToggle} aria-label={open ? "收起统计" : "展开统计"}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            {open ? <polyline points="6 15 12 9 18 15"></polyline> : <polyline points="6 9 12 15 18 9"></polyline>}
          </svg>
        </button>
      </div>
      {open ? (
        <div className="info-body">
          <div className="divider"></div>
          {hasData ? (
            <div className="stat-grid">
              <div className="stat-tile">
                <div className="stat-num">{stats.total}</div>
                <div className="stat-label">年度记录</div>
              </div>
              <div className="stat-tile">
                <div className="stat-num">{stats.done}</div>
                <div className="stat-label">已完成</div>
              </div>
              <div className="stat-tile">
                <div className="stat-num">
                  {pct}
                  <span className="stat-unit">%</span>
                </div>
                <div className="stat-label">完成率</div>
              </div>
            </div>
          ) : (
            <div className="info-stats">该年份暂无记录</div>
          )}
          {hasData ? (
            <div className="progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: pct + "%" }}></div>
              </div>
              <div className="progress-meta">
                {"更新至 " + stats.lastLabel + (stats.local > 0 ? " · 本地修改 " + stats.local + " 条" : "")}
              </div>
            </div>
          ) : null}
          <div className="divider"></div>
          <div className="legend">
            {CATEGORY_LIST.map((k) => {
              const catObj = CATS[k] || CATS["其他"];
              const isSel = categoryFilter === k;
              return (
                <span
                  className={"legend-item" + (isSel ? " is-active-cat" : "")}
                  key={k}
                  style={{ cursor: "pointer" }}
                  onClick={() => onCategoryFilterChange && onCategoryFilterChange(isSel ? "all" : k)}
                  title={`点击${isSel ? "取消过滤 (显示全部)" : "仅聚焦高亮 " + k}`}
                >
                  <span className="legend-dot" style={{ background: catObj.solid }}></span>
                  {k}
                  <span className="cnt">{stats.counts[k] || 0}</span>
                </span>
              );
            })}
            <span className="legend-item legend-gap" title="当天之前无一天总结记录的日期">
              <span className="legend-sw missed-sw"></span>
              未填写
            </span>
            <span className="legend-item" title="未到的日期">
              <span className="legend-sw future-sw"></span>
              未来
            </span>
            <span className="legend-item legend-gap" title="格子右上角圆点：红＝本地编辑 · 蓝＝有备注 · 橙＝未完成">
              <span className="legend-marks">
                <span className="mk-dot mk-local"></span>
                <span className="mk-dot mk-note"></span>
                <span className="mk-dot mk-pending"></span>
              </span>
              角点
            </span>
          </div>
          <div className="divider"></div>
          <div className="sync-box" title="口径：Base 是唯一事实源；定位键＝日期＋日程类型；命中仅更新改动字段，未命中新增，删除写标记删除">
            <div className="sync-row">
              <span className="sync-title">飞书 Base 同步</span>
              <span className="migrate-actions">
                <button className="sync-btn ghost sfx-knock" onClick={onPullFromBase} disabled={syncing}>
                  {syncing ? "拉取中..." : "拉取最新"}
                </button>
                <button className="sync-btn primary sfx-knock" onClick={onPushToBase} disabled={syncing || !sync || !sync.total}>
                  {syncing ? "写回中..." : "一键写回"}
                </button>
              </span>
            </div>
            <div className="sync-meta">
              {feishuStatus ? (
                <div className="feishu-status-line">
                  <span className={"status-dot " + (feishuStatus.available ? "online" : "")}></span>
                  <span>{feishuStatus.userName || "已连接"}</span>
                </div>
              ) : null}
              <div>
                {sync && sync.total > 0
                  ? "待写回 " + sync.total + " 条（新增 " + sync.create + " · 修改 " + sync.update + " · 删除 " + sync.softDelete + "）"
                  : "所有改动已与多维表格对齐"}
              </div>
            </div>
            <div className="sync-subactions">
              <button className="sync-btn-link" onClick={onExport} disabled={!sync || !sync.total}>
                导出离线写回包 JSON
              </button>
            </div>
          </div>
          <div className="divider"></div>
          <div className="migrate-box">
            <div className="sync-row">
              <span className="sync-title">数据迁移</span>
              <span className="migrate-actions">
                <button className="sync-btn ghost sfx-knock" onClick={onExportData}>
                  导出
                </button>
                <button className="sync-btn ghost sfx-knock" onClick={onImport}>
                  导入
                </button>
              </span>
            </div>
            {pendingImport ? (
              <div className="migrate-confirm">
                <span>将导入 {pendingImport.count} 条本地编辑与风格设置，同日条目以导入为准</span>
                <span className="migrate-confirm-btns">
                  <button className="sync-btn sfx-knock" onClick={onConfirmImport}>
                    确认导入
                  </button>
                  <button className="sync-btn ghost sfx-knock" onClick={onCancelImport}>
                    取消
                  </button>
                </span>
              </div>
            ) : (
              <div className={"sync-note" + (importMsg && !importMsg.ok ? " error" : "")}>
                {importMsg ? importMsg.text : "本地编辑与风格打包成 JSON，换设备或浏览器导入即恢复"}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ============================================================
   Notion 日历系统组件：周序号 · 顶栏 · 月网格 · 药丸 · 抽屉 · ⌘K 搜索
   ============================================================ */

/* 计算标准 ISO-8601 周序号 (1..53) */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/* 构建指定年月的周网格（以周一为起始，补齐前后月边缘日） */
function buildMonthGrid(year, mi) {
  const firstDate = new Date(year, mi, 1);
  const firstDayOfWeek = (firstDate.getDay() + 6) % 7; // 0=周一 ... 6=周日
  const startDate = new Date(year, mi, 1 - firstDayOfWeek);
  const weeks = [];
  let curr = new Date(startDate);

  while (true) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const y = curr.getFullYear();
      const m = curr.getMonth();
      const d = curr.getDate();
      const ds = y + "-" + pad2(m + 1) + "-" + pad2(d);
      days.push({
        date: new Date(curr),
        ds: ds,
        dayNum: d,
        isCurrentMonth: m === mi,
        isToday: ds === TODAY,
        fest: festivalOf(ds),
        lunarText: getLunarDayText(ds),
        lunarFull: getLunarFullDesc(ds),
        holidayBadge: getHolidayBadge(ds),
      });
      curr.setDate(curr.getDate() + 1);
    }
    const weekNum = getISOWeek(days[3].date);
    weeks.push({ weekNum: weekNum, days: days });

    if (
      curr.getFullYear() > year ||
      (curr.getFullYear() === year && curr.getMonth() > mi)
    ) {
      break;
    }
  }
  return weeks;
}

/* 构建时间轴视图展示的日期列表 (支持 1~9 天与周末过滤) */
function buildTimelineDays(focusedDateStr, viewMode, numDays, showWeekend = true) {
  const parts = (focusedDateStr || TODAY).split("-").map(Number);
  const baseDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const days = [];

  let start = new Date(baseDate);
  let count = numDays || 1;

  if (viewMode === "week" || count === 7) {
    // 一周以周一为起始
    const dayOfWeek = (baseDate.getDay() + 6) % 7;
    start.setDate(baseDate.getDate() - dayOfWeek);
    count = 7;
  } else if (count === 3) {
    // 3 天视图：以基准日为中心，展示「昨天、今天、明天」
    start.setDate(baseDate.getDate() - 1);
    count = 3;
  } else if (viewMode === "day" || count === 1) {
    count = 1;
  }

  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dayW = d.getDay();
    if (!showWeekend && (viewMode === "week" || count >= 5) && (dayW === 0 || dayW === 6)) {
      continue;
    }
    const y = d.getFullYear();
    const m = d.getMonth();
    const dateNum = d.getDate();
    const ds = y + "-" + pad2(m + 1) + "-" + pad2(dateNum);

    // 相对日期标签：在 3 天视图下展示昨天/今天/明天
    let relTag = "";
    if (count === 3) {
      if (i === 0) relTag = "昨天";
      else if (i === 1) relTag = "今天";
      else if (i === 2) relTag = "明天";
    }

    days.push({
      dateObj: d,
      ds: ds,
      dayNum: dateNum,
      wdStr: weekdays[dayW],
      relTag: relTag,
      isToday: ds === TODAY,
      fest: festivalOf(ds),
      lunarText: getLunarDayText(ds),
      lunarFull: getLunarFullDesc(ds),
      holidayBadge: getHolidayBadge(ds),
    });
  }
  return days;
}

/* 03 任务管理库默认预置数据 (基于真实 TASK_ID_MAP 精选代表性任务) */
const INITIAL_DEFAULT_TASKS = [
  { id: "task_init_1", title: "身体锻炼跑步与心率监测", priority: "P0", done: false, category: "运动" },
  { id: "task_init_2", title: "管理表实用性改进（待优化）", priority: "P0", done: false, category: "工作" },
  { id: "task_init_3", title: "国学清单-O1：一天三条图文笔记", priority: "P1", done: false, category: "创作" },
  { id: "task_init_4", title: "小红书店铺运营设计与售后", priority: "P1", done: false, category: "工作" },
  { id: "task_init_5", title: "素材库整理-O1：文案库", priority: "P2", done: false, category: "整理" },
  { id: "task_init_6", title: "购物清单-O1：工作道具整理", priority: "P3", done: false, category: "生活" },
];

/* 今日三件事 · 三青蛙微岛 (常驻顶栏，Eat That Frog) */
function ThreeFrogsIsland({
  threeThings = [],
  onToggleDone,
  onUpdateText,
  onStartPomodoro,
  onDropTask,
}) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState("");
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const inputRef = useRef(null);
  const islandRef = useRef(null);

  const frogs = useMemo(() => {
    const list = Array.isArray(threeThings) ? threeThings.map(x => ({ ...x })).slice(0, 3) : [];
    while (list.length < 3) {
      list.push({ text: "", done: false });
    }
    return list;
  }, [threeThings]);

  const doneCount = useMemo(() => frogs.filter(f => f.done && f.text && f.text.trim()).length, [frogs]);
  const filledCount = useMemo(() => frogs.filter(f => f.text && f.text.trim()).length, [frogs]);

  useEffect(() => {
    if (!popoverOpen) return;
    const handleClickOutside = (e) => {
      if (islandRef.current && !islandRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  const startEdit = (idx, text) => {
    setEditingIdx(idx);
    setEditText(text || "");
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 40);
  };

  const saveEdit = (idx) => {
    if (editingIdx !== null) {
      if (onUpdateText) {
        onUpdateText(idx, editText.trim());
      }
      setEditingIdx(null);
    }
  };

  const handleDropOnBadge = (e) => {
    e.preventDefault();
    let taskTitle = "";
    const raw = e.dataTransfer.getData("application/polaris-task");
    if (raw) {
      try {
        const t = JSON.parse(raw);
        taskTitle = t.title || t.name || "";
      } catch (err) {}
    }
    if (!taskTitle) {
      taskTitle = e.dataTransfer.getData("text/plain") || "";
    }
    if (taskTitle && onDropTask) {
      const targetIdx = frogs.findIndex(f => !f.text || !f.text.trim());
      onDropTask(targetIdx !== -1 ? targetIdx : 0, taskTitle);
    }
  };

  const renderItem = (frog, idx, isFlyout = false) => {
    const isDone = Boolean(frog.done);
    const isEmpty = !frog.text || frog.text.trim() === "";
    const isDragOver = dragOverIdx === idx;
    const isEditing = editingIdx === idx;
    const baseClass = isFlyout ? "three-frogs-flyout-item" : "three-frog-pill";

    return (
      <div
        key={idx}
        className={
          baseClass +
          (isDone ? " is-done" : "") +
          (isEmpty ? " is-empty" : "") +
          (isDragOver ? " is-drag-over" : "")
        }
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          if (dragOverIdx !== idx) setDragOverIdx(idx);
        }}
        onDragLeave={() => {
          if (dragOverIdx === idx) setDragOverIdx(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverIdx(null);
          let taskTitle = "";
          const raw = e.dataTransfer.getData("application/polaris-task");
          if (raw) {
            try {
              const t = JSON.parse(raw);
              taskTitle = t.title || t.name || "";
            } catch (err) {}
          }
          if (!taskTitle) {
            taskTitle = e.dataTransfer.getData("text/plain") || "";
          }
          if (taskTitle && onDropTask) {
            onDropTask(idx, taskTitle);
          }
        }}
      >
        <span
          className={isFlyout ? "three-frogs-flyout-num" : "three-frog-num"}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleDone) onToggleDone(idx);
          }}
          title={isDone ? "标记为未完成" : "点击标记完成"}
        >
          {isDone ? "✓" : idx + 1}
        </span>

        {isEditing ? (
          <input
            ref={inputRef}
            className={isFlyout ? "three-frogs-flyout-input" : "three-frog-input"}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "11px",
              fontWeight: 500,
              width: isFlyout ? "100%" : "78px",
              padding: 0,
              margin: 0,
              color: "inherit",
            }}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={() => saveEdit(idx)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit(idx);
              else if (e.key === "Escape") setEditingIdx(null);
            }}
          />
        ) : (
          <span
            className={isFlyout ? "three-frogs-flyout-text" : "three-frog-text"}
            onDoubleClick={() => startEdit(idx, frog.text)}
            onClick={() => isEmpty && startEdit(idx, "")}
            title={frog.text ? `${frog.text} (双击编辑)` : `青蛙 ${idx + 1} (点击设定)`}
          >
            {frog.text || `青蛙 ${idx + 1}`}
          </span>
        )}

        {frog.text && !isDone && (
          <span
            className="three-frog-pomodoro-btn"
            title="开启番茄钟专注此青蛙任务"
            onClick={(e) => {
              e.stopPropagation();
              if (onStartPomodoro) onStartPomodoro(frog.text);
            }}
          >
            🍅
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={islandRef}
      className="three-frogs-island"
      role="region"
      aria-label="今日三件事微岛"
      title="今日三件事 (Eat That Frog · 支持拖拽任务排入、双击编辑)"
    >
      {/* 紧凑状态徽标 (中窄屏自适应露出，点击展开浮出小卡片，杜绝空间碰撞) */}
      <button
        type="button"
        className={
          "three-frogs-badge-capsule" +
          (doneCount === 3 && filledCount === 3 ? " is-all-done" : "") +
          (popoverOpen ? " is-active" : "")
        }
        onClick={() => setPopoverOpen((v) => !v)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={handleDropOnBadge}
      >
        <span className="frog-emoji">🐸</span>
        <span className="three-frogs-badge-label">今日三事</span>
        <span className="three-frogs-badge-status">
          {filledCount === 0 ? "未排入" : `${doneCount}/${filledCount}`}
        </span>
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={"three-frogs-badge-arrow" + (popoverOpen ? " is-open" : "")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 浮动卡片详情 (点击徽标展开) */}
      {popoverOpen && (
        <div className="three-frogs-flyout">
          <div className="three-frogs-flyout-header">
            <div className="three-frogs-flyout-title">
              <span className="frog-emoji">🐸</span>
              <span>今日三事 (Eat That Frog)</span>
            </div>
            <span className="three-frogs-flyout-hint">双击编辑 · 可拖入任务</span>
          </div>
          <div className="three-frogs-flyout-list">
            {frogs.map((frog, idx) => renderItem(frog, idx, true))}
          </div>
        </div>
      )}

      {/* 宽屏内联展示 pills (屏幕宽度充足时展示) */}
      <div className="three-frogs-island-pills">
        <div className="three-frogs-island-title">
          <span className="frog-emoji">🐸</span>
          <span>今日三事</span>
        </div>
        {frogs.map((frog, idx) => renderItem(frog, idx, false))}
      </div>
    </div>
  );
}

/* 03 任务管理侧抽屉 (Task Drawer · 四象限 & 拖拽排程) */
function TaskDrawer({
  open,
  onClose,
  tasks = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onStartFocus,
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [inputTitle, setInputTitle] = useState("");
  const [inputPriority, setInputPriority] = useState("P0");

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTitle = (t.title || "").toLowerCase().includes(q);
        const matchCat = (t.category || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCat) return false;
      }
      if (activeTab === "all") return true;
      if (activeTab === "done") return Boolean(t.done);
      return (t.priority || "P0").toUpperCase() === activeTab.toUpperCase();
    });
  }, [tasks, search, activeTab]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;
    if (onAddTask) {
      onAddTask(inputTitle.trim(), inputPriority);
    }
    setInputTitle("");
  };

  if (!open) return null;

  return (
    <React.Fragment>
      <div className="notion-task-drawer-mask" onClick={onClose} />
      <div className={"notion-task-drawer" + (open ? " is-open" : "")} role="dialog" aria-label="03任务管理抽屉">
        {/* 抽屉头部 */}
        <div className="notion-task-drawer-header">
          <div className="task-drawer-title-group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
            <span className="task-drawer-title">03 任务管理库</span>
            <span className="task-drawer-count-badge">{tasks.length} 项</span>
          </div>
          <button className="task-drawer-close-btn" onClick={onClose} title="收起抽屉 ([ 或 Esc)">
            ✕
          </button>
        </div>

        {/* 快捷新建与搜索栏 */}
        <div className="notion-task-drawer-search-wrap">
          <form className="task-quick-input-row" onSubmit={handleCreate}>
            <input
              type="text"
              className="task-quick-input"
              placeholder="+ 快捷新增任务，回车即建..."
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
            />
            <select
              className="task-quick-priority-select"
              value={inputPriority}
              onChange={(e) => setInputPriority(e.target.value)}
              title="选择任务四象限优先级"
            >
              <option value="P0">P0 紧急重要</option>
              <option value="P1">P1 重要不急</option>
              <option value="P2">P2 紧急不重</option>
              <option value="P3">P3 顺手而为</option>
            </select>
          </form>

          {/* 搜索框 */}
          <div className="task-quick-input-row" style={{ marginTop: "4px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="task-quick-input"
              placeholder="按关键词过滤任务..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <span
                style={{ cursor: "pointer", fontSize: "11px", color: "#8e8e93" }}
                onClick={() => setSearch("")}
              >
                ✕
              </span>
            )}
          </div>

          {/* 四象限分类选择胶囊 */}
          <div className="task-quadrant-tabs">
            <button
              type="button"
              className={"task-quadrant-tab" + (activeTab === "all" ? " active" : "")}
              onClick={() => setActiveTab("all")}
            >
              全部 ({tasks.length})
            </button>
            <button
              type="button"
              className={"task-quadrant-tab p0" + (activeTab === "P0" ? " active" : "")}
              onClick={() => setActiveTab("P0")}
            >
              P0 紧急 ({tasks.filter((x) => x.priority === "P0").length})
            </button>
            <button
              type="button"
              className={"task-quadrant-tab p1" + (activeTab === "P1" ? " active" : "")}
              onClick={() => setActiveTab("P1")}
            >
              P1 重要 ({tasks.filter((x) => x.priority === "P1").length})
            </button>
            <button
              type="button"
              className={"task-quadrant-tab p2" + (activeTab === "P2" ? " active" : "")}
              onClick={() => setActiveTab("P2")}
            >
              P2 快速 ({tasks.filter((x) => x.priority === "P2").length})
            </button>
            <button
              type="button"
              className={"task-quadrant-tab p3" + (activeTab === "P3" ? " active" : "")}
              onClick={() => setActiveTab("P3")}
            >
              P3 顺手 ({tasks.filter((x) => x.priority === "P3").length})
            </button>
            <button
              type="button"
              className={"task-quadrant-tab" + (activeTab === "done" ? " active" : "")}
              onClick={() => setActiveTab("done")}
            >
              已完成 ({tasks.filter((x) => x.done).length})
            </button>
          </div>
        </div>

        {/* 任务列表区 */}
        <div className="notion-task-drawer-list">
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 10px", color: "#8e8e93", fontSize: "12px" }}>
              没有匹配的任务事项
            </div>
          ) : (
            filteredTasks.map((task) => {
              const pCls = (task.priority || "P0").toLowerCase();
              return (
                <div
                  key={task.id}
                  className={"notion-task-card" + (task.done ? " is-done" : "")}
                  draggable="true"
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/polaris-task", JSON.stringify(task));
                    e.dataTransfer.setData("text/plain", task.title);
                    e.dataTransfer.effectAllowed = "copyMove";
                  }}
                  title="可直接拖拽至时间轴排期，或拖入顶栏青蛙岛"
                >
                  <span className={"task-priority-bar " + pCls} />
                  <span
                    className="task-check-circle"
                    onClick={() => onToggleTask && onToggleTask(task.id)}
                    title={task.done ? "标记为待办" : "点击完成"}
                  >
                    {task.done ? "●" : "○"}
                  </span>
                  <div className="task-card-content">
                    <span className="task-card-title">{task.title}</span>
                    <div className="task-card-meta">
                      <span style={{ fontWeight: 600 }}>{task.priority || "P0"}</span>
                      {task.category && <span>· {task.category}</span>}
                    </div>
                  </div>
                  <span className="task-drag-grip" title="按住拖拽排程">⋮⋮</span>
                  <div className="task-card-actions">
                    <button
                      type="button"
                      className="task-action-btn"
                      onClick={() => onStartFocus && onStartFocus(task)}
                      title="以此任务开启专注时钟"
                    >
                      🍅
                    </button>
                    <button
                      type="button"
                      className="task-action-btn"
                      onClick={() => onDeleteTask && onDeleteTask(task.id)}
                      title="删除任务"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部排程引导条 */}
        <div className="notion-task-drawer-footer">
          <span>🎯 按住任务卡片拖入右侧时间轴即可自动排程</span>
          <span>按 [ 键开闭</span>
        </div>
      </div>
    </React.Fragment>
  );
}

/* Notion 日历顶栏组件 */
function NotionTopBar({
  year,
  currentMonth,
  focusedDate,
  viewMode,
  timelineDays,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  onOpenSearch,
  onNewEvent,
  onPull,
  onPush,
  syncInfo,
  syncing,
  onToggleDrawer,
  drawerOpen,
  taskDrawerOpen,
  onToggleTaskDrawer,
  threeThings,
  onToggleThreeFrog,
  onUpdateThreeFrogText,
  onStartPomodoroWithText,
  onDropThreeFrogTask,
  onToggleInfo,
  infoOpen,
  onOpenSettings,
  onOpenShortcuts,
  pomodoro,
  onTogglePomodoro,
  categoryFilter,
  onCategoryFilterChange,
}) {
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const catMenuRef = useRef(null);

  // 点击外部收起板块分类下拉菜单
  useEffect(() => {
    const onDocClick = (e) => {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target)) {
        setCatMenuOpen(false);
      }
    };
    if (catMenuOpen) {
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }
  }, [catMenuOpen]);

  // 计算当前聚焦日期所属的周与年月
  const fParts = (focusedDate || TODAY).split("-").map(Number);
  const fDate = new Date(fParts[0], fParts[1] - 1, fParts[2]);
  const fWeekNum = getISOWeek(fDate);
  const monthName = MONTHS[fParts[1] - 1] ? MONTHS[fParts[1] - 1].n : "";

  // 仅在单日、周或多天时间轴视图中显示具体第几周；年看板与整月视图跨多周，保持纯净简洁
  let showWeekBadge = viewMode === "day" || viewMode === "week" || viewMode === "days";

  return (
    <div className="notion-topbar" role="banner">
      <div className="notion-topbar-left">
        {/* macOS 左侧快捷工具图标群 (交通灯避让区右侧) */}
        <div className="notion-mac-tools">
          <button
            className={"notion-tool-btn" + (taskDrawerOpen ? " is-active" : "")}
            onClick={onToggleTaskDrawer}
            title={taskDrawerOpen ? "收起03任务库抽屉 ([)" : "展开03任务库抽屉 ([)"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <path d="M13 8h5M13 12h5M13 16h3" />
            </svg>
          </button>
          <button
            className="notion-tool-btn"
            onClick={onToggleDrawer}
            title={drawerOpen ? "收起右侧抽屉" : "展开快捷日程与备忘抽屉 (D)"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
          <button
            className="notion-tool-btn"
            onClick={onOpenSearch}
            title="全局搜索 (⌘K)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            className="notion-tool-btn notion-tool-btn-add"
            onClick={() => onNewEvent && onNewEvent(focusedDate || TODAY)}
            title="新建日程事项"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {/* 标题：如 2026年 10月 第41周 (防断行单行呈现) */}
        <div className="notion-title-wrap">
          <span className="notion-month-title">
            <span className="notion-month-text">{viewMode === "year" ? `${year}年` : monthName}</span>
            <span className="notion-year-text">{viewMode === "year" ? " 全年看板" : ` ${fParts[0]}`}</span>
          </span>
          {showWeekBadge ? (
            <span className="notion-week-badge">第{fWeekNum}周</span>
          ) : null}
        </div>

        {/* 日期导航前后翻页与今天 (聚合在左侧日期标题后，符合 Notion / macOS 原生直觉) */}
        <div className="notion-nav-group">
          <button className="notion-today-btn" onClick={onToday} title="回到今天 (快捷键 T)">
            今天
          </button>
          <button
            className="notion-nav-arrow"
            onClick={onPrev}
            title="前一周期 (J / ←)"
            aria-label="前一页"
          >
            ‹
          </button>
          <button
            className="notion-nav-arrow"
            onClick={onNext}
            title="后一周期 (K / →)"
            aria-label="后一页"
          >
            ›
          </button>
        </div>
      </div>

      {/* 顶栏中央区：独立挂载今日三事微岛，弹性居中，绝不与左右发生冲突 */}
      <div className="notion-topbar-center">
        <ThreeFrogsIsland
          threeThings={threeThings}
          onToggleDone={onToggleThreeFrog}
          onUpdateText={onUpdateThreeFrogText}
          onStartPomodoro={onStartPomodoroWithText}
          onDropTask={onDropThreeFrogTask}
        />
      </div>

      <div className="notion-topbar-right">
        {/* Apple 经典 macOS Segmented Control 视图分段控制条 */}
        <div className="notion-apple-segmented" role="tablist" aria-label="日历视图切换">
          <button
            type="button"
            data-mode="day"
            className={"notion-seg-btn" + (viewMode === "day" && timelineDays === 1 ? " is-active" : "")}
            onClick={() => onViewModeChange("day", 1)}
            title="单日视图 (1 / D)"
          >
            日
          </button>
          <button
            type="button"
            data-mode="2days"
            className={"notion-seg-btn" + (viewMode === "days" && timelineDays === 2 ? " is-active" : "")}
            onClick={() => onViewModeChange("days", 2)}
            title="连贯2天视图 (2)"
          >
            2天
          </button>
          <button
            type="button"
            data-mode="3days"
            className={"notion-seg-btn" + (viewMode === "days" && timelineDays === 3 ? " is-active" : "")}
            onClick={() => onViewModeChange("days", 3)}
            title="3天视图 (3)"
          >
            3天
          </button>
          <button
            type="button"
            data-mode="week"
            className={"notion-seg-btn" + (viewMode === "week" ? " is-active" : "")}
            onClick={() => onViewModeChange("week", 7)}
            title="周视图 (W / 7 / 0)"
          >
            周
          </button>
          <button
            type="button"
            data-mode="month"
            className={"notion-seg-btn" + (viewMode === "month" ? " is-active" : "")}
            onClick={() => onViewModeChange("month")}
            title="月视图 (M)"
          >
            月
          </button>
          <button
            type="button"
            data-mode="year"
            className={"notion-seg-btn" + (viewMode === "year" ? " is-active" : "")}
            onClick={() => onViewModeChange("year")}
            title="365天全年看板 (Y)"
          >
            年
          </button>
        </div>

        {/* 板块分类聚焦过滤选择器 (Focus & Fade 视觉沉浸高亮) */}
        <div className="notion-cat-filter-wrap" ref={catMenuRef}>
          <button
            type="button"
            className={"notion-cat-filter-btn" + (categoryFilter && categoryFilter !== "all" ? " is-filtered" : "")}
            onClick={() => setCatMenuOpen((v) => !v)}
            title="按板块聚焦高亮过滤日程 (Focus & Fade)"
          >
            <span
              className="notion-cat-filter-dot"
              style={{
                backgroundColor:
                  !categoryFilter || categoryFilter === "all"
                    ? "#8e8e93"
                    : (CATS[categoryFilter] ? CATS[categoryFilter].solid : "#007aff"),
              }}
            />
            <span className="notion-cat-filter-label">
              {!categoryFilter || categoryFilter === "all" ? "全部板块" : categoryFilter}
            </span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {catMenuOpen && (
            <div className="notion-cat-dropdown-menu">
              <button
                type="button"
                className={"notion-cat-dropdown-item" + (!categoryFilter || categoryFilter === "all" ? " is-active" : "")}
                onClick={() => {
                  onCategoryFilterChange && onCategoryFilterChange("all");
                  setCatMenuOpen(false);
                }}
              >
                <span className="notion-cat-dropdown-dot" style={{ backgroundColor: "#8e8e93" }} />
                <span className="notion-cat-dropdown-text">全部板块 (全显)</span>
                {(!categoryFilter || categoryFilter === "all") && <span className="notion-cat-dropdown-check">✓</span>}
              </button>
              <div className="notion-cat-dropdown-divider" />
              {CATEGORY_LIST.map((catName) => {
                const catObj = CATS[catName] || CATS["其他"];
                const isSel = categoryFilter === catName;
                return (
                  <button
                    key={catName}
                    type="button"
                    className={"notion-cat-dropdown-item" + (isSel ? " is-active" : "")}
                    onClick={() => {
                      onCategoryFilterChange && onCategoryFilterChange(catName);
                      setCatMenuOpen(false);
                    }}
                  >
                    <span className="notion-cat-dropdown-dot" style={{ backgroundColor: catObj.solid }} />
                    <span className="notion-cat-dropdown-text">{catName}</span>
                    {isSel && <span className="notion-cat-dropdown-check">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 飞书 Base 双向直连同步组 (Apple 原生操作胶囊，拉取与写入常驻展示) */}
        <div className="notion-sync-group">
          <button
            className="notion-sync-btn"
            onClick={onPull}
            disabled={syncing}
            title="从飞书多维表格拉取最新日程数据"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{syncing ? "同步中..." : "拉取"}</span>
          </button>

          <button
            className={"notion-sync-btn" + (syncInfo && syncInfo.total > 0 ? " has-changes" : "")}
            onClick={onPush}
            disabled={syncing}
            title={syncInfo && syncInfo.total > 0 ? `写回 ${syncInfo.total} 项改动到飞书多维表格` : "当前无待写回数据，点击校验同步状态"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>{syncInfo && syncInfo.total > 0 ? `写入 (${syncInfo.total})` : "写入"}</span>
          </button>
        </div>

        {/* 侧栏统计面板 (年视图专用) */}
        {viewMode === "year" ? (
          <button
            className={"notion-icon-btn" + (infoOpen ? " active" : "")}
            onClick={onToggleInfo}
            title={infoOpen ? "关闭概览与数据面板" : "打开概览与数据面板"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        ) : null}

        {/* 键鼠手势与快捷键指南 */}
        <button
          className="notion-icon-btn"
          onClick={onOpenShortcuts || onOpenSettings}
          title="键鼠手势与操作指南速查"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>

        {/* 番茄钟 / 专注时钟入口 (快捷键 P) */}
        {pomodoro && pomodoro.isRunning ? (
          <button
            type="button"
            className={"notion-pomodoro-capsule" + (pomodoro.mode === "break" ? " is-break" : " is-focus")}
            onClick={onTogglePomodoro}
            title="点击展开专注时钟 (快捷键 P)"
          >
            <span className="notion-pomodoro-dot" />
            <span className="notion-pomodoro-time">
              {formatPomodoroTime(pomodoro.remainingSeconds)}
            </span>
            {pomodoro.targetText ? (
              <span className="notion-pomodoro-task">
                {pomodoro.targetText.length > 7 ? pomodoro.targetText.slice(0, 7) + "…" : pomodoro.targetText}
              </span>
            ) : null}
          </button>
        ) : (
          <button
            type="button"
            className="notion-icon-btn notion-pomodoro-btn"
            onClick={onTogglePomodoro}
            title="专注时钟 / 番茄钟 (快捷键 P)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 2.5" />
              <path d="M9 3h6" />
              <path d="M10 6h4" />
            </svg>
          </button>
        )}

        {/* macOS 原生偏好设置中心 (⌘,) */}
        <button
          className="notion-icon-btn"
          onClick={onOpenSettings}
          title="偏好设置 (⌘,)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function getNextDayStr(ds) {
  if (!ds) return "";
  const parts = ds.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2] + 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getPrevDayStr(ds) {
  if (!ds) return "";
  const parts = ds.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2] - 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/* 解析 ISO 时间字符串中的时分与耗时（完整支持跨午夜/跨天精确计算） */
function parseEventTime(startIso, endIso) {
  if (!startIso) return { isAllDay: true };
  const sDate = new Date(startIso);
  if (isNaN(sDate.getTime())) return { isAllDay: true };
  const sh = sDate.getHours();
  const sm = sDate.getMinutes();

  let eh = sh + 1;
  let em = sm;
  let eDate = null;
  if (endIso) {
    eDate = new Date(endIso);
    if (!isNaN(eDate.getTime())) {
      eh = eDate.getHours();
      em = eDate.getMinutes();
    }
  }

  // 跨越全天 (00:00~23:59)
  if (sh === 0 && sm === 0 && (eh === 23 || (eh === 0 && em === 0))) {
    return { isAllDay: true };
  }

  // 判断是否跨天 (通过时间戳或年月日判断)
  const isCrossDay = eDate && !isNaN(eDate.getTime()) && (
    eDate.getTime() > sDate.getTime() &&
    (eDate.getFullYear() !== sDate.getFullYear() ||
     eDate.getMonth() !== sDate.getMonth() ||
     eDate.getDate() !== sDate.getDate())
  );

  let diffMinutes = 60;
  if (eDate && !isNaN(eDate.getTime()) && eDate > sDate) {
    diffMinutes = Math.max(15, Math.round((eDate.getTime() - sDate.getTime()) / 60000));
  } else {
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    diffMinutes = Math.max(15, endMinutes - startMinutes);
  }

  const diffH = Math.floor(diffMinutes / 60);
  const diffM = diffMinutes % 60;
  const durationStr = (diffH > 0 ? diffH + "小时 " : "") + (diffM > 0 ? diffM + "分" : "");

  const startTimeStr = pad2(sh) + ":" + pad2(sm);
  const endTimeStr = pad2(eh) + ":" + pad2(em);
  const timeRangeStr = isCrossDay
    ? `${startTimeStr} → ${endTimeStr} (次日)`
    : `${startTimeStr} → ${endTimeStr}`;

  const startMinutes = sh * 60 + sm;
  const day1Minutes = isCrossDay ? Math.max(15, 1440 - startMinutes) : diffMinutes;

  return {
    isAllDay: false,
    isCrossDay: !!isCrossDay,
    sh,
    sm,
    eh,
    em,
    startMinutes,
    diffMinutes,
    startTimeStr,
    endTimeStr,
    timeRangeStr,
    durationStr,
    startTop: (startMinutes / 60) * 50,
    height: Math.max(26, (day1Minutes / 60) * 50),
  };
}

function formatTimeFromMinutes(minutes) {
  const m = Math.max(0, Math.min(1439, Math.round(minutes)));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return pad2(h) + ":" + pad2(min);
}

/* 将 "HH:mm" 格式时间字符串安全解析为当天分钟数 (0~1440) */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const parts = timeStr.trim().split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return Math.max(0, Math.min(1440, h * 60 + m));
}

/* 获取事件的绝对唯一标识符（优先使用飞书 record_id 或本地唯一 _uid，杜绝拖拽拉伸与选择时 ID 脱节） */
function getEventUid(ev) {
  if (!ev) return "";
  return ev.record_id || ev._uid || `${ev.text || ""}_${ev.date || ""}_${ev.startTime || ""}`;
}

/* 获取日程的绝对时间戳 (毫秒)，用于 Shift+Click 连续时间区间多选 */
function getEventTimestamp(ev) {
  if (!ev) return 0;
  if (ev.startTime) {
    const s = String(ev.startTime).replace(/-/g, "/");
    const t = new Date(s).getTime();
    if (!isNaN(t)) return t;
  }
  if (ev.date) {
    const sTime = ev.startTimeStr || (ev.isAllDay ? "00:00" : "09:00");
    const s = `${ev.date} ${sTime}:00`.replace(/-/g, "/");
    const t = new Date(s).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}

/* 提取常用历史日程标题（按使用频次降序，自动携带其历史常关联分类） */
function getRecentScheduleTitles(list) {
  if (!list || !Array.isArray(list)) return [];
  const freq = {};
  const catMap = {};
  list.forEach((r) => {
    if (!r || r.markedDelete || r.type === "一天总结") return;
    const t = (r.text || "").trim();
    if (t && t !== "新日程" && t.length > 0) {
      freq[t] = (freq[t] || 0) + 1;
      let c = r.category;
      if (c === "睡觉") c = "睡眠";
      if (!catMap[t]) {
        if (c) {
          catMap[t] = c;
        } else if (t.includes("睡") || t.includes("觉")) {
          catMap[t] = "睡眠";
        }
      }
    }
  });
  return Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a])
    .slice(0, 15)
    .map((text) => {
      let category = catMap[text] || (text.includes("睡") || text.includes("觉") ? "睡眠" : "生活");
      if (category === "睡觉") category = "睡眠";
      return { text, count: freq[text], category };
    });
}

function formatDurationFromMinutes(diffMinutes) {
  const m = Math.max(0, Math.round(diffMinutes));
  const diffH = Math.floor(m / 60);
  const diffM = m % 60;
  if (diffH > 0 && diffM > 0) return diffH + "小时" + diffM + "分";
  if (diffH > 0) return diffH + "小时";
  return diffM + "分钟";
}

/* 格式化 Notion 风格日期胶囊文本，如 "九月 20 日 周日" */
function formatNotionDateText(ds) {
  if (!ds) return "";
  const p = ds.split("-").map(Number);
  if (p.length < 3) return ds;
  const m = p[1];
  const d = p[2];
  const wd = weekdayOf(p[0], m - 1, d);
  const monthCh = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"][m - 1] || String(m);
  return `${monthCh}月 ${d} 日 ${wd}`;
}

/* 计算并格式化 Notion 风格持续时长（如 "19 小时"、"22 小时 49 分钟"、"全天"） */
function formatDurationText(startDate, startTime, endDate, endTime, isAllDay) {
  if (isAllDay) {
    if (!startDate || !endDate || startDate === endDate) return "全天";
    const s = new Date(startDate + "T00:00:00").getTime();
    const e = new Date(endDate + "T00:00:00").getTime();
    if (isNaN(s) || isNaN(e)) return "全天";
    const days = Math.round((e - s) / 86400000) + 1;
    return days > 1 ? `${days} 天` : "全天";
  }
  if (!startDate || !startTime || !endDate || !endTime) return "";
  const sStr = startTime.length === 5 ? `${startTime}:00` : startTime;
  const eStr = endTime.length === 5 ? `${endTime}:00` : endTime;
  const s = new Date(`${startDate}T${sStr}`).getTime();
  const e = new Date(`${endDate}T${eStr}`).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return "";
  const totalMins = Math.round((e - s) / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h} 小时 ${m} 分钟`;
  if (h > 0) return `${h} 小时`;
  return `${m} 分钟`;
}

/* Notion Calendar 标志性多日程层叠覆盖排版算法 (Cascading Overlap Layout)：
   1. 跨天长日程在首日严格截断至午夜 24:00 (1440m)，防止高度穿透越界；
   2. 多个日程并行或重叠时（如预期日程与实际执行日程重叠、或多任务并行），采用 Notion 日历纸张层叠覆盖逻辑：
      - 后续卡片向右适度错落缩进（步长 stepPercent），自然层叠于上方；
      - 每一张卡片均保留绝大部分宽度（80%~90%+），方便完整阅读标题与时间；
      - 消除冲突警告与冲突红框，尊重真实工作流中的并行日程与双重记录；
      - 鼠标悬停时自动平滑置顶。 */
function computeEventLayout(events) {
  if (!events || events.length === 0) return [];
  const items = events.map((ev, i) => {
    let s = ev.startMinutes;
    let d = ev.diffMinutes;
    if (s === undefined || d === undefined) {
      const parsed = parseEventTime(ev.startTime, ev.endTime);
      if (s === undefined) s = parsed.startMinutes !== undefined ? parsed.startMinutes : 540;
      if (d === undefined) d = parsed.diffMinutes || 60;
    }
    // 跨天长日程在首日严格截断至午夜 24:00 (1440m)，防止高度穿透越界
    if (ev.isCrossDay && ev._crossDayPart !== "next" && s !== undefined) {
      d = Math.max(15, 1440 - s);
    }
    return {
      ev,
      origIdx: i,
      start: s,
      end: s + d,
      diff: d,
    };
  });

  // 按开始时间升序，相同时间按时长降序
  items.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // 1. 寻找相互存在时间交叠的连通簇
  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -1;

  for (const item of items) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.end;
    } else if (item.start < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.end);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.end;
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  // 2. 为每个重叠簇计算层叠覆盖排版 (Notion Calendar 标志性覆盖排版)
  const result = [];
  for (const cluster of clusters) {
    const columns = [];
    for (const item of cluster) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        if (columns[c] <= item.start) {
          item.col = c;
          columns[c] = item.end;
          placed = true;
          break;
        }
      }
      if (!placed) {
        item.col = columns.length;
        columns.push(item.end);
      }
    }
    const maxCols = columns.length;
    // 错落步进比例：重叠时每层向右错落 12%~16%
    const stepPercent = maxCols <= 1 ? 0 : Math.min(16, Math.max(10, 48 / maxCols));

    for (let i = 0; i < cluster.length; i++) {
      const item = cluster[i];
      item.maxCols = maxCols;
      item.hasConflict = false; // 消除“冲突”报错概念，视作合法的预期与实际/并行日程
      item.conflicts = [];

      if (maxCols === 1) {
        item.leftPercent = 0;
        item.widthPercent = 100;
        item.isCascaded = false;
      } else {
        item.isCascaded = item.col > 0;
        const baseLeft = item.col * stepPercent;
        item.leftPercent = baseLeft;

        // 若存在完全同时起止的同级日程，适当匀出宽度；常规层叠则占据剩余全部宽度
        const sameStartSiblings = cluster.filter(
          (o) => o !== item && Math.abs(o.start - item.start) < 5 && o.col > item.col
        );
        if (sameStartSiblings.length > 0) {
          const totalSib = sameStartSiblings.length + 1;
          item.widthPercent = Math.max(40, (100 - baseLeft) / totalSib);
        } else {
          item.widthPercent = 100 - baseLeft;
        }
      }
      result.push(item);
    }
  }

  // 排序
  return result.sort((a, b) => {
    if (a.col !== b.col) return a.col - b.col;
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });
}

/* 原地轻量快速创建气泡浮层 (Quick Create Popover - 现代分体胶囊重构版) */
function QuickCreatePopover({ draft, daysCount, onClose, onSubmit, onOpenMore, baseList = [] }) {
  const [title, setTitle] = useState("");
  const initialCat = (draft.category === "睡觉" ? "睡眠" : draft.category) || "生活";
  const [cat, setCat] = useState(initialCat);
  const [isAllDay, setIsAllDay] = useState(!!draft.isAllDay);
  const [reuseFeedback, setReuseFeedback] = useState(null);
  const [highlightCat, setHighlightCat] = useState(false);
  const inputRef = useRef(null);
  const popoverRef = useRef(null);

  // 提取历史常用日程标题
  const historyTitles = useMemo(() => getRecentScheduleTitles(baseList), [baseList]);

  // 根据当前输入实时过滤候选
  const filteredTitles = useMemo(() => {
    const t = (title || "").trim().toLowerCase();
    if (!t) return historyTitles;
    return historyTitles.filter((item) => item.text.toLowerCase().includes(t));
  }, [historyTitles, title]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    const onDocMouseDown = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [onClose]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const finalTitle = title.trim() || "新日程";
      onSubmit(finalTitle, cat === "睡觉" ? "睡眠" : cat, isAllDay);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  // 仅填入文字（光标置于文字末尾，保留当前已选分类和时间）
  const handleReuseTextOnly = (item, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setTitle(item.text);
    setReuseFeedback(`已填入文字「${item.text}」`);
    setTimeout(() => setReuseFeedback(null), 1500);
    if (inputRef.current) {
      inputRef.current.focus();
      const len = item.text.length;
      setTimeout(() => {
        try {
          inputRef.current.setSelectionRange(len, len);
        } catch (_) {}
      }, 0);
    }
  };

  // 全套复用（标题 + 板块全部应用，并提供高亮动效）
  const handleReuseAll = (item, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setTitle(item.text);
    const targetCat = item.category === "睡觉" ? "睡眠" : (item.category || "生活");
    setCat(targetCat);
    setHighlightCat(true);
    setTimeout(() => setHighlightCat(false), 900);
    setReuseFeedback(`已全套复用：「${item.text}」+「${targetCat}」板块`);
    setTimeout(() => setReuseFeedback(null), 2000);
    if (inputRef.current) inputRef.current.focus();
  };

  const [flipUp, setFlipUp] = useState(false);
  const [flipLeft, setFlipLeft] = useState(daysCount >= 4 && draft.colIndex >= daysCount - 2);
  const isMultiDay = draft.date && draft.endDate && draft.date !== draft.endDate;

  useEffect(() => {
    if (popoverRef.current) {
      const parentRect = popoverRef.current.parentElement ? popoverRef.current.parentElement.getBoundingClientRect() : null;
      if (parentRect) {
        const spaceBelow = window.innerHeight - parentRect.bottom;
        const spaceAbove = parentRect.top - 90; // 扣除顶部导航栏与全天栏固定高度
        // 只有在下方空间不足且上方空间绝对充裕时才上翻，绝不穿入顶部全天栏
        if (spaceBelow < 265 && spaceAbove >= 280) {
          setFlipUp(true);
        } else {
          setFlipUp(false);
        }
        if (window.innerWidth - parentRect.left < 370) {
          setFlipLeft(true);
        }
      }
    }
  }, []);

  // 严格遵循北极星日历 7 大标准板块规范
  const categories = [
    { key: "工作", label: "工作" },
    { key: "生活", label: "生活" },
    { key: "学习", label: "学习" },
    { key: "运动", label: "运动" },
    { key: "娱乐", label: "娱乐" },
    { key: "睡眠", label: "睡眠" },
    { key: "其他", label: "其他" },
  ];

  // 跨天或全天模式下的时间标签文案
  const timeLabel = isAllDay
    ? (isMultiDay ? `${draft.date.slice(5)} ~ ${draft.endDate.slice(5)} (全天)` : "全天日程")
    : `${draft.startTimeStr} - ${draft.endTimeStr}`;

  return (
    <div
      ref={popoverRef}
      className={"notion-quick-create-popover" + (flipLeft ? " flip-left" : "") + (flipUp ? " flip-up" : "")}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* 头部：时间胶囊与时段/全天切片 */}
      <div className="notion-qcp-header">
        <span className="notion-qcp-time-badge">
          📅 {timeLabel}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="notion-qcp-mode-toggle">
            <button
              type="button"
              className={"notion-qcp-mode-btn" + (!isAllDay ? " is-active" : "")}
              onClick={() => setIsAllDay(false)}
              title="具体时间段"
            >
              时段
            </button>
            <button
              type="button"
              className={"notion-qcp-mode-btn" + (isAllDay ? " is-active" : "")}
              onClick={() => setIsAllDay(true)}
              title="全天日程"
            >
              全天
            </button>
          </div>
          <button
            type="button"
            className="notion-qcp-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="关闭 (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 标题输入行 */}
      <div className="notion-qcp-input-wrap">
        <input
          ref={inputRef}
          className="notion-qcp-input"
          placeholder="输入日程标题... (按 Enter 创建)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {title ? (
          <button
            type="button"
            className="notion-qcp-input-clear"
            onClick={() => {
              setTitle("");
              if (inputRef.current) inputRef.current.focus();
            }}
            title="清空标题"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* 快捷复用反馈横幅 */}
      {reuseFeedback && (
        <div className="notion-qcp-feedback-banner">
          <i className="ph-bold ph-check-circle" />
          <span>{reuseFeedback}</span>
        </div>
      )}

      {/* 常用日程快捷复用区（双态分体式操作胶囊，零遮挡流式排列） */}
      {filteredTitles && filteredTitles.length > 0 && (
        <div className="notion-qcp-preset-section">
          <div className="notion-qcp-preset-header">
            <span className="notion-qcp-preset-title">
              <i className="ph-bold ph-lightning" style={{ color: "#ff9500", marginRight: 4 }} />
              常用日程速选
            </span>
            <span className="notion-qcp-preset-hint">点击文字填词 · 点击板块⚡全套复用</span>
          </div>
          <div className="notion-qcp-preset-list">
            {filteredTitles.slice(0, 5).map((item, idx) => {
              const itemCatName = item.category === "睡觉" ? "睡眠" : (item.category || "生活");
              const itemCat = CATS[itemCatName] || CATS["生活"];
              const isMatched = title.trim() && item.text.includes(title.trim());
              return (
                <div
                  key={idx}
                  className={"notion-qcp-split-chip" + (isMatched ? " is-matched" : "")}
                >
                  <div
                    className="notion-qcp-split-text-part"
                    onClick={(e) => handleReuseTextOnly(item, e)}
                    title={`仅填入文字「${item.text}」`}
                  >
                    <span className="notion-qcp-split-emoji">
                      {item.text.includes("睡") ? "🛏️" : item.text.includes("吃") || item.text.includes("餐") ? "🍲" : item.text.includes("跑") || item.text.includes("动") ? "🏃" : item.text.includes("会") ? "👥" : item.text.includes("书") || item.text.includes("学") ? "📖" : "📝"}
                    </span>
                    <span className="notion-qcp-split-label">{item.text}</span>
                    <span className="notion-qcp-split-action-tip">填词</span>
                  </div>
                  <button
                    type="button"
                    className="notion-qcp-split-apply-part"
                    style={{
                      backgroundColor: itemCat.solidTint || itemCat.tint,
                      color: itemCat.text || itemCat.solid,
                      borderColor: itemCat.solid ? itemCat.solid + "30" : "transparent",
                    }}
                    onClick={(e) => handleReuseAll(item, e)}
                    title={`全套复用：填入「${item.text}」并自动归入「${itemCatName}」板块`}
                  >
                    <span className="notion-qcp-split-cat-dot" style={{ backgroundColor: itemCat.solid }} />
                    <span className="notion-qcp-split-cat-name">{itemCatName}</span>
                    <span className="notion-qcp-split-bolt">⚡</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 板块分类选择区 (严格遵循北极星日历 7 大分类，睡眠对应沉静灰) */}
      <div className={"notion-qcp-cat-section" + (highlightCat ? " is-pulsing" : "")}>
        <div className="notion-qcp-section-label">
          <span>所属板块</span>
          {cat === "睡眠" && (
            <span className="notion-qcp-cat-sublabel">已绑定【睡眠】板块</span>
          )}
        </div>
        <div className="notion-qcp-categories">
          {categories.map((c) => {
            const itemCat = CATS[c.key] || CATS["生活"];
            const isActive = cat === c.key;
            return (
              <button
                type="button"
                key={c.key}
                className={"notion-qcp-cat-chip" + (isActive ? " is-active" : "")}
                style={{
                  backgroundColor: isActive ? itemCat.solid : (itemCat.tint || undefined),
                  color: isActive ? (itemCat.activeText || "#ffffff") : (itemCat.text || undefined),
                  borderColor: isActive ? (itemCat.activeBorder || itemCat.solid) : (itemCat.border || undefined),
                }}
                onClick={() => setCat(c.key)}
                title={`选择【${c.label}】板块`}
              >
                <span
                  className="notion-qcp-chip-dot"
                  style={{
                    backgroundColor: isActive ? (itemCat.activeDot || "#ffffff") : itemCat.solid,
                  }}
                />
                <span>{c.label}</span>
                {isActive && <span className="notion-qcp-chip-check">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="notion-qcp-footer">
        <button
          type="button"
          className="notion-qcp-btn-more"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMore({
              date: draft.date,
              endDate: draft.endDate,
              startTimeStr: isAllDay ? "00:00" : draft.startTimeStr,
              endTimeStr: isAllDay ? "23:59" : draft.endTimeStr,
              isAllDay: isAllDay,
              text: title.trim() || "新日程",
              category: cat === "睡觉" ? "睡眠" : cat,
            });
            onClose();
          }}
          title="展开完整设置面板 (高级配置)"
        >
          <i className="ph-bold ph-sliders-horizontal" />
          <span>详细设置...</span>
        </button>
        <div className="notion-qcp-actions">
          <button
            type="button"
            className="notion-qcp-btn-cancel"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            取消 (Esc)
          </button>
          <button
            type="button"
            className="notion-qcp-btn-submit"
            onClick={(e) => {
              e.stopPropagation();
              const finalTitle = title.trim() || "新日程";
              onSubmit(finalTitle, cat === "睡觉" ? "睡眠" : cat, isAllDay);
            }}
          >
            创建日程 (↵)
          </button>
        </div>
      </div>
    </div>
  );
}

/* Notion 日/周/多天时间轴视图组件 (完整支持触控板镜头缩放、拖拽创建草稿、超薄小块自适应与重叠算法) */
function NotionTimelineView({
  days,
  byDate,
  baseList = [],
  selectedDate,
  selectedEvent,
  selectedEventIds = [],
  onSelectDay,
  onSelectEvent,
  onUpdateEvent,
  onDeleteEvent,
  onBatchUpdateEvents,
  onCreateEvent,
  onOpenCreateModal,
  hourHeight = 50,
  onHourHeightChange,
  snapStep = 15,
  onSnapStepChange,
  onContextMenu,
  onPrev,
  onNext,
  pomodoro,
  onStartFocus,
  categoryFilter,
}) {
  const scrollRef = useRef(null);
  const timelineContainerRef = useRef(null);
  const [timelineSwipeOffset, setTimelineSwipeOffset] = useState(0);
  const [timelineIsAnimating, setTimelineIsAnimating] = useState(false);
  const timelineAccumXRef = useRef(0);
  const timelineCooldownRef = useRef(false);
  const timelineResetTimerRef = useRef(null);
  const [nowTop, setNowTop] = useState(() => {
    const d = new Date();
    return (d.getHours() + d.getMinutes() / 60) * hourHeight;
  });
  const [nowTimeStr, setNowTimeStr] = useState(() => {
    const d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  });

  // 正在进行的拖拽/拉伸状态
  const [dragInfo, setDragInfo] = useState(null);
  // 空白拖拽划定时段或多天的半透明指示块
  const [createGhost, setCreateGhost] = useState(null);
  // 原地快速创建草稿态 (Quick Draft Popover)
  const [quickDraft, setQuickDraft] = useState(null);
  // 拖拽防抖死区阈值 (像素)：彻底消灭微小手抖误创建
  const DRAG_THRESHOLD = 8;
  // 拖拽任务排程目标指示器 (Drag-to-Schedule Indicator)
  const [taskDropTarget, setTaskDropTarget] = useState(null); // { ds, snapMin, timeStr, isAllDay }
  // 全天日程专区折叠/隐藏状态（记忆用户偏好）
  const [alldayCollapsed, setAlldayCollapsed] = useState(() => {
    try {
      return localStorage.getItem("board-allday-collapsed") === "true";
    } catch (e) {
      return false;
    }
  });

  const toggleAlldayCollapse = () => {
    setAlldayCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("board-allday-collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

  const totalAllDayCount = useMemo(() => {
    let cnt = 0;
    days.forEach((d) => {
      const evList = (byDate.eventsByDate && byDate.eventsByDate[d.ds]) || [];
      const rawAllDay = evList.filter((ev) => ev.isAllDay || !ev.startTime || ev.type === "一天总结");
      const seen = new Set();
      rawAllDay.forEach((ev) => {
        const k = (ev.text || "").trim().toLowerCase();
        if (k) seen.add(k);
      });
      cnt += seen.size;
    });
    return cnt;
  }, [days, byDate]);

  // 时间轴按天布局缓存（Memoized Layout Cache）：避免每一帧高频重算非活动列
  const eventsLayoutByDay = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      const evList = (byDate.eventsByDate && byDate.eventsByDate[d.ds]) || [];
      const timed = evList.filter((ev) => !ev.isAllDay && ev.type !== "一天总结");
      map[d.ds] = computeEventLayout(timed);
    });
    return map;
  }, [days, byDate]);

  const dragRef = useRef(null);
  const colBoundsRef = useRef([]); // 缓存各列水平几何区间，彻底消灭 mousemove 过程中的强制同步布局 (Forced Synchronous Layout)
  const timelineRafIdRef = useRef(null); // rAF 节流调度标识
  const [hoverHint, setHoverHint] = useState(null); // 网格空白区悬停精炼微提示 { x, y, ds, timeStr }
  const hoverTimerRef = useRef(null);

  // 采集并缓存时间轴当前所有列的横向几何边界
  const updateTimelineColBounds = useCallback(() => {
    if (!scrollRef.current) return [];
    const colEls = scrollRef.current.querySelectorAll(".notion-grid-col");
    const bounds = [];
    for (let i = 0; i < colEls.length; i++) {
      const r = colEls[i].getBoundingClientRect();
      bounds.push({
        left: r.left,
        right: r.right,
        ds: days[i] ? days[i].ds : null,
      });
    }
    colBoundsRef.current = bounds;
    return bounds;
  }, [days]);

  // 全天区横向划选多天创建状态
  const [alldayDrag, setAlldayDrag] = useState(null);
  const alldayDragRef = useRef(null);

  useEffect(() => {
    if (!alldayDrag) return;

    const onMouseMove = (e) => {
      const drag = alldayDragRef.current;
      if (!drag) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const colEl = el && el.closest ? el.closest(".notion-allday-col") : null;
      if (colEl && colEl.dataset && colEl.dataset.ds) {
        const curDs = colEl.dataset.ds;
        const curIdx = days.findIndex((x) => x.ds === curDs);
        if (curIdx >= 0 && curIdx !== drag.currentIdx) {
          drag.currentIdx = curIdx;
          drag.endDs = curDs;
          drag.hasDragged = true;
          setAlldayDrag({ ...drag });
        }
      }
    };

    const onMouseUp = () => {
      const drag = alldayDragRef.current;
      alldayDragRef.current = null;
      setAlldayDrag(null);
      if (!drag) return;

      const minIdx = Math.min(drag.startIdx, drag.currentIdx);
      const maxIdx = Math.max(drag.startIdx, drag.currentIdx);
      const minDay = days[minIdx] ? days[minIdx].ds : drag.startDs;
      const maxDay = days[maxIdx] ? days[maxIdx].ds : drag.endDs;

      setQuickDraft({
        date: minDay,
        endDate: maxDay,
        startMin: 540,
        endMin: 1080,
        startTimeStr: "09:00",
        endTimeStr: "18:00",
        durationStr: "全天",
        isAllDay: true,
        isAlldayHeader: true,
        colIndex: minIdx,
        category: "生活",
        text: "",
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [alldayDrag, days]);

  const startAlldayDrag = (e, ds, idx) => {
    if (e.button !== 0) return;
    const initialDrag = {
      startDs: ds,
      endDs: ds,
      startIdx: idx,
      currentIdx: idx,
      hasDragged: false,
    };
    alldayDragRef.current = initialDrag;
    setAlldayDrag(initialDrag);
  };

  const initialGestureHeightRef = useRef(50);

  // 触控板双指缩放（镜头缩放锚定光标）
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // 1. 优先捕获 Mac 触控板双指横向滑动切周/切天 (非捏合缩放状态)
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        if (timelineCooldownRef.current) {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
          }
          return;
        }

        const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.25 && Math.abs(e.deltaX) > 2.5;
        if (isHorizontal) {
          e.preventDefault();
          timelineAccumXRef.current += e.deltaX * 0.45;
          const raw = -timelineAccumXRef.current * 0.32;
          const sign = Math.sign(raw);
          const mag = Math.abs(raw);
          const damped = sign * Math.min(85, Math.pow(mag, 0.85) * 1.8);
          setTimelineSwipeOffset(damped);

          if (timelineResetTimerRef.current) clearTimeout(timelineResetTimerRef.current);

          // 翻页阈值检测：累计滑动超 90px（沉稳厚重，防误触滑脱）
          if (Math.abs(timelineAccumXRef.current) >= 90) {
            timelineCooldownRef.current = true;
            setTimelineIsAnimating(true);

            // 嘎嘣脆音效：在卡入槽位瞬间响起
            if (window.SFX) window.SFX.play("snap");

            const isNext = timelineAccumXRef.current > 0;
            // 机械吸附位移：先滑到位，再产生轻微卡片落槽顿挫
            setTimelineSwipeOffset(isNext ? -85 : 85);
            if (isNext) {
              onNext && onNext();
            } else {
              onPrev && onPrev();
            }
            timelineAccumXRef.current = 0;

            setTimeout(() => {
              setTimelineSwipeOffset(isNext ? 16 : -16);
              setTimeout(() => {
                setTimelineSwipeOffset(0);
                setTimeout(() => {
                  setTimelineIsAnimating(false);
                  timelineCooldownRef.current = false;
                }, 320);
              }, 60);
            }, 80);
            return;
          }

          // 未达阈值时，用户松手 120ms 后弹性平滑复位
          timelineResetTimerRef.current = setTimeout(() => {
            setTimelineIsAnimating(true);
            setTimelineSwipeOffset(0);
            timelineAccumXRef.current = 0;
            setTimeout(() => {
              setTimelineIsAnimating(false);
            }, 220);
          }, 120);
          return;
        }
      }

      // 2. 捕获 Mac 触控板双指捏合手势 (e.ctrlKey === true)、Cmd/Alt 键或左侧刻度区滚动
      const isOverAxis = e.target && e.target.closest && e.target.closest(".notion-hours-axis");
      if (e.ctrlKey || e.altKey || e.metaKey || isOverAxis) {
        e.preventDefault();
        e.stopPropagation();

        const rect = el.getBoundingClientRect();
        const clientY = e.clientY;
        const offsetY = clientY - rect.top; // 光标在时间轴可视区内的相对 Y 坐标
        const currentScrollTop = el.scrollTop;
        const currentCanvasY = currentScrollTop + offsetY;
        const currentMinute = (currentCanvasY / hourHeight) * 60; // 鼠标当前锚定的准确分钟点

        // 平滑缩放步长（最小 24px 全天紧凑压缩，最大 160px 超精细展开）
        const step = Math.abs(e.deltaY) > 50 ? (e.deltaY > 0 ? -6 : 6) : -e.deltaY * 0.35;
        const nextHourHeight = Math.max(24, Math.min(160, Math.round(hourHeight + step)));

        if (nextHourHeight !== hourHeight && onHourHeightChange) {
          onHourHeightChange(nextHourHeight);
          // 镜头锚定：调整 scrollTop 确保光标所指的时间点保持在同一视口位置
          const newCanvasY = (currentMinute / 60) * nextHourHeight;
          const targetScroll = Math.max(0, newCanvasY - offsetY);
          el.scrollTop = targetScroll;
        }
      }
    };

    const onGestureStart = (e) => {
      e.preventDefault();
      initialGestureHeightRef.current = hourHeight;
    };
    const onGestureChange = (e) => {
      e.preventDefault();
      const base = initialGestureHeightRef.current || hourHeight;
      const nextHourHeight = Math.max(24, Math.min(160, Math.round(base * e.scale)));
      if (onHourHeightChange && nextHourHeight !== hourHeight) {
        onHourHeightChange(nextHourHeight);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGestureStart);
    el.addEventListener("gesturechange", onGestureChange);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
      if (timelineResetTimerRef.current) clearTimeout(timelineResetTimerRef.current);
    };
  }, [hourHeight, onHourHeightChange, onPrev, onNext]);

  // 每 30 秒更新当前红线位置
  useEffect(() => {
    const updateNow = () => {
      const d = new Date();
      setNowTop((d.getHours() + d.getMinutes() / 60) * hourHeight);
      setNowTimeStr(String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"));
    };
    updateNow();
    const timer = setInterval(updateNow, 30000);
    return () => clearInterval(timer);
  }, [hourHeight]);

  // 挂载时，平滑自动滚动到当前时间上方 2 小时处
  useEffect(() => {
    if (scrollRef.current) {
      const targetScroll = Math.max(0, nowTop - 150);
      scrollRef.current.scrollTop = targetScroll;
    }
  }, []);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const timelineContextRef = useRef({});
  timelineContextRef.current = {
    hourHeight,
    snapStep,
    days,
    byDate,
    selectedEventIds,
    onUpdateEvent,
    onBatchUpdateEvents,
    onCreateEvent,
    selectedEvent,
    onSelectEvent,
    onSelectDay,
  };
  const dragInfoRef = useRef(dragInfo);
  dragInfoRef.current = dragInfo;
  const createGhostRef = useRef(createGhost);
  createGhostRef.current = createGhost;
  const quickDraftRef = useRef(quickDraft);
  quickDraftRef.current = quickDraft;

  /* 全局鼠标移动与松开监听：驱动全自由度拖拽位移(左右跨天+上下调时)、上下边缘调整时长与拖拽划定创建 (rAF 节流性能优化) */
  useEffect(() => {
    const onMouseMove = (e) => {
      const drag = dragRef.current;
      if (!drag) return;

      const clientX = e.clientX;
      const clientY = e.clientY;
      const altKey = e.altKey;
      const metaKey = e.metaKey;
      const ctrlKey = e.ctrlKey;

      if (timelineRafIdRef.current) return;

      timelineRafIdRef.current = requestAnimationFrame(() => {
        timelineRafIdRef.current = null;
        const curDrag = dragRef.current;
        if (!curDrag) return;

        const { hourHeight: curHourHeight, snapStep: curSnapStep } = timelineContextRef.current;
        const dx = clientX - curDrag.startX;
        const dy = clientY - curDrag.startY;
        const isCmdNow = !!(curDrag.withCmd || metaKey || ctrlKey);
        const isResize = curDrag.type === "resize-top" || curDrag.type === "resize-bottom";
        // 按住 Command 键启用 1 分钟超微度平滑调节，普通拉伸启用 5 分钟吸附，移动遵循网格步长
        const effectiveStep = isCmdNow ? 1 : (isResize ? 5 : Math.max(1, curSnapStep || 15));
        const rawDeltaMin = ((dy / curHourHeight) * 60);
        const deltaMin = Math.round(rawDeltaMin / effectiveStep) * effectiveStep;

        // 探测鼠标当前横向悬停的目标日期列（直接使用预计算内存坐标数组，彻底杜绝 DOM forced reflow）
        let currentColDs = curDrag.dayDs;
        const bounds = colBoundsRef.current;
        if (bounds && bounds.length > 0) {
          for (let i = 0; i < bounds.length; i++) {
            if (clientX >= bounds[i].left && clientX <= bounds[i].right) {
              if (bounds[i].ds) currentColDs = bounds[i].ds;
              break;
            }
          }
        }

        const nowObj = new Date();
        const todayDs = getToday(nowObj);
        const nowMin = nowObj.getHours() * 60 + nowObj.getMinutes();

        if (curDrag.type === "move") {
          if (!curDrag.hasMoved && (Math.abs(dy) > 3 || Math.abs(dx) > 6)) curDrag.hasMoved = true;
          curDrag.targetDayDs = currentColDs;
          const isCloneNow = !!(curDrag.isClone || altKey);
          curDrag.isClone = isCloneNow;

          let effectiveDelta = deltaMin;
          let snapNotice = null;
          const proposedStartMin = Math.max(0, Math.min(1440 - curDrag.duration, curDrag.origStartMin + deltaMin));
          const proposedEndMin = proposedStartMin + curDrag.duration;

          // 智能磁吸对齐（按住 Command/Ctrl 时精确微调，不触发吸附）
          if (!isCmdNow) {
            let closestDist = 9; // 吸附阈值 8~9 分钟内

            // 1. 优先吸附当前时间红线（仅当目标日期为今天时）
            if (currentColDs === todayDs) {
              // 贴合日程结束时间至当前时间
              const distEndToNow = Math.abs(proposedEndMin - nowMin);
              if (distEndToNow < closestDist && nowMin - curDrag.duration >= 0) {
                closestDist = distEndToNow;
                effectiveDelta = (nowMin - curDrag.duration) - curDrag.origStartMin;
                snapNotice = `贴合至当前时间 (${formatTimeFromMinutes(nowMin)})`;
              }
              // 贴合日程开始时间至当前时间
              const distStartToNow = Math.abs(proposedStartMin - nowMin);
              if (distStartToNow < closestDist && nowMin + curDrag.duration <= 1440) {
                closestDist = distStartToNow;
                effectiveDelta = nowMin - curDrag.origStartMin;
                snapNotice = `贴合至当前时间 (${formatTimeFromMinutes(nowMin)})`;
              }
            }

            // 2. 贴合相邻日程前后边缘
            const dayEvents = (byDate.eventsByDate && byDate.eventsByDate[currentColDs]) || [];
            const otherTimed = dayEvents.filter(x => !x.isAllDay && x.type !== "一天总结" && getEventUid(x) !== curDrag.eventId);
            for (const ot of otherTimed) {
              const otp = parseEventTime(ot.startTime, ot.endTime);
              const ots = otp.startMinutes !== undefined ? otp.startMinutes : 540;
              const ote = ots + (otp.diffMinutes || 60);

              // 贴合上方日程结束时间
              const distTop = Math.abs(proposedStartMin - ote);
              if (distTop < closestDist && ote + curDrag.duration <= 1440) {
                closestDist = distTop;
                effectiveDelta = ote - curDrag.origStartMin;
                snapNotice = `贴合至【${ot.text}】后 (${formatTimeFromMinutes(ote)})`;
              }
              // 贴合下方日程开始时间
              const distBtm = Math.abs(proposedEndMin - ots);
              if (distBtm < closestDist && ots - curDrag.duration >= 0) {
                closestDist = distBtm;
                effectiveDelta = (ots - curDrag.duration) - curDrag.origStartMin;
                snapNotice = `贴合至【${ot.text}】前 (${formatTimeFromMinutes(ots)})`;
              }
            }
          }

          const finalStartMin = Math.max(0, Math.min(1440 - curDrag.duration, curDrag.origStartMin + effectiveDelta));
          const finalEndMin = finalStartMin + curDrag.duration;
          const dayEvents = (byDate.eventsByDate && byDate.eventsByDate[currentColDs]) || [];
          const colliding = dayEvents.filter(x => {
            if (x.isAllDay || x.type === "一天总结" || (getEventUid(x) && getEventUid(x) === curDrag.eventId)) return false;
            const p = parseEventTime(x.startTime, x.endTime);
            const s = p.startMinutes !== undefined ? p.startMinutes : 540;
            const e = s + (p.diffMinutes || 60);
            return Math.max(finalStartMin, s) < Math.min(finalEndMin, e);
          });

          setDragInfo({
            type: "move",
            eventId: curDrag.eventId,
            event: curDrag.event,
            deltaMin: effectiveDelta,
            origStartMin: curDrag.origStartMin,
            duration: curDrag.duration,
            origDayDs: curDrag.dayDs,
            targetDayDs: currentColDs,
            isClone: isCloneNow,
            withCmd: isCmdNow,
            hasCollision: colliding.length > 0,
            collisionNames: colliding.map(x => x.text),
            magnetSnap: snapNotice,
          });
        } else if (curDrag.type === "resize-top") {
          let effectiveDelta = deltaMin;
          let snapNotice = null;
          const rawStartMin = curDrag.origStartMin + rawDeltaMin;

          // 智能磁吸对齐（按住 Command/Ctrl 时精确微调，不触发吸附）
          if (!isCmdNow) {
            let closestDist = 9;

            // 1. 优先磁吸当前时间红线（仅当为今天时）
            if (curDrag.dayDs === todayDs && nowMin >= 0 && nowMin <= curDrag.origEndMin - 1) {
              const distToNow = Math.abs(rawStartMin - nowMin);
              if (distToNow <= closestDist) {
                closestDist = distToNow;
                effectiveDelta = nowMin - curDrag.origStartMin;
                snapNotice = `贴合至当前时间 (${formatTimeFromMinutes(nowMin)})`;
              }
            }

            // 2. 磁吸上方日程的结束时间
            const dayEvents = (byDate.eventsByDate && byDate.eventsByDate[curDrag.dayDs]) || [];
            const otherTimed = dayEvents.filter(x => !x.isAllDay && x.type !== "一天总结" && getEventUid(x) !== curDrag.eventId);
            for (const ot of otherTimed) {
              const otp = parseEventTime(ot.startTime, ot.endTime);
              const ots = otp.startMinutes !== undefined ? otp.startMinutes : 540;
              const ote = ots + (otp.diffMinutes || 60);
              if (ote <= curDrag.origEndMin - 1) {
                const distToPrev = Math.abs(rawStartMin - ote);
                if (distToPrev < closestDist) {
                  closestDist = distToPrev;
                  effectiveDelta = ote - curDrag.origStartMin;
                  snapNotice = `贴合至【${ot.text}】后 (${formatTimeFromMinutes(ote)})`;
                }
              }
            }
          }

          const finalStartMin = Math.max(0, Math.min(curDrag.origEndMin - 1, curDrag.origStartMin + effectiveDelta));
          const dayEvents = (byDate.eventsByDate && byDate.eventsByDate[curDrag.dayDs]) || [];
          const colliding = dayEvents.filter(x => {
            if (x.isAllDay || x.type === "一天总结" || (getEventUid(x) && getEventUid(x) === curDrag.eventId)) return false;
            const p = parseEventTime(x.startTime, x.endTime);
            const s = p.startMinutes !== undefined ? p.startMinutes : 540;
            const e = s + (p.diffMinutes || 60);
            return Math.max(finalStartMin, s) < Math.min(curDrag.origEndMin, e);
          });
          setDragInfo({
            type: "resize-top",
            eventId: curDrag.eventId,
            deltaMin: effectiveDelta,
            origStartMin: curDrag.origStartMin,
            origEndMin: curDrag.origEndMin,
            hasCollision: colliding.length > 0,
            collisionNames: colliding.map(x => x.text),
            magnetSnap: snapNotice,
          });
        } else if (curDrag.type === "resize-bottom") {
          let effectiveDelta = deltaMin;
          let snapNotice = null;
          const rawEndMin = curDrag.origEndMin + rawDeltaMin;

          // 智能磁吸对齐（按住 Command/Ctrl 时精确微调，不触发吸附）
          if (!isCmdNow) {
            let closestDist = 9;

            // 1. 优先磁吸当前时间红线（仅当为今天时，让滑块底边精确贴合当前实时红线）
            if (curDrag.dayDs === todayDs && nowMin >= curDrag.origStartMin + 1 && nowMin <= 1440) {
              const distToNow = Math.abs(rawEndMin - nowMin);
              if (distToNow <= closestDist) {
                closestDist = distToNow;
                effectiveDelta = nowMin - curDrag.origEndMin;
                snapNotice = `贴合至当前时间 (${formatTimeFromMinutes(nowMin)})`;
              }
            }

            // 2. 磁吸下方日程的开始时间
            const dayEvents = (byDate.eventsByDate && byDate.eventsByDate[curDrag.dayDs]) || [];
            const otherTimed = dayEvents.filter(x => !x.isAllDay && x.type !== "一天总结" && getEventUid(x) !== curDrag.eventId);
            for (const ot of otherTimed) {
              const otp = parseEventTime(ot.startTime, ot.endTime);
              const ots = otp.startMinutes !== undefined ? otp.startMinutes : 540;
              if (ots >= curDrag.origStartMin + 1) {
                const distToNext = Math.abs(rawEndMin - ots);
                if (distToNext < closestDist) {
                  closestDist = distToNext;
                  effectiveDelta = ots - curDrag.origEndMin;
                  snapNotice = `贴合至【${ot.text}】前 (${formatTimeFromMinutes(ots)})`;
                }
              }
            }
          }

          const finalEndMin = Math.min(1440, Math.max(curDrag.origStartMin + 1, curDrag.origEndMin + effectiveDelta));
          const dayEvents = (byDate.eventsByDate && byDate.eventsByDate[curDrag.dayDs]) || [];
          const colliding = dayEvents.filter(x => {
            if (x.isAllDay || x.type === "一天总结" || (getEventUid(x) && getEventUid(x) === curDrag.eventId)) return false;
            const p = parseEventTime(x.startTime, x.endTime);
            const s = p.startMinutes !== undefined ? p.startMinutes : 540;
            const e = s + (p.diffMinutes || 60);
            return Math.max(curDrag.origStartMin, s) < Math.min(finalEndMin, e);
          });
          setDragInfo({
            type: "resize-bottom",
            eventId: curDrag.eventId,
            deltaMin: effectiveDelta,
            origStartMin: curDrag.origStartMin,
            origEndMin: curDrag.origEndMin,
            hasCollision: colliding.length > 0,
            collisionNames: colliding.map(x => x.text),
            magnetSnap: snapNotice,
          });
        } else if (curDrag.type === "potential-create" || curDrag.type === "create") {
          const moveDist = Math.hypot(dx, dy);
          const colChanged = currentColDs !== curDrag.dayDs;
          // 关键防抖：移动距离必须超过死区阈值 (DRAG_THRESHOLD = 8px) 或者是跨列，才确认为真正的划选新建手势！
          if (moveDist >= DRAG_THRESHOLD || colChanged || curDrag.hasDragged) {
            curDrag.type = "create";
            curDrag.hasDragged = true;
            let d1 = curDrag.dayDs;
            let d2 = currentColDs;
            if (d1 > d2) {
              const tmp = d1; d1 = d2; d2 = tmp;
            }
            const step = isCmdNow ? 1 : effectiveStep;
            const rawCurrentMin = curDrag.startMin + ((dy / curHourHeight) * 60);
            let snappedCurrentMin = Math.round(rawCurrentMin / step) * step;

            // 智能磁吸对齐（按住 Command/Ctrl 时精确微调，不触发吸附）
            if (!isCmdNow) {
              let closestDist = 9; // 吸附阈值 8~9 分钟内
              const targetColDs = d1;
              const dayEvents = (byDate.eventsByDate && byDate.eventsByDate[targetColDs]) || [];
              const timedEvents = dayEvents.filter(x => !x.isAllDay && x.type !== "一天总结");

              if (rawCurrentMin >= curDrag.startMin) {
                // 向下拖动确定结束时间（底边）：
                // 1. 优先吸附下方紧邻日程的开始时间（消除缝隙且防重叠）
                for (const ot of timedEvents) {
                  const otp = parseEventTime(ot.startTime, ot.endTime);
                  const ots = otp.startMinutes !== undefined ? otp.startMinutes : 540;
                  if (ots > curDrag.startMin) {
                    const dist = Math.abs(rawCurrentMin - ots);
                    if (dist <= closestDist) {
                      closestDist = dist;
                      snappedCurrentMin = ots;
                    }
                  }
                }
                // 2. 磁吸当前时间红线（仅当为今天时）
                if (targetColDs === todayDs && nowMin > curDrag.startMin) {
                  const distNow = Math.abs(rawCurrentMin - nowMin);
                  if (distNow <= closestDist) {
                    closestDist = distNow;
                    snappedCurrentMin = nowMin;
                  }
                }
              } else {
                // 向上反向拖动确定开始时间（顶边）：
                // 1. 优先吸附上方紧邻日程的结束时间
                for (const ot of timedEvents) {
                  const otp = parseEventTime(ot.startTime, ot.endTime);
                  const ots = otp.startMinutes !== undefined ? otp.startMinutes : 540;
                  const ote = ots + (otp.diffMinutes || 60);
                  if (ote < curDrag.startMin) {
                    const dist = Math.abs(rawCurrentMin - ote);
                    if (dist <= closestDist) {
                      closestDist = dist;
                      snappedCurrentMin = ote;
                    }
                  }
                }
                // 2. 磁吸当前时间红线（仅当为今天时）
                if (targetColDs === todayDs && nowMin < curDrag.startMin) {
                  const distNow = Math.abs(rawCurrentMin - nowMin);
                  if (distNow <= closestDist) {
                    closestDist = distNow;
                    snappedCurrentMin = nowMin;
                  }
                }
              }
            }

            const minSpan = isCmdNow ? 1 : Math.min(step, 5);
            const sMin = Math.max(0, Math.min(curDrag.startMin, snappedCurrentMin));
            const eMin = Math.min(1440, Math.max(sMin + minSpan, Math.max(curDrag.startMin, snappedCurrentMin)));
            const gData = {
              startDayDs: d1,
              endDayDs: d2,
              startMin: sMin,
              endMin: eMin,
              isMultiDay: d1 !== d2,
            };
            curDrag.ghostData = gData;
            setCreateGhost(gData);
          }
        }
      });
    };

    const onMouseUp = () => {
      if (timelineRafIdRef.current) {
        cancelAnimationFrame(timelineRafIdRef.current);
        timelineRafIdRef.current = null;
      }
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;

      const currentDragInfo = dragInfoRef.current;
      const currentCreateGhost = createGhostRef.current;
      const currentQuickDraft = quickDraftRef.current;
      const {
        days: currentDays,
        selectedEventIds: currentSelectedEventIds,
        onBatchUpdateEvents: currentOnBatchUpdateEvents,
        onUpdateEvent: currentOnUpdateEvent,
        onCreateEvent: currentOnCreateEvent,
        selectedEvent: currentSelectedEvent,
        onSelectEvent: currentOnSelectEvent,
        onSelectDay: currentOnSelectDay,
      } = timelineContextRef.current;

      if (drag.type === "move" && drag.hasMoved) {
        const delta = currentDragInfo ? currentDragInfo.deltaMin : 0;
        const targetDay = (currentDragInfo && currentDragInfo.targetDayDs) || drag.dayDs;
        const isClone = (currentDragInfo && currentDragInfo.isClone) || drag.isClone;
        const newStartMin = Math.max(0, Math.min(1440 - drag.duration, drag.origStartMin + delta));
        const newEndMin = newStartMin + drag.duration;
        const newStart = `${targetDay} ${formatTimeFromMinutes(newStartMin)}:00`;
        const newEnd = `${targetDay} ${formatTimeFromMinutes(newEndMin)}:00`;

        if (isClone) {
          // Option (⌥) 键克隆复制：创建新条目，保持原日程不动
          if (currentOnCreateEvent) {
            currentOnCreateEvent(Object.assign({}, drag.event, {
              date: targetDay,
              endDate: targetDay,
              startTime: newStart,
              endTime: newEnd,
              startTimeStr: formatTimeFromMinutes(newStartMin),
              endTimeStr: formatTimeFromMinutes(newEndMin),
              durationStr: formatDurationFromMinutes(drag.duration),
              record_id: undefined,
              _uid: `${targetDay}_${Date.now()}`,
              _local: true,
            }));
          }
        } else {
          const isMulti = currentSelectedEventIds && currentSelectedEventIds.length > 1 && currentSelectedEventIds.includes(drag.eventId);
          if (isMulti && currentOnBatchUpdateEvents) {
            currentOnBatchUpdateEvents(currentSelectedEventIds, delta);
          } else if (currentOnUpdateEvent) {
            currentOnUpdateEvent(Object.assign({}, drag.event, {
              date: targetDay,
              startTime: newStart,
              endTime: newEnd,
              startTimeStr: formatTimeFromMinutes(newStartMin),
              endTimeStr: formatTimeFromMinutes(newEndMin),
              durationStr: formatDurationFromMinutes(drag.duration),
            }), false, "", drag.event);
          }
        }

        if (window.SFX) {
          if (currentDragInfo && currentDragInfo.hasCollision) {
            window.SFX.play("tap");
          } else {
            window.SFX.play("snap");
          }
        }
      } else if (drag.type === "move" && !drag.hasMoved && !drag.withCmd && !drag.isClone) {
        // 轻点已有日程卡片（未发生拖拽位移）：打开详情抽屉进行编辑
        if (currentOnSelectEvent) {
          currentOnSelectEvent(drag.event, drag.dayDs, false, true);
        }
      } else if (drag.type === "resize-top" && currentOnUpdateEvent) {
        const delta = currentDragInfo ? currentDragInfo.deltaMin : 0;
        const minDur = 1;
        const newStartMin = Math.max(0, Math.min(drag.origEndMin - minDur, drag.origStartMin + delta));
        const newDiff = drag.origEndMin - newStartMin;
        const newStart = `${drag.dayDs} ${formatTimeFromMinutes(newStartMin)}:00`;
        currentOnUpdateEvent(Object.assign({}, drag.event, {
          startTime: newStart,
          startTimeStr: formatTimeFromMinutes(newStartMin),
          durationStr: formatDurationFromMinutes(newDiff),
        }), false, "", drag.event);
        if (window.SFX) window.SFX.play("snap");
      } else if (drag.type === "resize-bottom" && currentOnUpdateEvent) {
        const delta = currentDragInfo ? currentDragInfo.deltaMin : 0;
        const minDur = 1;
        const newEndMin = Math.min(1440, Math.max(drag.origStartMin + minDur, drag.origEndMin + delta));
        const newDiff = newEndMin - drag.origStartMin;
        const newEnd = `${drag.dayDs} ${formatTimeFromMinutes(newEndMin)}:00`;
        currentOnUpdateEvent(Object.assign({}, drag.event, {
          endTime: newEnd,
          endTimeStr: formatTimeFromMinutes(newEndMin),
          durationStr: formatDurationFromMinutes(newDiff),
        }), false, "", drag.event);
        if (window.SFX) window.SFX.play("snap");
      } else if (drag.type === "create" && drag.hasDragged && (drag.ghostData || currentCreateGhost)) {
        // 拖拽划定创建：松手后绝不直接落库一个名为“新日程”的垃圾数据，而是就地激活轻量草稿输入框！
        const targetGhost = drag.ghostData || currentCreateGhost;
        if (targetGhost && targetGhost.endMin > targetGhost.startMin) {
          const sTime = formatTimeFromMinutes(targetGhost.startMin);
          const eTime = formatTimeFromMinutes(targetGhost.endMin);
          const diffMin = targetGhost.endMin - targetGhost.startMin;
          const targetDay = targetGhost.startDayDs;
          const colIdx = currentDays ? currentDays.findIndex((x) => x.ds === targetDay) : -1;
          setQuickDraft({
            date: targetDay,
            endDate: targetGhost.endDayDs || targetDay,
            startMin: targetGhost.startMin,
            endMin: targetGhost.endMin,
            startTimeStr: sTime,
            endTimeStr: eTime,
            durationStr: formatDurationFromMinutes(diffMin),
            isAllDay: targetGhost.isMultiDay,
            colIndex: colIdx >= 0 ? colIdx : 0,
            category: "生活",
            status: "完成",
            text: "",
          });
        }
      } else if (drag.type === "potential-create" && !drag.hasDragged) {
        // 单击空白处：仅选择与聚焦日期，清空卡片选中状态与之前的草稿，绝不误创建日程！
        if (currentQuickDraft) {
          setQuickDraft(null);
        }
        if (currentSelectedEvent) {
          currentOnSelectEvent && currentOnSelectEvent(null);
        }
        currentOnSelectDay && currentOnSelectDay(drag.dayDs);
      }

      setDragInfo(null);
      setCreateGhost(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      if (timelineRafIdRef.current) {
        cancelAnimationFrame(timelineRafIdRef.current);
        timelineRafIdRef.current = null;
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // 开始按住拖拽块 (支持普通拖拽移动、按住 Shift 连续时间区间多选、⌘/Ctrl 跳跃散选、Option 克隆复制)
  const startMoveBlock = (e, ev, ds) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    updateTimelineColBounds();

    // 触发事件点选（透传 shiftKey / metaKey / ctrlKey 以支持像单元格一样的区间连续多选与跳跃散选）
    onSelectEvent && onSelectEvent(ev, ds, e);

    const parsed = parseEventTime(ev.startTime, ev.endTime);
    const startMin = parsed.startMinutes !== undefined ? parsed.startMinutes : 540;
    const duration = parsed.diffMinutes || 60;

    const evId = getEventUid(ev);

    const isCmd = !!(e && (e.metaKey || e.ctrlKey));
    const isClone = !!(e && e.altKey);

    dragRef.current = {
      type: "move",
      eventId: evId,
      dayDs: ds,
      targetDayDs: ds,
      event: ev,
      startX: e.clientX,
      startY: e.clientY,
      origStartMin: startMin,
      duration: duration,
      hasMoved: false,
      isClone: isClone,
      withCmd: isCmd,
    };
  };

  // 开始调整顶部或底部边缘
  const startResize = (e, ev, ds, edge) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    updateTimelineColBounds();

    const parsed = parseEventTime(ev.startTime, ev.endTime);
    const startMin = parsed.startMinutes !== undefined ? parsed.startMinutes : 540;
    const diffMin = parsed.diffMinutes || 60;
    const evId = getEventUid(ev);

    dragRef.current = {
      type: edge === "top" ? "resize-top" : "resize-bottom",
      eventId: evId,
      dayDs: ds,
      event: ev,
      startX: e.clientX,
      startY: e.clientY,
      origStartMin: startMin,
      origEndMin: startMin + diffMin,
    };

    setDragInfo({
      type: edge === "top" ? "resize-top" : "resize-bottom",
      eventId: evId,
      deltaMin: 0,
      origStartMin: startMin,
      origEndMin: startMin + diffMin,
    });
  };

  // 在空白网格处按下：进入潜在拖拽创建准备态，记录初始点击坐标（尚未拖动前不渲染 ghost，防止单击闪烁与误触）
  const startCreateGhost = (e, ds) => {
    if (e.button !== 0) return;
    updateTimelineColBounds();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const isCmd = !!(e.metaKey || e.ctrlKey);
    const step = isCmd ? 1 : Math.max(1, snapStep || 15);
    const rawMin = (clickY / hourHeight) * 60;
    let snapMin = Math.round(rawMin / step) * step;

    // 起点智能磁吸（按住 Command/Ctrl 时精确微调，不触发吸附）
    if (!isCmd) {
      const nowObj = new Date();
      const todayDs = getToday(nowObj);
      const nowMin = nowObj.getHours() * 60 + nowObj.getMinutes();
      let closestDist = 8;
      if (ds === todayDs && Math.abs(rawMin - nowMin) <= closestDist) {
        closestDist = Math.abs(rawMin - nowMin);
        snapMin = nowMin;
      }
      const dayEvents = (byDate.eventsByDate && byDate.eventsByDate[ds]) || [];
      const timedEvents = dayEvents.filter(x => !x.isAllDay && x.type !== "一天总结");
      for (const ot of timedEvents) {
        const otp = parseEventTime(ot.startTime, ot.endTime);
        const ots = otp.startMinutes !== undefined ? otp.startMinutes : 540;
        const ote = ots + (otp.diffMinutes || 60);
        if (Math.abs(rawMin - ote) <= closestDist) {
          closestDist = Math.abs(rawMin - ote);
          snapMin = ote;
        }
        if (Math.abs(rawMin - ots) <= closestDist) {
          closestDist = Math.abs(rawMin - ots);
          snapMin = ots;
        }
      }
    }

    const initialGhost = {
      startDayDs: ds,
      endDayDs: ds,
      startMin: snapMin,
      endMin: Math.min(1440, snapMin + (isCmd ? 1 : step)),
      isMultiDay: false,
    };

    dragRef.current = {
      type: "potential-create",
      dayDs: ds,
      startY: e.clientY,
      startX: e.clientX,
      startMin: snapMin,
      hasDragged: false,
      ghostData: initialGhost,
      withCmd: isCmd,
    };
  };

  return (
    <div
      ref={timelineContainerRef}
      className="notion-timeline-container"
      style={{
        transform: timelineSwipeOffset !== 0 ? `translateX(${timelineSwipeOffset}px)` : undefined,
        transition: timelineIsAnimating ? "transform 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.25)" : undefined,
        willChange: timelineSwipeOffset !== 0 ? "transform" : undefined,
      }}
    >
      {/* 顶部列标头 (星期与日期) */}
      <div className="notion-timeline-hd">
        <div className="notion-tz-col">
          <span className="notion-tz-label">GMT+8</span>
        </div>
        <div className="notion-timeline-cols">
          {days.map((d) => {
            const fest = d.fest || festivalOf(d.ds);
            const lText = d.lunarText || getLunarDayText(d.ds);
            const hBadge = d.holidayBadge || getHolidayBadge(d.ds);
            const lFull = d.lunarFull || getLunarFullDesc(d.ds);
            return (
              <div
                key={d.ds}
                className={"notion-col-header" + (d.isToday ? " is-today" : "")}
                onClick={() => onSelectDay && onSelectDay(d.ds)}
                title={`${d.ds} ${d.wdStr} ${lFull ? "· " + lFull : ""}${hBadge ? ` [${hBadge.name}${hBadge.type === "rest" ? "休" : "班"}]` : ""}`}
              >
                <div className="notion-col-header-top">
                  <span className="notion-col-wd">{d.wdStr}{d.relTag ? ` · ${d.relTag}` : ""}</span>
                  {hBadge ? (
                    <span className={"notion-holiday-badge badge-" + hBadge.type} title={hBadge.name + (hBadge.type === "rest" ? "放假" : "补班")}>
                      {hBadge.type === "rest" ? "休" : "班"}
                    </span>
                  ) : null}
                </div>
                <div className="notion-col-header-sub">
                  {d.isToday ? (
                    <span className="notion-today-chip">{d.dayNum}</span>
                  ) : (
                    <span className="notion-col-daynum">{d.dayNum}</span>
                  )}
                  <span className="notion-col-lunar" title={fest || lText}>
                    {fest || lText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 全天日程专区 (All-day Row，常驻自适应展开) */}
      <div className="notion-allday-row">
        <div className="notion-allday-label">
          <span>全天</span>
          {totalAllDayCount > 0 ? (
            <span className="notion-allday-count-badge">{totalAllDayCount}</span>
          ) : null}
        </div>
        <div className="notion-allday-cols">
            {days.map((d, colIdx) => {
              const evList = (byDate.eventsByDate && byDate.eventsByDate[d.ds]) || [];
              const rawAllDay = evList.filter((ev) => ev.isAllDay || !ev.startTime || ev.type === "一天总结");
              const seenMap = new Map();
              rawAllDay.forEach((item) => {
                const k = (item.text || "").trim().toLowerCase();
                if (!k) return;
                const prev = seenMap.get(k);
                if (!prev) {
                  seenMap.set(k, item);
                } else if (item.type === "一天总结" && prev.type !== "一天总结") {
                  seenMap.set(k, Object.assign({}, prev, item));
                } else if (item.record_id && !prev.record_id) {
                  seenMap.set(k, Object.assign({}, prev, item));
                }
              });
              const allDayList = Array.from(seenMap.values()).sort((a, b) => {
                if (a.type === "一天总结" && b.type !== "一天总结") return -1;
                if (a.type !== "一天总结" && b.type === "一天总结") return 1;
                return 0;
              });
              const isColRangeActive = alldayDrag && alldayDrag.hasDragged && (
                colIdx >= Math.min(alldayDrag.startIdx, alldayDrag.currentIdx) &&
                colIdx <= Math.max(alldayDrag.startIdx, alldayDrag.currentIdx)
              );
              const isRangeFirstCol = alldayDrag && alldayDrag.hasDragged && (
                colIdx === Math.min(alldayDrag.startIdx, alldayDrag.currentIdx)
              );
              const isDraftHeaderHere = quickDraft && quickDraft.isAlldayHeader && quickDraft.colIndex === colIdx;

              return (
                <div
                  key={d.ds}
                  data-ds={d.ds}
                  className={"notion-allday-col" + (isColRangeActive ? " is-range-active" : "") + (taskDropTarget && taskDropTarget.ds === d.ds && taskDropTarget.isAllDay ? " is-task-drag-over" : "")}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                    if (!taskDropTarget || taskDropTarget.ds !== d.ds || !taskDropTarget.isAllDay) {
                      setTaskDropTarget({ ds: d.ds, isAllDay: true });
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setTaskDropTarget(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setTaskDropTarget(null);
                    let task = null;
                    const raw = e.dataTransfer.getData("application/polaris-task");
                    if (raw) {
                      try { task = JSON.parse(raw); } catch (err) {}
                    }
                    if (!task) {
                      const text = e.dataTransfer.getData("text/plain");
                      if (text) task = { title: text, priority: "P0" };
                    }
                    if (task && task.title) {
                      if (onCreateEvent) {
                        onCreateEvent({
                          _uid: "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
                          text: task.title,
                          date: d.ds,
                          endDate: d.ds,
                          startTime: `${d.ds} 00:00:00`,
                          endTime: `${d.ds} 23:59:59`,
                          durationStr: "全天",
                          category: task.category || "工作",
                          type: "自己安排",
                          status: "完成",
                          isAllDay: true,
                          trackTime: false,
                          linkedTask: task.title,
                          linkedTaskId: task.id || "",
                          isNew: true,
                        });
                        if (window.__triggerToast) {
                          window.__triggerToast(`🎯 已排入全天日程：${task.title} (${d.ds})`);
                        }
                      }
                    }
                  }}
                  onMouseDown={(e) => {
                    if (e.target.closest(".notion-allday-pill") || e.target.closest(".notion-draft-popover")) return;
                    startAlldayDrag(e, d.ds, colIdx);
                  }}
                  onClick={() => {
                    if (!alldayDrag || !alldayDrag.hasDragged) {
                      onSelectDay && onSelectDay(d.ds);
                    }
                  }}
                  onDoubleClick={() => onOpenCreateModal && onOpenCreateModal({ date: d.ds, isAllDay: true })}
                  title={d.ds + " (按住可横向划选跨天日程，可拖入任务排程，单击选中日期，双击添加全天日程)"}
                >
                  {/* 正在划选的半透明浮动占位 */}
                  {isRangeFirstCol && (
                    <div className="notion-allday-ghost-pill">
                      + 跨天全天 ({Math.abs(alldayDrag.currentIdx - alldayDrag.startIdx) + 1}天)
                    </div>
                  )}

                  {/* 原地全天快速创建 Popover 锚点 */}
                  {isDraftHeaderHere && (
                    <div
                      className="notion-allday-draft-anchor"
                      style={{ position: "relative" }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className="notion-allday-ghost-pill" style={{ opacity: 0.95 }}>
                        {quickDraft.text || "新建全天日程..."} {quickDraft.date !== quickDraft.endDate ? `(${quickDraft.date.slice(5)} ~ ${quickDraft.endDate.slice(5)})` : ""}
                      </div>
                      <QuickCreatePopover
                        draft={quickDraft}
                        daysCount={days.length}
                        baseList={baseList}
                        onClose={() => setQuickDraft(null)}
                        onSubmit={(title, cat, popoverAllDay) => {
                          const actualAllDay = popoverAllDay !== undefined ? popoverAllDay : quickDraft.isAllDay;
                          const targetDay = quickDraft.date;
                          const endDay = quickDraft.endDate || targetDay;
                          const sTime = quickDraft.startTimeStr || "09:00";
                          const eTime = quickDraft.endTimeStr || "18:00";
                          if (onCreateEvent) {
                            onCreateEvent({
                              _uid: "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
                              text: title,
                              date: targetDay,
                              endDate: endDay,
                              startTime: actualAllDay ? `${targetDay} 00:00:00` : `${targetDay} ${sTime}:00`,
                              endTime: actualAllDay ? `${endDay} 23:59:59` : `${endDay} ${eTime}:00`,
                              startTimeStr: sTime,
                              endTimeStr: eTime,
                              durationStr: actualAllDay ? "全天" : formatDurationFromMinutes(quickDraft.endMin - quickDraft.startMin),
                              category: cat,
                              type: "自己安排",
                              status: "完成",
                              isAllDay: actualAllDay,
                              trackTime: !actualAllDay,
                              isNew: true,
                            });
                          }
                          setQuickDraft(null);
                        }}
                        onOpenMore={(data) => {
                          onOpenCreateModal && onOpenCreateModal({
                            ...data,
                            isAllDay: data && data.isAllDay !== undefined ? data.isAllDay : quickDraft.isAllDay,
                            date: quickDraft.date,
                            endDate: quickDraft.endDate,
                          });
                          setQuickDraft(null);
                        }}
                      />
                    </div>
                  )}

                  {allDayList.map((ev, idx) => {
                    const cat = CATS[ev.category] || CATS["生活"];
                    const isSummary = ev.type === "一天总结";
                    const evId = getEventUid(ev);
                    const isSel = (selectedEvent && (selectedEvent.record_id === ev.record_id || selectedEvent.text === ev.text)) ||
                      (selectedEventIds && selectedEventIds.includes(evId));
                    const isDimmed = !isEventMatchCategory(ev.category, categoryFilter);
                    return (
                      <div
                        key={idx}
                        tabIndex={0}
                        className={
                          "notion-allday-pill" +
                          (isSel ? " selected" : "") +
                          (isSummary ? " is-summary" : "") +
                          (isDimmed ? " is-category-dimmed" : "")
                        }
                        style={{
                          backgroundColor: cat.tint,
                          borderColor: cat.solid,
                          color: cat.text || "#1c1c1e",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.currentTarget.focus();
                          onSelectEvent && onSelectEvent(ev, d.ds, e, true);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent && onSelectEvent(ev, d.ds, false, true);
                        }}
                        onContextMenu={(e) => onContextMenu && onContextMenu(e, ev, d.ds)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.keyCode === 13) {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectEvent && onSelectEvent(ev, d.ds, false, true);
                          } else if (e.key === "Delete" || e.key === "Backspace" || e.keyCode === 8 || e.keyCode === 46) {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteEvent && onDeleteEvent(ev);
                          }
                        }}
                        title={"[" + (ev.type || ev.category || "日程") + "] " + ev.text + " (轻点/回车编辑，Delete 删除)"}
                      >
                        <span
                          className="notion-pill-dot-dashed"
                          style={{ borderColor: cat.solid }}
                        ></span>
                        {isSummary ? (
                          <span style={{ fontSize: "10px", fontWeight: 700, backgroundColor: cat.solid, color: "#ffffff", padding: "1px 4px", borderRadius: "3px", marginRight: "4px", lineHeight: 1 }}>总结</span>
                        ) : null}
                        <span className="notion-allday-pill-text">{ev.text}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
      </div>

      {/* 24 小时纵向滚动时间网格 */}
      <div className="notion-timeline-body" ref={scrollRef}>
        {/* 左侧时间标尺（包含整点、半点 :30 与 15m/45m 刻度线） */}
        <div className={"notion-hours-axis" + (hourHeight < 45 ? " is-compact" : "")} style={{ height: 24 * hourHeight }}>
          {hours.map((h) => {
            const isZero = h === 0;
            const isStretched = hourHeight >= 75;
            const isSuperStretched = hourHeight >= 110;

            return (
              <React.Fragment key={h}>
                {/* 整点刻度与标签 */}
                <div className={"notion-hour-mark" + (isZero ? " is-zero" : "")} style={{ top: h * hourHeight }}>
                  <span className="notion-hour-num">{String(h).padStart(2, "0") + ":00"}</span>
                  <span className="notion-hour-line-tick"></span>
                </div>

                {/* 10m 微刻度短线 (拉伸展开时提供 10 分钟辅助吸附参照) */}
                {isSuperStretched && (
                  <>
                    <div className="notion-micro-tick" style={{ top: h * hourHeight + (hourHeight * 10) / 60 }}></div>
                    <div className="notion-micro-tick" style={{ top: h * hourHeight + (hourHeight * 20) / 60 }}></div>
                    <div className="notion-micro-tick" style={{ top: h * hourHeight + (hourHeight * 40) / 60 }}></div>
                    <div className="notion-micro-tick" style={{ top: h * hourHeight + (hourHeight * 50) / 60 }}></div>
                  </>
                )}

                {/* 15m 刻度（拉伸时展开 15 数字） */}
                <div
                  className={"notion-quarter-hour-mark" + (isStretched ? " show-num" : "")}
                  style={{ top: h * hourHeight + hourHeight * 0.25 }}
                >
                  {isStretched ? <span className="notion-quarter-hour-num">15</span> : null}
                  <span className="notion-sub-tick tick-15"></span>
                </div>

                {/* 30m 半点副刻度（带 30 数字与短横线） */}
                <div
                  className="notion-half-hour-mark"
                  style={{ top: h * hourHeight + hourHeight * 0.5 }}
                >
                  <span className="notion-half-hour-num">30</span>
                  <span className="notion-half-hour-tick"></span>
                </div>

                {/* 45m 刻度（拉伸时展开 45 数字） */}
                <div
                  className={"notion-quarter-hour-mark" + (isStretched ? " show-num" : "")}
                  style={{ top: h * hourHeight + hourHeight * 0.75 }}
                >
                  {isStretched ? <span className="notion-quarter-hour-num">45</span> : null}
                  <span className="notion-sub-tick tick-45"></span>
                </div>
              </React.Fragment>
            );
          })}

          {/* 实时当前时间红色药丸 */}
          <div className="notion-now-pill" style={{ top: nowTop }}>
            {nowTimeStr}
          </div>
        </div>

        {/* 右侧时间网格 */}
        <div className="notion-grid-canvas" style={{ height: 24 * hourHeight }}>
          {hours.map((h) => (
            <React.Fragment key={h}>
              <div
                className="notion-grid-hour-line"
                style={{ top: h * hourHeight }}
              ></div>
              {hourHeight >= 80 && (
                <>
                  <div
                    className="notion-grid-quarter-line"
                    style={{ top: h * hourHeight + hourHeight * 0.25 }}
                  ></div>
                  <div
                    className="notion-grid-quarter-line"
                    style={{ top: h * hourHeight + hourHeight * 0.75 }}
                  ></div>
                </>
              )}
              <div
                className="notion-grid-half-line"
                style={{ top: h * hourHeight + hourHeight * 0.5 }}
              ></div>
            </React.Fragment>
          ))}

          {/* 贯穿全图的实时红色线 */}
          <div className="notion-now-line" style={{ top: nowTop }}></div>

          {/* 各天纵向列与时段日程块 */}
          {days.map((d) => {
            const evList = (byDate.eventsByDate && byDate.eventsByDate[d.ds]) || [];
            // 严格排除「一天总结」，一天总结仅常驻顶部全天专区
            let timedList = evList.filter((ev) => !ev.isAllDay && ev.type !== "一天总结");

            const hasCrossDragEvent = Boolean(
              dragInfo &&
              dragInfo.type === "move" &&
              dragInfo.targetDayDs === d.ds &&
              dragInfo.origDayDs !== d.ds &&
              dragInfo.event
            );
            const layoutList = hasCrossDragEvent ? computeEventLayout(timedList) : (eventsLayoutByDay[d.ds] || computeEventLayout(timedList));

            const inGhost = createGhost && d.ds >= createGhost.startDayDs && d.ds <= createGhost.endDayDs;
            const isGhostFirstCol = inGhost && d.ds === createGhost.startDayDs;

            return (
              <div
                key={d.ds}
                className={"notion-grid-col" + (taskDropTarget && taskDropTarget.ds === d.ds && !taskDropTarget.isAllDay ? " is-task-drag-over" : "")}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const step = Math.max(1, snapStep || 15);
                  const rawMin = (clickY / hourHeight) * 60;
                  const snapMin = Math.max(0, Math.min(1380, Math.round(rawMin / step) * step));
                  const timeStr = formatTimeFromMinutes(snapMin);
                  if (!taskDropTarget || taskDropTarget.ds !== d.ds || taskDropTarget.snapMin !== snapMin) {
                    setTaskDropTarget({ ds: d.ds, snapMin, timeStr, isAllDay: false });
                  }
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setTaskDropTarget(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setTaskDropTarget(null);
                  let task = null;
                  const raw = e.dataTransfer.getData("application/polaris-task");
                  if (raw) {
                    try { task = JSON.parse(raw); } catch (err) {}
                  }
                  if (!task) {
                    const text = e.dataTransfer.getData("text/plain");
                    if (text) task = { title: text, priority: "P0" };
                  }
                  if (task && task.title) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickY = e.clientY - rect.top;
                    const step = Math.max(1, snapStep || 15);
                    const rawMin = (clickY / hourHeight) * 60;
                    const snapMin = Math.max(0, Math.min(1380, Math.round(rawMin / step) * step));
                    const endMin = Math.min(1440, snapMin + 60);
                    const sTime = formatTimeFromMinutes(snapMin);
                    const eTime = formatTimeFromMinutes(endMin);
                    if (onCreateEvent) {
                      onCreateEvent({
                        _uid: "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
                        text: task.title,
                        date: d.ds,
                        endDate: d.ds,
                        startTime: `${d.ds} ${sTime}:00`,
                        endTime: `${d.ds} ${eTime}:00`,
                        startTimeStr: sTime,
                        endTimeStr: eTime,
                        durationStr: formatDurationFromMinutes(endMin - snapMin),
                        category: task.category || "工作",
                        type: "自己安排",
                        status: "完成",
                        isAllDay: false,
                        trackTime: true,
                        linkedTask: task.title,
                        linkedTaskId: task.id || "",
                        isNew: true,
                      });
                      if (window.__triggerToast) {
                        window.__triggerToast(`🎯 任务排程成功：${task.title} 已排入 ${d.ds} ${sTime}`);
                      }
                    }
                  }
                }}
                onMouseDown={(e) => {
                  if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                  setHoverHint(null);
                  startCreateGhost(e, d.ds);
                }}
                onMouseMove={(e) => {
                  if (dragRef.current || createGhost || alldayDrag) return;
                  if (e.target && e.target.closest && e.target.closest(".notion-timeline-block")) {
                    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                    if (hoverHint) setHoverHint(null);
                    return;
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const step = Math.max(1, snapStep || 15);
                  const rawMin = (clickY / hourHeight) * 60;
                  const snapMin = Math.round(rawMin / step) * step;
                  const timeStr = formatTimeFromMinutes(snapMin);
                  const clientX = e.clientX;
                  const clientY = e.clientY;

                  if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                  hoverTimerRef.current = setTimeout(() => {
                    setHoverHint({
                      x: clientX,
                      y: clientY,
                      ds: d.ds,
                      timeStr: timeStr,
                    });
                  }, 450);
                }}
                onMouseLeave={() => {
                  if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                  setHoverHint(null);
                }}
                onDoubleClick={(e) => {
                  if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                  setHoverHint(null);
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const step = Math.max(1, snapStep || 15);
                  const rawMin = (clickY / hourHeight) * 60;
                  const snapMin = Math.round(rawMin / step) * step;
                  const endMin = Math.min(1440, snapMin + 60);
                  const sTime = formatTimeFromMinutes(snapMin);
                  const eTime = formatTimeFromMinutes(endMin);
                  const colIdx = days.findIndex((x) => x.ds === d.ds);
                  setQuickDraft({
                    date: d.ds,
                    endDate: d.ds,
                    startMin: snapMin,
                    endMin: endMin,
                    startTimeStr: sTime,
                    endTimeStr: eTime,
                    durationStr: formatDurationFromMinutes(60),
                    isAllDay: false,
                    colIndex: colIdx >= 0 ? colIdx : 0,
                    category: "生活",
                    text: "",
                  });
                }}
                onContextMenu={(e) => {
                  if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                  setHoverHint(null);
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const step = Math.max(1, snapStep || 15);
                  const rawMin = (clickY / hourHeight) * 60;
                  const snapMin = Math.round(rawMin / step) * step;
                  onContextMenu && onContextMenu(e, null, d.ds, formatTimeFromMinutes(snapMin));
                }}
              >
                {/* 空白拖拽新建时的半透明占位框 (支持单天与多天连续跨列) */}
                {inGhost && (
                  <div
                    className="notion-create-ghost"
                    style={{
                      top: (createGhost.startMin / 60) * hourHeight,
                      height: Math.max(26, ((createGhost.endMin - createGhost.startMin) / 60) * hourHeight),
                      background: "rgba(0, 122, 255, 0.14)",
                      borderColor: "#007aff",
                      color: "#007aff",
                    }}
                  >
                    {isGhostFirstCol ? (
                      <span>+ 新建日程 {createGhost.isMultiDay ? `(${createGhost.startDayDs.slice(5)} ~ ${createGhost.endDayDs.slice(5)})` : `(${formatTimeFromMinutes(createGhost.startMin)} - ${formatTimeFromMinutes(createGhost.endMin)})`}</span>
                    ) : null}
                  </div>
                )}

                {/* 原地轻量快速创建草稿块及 Popover */}
                {quickDraft && !quickDraft.isAllDay && !quickDraft.isAlldayHeader && quickDraft.date === d.ds && (
                  <div
                    className="notion-draft-block"
                    style={{
                      top: (quickDraft.startMin / 60) * hourHeight,
                      height: Math.max(30, ((quickDraft.endMin - quickDraft.startMin) / 60) * hourHeight),
                      backgroundColor: (CATS[quickDraft.category] || CATS["生活"]).tint,
                      borderLeftColor: (CATS[quickDraft.category] || CATS["生活"]).solid,
                      borderColor: (CATS[quickDraft.category] || CATS["生活"]).solid ? (CATS[quickDraft.category] || CATS["生活"]).solid + "40" : undefined,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="notion-draft-block-title">
                      {quickDraft.text || "新建日程..."}
                    </div>
                    <div className="notion-draft-block-time">
                      {quickDraft.startTimeStr} - {quickDraft.endTimeStr}
                    </div>

                    <QuickCreatePopover
                      draft={quickDraft}
                      daysCount={days.length}
                      baseList={baseList}
                      onClose={() => setQuickDraft(null)}
                      onSubmit={(title, cat, popoverAllDay) => {
                        const actualAllDay = popoverAllDay !== undefined ? popoverAllDay : quickDraft.isAllDay;
                        const sTime = quickDraft.startTimeStr || "09:00";
                        const eTime = quickDraft.endTimeStr || "18:00";
                        const diffMin = (quickDraft.endMin || 1080) - (quickDraft.startMin || 540);
                        const targetDay = quickDraft.date;
                        const endDay = quickDraft.endDate || targetDay;
                        if (onCreateEvent) {
                          onCreateEvent({
                            _uid: "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
                            text: title,
                            date: targetDay,
                            endDate: endDay,
                            startTime: actualAllDay ? `${targetDay} 00:00:00` : `${targetDay} ${sTime}:00`,
                            endTime: actualAllDay ? `${endDay} 23:59:59` : `${endDay} ${eTime}:00`,
                            startTimeStr: sTime,
                            endTimeStr: eTime,
                            durationStr: actualAllDay ? "全天" : formatDurationFromMinutes(diffMin),
                            category: cat,
                            type: "自己安排",
                            status: "完成",
                            isAllDay: actualAllDay,
                            trackTime: !actualAllDay,
                            isNew: true,
                          });
                        }
                        setQuickDraft(null);
                      }}
                      onOpenMore={(data) => {
                        onOpenCreateModal && onOpenCreateModal({
                          ...data,
                          isAllDay: data && data.isAllDay !== undefined ? data.isAllDay : quickDraft.isAllDay,
                        });
                        setQuickDraft(null);
                      }}
                    />
                  </div>
                )}

                {layoutList.map((item, idx) => {
                  const ev = item.ev;
                  const col = item.col || 0;
                  const maxCols = item.maxCols || 1;
                  const cat = CATS[ev.category] || CATS["生活"];
                  const evId = getEventUid(ev);
                  const isSelected = (selectedEvent && (
                    (selectedEvent.record_id && selectedEvent.record_id === ev.record_id) ||
                    (selectedEvent._uid && selectedEvent._uid === ev._uid) ||
                    (selectedEvent.text === ev.text && selectedEvent.date === ev.date && selectedEvent.startTime === ev.startTime)
                  )) || (selectedEventIds && selectedEventIds.includes(evId));

                  const isFocusing = Boolean(
                    pomodoro &&
                    pomodoro.isRunning &&
                    (
                      (pomodoro.targetEvent && getEventUid(pomodoro.targetEvent) === evId) ||
                      (pomodoro.targetEventId && pomodoro.targetEventId === evId) ||
                      (pomodoro.targetText && (pomodoro.targetText === ev.text || pomodoro.targetText === ev.title))
                    )
                  );

                  const isThisDragging = dragInfo && dragInfo.eventId === evId;
                  const isClone = dragInfo && dragInfo.isClone;
                  const isDragColliding = Boolean(isThisDragging && dragInfo && dragInfo.hasCollision);

                  // 如果该事件正在被普通拖拽，且原日期是当前列但目标日期不是当前列 -> 渲染为浅色虚线原位底框
                  // （注意：若为 Option 克隆复制，原事件在原位完整保留，不变成虚线底框）
                  if (isThisDragging && !isClone && dragInfo.type === "move" && dragInfo.origDayDs === d.ds && dragInfo.targetDayDs !== d.ds) {
                    return (
                      <div
                        key={`orig_ghost_${idx}`}
                        className="notion-time-block"
                        style={{
                          top: (dragInfo.origStartMin / 60) * hourHeight,
                          height: Math.max(26, ((ev.diffMinutes || 60) / 60) * hourHeight),
                          backgroundColor: cat.tint,
                          borderLeftColor: cat.solid,
                          opacity: 0.35,
                          borderStyle: "dashed",
                          pointerEvents: "none",
                        }}
                      >
                        <span className="notion-tb-title" style={{ opacity: 0.6 }}>{ev.text}</span>
                      </div>
                    );
                  }

                  let startMin = ev.startMinutes !== undefined ? ev.startMinutes : 540;
                  let diffMin = ev.diffMinutes !== undefined ? ev.diffMinutes : 60;
                  // 跨天日程在首日严格截断在当日 24:00 (1440m)，防止高度越界膨胀
                  if (ev.isCrossDay && ev._crossDayPart !== "next") {
                    diffMin = Math.max(15, 1440 - startMin);
                  }
                  let tooltipText = "";

                  if (isThisDragging) {
                    if (dragInfo.type === "move") {
                      startMin = Math.max(0, Math.min(1440 - diffMin, dragInfo.origStartMin + dragInfo.deltaMin));
                      const datePrefix = dragInfo.targetDayDs !== dragInfo.origDayDs ? `${dragInfo.targetDayDs.slice(5)} ` : "";
                      const cloneTag = dragInfo.isClone ? "【⌥ 复制副本】" : (dragInfo.withCmd ? "【⌘ 精确微调】" : "");
                      const snapTag = dragInfo.magnetSnap ? `🧲 ${dragInfo.magnetSnap} · ` : "";
                      tooltipText = `${snapTag}${cloneTag}${datePrefix}${formatTimeFromMinutes(startMin)} → ${formatTimeFromMinutes(startMin + diffMin)} (${formatDurationFromMinutes(diffMin)})`;
                    } else if (dragInfo.type === "resize-top") {
                      const step = 1;
                      startMin = Math.max(0, Math.min(dragInfo.origEndMin - step, dragInfo.origStartMin + dragInfo.deltaMin));
                      diffMin = dragInfo.origEndMin - startMin;
                      const snapTag = dragInfo.magnetSnap ? `🧲 ${dragInfo.magnetSnap} · ` : "";
                      tooltipText = `${snapTag}起: ${formatTimeFromMinutes(startMin)} (时长 ${formatDurationFromMinutes(diffMin)})`;
                    } else if (dragInfo.type === "resize-bottom") {
                      const step = 1;
                      const endMin = Math.min(1440, Math.max(dragInfo.origStartMin + step, dragInfo.origEndMin + dragInfo.deltaMin));
                      diffMin = endMin - dragInfo.origStartMin;
                      const snapTag = dragInfo.magnetSnap ? `🧲 ${dragInfo.magnetSnap} · ` : "";
                      tooltipText = `${snapTag}止: ${formatTimeFromMinutes(endMin)} (时长 ${formatDurationFromMinutes(diffMin)})`;
                    }
                  }

                  const top = (startMin / 60) * hourHeight;
                  const bHeight = Math.max(24, (diffMin / 60) * hourHeight);
                  const tierCls = bHeight < 32 ? " tier-tiny" : (bHeight < 46 ? " tier-medium" : " tier-tall");

                  const isCascaded = item.isCascaded || item.col > 0;
                  const leftVal = item.leftPercent !== undefined && maxCols > 1
                    ? `calc(${item.leftPercent}% + 2px)`
                    : "2px";
                  const widthVal = item.widthPercent !== undefined && maxCols > 1
                    ? `calc(${item.widthPercent}% - 6px)`
                    : "calc(100% - 6px)";

                  // 严格分轨层级隔离系统 (Track Isolation Architecture)
                  const colBaseZ = 10 + (col * 20);
                  const durationDelta = Math.max(1, Math.min(5, Math.round((720 - Math.min(720, diffMin)) / 144)));
                  const blockZ = isThisDragging ? 999 : (colBaseZ + durationDelta + (isSelected ? 4 : 0));

                  const isDimmed = !isEventMatchCategory(ev.category, categoryFilter);

                  const blockElement = (
                    <div
                      key={evId || idx}
                      tabIndex={0}
                      className={
                        "notion-time-block" +
                        tierCls +
                        (isCascaded ? " is-cascaded" : "") +
                        (isSelected ? " selected" : "") +
                        (isFocusing ? " is-focusing-block" : "") +
                        (isDimmed ? " is-category-dimmed" : "") +
                        (isThisDragging ? " is-dragging" : "")
                      }
                      style={{
                        top: top,
                        height: bHeight,
                        backgroundColor: cat.tint,
                        borderLeftColor: cat.solid,
                        left: leftVal,
                        width: widthVal,
                        right: "auto",
                        zIndex: isFocusing ? 15 : blockZ,
                        boxShadow: isThisDragging
                          ? (isClone ? "0 8px 24px rgba(0,122,255,0.3)" : "0 8px 24px rgba(0,0,0,0.18)")
                          : (isFocusing
                              ? "0 0 0 2px #eb5757, 0 4px 18px rgba(235, 87, 87, 0.35)"
                              : (isSelected
                                  ? "0 0 0 2px #ffffff, 0 0 0 3.5px #007aff, 0 6px 16px rgba(0,0,0,0.14)"
                                  : (isCascaded
                                      ? "0 0 0 2px #ffffff, 0 2px 8px rgba(0,0,0,0.08)"
                                      : "0 1px 3px rgba(0,0,0,0.06)"))),
                        cursor: isThisDragging ? (isClone ? "copy" : "grabbing") : "grab",
                        outline: isThisDragging && isClone ? "2px dashed #007aff" : undefined,
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.focus();
                        startMoveBlock(e, ev, d.ds);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent && onSelectEvent(ev, d.ds, false, true);
                      }}
                      onContextMenu={(e) => onContextMenu && onContextMenu(e, ev, d.ds)}
                      onKeyDown={(e) => {
                        if (e.key === "Delete" || e.key === "Backspace" || e.keyCode === 8 || e.keyCode === 46) {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteEvent && onDeleteEvent(ev);
                        }
                      }}
                      title={
                        (ev.timeRangeStr ? ev.timeRangeStr + " " : "") +
                        ev.text +
                        " (按住 Shift 拖拽在此处划选新建重叠日程；按住 Option 拖拽复制；双击快捷新建)"
                      }
                    >
                      {/* 顶部拉伸调整开始时间手柄 */}
                      <div
                        className="notion-tb-resizer-top"
                        onMouseDown={(e) => startResize(e, ev, d.ds, "top")}
                        title="拖拽调整开始时间"
                      />

                      {/* 专注进行中倒计时胶囊 / 悬停快速启动按钮 */}
                      {isFocusing ? (
                        <div className="notion-tb-focus-capsule" title="当前日程正在专注中...">
                          <span className="notion-tb-focus-dot" />
                          <span className="notion-tb-focus-time">
                            {formatPomodoroTime(pomodoro.remainingSeconds)}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="notion-tb-focus-trigger"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartFocus && onStartFocus(ev);
                          }}
                          title="以此日程开启专注番茄钟 (25m)"
                        >
                          <i className="ph-bold ph-timer" />
                        </button>
                      )}

                      {/* 拖拽吸附时间跟随气泡 */}
                      {isThisDragging && tooltipText && (
                        <div className={"notion-drag-tooltip" + ((isDragColliding || (dragInfo && dragInfo.hasCollision)) ? " is-collision" : (dragInfo && dragInfo.magnetSnap ? " is-magnet" : ""))}>
                          {tooltipText}
                        </div>
                      )}

                      {/* 按住 Option 拖拽克隆时的醒目徽标 */}
                      {isThisDragging && isClone && (
                        <div className="notion-clone-chip">+ 复制副本</div>
                      )}

                      {/* 苹果日历自适应字体排版：超薄微型(10px单行) vs 中等内联(11px) vs 舒适双行(12px) */}
                      {bHeight < 32 ? (
                        <div className="notion-tb-row is-tiny" style={{ pointerEvents: "none" }}>
                          <span className="notion-tb-time-pill" style={{ color: cat.solid }}>
                            {formatTimeFromMinutes(startMin)}
                          </span>
                          <span className="notion-tb-title-inline">
                            {isThisDragging && isClone ? `+ ${ev.text}` : (ev._crossDayPart === "next" ? `🌙 ${ev.text} (延续)` : (ev.isCrossDay ? `${ev.text} (至次日)` : ev.text))}
                          </span>
                        </div>
                      ) : bHeight < 46 ? (
                        <div className="notion-tb-row is-medium" style={{ pointerEvents: "none" }}>
                          <span className="notion-tb-time" style={{ color: cat.solid }}>
                            {formatTimeFromMinutes(startMin)}
                          </span>
                          <span className="notion-tb-title-inline">
                            {isThisDragging && isClone ? `+ ${ev.text}` : (ev._crossDayPart === "next" ? `🌙 ${ev.text} (延续)` : (ev.isCrossDay ? `${ev.text} (至次日)` : ev.text))}
                          </span>
                        </div>
                      ) : (
                        <div className="notion-tb-col is-tall" style={{ pointerEvents: "none", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <div className="notion-tb-time" style={{ color: cat.solid }}>
                              {ev._crossDayPart === "next" ? `00:00 → ${ev.endTimeStr || ""}` : (ev.isCrossDay ? `${formatTimeFromMinutes(startMin)} → 24:00 (跨天)` : formatTimeFromMinutes(startMin))}
                            </div>
                            <div className="notion-tb-title">
                              {isThisDragging && isClone ? `+ ${ev.text}` : (ev._crossDayPart === "next" ? `🌙 ${ev.text} (延续)` : (ev.isCrossDay ? `${ev.text} (至次日)` : ev.text))}
                            </div>
                          </div>
                          {ev.isCrossDay && ev._crossDayPart !== "next" && bHeight > 55 && (
                            <div className="notion-cross-day-tag">
                              🌙 延续至次日 {ev.endTimeStr || ""}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 底部拉伸调整结束时间手柄 */}
                      <div
                        className="notion-tb-resizer-bottom"
                        onMouseDown={(e) => startResize(e, ev, d.ds, "bottom")}
                        title="拖拽调整结束时间"
                      />
                    </div>
                  );

                  const showCloneAnchor = isThisDragging && isClone && dragInfo && dragInfo.origDayDs === d.ds;
                  if (showCloneAnchor) {
                    return (
                      <React.Fragment key={`clone_group_${idx}`}>
                        <div
                          key={`orig_anchor_${idx}`}
                          className="notion-time-block"
                          style={{
                            top: (dragInfo.origStartMin / 60) * hourHeight,
                            height: Math.max(26, ((ev.diffMinutes || 60) / 60) * hourHeight),
                            backgroundColor: cat.tint,
                            borderLeftColor: cat.solid,
                            opacity: 0.9,
                            pointerEvents: "none",
                          }}
                        >
                          <span className="notion-tb-title">{ev.text}</span>
                        </div>
                        {blockElement}
                      </React.Fragment>
                    );
                  }

                  return blockElement;
                })}

                {/* 任务拖入排程虚线预览与时间指示 */}
                {taskDropTarget && taskDropTarget.ds === d.ds && !taskDropTarget.isAllDay && (
                  <div
                    className="timeline-hour-slot is-task-drop-active"
                    style={{
                      position: "absolute",
                      top: (taskDropTarget.snapMin / 60) * hourHeight,
                      height: Math.max(30, (60 / 60) * hourHeight),
                      left: "3px",
                      right: "3px",
                      zIndex: 80,
                      borderRadius: "6px",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 网格空白区悬停灵动微提示 (Apple HIG 磨砂微浮层，当打开轻量悬浮创建窗时自动静音隐藏) */}
      {hoverHint && !dragInfo && !createGhost && !alldayDrag && !quickDraft && (
        <div
          className="notion-grid-hover-hint"
          style={{
            left: `${hoverHint.x}px`,
            top: `${hoverHint.y}px`,
          }}
        >
          <span className="hint-date">{hoverHint.ds} {hoverHint.timeStr}</span>
          <span className="hint-divider">·</span>
          <span className="hint-action">双击新建</span>
          <span className="hint-divider">·</span>
          <span className="hint-action">拖拽划时</span>
        </div>
      )}
    </div>
  );
}


/* ============================================================
   月视图单日全量日程悬浮卡片 (MonthDayMorePopover)
   ============================================================ */
function MonthDayMorePopover({
  popover,
  onClose,
  onSelectEvent,
  onContextMenu,
  onJumpDay,
  onOpenCreateModal,
  categoryFilter,
}) {
  if (!popover) return null;
  const { ds, events = [], anchorRect } = popover;

  // ESC 键平滑退出
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const style = useMemo(() => {
    if (!anchorRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const popoverW = 320;
    const popoverH = Math.min(420, 110 + events.length * 36);

    let left = anchorRect.left;
    if (left + popoverW > (window.innerWidth || 1200) - 16) {
      left = Math.max(12, anchorRect.right - popoverW);
    }
    let top = anchorRect.bottom + 6;
    if (top + popoverH > (window.innerHeight || 800) - 20) {
      top = Math.max(12, anchorRect.top - popoverH - 6);
    }
    return {
      position: "fixed",
      left: `${left}px`,
      top: `${top}px`,
      width: `${popoverW}px`,
      maxHeight: `${popoverH}px`,
      zIndex: 100002,
    };
  }, [anchorRect, events.length]);

  // 日期解析：如 2026-09-11 -> 9月11日 周五
  const dateTitle = useMemo(() => {
    if (!ds) return "";
    const p = ds.split("-").map(Number);
    if (p.length < 3) return ds;
    const wd = weekdayOf(p[0], p[1] - 1, p[2]);
    return `${p[1]}月${p[2]}日 ${wd}`;
  }, [ds]);

  const isToday = ds === TODAY;

  const content = (
    <React.Fragment>
      <div
        className="notion-popover-backdrop"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div className="notion-day-more-popover" style={style} onClick={(e) => e.stopPropagation()}>
        {/* 顶部标题栏 */}
        <div className="notion-dmp-header">
          <div className="notion-dmp-title-wrap">
            <span className={"notion-dmp-date" + (isToday ? " is-today" : "")}>
              {dateTitle}
            </span>
            <span className="notion-dmp-count">共 {events.length} 项日程</span>
          </div>

          <div className="notion-dmp-actions">
            <button
              type="button"
              className="notion-dmp-btn-action"
              onClick={() => {
                onJumpDay && onJumpDay(ds);
                onClose();
              }}
              title="切换到日视图时间轴 (按 1)"
            >
              <i className="ph-bold ph-calendar-blank" style={{ marginRight: "3px" }} />
              <span>日视图</span>
            </button>
            <button
              type="button"
              className="notion-dmp-close-btn"
              onClick={onClose}
              title="关闭 (Esc)"
            >
              <i className="ph-bold ph-x" />
            </button>
          </div>
        </div>

        {/* 日程列表主体 (全量可点击查看详情/右键操作) */}
        <div className="notion-dmp-body">
          {events.map((rec, idx) => {
            const isSummary = rec.type === "一天总结";
            const cat = rec.category && CATS[rec.category] ? CATS[rec.category] : CATS["生活"];
            const timePrefix = rec.isAllDay || !rec.startTimeStr || isSummary ? "" : rec.startTimeStr + " ";

            const isDimmed = !isEventMatchCategory(rec.category, categoryFilter);

            return (
              <div
                key={rec.record_id || `${ds}_${idx}`}
                className={"notion-dmp-item" + (isSummary ? " is-summary" : "") + (isDimmed ? " is-category-dimmed" : "")}
                style={{
                  borderLeftColor: cat.solid,
                  backgroundColor: cat.tint,
                  color: cat.text || "#1c1c1e",
                }}
                onClick={(e) => {
                  onSelectEvent && onSelectEvent(rec, ds, e, true);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onContextMenu && onContextMenu(rec, ds, e);
                }}
                title={`点击查看抽屉详情 · 右键操作菜单\n${rec.text} (${rec.startTimeStr || '全天'}${rec.endTimeStr ? ' ~ ' + rec.endTimeStr : ''})`}
              >
                <div className="notion-dmp-item-left">
                  {isSummary ? (
                    <span className="notion-pill-tag" style={{ background: cat.solid, color: "#ffffff", padding: "1px 4px", borderRadius: "3px", fontSize: "10px", fontWeight: "600", marginRight: "4px" }}>
                      总结
                    </span>
                  ) : (
                    <span
                      className="notion-pill-dot"
                      style={{
                        color: cat.solid,
                        fontSize: "12px",
                        marginRight: "4px",
                        fontWeight: rec.status === "完成" ? "700" : "normal",
                      }}
                    >
                      {rec.status === "完成" ? "✓" : "◌"}
                    </span>
                  )}
                  {timePrefix ? (
                    <span className="notion-dmp-time">{timePrefix}</span>
                  ) : rec.isAllDay ? (
                    <span className="notion-dmp-allday-badge">全天</span>
                  ) : null}
                  <span className="notion-dmp-text">{rec.text || "（无标题）"}</span>
                </div>

                {rec.category ? (
                  <span className="notion-dmp-cat-badge" style={{ color: cat.solid }}>
                    {rec.category}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 底部便捷新建入口 */}
        <div className="notion-dmp-footer">
          <button
            type="button"
            className="notion-dmp-add-btn"
            onClick={() => {
              onOpenCreateModal && onOpenCreateModal({ date: ds, isAllDay: false });
              onClose();
            }}
          >
            <i className="ph-bold ph-plus" style={{ marginRight: "4px" }} />
            <span>新建日程</span>
          </button>
        </div>
      </div>
    </React.Fragment>
  );

  return typeof ReactDOM !== "undefined" && ReactDOM.createPortal ? ReactDOM.createPortal(content, document.body) : content;
}

/* Notion 月历视图组件 (支持触控板双指横向滑动切月与单日更多全景弹窗) */
function NotionMonthView({
  year,
  monthIndex,
  byDate,
  selectedDate,
  onSelectDay,
  onSelectEvent,
  onDeleteEvent,
  onUpdateEvent,
  onContextMenu,
  onPrevMonth,
  onNextMonth,
  onJumpDay,
  onOpenCreateModal,
  categoryFilter,
}) {
  const weeks = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);
  const weekdaysHeader = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  // 单日全量日程细节 Popover 状态
  const [morePopover, setMorePopover] = useState(null);

  // 触控板双指左右滑动手势状态与物理回弹
  const containerRef = useRef(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const accumXRef = useRef(0);
  const cooldownRef = useRef(false);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // 若处于翻页冷却锁中，仅阻止横向冒泡，不重复触发
      if (cooldownRef.current) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault();
        }
        return;
      }

      // 判定是否为明确的左右横向滑动手势
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2.5;
      if (!isHorizontal) return;

      e.preventDefault();

      // 物理阻尼微位移：手势拉得越远，非线性弹性阻力越大（消除滑脱过冲感）
      accumXRef.current += e.deltaX * 0.45;
      const raw = -accumXRef.current * 0.32;
      const sign = Math.sign(raw);
      const mag = Math.abs(raw);
      const damped = sign * Math.min(85, Math.pow(mag, 0.85) * 1.8);
      setSwipeOffset(damped);

      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

      // 翻页阈值：累计位移达 90px 触发切月（防误滑，增强分量感）
      if (Math.abs(accumXRef.current) >= 90) {
        cooldownRef.current = true;
        setIsAnimating(true);

        // 嘎嘣脆音效：饼干掰断般清脆解压的物理卡扣断裂声
        if (window.SFX) window.SFX.play("snap");

        const isNext = accumXRef.current > 0;
        // 机械吸附位移：先滑到位，再产生极其轻微的卡片落槽微顿挫
        setSwipeOffset(isNext ? -85 : 85);
        if (isNext) {
          onNextMonth && onNextMonth();
        } else {
          onPrevMonth && onPrevMonth();
        }
        accumXRef.current = 0;

        setTimeout(() => {
          setSwipeOffset(isNext ? 16 : -16);
          setTimeout(() => {
            setSwipeOffset(0);
            setTimeout(() => {
              setIsAnimating(false);
              cooldownRef.current = false;
            }, 320);
          }, 60);
        }, 80);
        return;
      }

      // 未达阈值时，用户松手 120ms 后弹性平滑复位
      resetTimerRef.current = setTimeout(() => {
        setIsAnimating(true);
        setSwipeOffset(0);
        accumXRef.current = 0;
        setTimeout(() => {
          setIsAnimating(false);
        }, 220);
      }, 120);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [onPrevMonth, onNextMonth]);

  // 月视图跨天/跨周拖拽状态 (rAF 节流性能优化)
  const [monthDrag, setMonthDrag] = useState(null);
  const monthDragRafIdRef = useRef(null);

  useEffect(() => {
    if (!monthDrag) return;

    const onMouseMove = (e) => {
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (monthDragRafIdRef.current) return;

      monthDragRafIdRef.current = requestAnimationFrame(() => {
        monthDragRafIdRef.current = null;
        const el = document.elementFromPoint(clientX, clientY);
        const cell = el && el.closest ? el.closest(".notion-day-cell") : null;
        const targetDs = cell && cell.dataset ? cell.dataset.ds : null;
        setMonthDrag((prev) => (prev ? { ...prev, targetDs: targetDs || prev.targetDs, mousePos: { x: clientX, y: clientY } } : null));
      });
    };

    const onMouseUp = () => {
      if (monthDragRafIdRef.current) {
        cancelAnimationFrame(monthDragRafIdRef.current);
        monthDragRafIdRef.current = null;
      }
      if (monthDrag && monthDrag.targetDs && monthDrag.targetDs !== monthDrag.origDs) {
        onUpdateEvent && onUpdateEvent({ ...monthDrag.event, date: monthDrag.targetDs });
      }
      setMonthDrag(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      if (monthDragRafIdRef.current) {
        cancelAnimationFrame(monthDragRafIdRef.current);
        monthDragRafIdRef.current = null;
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [monthDrag, onUpdateEvent]);

  // 月视图空白格划选多天跨天创建 (rAF 节流性能优化)
  const [monthCreateDrag, setMonthCreateDrag] = useState(null);
  const monthCreateDragRef = useRef(null);
  const monthCreateRafIdRef = useRef(null);

  useEffect(() => {
    if (!monthCreateDrag) return;

    const onMouseMove = (e) => {
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (monthCreateRafIdRef.current) return;

      monthCreateRafIdRef.current = requestAnimationFrame(() => {
        monthCreateRafIdRef.current = null;
        const drag = monthCreateDragRef.current;
        if (!drag) return;
        const dist = Math.hypot(clientX - drag.startX, clientY - drag.startY);
        if (dist > 8) {
          drag.hasDragged = true;
        }
        const el = document.elementFromPoint(clientX, clientY);
        const cell = el && el.closest ? el.closest(".notion-day-cell") : null;
        const targetDs = cell && cell.dataset ? cell.dataset.ds : null;
        if (targetDs && targetDs !== drag.endDs) {
          drag.endDs = targetDs;
        }
        setMonthCreateDrag({ ...drag });
      });
    };

    const onMouseUp = () => {
      if (monthCreateRafIdRef.current) {
        cancelAnimationFrame(monthCreateRafIdRef.current);
        monthCreateRafIdRef.current = null;
      }
      const drag = monthCreateDragRef.current;
      monthCreateDragRef.current = null;
      setMonthCreateDrag(null);
      if (drag && drag.hasDragged && drag.startDs && drag.endDs) {
        const minDs = drag.startDs < drag.endDs ? drag.startDs : drag.endDs;
        const maxDs = drag.startDs < drag.endDs ? drag.endDs : drag.startDs;
        onOpenCreateModal && onOpenCreateModal({
          date: minDs,
          endDate: maxDs,
          isAllDay: true,
        });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      if (monthCreateRafIdRef.current) {
        cancelAnimationFrame(monthCreateRafIdRef.current);
        monthCreateRafIdRef.current = null;
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [monthCreateDrag, onOpenCreateModal]);

  const startMonthCreateDrag = (e, ds) => {
    if (e.button !== 0) return;
    const initial = {
      startDs: ds,
      endDs: ds,
      startX: e.clientX,
      startY: e.clientY,
      hasDragged: false,
    };
    monthCreateDragRef.current = initial;
    setMonthCreateDrag(initial);
  };

  const startMonthDrag = (e, rec, ds) => {
    if (e.button !== 0) return;
    setMonthDrag({
      event: rec,
      origDs: ds,
      targetDs: ds,
      mousePos: { x: e.clientX, y: e.clientY },
    });
  };

  return (
    <div
      ref={containerRef}
      className="notion-month-container"
      style={{
        transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
        transition: isAnimating ? "transform 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.25)" : undefined,
        willChange: swipeOffset !== 0 ? "transform" : undefined,
      }}
    >
      {/* 星期表头（带左侧周序号占位列） */}
      <div className="notion-month-header">
        <div className="notion-wh-col week-lbl" title="ISO 周序号">周</div>
        {weekdaysHeader.map((wd) => (
          <div key={wd} className="notion-wh-col">
            {wd}
          </div>
        ))}
      </div>

      {/* 月历网格主体 */}
      <div className="notion-month-body">
        {weeks.map((week, widx) => (
          <div key={widx} className="notion-week-row">
            {/* 左侧周序号，如 38 */}
            <div className="notion-week-num-cell" title={"第 " + week.weekNum + " 周"}>
              {week.weekNum}
            </div>

            {/* 一周 7 天 */}
            {week.days.map((day) => {
              const rawList = (byDate.eventsByDate && byDate.eventsByDate[day.ds]) || (byDate.map && byDate.map[day.ds] ? [byDate.map[day.ds]] : []);
              // 优先将「一天总结」置顶展示，强化月看板的视觉层级
              const evList = [...rawList].sort((a, b) => {
                if (a.type === "一天总结" && b.type !== "一天总结") return -1;
                if (a.type !== "一天总结" && b.type === "一天总结") return 1;
                return 0;
              });

              const isSelected = selectedDate === day.ds;
              const isDragTarget = monthDrag && monthDrag.targetDs === day.ds;
              const isDragOrigin = monthDrag && monthDrag.origDs === day.ds;

              const isRangeCreate = Boolean(
                monthCreateDrag && monthCreateDrag.hasDragged &&
                day.ds >= (monthCreateDrag.startDs < monthCreateDrag.endDs ? monthCreateDrag.startDs : monthCreateDrag.endDs) &&
                day.ds <= (monthCreateDrag.startDs < monthCreateDrag.endDs ? monthCreateDrag.endDs : monthCreateDrag.startDs)
              );

              return (
                <div
                  key={day.ds}
                  data-ds={day.ds}
                  className={
                    "notion-day-cell" +
                    (!day.isCurrentMonth ? " dimmed" : "") +
                    (isSelected ? " selected" : "") +
                    (isDragTarget && !isDragOrigin ? " is-drag-hover" : "") +
                    (isRangeCreate ? " is-range-create" : "")
                  }
                  onMouseDown={(e) => {
                    if (e.target.closest(".notion-event-pill") || e.target.closest(".notion-month-more-btn") || e.target.closest(".notion-day-more-popover")) return;
                    startMonthCreateDrag(e, day.ds);
                  }}
                  onClick={(e) => {
                    if (!monthCreateDrag || !monthCreateDrag.hasDragged) {
                      onSelectDay(day.ds, e);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onOpenCreateModal && onOpenCreateModal({ date: day.ds, isAllDay: true });
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onContextMenu && onContextMenu(e, null, day.ds);
                  }}
                  title={`${day.ds}${day.lunarFull ? " · " + day.lunarFull : ""}${day.holidayBadge ? ` [${day.holidayBadge.name}${day.holidayBadge.type === "rest" ? "休" : "班"}]` : ""}`}
                >
                  <div className="notion-day-top">
                    <div className="notion-day-num-wrap">
                      {day.isToday ? (
                        <span className="notion-today-badge">{day.dayNum}</span>
                      ) : (
                        <span className="notion-day-num">{day.dayNum}</span>
                      )}
                      <span className={"notion-lunar-txt" + (day.fest ? " is-fest" : "")} title={day.fest || day.lunarText}>
                        {day.fest || day.lunarText}
                      </span>
                    </div>

                    {day.holidayBadge ? (
                      <span className={"notion-holiday-badge badge-" + day.holidayBadge.type} title={day.holidayBadge.name + (day.holidayBadge.type === "rest" ? "放假" : "补班")}>
                        {day.holidayBadge.type === "rest" ? "休" : "班"}
                      </span>
                    ) : null}
                  </div>

                  {/* 日程彩条药丸 (Notion Event Pills) - 全量渲染 + 滚轮滑动 */}
                  <div className="notion-cell-pills">
                    {evList.map((rec, idx) => {
                      const isSummary = rec.type === "一天总结";
                      const cat = rec.category && CATS[rec.category] ? CATS[rec.category] : CATS["生活"];
                      const timePrefix = rec.isAllDay || !rec.startTimeStr || isSummary ? "" : rec.startTimeStr + " ";
                      const isBeingDragged = monthDrag && monthDrag.event && (monthDrag.event.record_id ? monthDrag.event.record_id === rec.record_id : monthDrag.event.text === rec.text);

                      const isDimmed = !isEventMatchCategory(rec.category, categoryFilter);

                      return (
                        <div
                          key={idx}
                          tabIndex={0}
                          className={"notion-event-pill" + (isSummary ? " is-summary" : "") + (isDimmed ? " is-category-dimmed" : "")}
                          style={{
                            borderLeftColor: cat.solid,
                            backgroundColor: cat.tint,
                            color: cat.text || "#1c1c1e",
                            opacity: isBeingDragged ? 0.35 : 1,
                          }}
                          onMouseDown={(e) => startMonthDrag(e, rec, day.ds)}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.currentTarget.focus();
                            onSelectEvent(rec, day.ds, e, true);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(rec, day.ds, false, true);
                          }}
                          onContextMenu={(e) => onContextMenu && onContextMenu(e, rec, day.ds)}
                          onKeyDown={(e) => {
                            if (e.key === "Delete" || e.key === "Backspace" || e.keyCode === 8 || e.keyCode === 46) {
                              e.preventDefault();
                              e.stopPropagation();
                              onDeleteEvent && onDeleteEvent(rec);
                            }
                          }}
                          title={
                            "[" + (rec.type || rec.category || "日程") + "] " +
                            timePrefix + rec.text +
                            (rec.note ? "\n备注: " + rec.note : "") + " (按住可拖拽改期，按 Delete 键删除)"
                          }
                        >
                          {isSummary ? (
                            <span className="notion-summary-badge" style={{ background: cat.solid }}>总结</span>
                          ) : (
                            <span
                              className="notion-pill-dot"
                              style={{ color: cat.solid }}
                            >
                              {rec.status === "完成" ? "✓" : "◌"}
                            </span>
                          )}
                          <span className="notion-pill-text">{timePrefix + rec.text}</span>
                        </div>
                      );
                    })}

                    {/* 跨天/跨周拖拽改期实时占位框 (参考 Notion Calendar) */}
                    {isDragTarget && monthDrag && monthDrag.origDs !== day.ds && (
                      <div className="notion-month-drag-placeholder">
                        <span className="notion-pill-dot">◌</span>
                        <span className="notion-pill-text">{monthDrag.event.text}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 鼠标跟随浮动半透明副本 */}
      {monthDrag && monthDrag.mousePos && (
        <div
          style={{
            position: "fixed",
            left: monthDrag.mousePos.x + 8,
            top: monthDrag.mousePos.y + 8,
            pointerEvents: "none",
            zIndex: 99999,
          }}
        >
          <div className="notion-event-pill is-float">
            <span>{monthDrag.event.text}</span>
          </div>
        </div>
      )}

      {/* 单日全量日程悬浮查看弹窗 */}
      {morePopover && (
        <MonthDayMorePopover
          popover={morePopover}
          onClose={() => setMorePopover(null)}
          onSelectEvent={onSelectEvent}
          onContextMenu={onContextMenu}
          onJumpDay={onJumpDay}
          onOpenCreateModal={onOpenCreateModal}
          categoryFilter={categoryFilter}
        />
      )}
    </div>
  );
}

/* ============================================================
   1:1 纯白 Notion 风格微型弹窗体系（日期、时间时长、飞书属性）
   ============================================================ */

/* 1. 纯白微型日历弹出层 (Notion Mini Calendar) */
function NotionMiniCalendarPopover({ date, anchorRect, onSelectDate, onClose }) {
  const parsed = useMemo(() => {
    if (!date) return { y: 2026, m: 8 };
    const p = date.split("-").map(Number);
    return { y: p[0], m: p[1] - 1 };
  }, [date]);

  const [yearMonth, setYearMonth] = useState(parsed);

  const prevMonth = (e) => {
    e.stopPropagation();
    setYearMonth((cur) => {
      let nm = cur.m - 1;
      let ny = cur.y;
      if (nm < 0) { nm = 11; ny -= 1; }
      return { y: ny, m: nm };
    });
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    setYearMonth((cur) => {
      let nm = cur.m + 1;
      let ny = cur.y;
      if (nm > 11) { nm = 0; ny += 1; }
      return { y: ny, m: nm };
    });
  };

  const grid = useMemo(() => {
    const y = yearMonth.y;
    const m = yearMonth.m;
    const firstDay = new Date(y, m, 1);
    let startWd = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    const cells = [];
    for (let i = startWd - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const pm = m === 0 ? 11 : m - 1;
      const py = m === 0 ? y - 1 : y;
      const ds = `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ ds, dayNum: d, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ ds, dayNum: d, inMonth: true });
    }
    let nextD = 1;
    while (cells.length % 7 !== 0 || cells.length < 35) {
      const nm = m === 11 ? 0 : m + 1;
      const ny = m === 11 ? y + 1 : y;
      const ds = `${ny}-${String(nm + 1).padStart(2, "0")}-${String(nextD).padStart(2, "0")}`;
      cells.push({ ds, dayNum: nextD, inMonth: false });
      nextD++;
    }

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      const weekCells = cells.slice(i, i + 7);
      const wDate = new Date(weekCells[0].ds + "T00:00:00");
      const d = new Date(Date.UTC(wDate.getFullYear(), wDate.getMonth(), wDate.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      weeks.push({ weekNo, days: weekCells });
    }
    return weeks;
  }, [yearMonth]);

  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const titleStr = `${yearMonth.y} ${monthNames[yearMonth.m]}`;

  const style = useMemo(() => {
    if (!anchorRect) return { top: 120, right: 390 };
    const w = 260;
    const h = 280;
    let top = Math.min(window.innerHeight - h - 10, Math.max(10, anchorRect.top - 10));
    let left = anchorRect.left - w - 8;
    if (left < 10) left = Math.max(10, anchorRect.left);
    return { top, left };
  }, [anchorRect]);

  const content = (
    <React.Fragment>
      <div className="notion-popover-backdrop" onClick={onClose} />
      <div className="notion-popover notion-mini-cal" style={style}>
        <div className="notion-mc-hd">
          <span className="notion-mc-title">{titleStr}</span>
          <div className="notion-mc-navs">
            <button type="button" className="notion-mc-nav" onClick={prevMonth} title="上一月">
              <i className="ph-bold ph-caret-left" />
            </button>
            <button type="button" className="notion-mc-nav" onClick={nextMonth} title="下一月">
              <i className="ph-bold ph-caret-right" />
            </button>
          </div>
        </div>
        <div className="notion-mc-weekdays">
          <span></span>
          <span>周一</span>
          <span>周二</span>
          <span>周三</span>
          <span>周四</span>
          <span>周五</span>
          <span>周六</span>
          <span>周日</span>
        </div>
        <div className="notion-mc-grid">
          {grid.map((w, wi) => (
            <React.Fragment key={wi}>
              <span className="notion-mc-wnum">{w.weekNo}</span>
              {w.days.map((d, di) => {
                const isToday = d.ds === TODAY;
                const isSel = d.ds === date;
                let cls = "notion-mc-day";
                if (!d.inMonth) cls += " other-month";
                if (isToday) cls += " is-today";
                if (isSel) cls += " is-selected";
                return (
                  <div
                    key={di}
                    className={cls}
                    onClick={() => {
                      onSelectDate(d.ds);
                      onClose();
                    }}
                  >
                    {d.dayNum}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
  return typeof ReactDOM !== "undefined" && ReactDOM.createPortal ? ReactDOM.createPortal(content, document.body) : content;
}

/* 2. 纯白时间选项列表 (带相对时长 15分钟/30分钟/1小时...) */
function NotionTimeMenuPopover({ selectedTime, anchorRect, onSelectTime, onClose, isEnd, startTime }) {
  const options = useMemo(() => {
    const list = [];
    if (isEnd && startTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      const startMin = (sh || 0) * 60 + (sm || 0);
      for (let offset = 15; offset <= 480; offset += 15) {
        const curMin = startMin + offset;
        if (curMin > 1440) break;
        const h = Math.floor(curMin / 60);
        const m = curMin % 60;
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        let durStr = "";
        if (offset < 60) durStr = `${offset}分钟`;
        else {
          const dh = Math.floor(offset / 60);
          const dm = offset % 60;
          durStr = dm ? `${dh} 小时 ${dm} 分钟` : `${dh} 小时`;
        }
        list.push({ timeStr, durStr });
      }
    } else {
      for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
          const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          list.push({ timeStr, durStr: "" });
        }
      }
    }
    return list;
  }, [isEnd, startTime]);

  const style = useMemo(() => {
    if (!anchorRect) return { top: 120, right: 390 };
    const w = 210;
    const h = 280;
    let top = Math.min(window.innerHeight - h - 10, Math.max(10, anchorRect.top - 10));
    let left = anchorRect.left - w - 8;
    if (left < 10) {
      left = anchorRect.right ? anchorRect.right + 8 : Math.max(10, anchorRect.left);
    }
    if (left + w > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - w - 10);
    }
    return { top, left };
  }, [anchorRect]);

  const content = (
    <React.Fragment>
      <div className="notion-popover-backdrop" onClick={onClose} />
      <div className="notion-popover notion-time-menu" style={style}>
        {options.map((opt, idx) => {
          const isActive = opt.timeStr === selectedTime;
          return (
            <div
              key={idx}
              className={"notion-time-item" + (isActive ? " is-active" : "")}
              onClick={() => {
                onSelectTime(opt.timeStr);
                onClose();
              }}
            >
              <span style={{ fontWeight: isActive ? "600" : "500" }}>{opt.timeStr}</span>
              {opt.durStr ? <span className="notion-time-dur">{opt.durStr}</span> : null}
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
  return typeof ReactDOM !== "undefined" && ReactDOM.createPortal ? ReactDOM.createPortal(content, document.body) : content;
}

/* 可直接点击修改输入数字、同时保留左侧固定时段推荐的时间胶囊组件 */
function EditableTimePill({ value, isActive, onActivate, onChangeTime }) {
  const [val, setVal] = useState(value || "09:00");
  const inputRef = useRef(null);

  useEffect(() => {
    setVal(value || "09:00");
  }, [value]);

  const commit = (nextVal) => {
    const trimmed = (nextVal || "").trim();
    let formatted = trimmed;
    // 智能解析与容错：支持纯数字如 "11" -> "11:00", "9" -> "09:00", "1130" -> "11:30"
    if (/^\d{1,2}$/.test(trimmed)) {
      const h = Math.min(23, Math.max(0, parseInt(trimmed, 10)));
      formatted = `${String(h).padStart(2, "0")}:00`;
    } else if (/^\d{3,4}$/.test(trimmed)) {
      const h = Math.min(23, Math.max(0, parseInt(trimmed.slice(0, trimmed.length - 2), 10)));
      const m = Math.min(59, Math.max(0, parseInt(trimmed.slice(-2), 10)));
      formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    } else if (/^\d{1,2}:\d{1,2}$/.test(trimmed)) {
      const [hStr, mStr] = trimmed.split(":");
      const h = Math.min(23, Math.max(0, parseInt(hStr, 10)));
      const m = Math.min(59, Math.max(0, parseInt(mStr, 10)));
      formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    if (/^\d{2}:\d{2}$/.test(formatted)) {
      setVal(formatted);
      onChangeTime && onChangeTime(formatted);
    } else {
      setVal(value || "09:00");
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      className={`notion-time-pill ${isActive ? "is-active" : ""}`}
      value={val}
      title="点击直接修改时间（如输入 11），同时左侧可挑选推荐时段"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onActivate && onActivate(r);
      }}
      onFocus={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onActivate && onActivate(r);
      }}
      onChange={(e) => {
        setVal(e.target.value);
        if (/^\d{2}:\d{2}$/.test(e.target.value)) {
          commit(e.target.value);
        }
      }}
      onBlur={() => {
        commit(val);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit(val);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

/* 3. 纯白属性选择浮层 (Notion Property Popover，带搜索框与药丸标签) */
function NotionPropertyPopover({ fieldName, currentValue, anchorRect, onSelect, onClose, baseList }) {
  const [search, setSearch] = useState("");

  const rawOptions = useMemo(() => {
    if (fieldName === "日程类型") {
      return ["一天总结", "预期安排", "自己安排", "需求表", "飞书任务", "项目", "定时", "会议", "智能体安排"];
    }
    if (fieldName === "板块") {
      return ["工作", "生活", "学习", "运动", "睡眠", "娱乐", "无匹配标签"];
    }
    if (fieldName === "完成状态") {
      return ["完成", "未完成", "继续", "中断", "超时"];
    }
    if (fieldName === "提醒时间") {
      return ["不提醒", "准时", "提前 5 分钟", "提前 15 分钟", "提前 30 分钟", "提前 1 小时", "提前 1 天", "提前 1 周"];
    }
    if (fieldName === "外部来源") {
      return ["手动", "谷歌/飞书/Notion 日历", "飞书任务", "直播会议", "需求表", "AI 转录", "飞书待同步"];
    }
    if (fieldName === "重复规则") {
      return ["不重复", "每天", "工作日", "每周", "每月", "每年"];
    }
    if (fieldName === "关联任务") {
      const set = new Set();
      Object.values(TASK_ID_MAP).forEach((t) => { if (t) set.add(t); });
      if (Array.isArray(baseList)) {
        baseList.forEach((r) => {
          const tName = formatLinkedTaskName(r && r.linkedTask);
          if (tName && tName !== "无关联") set.add(tName);
        });
      }
      const curFormatted = formatLinkedTaskName(currentValue);
      if (curFormatted && curFormatted !== "无关联") {
        set.add(curFormatted);
      }
      return ["无关联", ...Array.from(set)];
    }
    if (fieldName === "关联打卡") {
      const set = new Set();
      Object.values(HABIT_ID_MAP).forEach((h) => { if (h) set.add(h); });
      if (Array.isArray(baseList)) {
        baseList.forEach((r) => {
          const hName = formatLinkedHabitName(r && r.linkedHabit);
          if (hName && hName !== "无关联") set.add(hName);
        });
      }
      const curFormatted = formatLinkedHabitName(currentValue);
      if (curFormatted && curFormatted !== "无关联") {
        set.add(curFormatted);
      }
      return ["无关联", ...Array.from(set)];
    }
    if (fieldName === "关联时间记录") {
      return currentValue ? [currentValue, "无关联"] : ["无关联"];
    }
    return [];
  }, [fieldName]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rawOptions;
    return rawOptions.filter((opt) => opt.toLowerCase().includes(search.trim().toLowerCase()));
  }, [rawOptions, search]);

  const style = useMemo(() => {
    if (!anchorRect) return { top: 150, right: 400 };
    const w = 260;
    const h = 340;
    let top = Math.min(window.innerHeight - h - 10, Math.max(10, anchorRect.top - 8));
    let left = anchorRect.left - w - 8;
    if (left < 10) left = anchorRect.right + 8;
    return { top, left };
  }, [anchorRect]);

  const content = (
    <React.Fragment>
      <div className="notion-popover-backdrop" onClick={onClose} />
      <div className="notion-popover notion-prop-popover" style={style}>
        <input
          autoFocus
          className="notion-prop-search"
          placeholder={fieldName.startsWith("关联") ? "搜索或输入自定义并按回车..." : "搜索选项..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && search.trim()) {
              onSelect(search.trim());
              onClose();
            }
          }}
        />
        <div className="notion-prop-sec-title">选择一项</div>
        <div className="notion-prop-list">
          {search.trim() && !rawOptions.includes(search.trim()) && (
            <div
              className="notion-prop-item"
              style={{ background: "#f0f7ff", color: "#0066cc", borderBottom: "1px dashed #d0e2ff", cursor: "pointer", marginBottom: "4px" }}
              onClick={() => {
                onSelect(search.trim());
                onClose();
              }}
            >
              <span style={{ fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <i className="ph-bold ph-plus" />
                <span>使用 "{search.trim()}"</span>
              </span>
              <span style={{ fontSize: "11px", opacity: 0.7 }}>按 Enter 采用</span>
            </div>
          )}
          {filtered.map((opt) => {
            const isSel = opt === currentValue;
            let tagBg = "#f1f3f4";
            let tagColor = "#37352f";
            if (fieldName === "日程类型" && opt === "一天总结") {
              tagBg = "#eb5757";
              tagColor = "#ffffff";
            } else if (fieldName === "日程类型" && opt === "会议") {
              tagBg = "#9c7fc0";
              tagColor = "#ffffff";
            } else if (fieldName === "板块" && CATS[opt]) {
              tagBg = CATS[opt].tint;
              tagColor = CATS[opt].solid;
            } else if (fieldName === "完成状态" && opt === "完成") {
              tagBg = "#eefaf3";
              tagColor = "#1a7f37";
            } else if (opt === "无关联" || opt === "不重复" || opt === "不提醒") {
              tagBg = "#f5f5f7";
              tagColor = "#86868b";
            } else if (fieldName.startsWith("关联")) {
              tagBg = "#e8f0fe";
              tagColor = "#1967d2";
            }
            return (
              <div
                key={opt}
                className="notion-prop-item"
                onClick={() => {
                  onSelect(opt);
                  onClose();
                }}
              >
                <span className="notion-prop-pill-tag" style={{ background: tagBg, color: tagColor }}>
                  {opt}
                </span>
                {isSel ? <span style={{ color: "#1a73e8", fontWeight: "700" }}>✓</span> : null}
              </div>
            );
          })}
          {filtered.length === 0 && !search.trim() && (
            <div style={{ padding: "10px", fontSize: "12px", color: "#80868b", textAlign: "center" }}>
              无匹配选项
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
  return typeof ReactDOM !== "undefined" && ReactDOM.createPortal ? ReactDOM.createPortal(content, document.body) : content;
}

/* Notion 右侧详情与快捷键抽屉 (1:1 复刻 Notion Calendar 真实界面与弹窗交互) */
function NotionDrawer({
  open,
  onClose,
  selectedEvent,
  selectedDate,
  onOpenCreateModal,
  onUpdateEvent,
  onDeleteEvent,
  onNudgeDuration,
  tab = "detail",
  onTabChange,
  snapStep = 15,
  baseList = [],
  onStartFocus,
}) {
  const currentTab = tab || (selectedEvent ? "detail" : "shortcuts");
  const titleInputRef = useRef(null);

  // 控制纯白微型弹窗（日期 / 开始时间 / 结束时间 / 属性选择）
  const [popover, setPopover] = useState(() => {
    const p = new URLSearchParams(window.location.search).get("test_popover");
    if (p === "date") return { type: "date", anchorRect: { top: 120, left: 880, bottom: 150, right: 1040 } };
    if (p === "time") return { type: "startTime", anchorRect: { top: 110, left: 880, bottom: 140, right: 960 } };
    if (p === "property") return { type: "property", fieldName: "日程类型", anchorRect: { top: 220, left: 880, bottom: 250, right: 1050 } };
    return null;
  });

  // 同名日程联动同步开关（默认 false：仅修改当前选中的单个日程）
  const [syncAllSame, setSyncAllSame] = useState(false);

  const sameTitleEvents = useMemo(() => {
    if (!selectedEvent || !selectedEvent.text || !baseList) return [];
    const t = (selectedEvent.text || "").trim();
    if (!t) return [];
    return baseList.filter((ev) => !ev.markedDelete && (ev.text || "").trim() === t);
  }, [selectedEvent && selectedEvent.text, baseList]);

  // 切换不同日程时重置同步开关为 false（不影响下一日程编辑）
  const prevEventIdRef = useRef(null);
  useEffect(() => {
    const curId = selectedEvent ? (selectedEvent.record_id || selectedEvent._uid || (selectedEvent.text + "_" + selectedEvent.date)) : null;
    if (prevEventIdRef.current !== curId) {
      prevEventIdRef.current = curId;
      setSyncAllSame(false);
    }
  }, [selectedEvent]);

  // 统一调用 onUpdateEvent，并自动带入 syncAllSame 标识与原始标题，严格保留原对象的 _uid 与 record_id 并确保 date 绝不缺失
  const fireUpdate = (updated) => {
    const curDate = (selectedEvent && selectedEvent.date) || selectedDate || TODAY;
    const safeUpdated = Object.assign({ date: curDate }, selectedEvent, updated);
    if (!safeUpdated.date) safeUpdated.date = curDate;
    onUpdateEvent && onUpdateEvent(safeUpdated, syncAllSame, selectedEvent ? selectedEvent.text : "", selectedEvent);
  };

  // 记录已经自动全选过标题的日程 ID，避免输入打字过程中重复触发全选冲掉内容
  const autoSelectedUidRef = useRef(null);

  // 当新建日程打开抽屉时，仅首次聚焦并选中默认标题（方便直接打字替换），打字后绝不重复全选
  useEffect(() => {
    if (!open) {
      autoSelectedUidRef.current = null;
      return;
    }
    if (open && currentTab === "detail" && selectedEvent && selectedEvent.isNew && titleInputRef.current) {
      const curUid = selectedEvent._uid || selectedEvent.record_id || (selectedEvent.text + "_" + (selectedEvent.startTime || ""));
      if (autoSelectedUidRef.current !== curUid) {
        autoSelectedUidRef.current = curUid;
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }
  }, [open, currentTab, selectedEvent ? (selectedEvent._uid || selectedEvent.record_id) : null]);

  // 监听键盘连续键属性聚焦事件 (E 再 T/D/S/Q/R/P/L/W)
  useEffect(() => {
    const handleFocusField = (e) => {
      const field = e.detail && e.detail.field;
      if (!field) return;
      if (field === "title") {
        setTimeout(() => {
          if (titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
          }
        }, 60);
      } else if (field === "date") {
        setTimeout(() => {
          const btn = document.getElementById("notion-drawer-date-pill") || document.querySelector(".notion-date-pill");
          if (btn) btn.click();
        }, 60);
      } else if (field === "startTime") {
        setTimeout(() => {
          const pill = document.querySelector(".notion-time-pill");
          if (pill) pill.click();
        }, 60);
      } else if (field === "endTime") {
        setTimeout(() => {
          const pills = document.querySelectorAll(".notion-time-pill");
          if (pills && pills.length > 1) pills[1].click();
        }, 60);
      } else if (field === "repeat") {
        setTimeout(() => {
          const chip = document.querySelector(".motion-icon-repeat");
          if (chip && chip.closest(".notion-drawer-field-block")) {
            chip.closest(".notion-drawer-field-block").scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 60);
      } else if (field === "note") {
        setTimeout(() => {
          const el = document.getElementById("notion-drawer-note-input") || document.querySelector(".notion-edit-textarea");
          if (el) { el.focus(); el.select(); }
        }, 60);
      }
    };
    window.addEventListener("notion:focus-field", handleFocusField);
    return () => window.removeEventListener("notion:focus-field", handleFocusField);
  }, []);

  // 格式化日期副标题，如 "九月 16 日 周三"（跨天时显示完整起止）
  const dateSubTitle = useMemo(() => {
    if (!selectedEvent || !selectedEvent.date) return "";
    const p = selectedEvent.date.split("-").map(Number);
    if (p.length < 3) return selectedEvent.date;
    const m = p[1];
    const d = p[2];
    const wd = weekdayOf(p[0], m - 1, d);
    const monthCh = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"][m - 1] || String(m);
    const baseStr = `${monthCh}月 ${d} 日 ${wd}`;
    const endDate = selectedEvent.endDate || (selectedEvent.endTime && selectedEvent.endTime.length >= 10 ? selectedEvent.endTime.slice(0, 10) : "");
    if (endDate && endDate > selectedEvent.date) {
      const ep = endDate.split("-").map(Number);
      if (ep.length >= 3) {
        const eWd = weekdayOf(ep[0], ep[1] - 1, ep[2]);
        const eMonthCh = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"][ep[1] - 1] || String(ep[1]);
        return `${baseStr} → ${eMonthCh}月 ${ep[2]} 日 ${eWd} (跨天)`;
      }
    }
    return baseStr;
  }, [selectedEvent]);

  // 属性选择回调（包含一天总结 00:00~23:59 约束及关联打卡/任务/时间记录）
  const handleSelectProperty = (fieldName, val) => {
    if (!selectedEvent) return;
    if (fieldName === "日程类型") {
      if (val === "一天总结") {
        const d = selectedEvent.date || TODAY;
        fireUpdate(Object.assign({}, selectedEvent, {
          type: "一天总结",
          trackTime: false,
          category: selectedEvent.category || "生活",
          isAllDay: true,
          startTime: `${d} 00:00:00`,
          endTime: `${d} 23:59:00`,
          startTimeStr: "00:00",
          endTimeStr: "23:59",
          expectedTime: `${d} 23:59:00`,
          durationStr: "全天 (24小时)",
        }));
      } else {
        fireUpdate(Object.assign({}, selectedEvent, {
          type: val,
        }));
      }
    } else if (fieldName === "板块") {
      const safeCat = val === "睡觉" ? "睡眠" : val;
      fireUpdate(Object.assign({}, selectedEvent, {
        category: safeCat,
      }));
    } else if (fieldName === "完成状态") {
      fireUpdate(Object.assign({}, selectedEvent, {
        status: val,
      }));
    } else if (fieldName === "提醒时间") {
      fireUpdate(Object.assign({}, selectedEvent, {
        reminder: val,
      }));
    } else if (fieldName === "外部来源") {
      fireUpdate(Object.assign({}, selectedEvent, {
        externalSource: val,
      }));
    } else if (fieldName === "重复规则") {
      fireUpdate(Object.assign({}, selectedEvent, {
        repeatRule: val,
        repeatMode: val === "每天" ? "daily" : (val === "工作日" ? "weekdays" : (val === "每周" ? "weekly" : "none")),
      }));
    } else if (fieldName === "计入时间记录") {
      fireUpdate(Object.assign({}, selectedEvent, {
        trackTime: !!val,
      }));
    } else if (fieldName === "关联打卡") {
      const v = (val === "无关联" || !val) ? "" : val;
      fireUpdate(Object.assign({}, selectedEvent, {
        linkedHabit: v,
      }));
    } else if (fieldName === "关联任务") {
      const v = (val === "无关联" || !val) ? "" : val;
      fireUpdate(Object.assign({}, selectedEvent, {
        linkedTask: v,
      }));
    } else if (fieldName === "关联时间记录") {
      const v = (val === "无关联" || !val) ? "" : val;
      fireUpdate(Object.assign({}, selectedEvent, {
        linkedTimeRecord: v,
      }));
    }
  };

  if (!open) return null;

  const sTimeStr = selectedEvent && selectedEvent.startTimeStr ? selectedEvent.startTimeStr : (selectedEvent && selectedEvent.startTime && selectedEvent.startTime.length >= 16 ? selectedEvent.startTime.slice(11, 16) : "09:00");
  const eTimeStr = selectedEvent && selectedEvent.endTimeStr ? selectedEvent.endTimeStr : (selectedEvent && selectedEvent.endTime && selectedEvent.endTime.length >= 16 ? selectedEvent.endTime.slice(11, 16) : "10:00");
  const drawerStartDate = (selectedEvent && selectedEvent.date) || selectedDate || TODAY;
  const drawerEndDate = (selectedEvent && selectedEvent.endDate) || (selectedEvent && selectedEvent.endTime && selectedEvent.endTime.length >= 10 ? selectedEvent.endTime.slice(0, 10) : drawerStartDate);
  const isCrossDay = drawerEndDate > drawerStartDate || (eTimeStr < sTimeStr);
  const drawerDuration = formatDurationText(drawerStartDate, sTimeStr, drawerEndDate, eTimeStr, selectedEvent && selectedEvent.isAllDay);

  return (
    <div className={"notion-drawer" + (open ? " open" : "")}>
      {/* 移动端底部抽屉下拉把手 */}
      <div className="notion-drawer-handle" />

      {/* 顶部标题栏：编辑 / 快捷键切换 */}
      <div className="notion-drawer-hd">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            className="notion-drawer-title"
            style={{ cursor: "pointer", opacity: currentTab === "detail" ? 1 : 0.6 }}
            onClick={() => onTabChange && onTabChange("detail")}
          >
            编辑日程
          </span>
          <span style={{ color: "var(--ink-faint)" }}>/</span>
          <span
            className="notion-drawer-title"
            style={{ cursor: "pointer", opacity: currentTab === "shortcuts" ? 1 : 0.6 }}
            onClick={() => onTabChange && onTabChange("shortcuts")}
          >
            快捷键 (?)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button className="notion-icon-btn" onClick={onClose} title="关闭 (Esc)">
            <i className="ph-bold ph-x" />
          </button>
        </div>
      </div>

      <div className="notion-drawer-body">
        {currentTab === "detail" && selectedEvent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* 1. 页面大字标题输入框 (就地编辑) */}
            <div className="notion-drawer-page-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="motion-icon motion-icon-title" style={{ fontSize: "20px", width: "26px", height: "26px", color: "#007aff" }}>
                <i className="ph-bold ph-calendar-blank" />
              </span>
              <input
                ref={titleInputRef}
                className="notion-edit-title-input"
                value={selectedEvent.text || ""}
                placeholder="输入日程标题..."
                onChange={(e) => {
                  fireUpdate(Object.assign({}, selectedEvent, { text: e.target.value, isNew: false }));
                }}
              />
            </div>

            {/* 同名日程联动同步条 (当列表中存在多项同名日程时展示) */}
            {sameTitleEvents.length > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "9px",
                  background: syncAllSame ? "rgba(0, 122, 255, 0.08)" : "var(--bg-subtle, #f5f5f7)",
                  border: syncAllSame ? "1px solid rgba(0, 122, 255, 0.3)" : "1px solid var(--border, #e5e5ea)",
                  fontSize: "12px",
                  color: "var(--ink-base, #1d1d1f)",
                  transition: "all 0.15s ease",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="motion-icon motion-icon-link" style={{ fontSize: "14px", color: "#007aff" }}>
                    <i className="ph-bold ph-link-simple" />
                  </span>
                  <span>
                    发现 <strong>{sameTitleEvents.length}</strong> 项同名日程
                    <span style={{ color: "var(--ink-faint, #86868b)", marginLeft: "4px", fontSize: "11px" }}>
                      ({syncAllSame ? "已开启同步更新" : "默认仅修改此项"})
                    </span>
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                  onClick={() => setSyncAllSame(!syncAllSame)}
                  title={syncAllSame ? "点击切换为仅修改当前日程" : "点击开启同步修改所有同名日程"}
                >
                  <span style={{ fontSize: "11px", fontWeight: 600, color: syncAllSame ? "#007aff" : "#86868b" }}>
                    同步修改全部
                  </span>
                  <div className={"apple-switch" + (syncAllSame ? " active" : "")} style={{ transform: "scale(0.75)", transformOrigin: "center" }}>
                    <div className="apple-switch-thumb" />
                  </div>
                </div>
              </div>
            )}

            <div style={{ height: "1px", background: "var(--border)" }}></div>

            {/* 2. 纯白 Notion 风格时间与日期控制区 (参考 Notion Calendar 官方标准布局) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* 属性标题：📅 日期 */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "500", color: "var(--ink-soft, #787774)" }}>
                <i className="ph-bold ph-calendar-blank" style={{ fontSize: "16px" }} />
                <span>日期</span>
              </div>

              {/* 非全天：时间段选择与动态时长 (如 23:30 → 18:30  19 小时) */}
              {!selectedEvent.isAllDay && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <EditableTimePill
                    value={sTimeStr}
                    isActive={popover && popover.type === "startTime"}
                    onActivate={(r) => setPopover({ type: "startTime", anchorRect: r })}
                    onChangeTime={(val) => {
                      const d = drawerStartDate;
                      const curEndVal = eTimeStr;
                      const isNextDay = curEndVal < val;
                      const targetEndDate = isNextDay ? (drawerEndDate <= d ? getNextDayStr(d) : drawerEndDate) : drawerEndDate;
                      fireUpdate(Object.assign({}, selectedEvent, {
                        date: d,
                        startTime: `${d} ${val}:00`,
                        startTimeStr: val,
                        endDate: targetEndDate,
                        endTime: `${targetEndDate} ${curEndVal}:00`,
                      }));
                    }}
                  />
                  <span style={{ color: "#8a8d91", fontSize: "14px", fontWeight: "400" }}>→</span>
                  <EditableTimePill
                    value={eTimeStr}
                    isActive={popover && popover.type === "endTime"}
                    onActivate={(r) => setPopover({ type: "endTime", anchorRect: r })}
                    onChangeTime={(val) => {
                      const d = drawerStartDate;
                      const curStartVal = sTimeStr;
                      const isNextDay = val < curStartVal;
                      const targetEndDate = isNextDay ? (drawerEndDate <= d ? getNextDayStr(d) : drawerEndDate) : drawerEndDate;
                      fireUpdate(Object.assign({}, selectedEvent, {
                        date: d,
                        endDate: targetEndDate,
                        endTime: `${targetEndDate} ${val}:00`,
                        endTimeStr: val,
                      }));
                    }}
                  />
                  {drawerDuration && (
                    <span style={{ fontSize: "13px", color: "var(--ink-soft, #787774)", fontWeight: "400", marginLeft: "2px" }}>
                      {drawerDuration}
                    </span>
                  )}
                  {isCrossDay && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#ff9500",
                        fontWeight: "600",
                        background: "rgba(255, 149, 0, 0.12)",
                        border: "1px solid rgba(255, 149, 0, 0.25)",
                        padding: "2px 7px",
                        borderRadius: "5px",
                        letterSpacing: "0.2px",
                      }}
                      title="此日程跨越午夜至次日"
                    >
                      次日 (+1天)
                    </span>
                  )}
                </div>
              )}

              {/* 日期选择：并排双日期胶囊 (支持分别独立点击修改开始日期与结束日期) */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  id="notion-drawer-date-pill"
                  type="button"
                  className={`notion-date-pill ${popover && (popover.type === "startDate" || popover.type === "date") ? "is-active" : ""}`}
                  style={{ flex: 1, minWidth: 0 }}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setPopover({ type: "startDate", anchorRect: r });
                  }}
                  title="点击更改开始日期"
                >
                  {formatNotionDateText(drawerStartDate)}
                </button>
                <button
                  type="button"
                  className={`notion-date-pill ${popover && popover.type === "endDate" ? "is-active" : ""}`}
                  style={{ flex: 1, minWidth: 0 }}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setPopover({ type: "endDate", anchorRect: r });
                  }}
                  title="点击更改结束日期"
                >
                  {formatNotionDateText(drawerEndDate)}
                </button>
              </div>

              {/* 全天开关与时区 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}
                  onClick={() => {
                    const isAll = !selectedEvent.isAllDay;
                    const d = drawerStartDate;
                    const ed = drawerEndDate || d;
                    fireUpdate(Object.assign({}, selectedEvent, {
                      date: d,
                      endDate: ed,
                      isAllDay: isAll,
                      startTime: isAll ? `${d} 00:00:00` : `${d} 09:00:00`,
                      endTime: isAll ? `${ed} 23:59:00` : `${ed} 10:00:00`,
                      startTimeStr: isAll ? "00:00" : "09:00",
                      endTimeStr: isAll ? "23:59" : "10:00",
                      expectedTime: isAll ? `${ed} 23:59:00` : "",
                      durationStr: isAll ? "全天" : "1 小时",
                    }));
                  }}
                >
                  <div style={{
                    width: "32px",
                    height: "18px",
                    borderRadius: "9px",
                    background: selectedEvent.isAllDay ? "#2383e2" : "#d3d3d3",
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "7px",
                      background: "#ffffff",
                      position: "absolute",
                      top: "2px",
                      left: selectedEvent.isAllDay ? "16px" : "2px",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                    }} />
                  </div>
                  <span style={{ fontSize: "13.5px", color: "var(--ink)", fontWeight: "400" }}>全天</span>
                </div>

                {/* 时区显示 */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#80868b" }}>
                  <span className="motion-icon" style={{ fontSize: "13px", color: "var(--notion-accent)" }}>
                    <i className="ph-bold ph-globe" />
                  </span>
                  <span>GMT+8 Shanghai</span>
                </div>
              </div>
            </div>

            <div style={{ height: "1px", background: "var(--border-light, #f0f0f0)", margin: "4px 0" }}></div>

            {/* 所属日历数据源 (对齐截图 1/2: 北极星日历) */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--ink)", padding: "2px 0" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                background: "#2ea043",
                color: "#ffffff",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: "bold",
              }}>田</span>
              <span style={{ fontWeight: "500" }}>北极星日历</span>
              <span style={{ color: "#80868b", fontSize: "12px" }}>北极星日历</span>
            </div>

            <div style={{ height: "1px", background: "var(--border-light, #f0f0f0)", margin: "4px 0" }}></div>

            {/* 3. 属性配置区 (全平铺展开，零折叠、零层级弹窗，所见即所改) */}
            <div className="notion-drawer-fields-container">
              {/* 板块分类 */}
              <div className="notion-drawer-field-block">
                <div className="notion-drawer-field-label">
                  <span className="motion-icon motion-icon-category"><i className="ph-bold ph-squares-four" /></span>
                  <span>板块分类</span>
                </div>
                <div className="notion-drawer-chips-wrap">
                  {["工作", "生活", "学习", "运动", "娱乐", "睡眠", "其他"].map((c) => {
                    const itemCat = CATS[c] || CATS["生活"];
                    const curCat = selectedEvent.category === "睡觉" ? "睡眠" : (selectedEvent.category || "生活");
                    const isAct = curCat === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        className={"notion-drawer-chip notion-cat-chip" + (isAct ? " is-active" : "")}
                        style={{
                          backgroundColor: isAct ? itemCat.solid : (itemCat.tint || "#f1f3f4"),
                          color: isAct ? (itemCat.activeText || "#ffffff") : (itemCat.text || itemCat.solid || "#37352f"),
                          borderColor: isAct ? (itemCat.activeBorder || itemCat.solid) : (itemCat.border || "transparent"),
                        }}
                        onClick={() => handleSelectProperty("板块", c)}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 完成状态 */}
              <div className="notion-drawer-field-block">
                <div className="notion-drawer-field-label">
                  <span className="motion-icon motion-icon-check"><i className="ph-bold ph-check-circle" /></span>
                  <span>完成状态</span>
                </div>
                <div className="notion-drawer-chips-wrap">
                  {[
                    { id: "", label: "未设置" },
                    { id: "完成", label: "完成" },
                    { id: "未完成", label: "未完成" },
                    { id: "继续", label: "继续" },
                    { id: "中断", label: "中断" },
                    { id: "超时", label: "超时" },
                  ].map((st) => {
                    const isAct = (selectedEvent.status || "") === st.id;
                    let actBg = "#007aff";
                    if (st.id === "完成") actBg = "#34c759";
                    else if (st.id === "未完成") actBg = "#ff3b30";
                    else if (st.id === "继续") actBg = "#007aff";
                    else if (st.id === "中断") actBg = "#8e8e93";
                    else if (st.id === "超时") actBg = "#af52de";
                    else if (st.id === "") actBg = "#555a64";

                    return (
                      <button
                        key={st.id}
                        type="button"
                        className={"notion-drawer-chip" + (isAct ? " is-active" : "")}
                        style={{
                          backgroundColor: isAct ? actBg : "var(--bg-subtle, #f5f5f7)",
                          color: isAct ? "#ffffff" : "var(--ink-base, #1d1d1f)",
                          borderColor: isAct ? actBg : "var(--border, #e5e5ea)",
                        }}
                        onClick={() => handleSelectProperty("完成状态", st.id)}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 日程类型 */}
              <div className="notion-drawer-field-block">
                <div className="notion-drawer-field-label">
                  <span className="motion-icon motion-icon-type"><i className="ph-bold ph-tag" /></span>
                  <span>日程类型</span>
                </div>
                <div className="notion-drawer-chips-wrap">
                  {["自己安排", "一天总结", "预期安排", "会议", "需求表", "飞书任务", "项目", "定时", "智能体安排"].map((tp) => {
                    const isAct = (selectedEvent.type || "自己安排") === tp;
                    let actBg = "#007aff";
                    if (tp === "一天总结") actBg = "#eb5757";
                    else if (tp === "预期安排") actBg = "#af52de";
                    else if (tp === "会议") actBg = "#9c7fc0";
                    else if (tp === "需求表") actBg = "#ff9500";
                    else if (tp === "飞书任务") actBg = "#5856d6";
                    else if (tp === "项目") actBg = "#34c759";
                    else if (tp === "定时") actBg = "#ff2d55";
                    else if (tp === "智能体安排") actBg = "#5ac8fa";

                    return (
                      <button
                        key={tp}
                        type="button"
                        className={"notion-drawer-chip" + (isAct ? " is-active" : "")}
                        style={{
                          backgroundColor: isAct ? actBg : "var(--bg-subtle, #f5f5f7)",
                          color: isAct ? "#ffffff" : "var(--ink-base, #1d1d1f)",
                          borderColor: isAct ? actBg : "var(--border, #e5e5ea)",
                        }}
                        onClick={() => handleSelectProperty("日程类型", tp)}
                      >
                        {tp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 重复规则 */}
              <div className="notion-drawer-field-block">
                <div className="notion-drawer-field-label">
                  <span className="motion-icon motion-icon-repeat"><i className="ph-bold ph-arrows-clockwise" /></span>
                  <span>重复规则</span>
                </div>
                <div className="notion-drawer-chips-wrap">
                  {["不重复", "每天", "工作日", "每周", "每月", "每年"].map((rp) => {
                    const isAct = (selectedEvent.repeatRule || "不重复") === rp;
                    return (
                      <button
                        key={rp}
                        type="button"
                        className={"notion-drawer-chip" + (isAct ? " is-active" : "")}
                        style={{
                          backgroundColor: isAct ? "#007aff" : "var(--bg-subtle, #f5f5f7)",
                          color: isAct ? "#ffffff" : "var(--ink-base, #1d1d1f)",
                          borderColor: isAct ? "#007aff" : "var(--border, #e5e5ea)",
                        }}
                        onClick={() => handleSelectProperty("重复规则", rp)}
                      >
                        {rp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 提醒时间 */}
              <div className="notion-drawer-field-block">
                <div className="notion-drawer-field-label">
                  <span className="motion-icon motion-icon-bell"><i className="ph-bold ph-bell" /></span>
                  <span>提醒时间</span>
                </div>
                <div className="notion-drawer-chips-wrap">
                  {["不提醒", "准时", "提前 5 分钟", "提前 15 分钟", "提前 30 分钟", "提前 1 小时", "提前 1 天"].map((rm) => {
                    const isAct = (selectedEvent.reminder || "不提醒") === rm;
                    return (
                      <button
                        key={rm}
                        type="button"
                        className={"notion-drawer-chip" + (isAct ? " is-active" : "")}
                        style={{
                          backgroundColor: isAct ? "#007aff" : "var(--bg-subtle, #f5f5f7)",
                          color: isAct ? "#ffffff" : "var(--ink-base, #1d1d1f)",
                          borderColor: isAct ? "#007aff" : "var(--border, #e5e5ea)",
                        }}
                        onClick={() => handleSelectProperty("提醒时间", rm)}
                      >
                        {rm}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 计入时间记录开关 */}
              <div className="notion-drawer-row-between">
                <div className="notion-dpr-left">
                  <span className="motion-icon motion-icon-timer"><i className="ph-bold ph-hourglass-medium" /></span>
                  <span>计入时间记录</span>
                </div>
                <div
                  className={"apple-switch" + ((selectedEvent.trackTime !== false) ? " active" : "")}
                  style={{ transform: "scale(0.85)", transformOrigin: "right center", cursor: "pointer" }}
                  onClick={() => {
                    const nextVal = selectedEvent.trackTime === undefined ? false : !selectedEvent.trackTime;
                    handleSelectProperty("计入时间记录", nextVal);
                  }}
                >
                  <div className="apple-switch-thumb" />
                </div>
              </div>

              {/* 关联打卡 & 任务 (多维表格双向关联，支持点击选择与快速修改) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="notion-drawer-field-block">
                  <div className="notion-drawer-field-label" style={{ fontSize: "11.5px" }}>
                    <span className="motion-icon motion-icon-target"><i className="ph-bold ph-target" /></span>
                    <span>关联打卡</span>
                  </div>
                  {selectedEvent.linkedHabit ? (
                    <div
                      className="notion-drawer-readonly-pill"
                      style={{ cursor: "pointer", background: "rgba(52, 199, 89, 0.08)", color: "#1c6b2e", border: "1px solid rgba(52, 199, 89, 0.25)" }}
                      title="点击修改关联打卡项 (⌥点击快速复制)"
                      onClick={(e) => {
                        if (e.altKey && navigator.clipboard) {
                          navigator.clipboard.writeText(formatLinkedHabitName(selectedEvent.linkedHabit));
                          if (typeof window.__triggerToast === "function") window.__triggerToast("已复制关联打卡: " + formatLinkedHabitName(selectedEvent.linkedHabit));
                          return;
                        }
                        const r = e.currentTarget.getBoundingClientRect();
                        setPopover({ type: "property", fieldName: "关联打卡", anchorRect: r });
                      }}
                    >
                      <i className="ph-bold ph-target" style={{ fontSize: "11px", opacity: 0.8 }} />
                      <span className="notion-drawer-pill-text" style={{ fontWeight: "500" }}>{formatLinkedHabitName(selectedEvent.linkedHabit)}</span>
                      <i className="ph-bold ph-caret-down" style={{ fontSize: "10px", opacity: 0.5, marginLeft: "auto" }} />
                    </div>
                  ) : (
                    <div
                      className="notion-drawer-readonly-empty"
                      style={{ cursor: "pointer", border: "1px dashed rgba(0,0,0,0.15)", background: "rgba(0,0,0,0.02)", color: "#666" }}
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setPopover({ type: "property", fieldName: "关联打卡", anchorRect: r });
                      }}
                      title="点击选择关联打卡项"
                    >
                      + 选择关联打卡
                    </div>
                  )}
                </div>
                <div className="notion-drawer-field-block">
                  <div className="notion-drawer-field-label" style={{ fontSize: "11.5px" }}>
                    <span className="motion-icon motion-icon-task"><i className="ph-bold ph-clipboard-text" /></span>
                    <span>关联任务</span>
                  </div>
                  {selectedEvent.linkedTask ? (
                    <div
                      className="notion-drawer-readonly-pill"
                      style={{ cursor: "pointer", background: "rgba(0, 122, 255, 0.08)", color: "#0050a6", border: "1px solid rgba(0, 122, 255, 0.25)" }}
                      title="点击修改关联任务 (⌥点击快速复制)"
                      onClick={(e) => {
                        if (e.altKey && navigator.clipboard) {
                          navigator.clipboard.writeText(formatLinkedTaskName(selectedEvent.linkedTask));
                          if (typeof window.__triggerToast === "function") window.__triggerToast("已复制关联任务: " + formatLinkedTaskName(selectedEvent.linkedTask));
                          return;
                        }
                        const r = e.currentTarget.getBoundingClientRect();
                        setPopover({ type: "property", fieldName: "关联任务", anchorRect: r });
                      }}
                    >
                      <i className="ph-bold ph-clipboard-text" style={{ fontSize: "11px", opacity: 0.8 }} />
                      <span className="notion-drawer-pill-text" style={{ fontWeight: "500" }}>{formatLinkedTaskName(selectedEvent.linkedTask)}</span>
                      <i className="ph-bold ph-caret-down" style={{ fontSize: "10px", opacity: 0.5, marginLeft: "auto" }} />
                    </div>
                  ) : (
                    <div
                      className="notion-drawer-readonly-empty"
                      style={{ cursor: "pointer", border: "1px dashed rgba(0,0,0,0.15)", background: "rgba(0,0,0,0.02)", color: "#666" }}
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setPopover({ type: "property", fieldName: "关联任务", anchorRect: r });
                      }}
                      title="点击选择关联任务"
                    >
                      + 选择关联任务
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ height: "1px", background: "var(--border-light, #f0f0f0)", margin: "4px 0" }}></div>

            {/* 4. 详细备注笔记 (W) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#80868b" }}>
                <span className="motion-icon motion-icon-note" style={{ fontSize: "14px", width: "18px", height: "18px" }}><i className="ph-bold ph-note-pencil" /></span>
                <span>备注与描述 (W)</span>
              </div>
              <textarea
                id="notion-drawer-note-input"
                className="notion-edit-textarea"
                placeholder="添加详细日程笔记、会议要点或描述 (按 W 聚焦)..."
                value={selectedEvent.note || ""}
                onChange={(e) => {
                  fireUpdate(Object.assign({}, selectedEvent, {
                    note: e.target.value,
                  }));
                }}
              />
            </div>

            {/* 5. 底部操作：专注心流与删除 */}
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                className="notion-start-focus-btn"
                onClick={() => {
                  onStartFocus && onStartFocus(selectedEvent);
                }}
                title="以此日程为目标开启专注时钟 (25m)"
              >
                <i className="ph-bold ph-timer" style={{ marginRight: "6px", fontSize: "15px" }} />
                <span>以此日程开启专注 (25m)</span>
              </button>

              <button
                type="button"
                className="notion-delete-btn"
                onClick={() => {
                  onDeleteEvent && onDeleteEvent(selectedEvent);
                }}
              >
                <i className="ph-bold ph-trash" style={{ marginRight: "6px", fontSize: "14px" }} />
                删除此日程 (或按 Delete 键)
              </button>
            </div>

            {/* 渲染纯白弹出层 */}
            {popover && (popover.type === "startDate" || popover.type === "date") && (
              <NotionMiniCalendarPopover
                date={drawerStartDate}
                anchorRect={popover.anchorRect}
                onSelectDate={(newDate) => {
                  let newEndDate = drawerEndDate;
                  if (newEndDate < newDate) {
                    newEndDate = newDate;
                  }
                  let newStart = `${newDate} ${sTimeStr}:00`;
                  let newEnd = `${newEndDate} ${eTimeStr}:00`;
                  fireUpdate(Object.assign({}, selectedEvent, {
                    date: newDate,
                    endDate: newEndDate,
                    startTime: newStart,
                    endTime: newEnd,
                  }));
                }}
                onClose={() => setPopover(null)}
              />
            )}

            {popover && popover.type === "endDate" && (
              <NotionMiniCalendarPopover
                date={drawerEndDate}
                anchorRect={popover.anchorRect}
                onSelectDate={(newDate) => {
                  let newStartDate = drawerStartDate;
                  if (newDate < newStartDate) {
                    newStartDate = newDate;
                  }
                  let newStart = `${newStartDate} ${sTimeStr}:00`;
                  let newEnd = `${newDate} ${eTimeStr}:00`;
                  fireUpdate(Object.assign({}, selectedEvent, {
                    date: newStartDate,
                    endDate: newDate,
                    startTime: newStart,
                    endTime: newEnd,
                  }));
                }}
                onClose={() => setPopover(null)}
              />
            )}

            {popover && popover.type === "startTime" && (
              <NotionTimeMenuPopover
                selectedTime={sTimeStr}
                anchorRect={popover.anchorRect}
                isEnd={false}
                onSelectTime={(val) => {
                  const d = drawerStartDate;
                  const curEndVal = eTimeStr;
                  const isNextDay = curEndVal < val;
                  const targetEndDate = isNextDay ? (drawerEndDate <= d ? getNextDayStr(d) : drawerEndDate) : drawerEndDate;
                  fireUpdate(Object.assign({}, selectedEvent, {
                    date: d,
                    startTime: `${d} ${val}:00`,
                    startTimeStr: val,
                    endDate: targetEndDate,
                    endTime: `${targetEndDate} ${curEndVal}:00`,
                  }));
                }}
                onClose={() => setPopover(null)}
              />
            )}

            {popover && popover.type === "endTime" && (
              <NotionTimeMenuPopover
                selectedTime={eTimeStr}
                anchorRect={popover.anchorRect}
                isEnd={true}
                startTime={sTimeStr}
                onSelectTime={(val) => {
                  const d = drawerStartDate;
                  const curStartVal = sTimeStr;
                  const isNextDay = val < curStartVal;
                  const targetEndDate = isNextDay ? (drawerEndDate <= d ? getNextDayStr(d) : drawerEndDate) : drawerEndDate;
                  fireUpdate(Object.assign({}, selectedEvent, {
                    date: d,
                    endDate: targetEndDate,
                    endTime: `${targetEndDate} ${val}:00`,
                    endTimeStr: val,
                  }));
                }}
                onClose={() => setPopover(null)}
              />
            )}

            {popover && popover.type === "property" && (
              <NotionPropertyPopover
                fieldName={popover.fieldName}
                currentValue={
                  popover.fieldName === "日程类型" ? selectedEvent.type :
                  popover.fieldName === "板块" ? selectedEvent.category :
                  popover.fieldName === "完成状态" ? selectedEvent.status :
                  popover.fieldName === "提醒时间" ? selectedEvent.reminder :
                  popover.fieldName === "重复规则" ? (selectedEvent.repeatRule || "不重复") :
                  popover.fieldName === "外部来源" ? selectedEvent.externalSource :
                  popover.fieldName === "关联打卡" ? (formatLinkedHabitName(selectedEvent.linkedHabit) || "无关联") :
                  popover.fieldName === "关联任务" ? (formatLinkedTaskName(selectedEvent.linkedTask) || "无关联") :
                  popover.fieldName === "关联时间记录" ? (selectedEvent.linkedTimeRecord || "无关联") :
                  selectedEvent[popover.fieldName]
                }
                anchorRect={popover.anchorRect}
                onSelect={(val) => handleSelectProperty(popover.fieldName, val)}
                onClose={() => setPopover(null)}
                baseList={baseList}
              />
            )}
          </div>
        ) : null}

        {/* 快捷键速查面板 (当 tab 为 shortcuts 或无选中日程时展示) */}
        {(currentTab === "shortcuts" || !selectedEvent) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* 0. 当选中的日期为空白日时的快速新建卡片 */}
            {!selectedEvent && selectedDate && (
              <div
                className="notion-shortcuts-card"
                style={{
                  border: "1.5px dashed var(--nt-border, #e5e5e5)",
                  background: "var(--nt-bg-subtle, #fafafa)",
                  padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--nt-text, #111)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="ph-bold ph-calendar-plus motion-icon" style={{ color: "#007aff" }} />
                    <span>{selectedDate} (暂无日程)</span>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--nt-text-muted, #737373)", marginBottom: "12px", lineHeight: "1.5" }}>
                  当前选中的日期尚无日程安排。你可以直接在此日期新建日程，或在年看板上双击该日格子快速创建。
                </div>
                <button
                  type="button"
                  className="notion-btn-primary"
                  style={{
                    width: "100%",
                    padding: "7px 12px",
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                  onClick={() => onOpenCreateModal && onOpenCreateModal({ date: selectedDate, isAllDay: true })}
                >
                  <i className="ph-bold ph-plus" />
                  <span>在此日期新建全天日程</span>
                </button>
              </div>
            )}

            {/* 1. 日历视图切换 */}
            <div className="notion-shortcuts-card">
              <div className="notion-sc-title" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <i className="ph-bold ph-calendar-blank motion-icon" />
                <span>日历视图切换</span>
              </div>
              <div className="notion-sc-row">
                <span>显示日视图 (Day)</span>
                <span className="notion-sc-key">D 或 1</span>
              </div>
              <div className="notion-sc-row">
                <span>显示周视图 (Week)</span>
                <span className="notion-sc-key">W 或 2</span>
              </div>
              <div className="notion-sc-row">
                <span>显示月视图 (Month)</span>
                <span className="notion-sc-key">M</span>
              </div>
              <div className="notion-sc-row">
                <span>自定义天数视图</span>
                <span className="notion-sc-key">1 - 0</span>
              </div>
              <div className="notion-sc-row">
                <span>全天总结年看板</span>
                <span className="notion-sc-key">Y</span>
              </div>
              <div className="notion-sc-row">
                <span>显示 / 隐藏周末</span>
                <span className="notion-sc-key">⇧ ⌘ E</span>
              </div>
              <div className="notion-sc-row">
                <span>放大 / 缩小时间轴</span>
                <span className="notion-sc-key">⇧ ⌘ . / ,</span>
              </div>
            </div>

            {/* 2. 日历导航 */}
            <div className="notion-shortcuts-card">
              <div className="notion-sc-title" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <i className="ph-bold ph-compass motion-icon motion-icon-repeat" />
                <span>日历时间导航</span>
              </div>
              <div className="notion-sc-row">
                <span>立即跳转回今天 (Today)</span>
                <span className="notion-sc-key">T</span>
              </div>
              <div className="notion-sc-row">
                <span>对齐今天</span>
                <span className="notion-sc-key">⌥ T</span>
              </div>
              <div className="notion-sc-row">
                <span>跳转到下一个 (明天/下周/下月)</span>
                <span className="notion-sc-key">J 或 →</span>
              </div>
              <div className="notion-sc-row">
                <span>跳转到上一个 (昨天/上周/上月)</span>
                <span className="notion-sc-key">K 或 ←</span>
              </div>
              <div className="notion-sc-row">
                <span>跳转到指定日期 (Go to date)</span>
                <span className="notion-sc-key">.</span>
              </div>
              <div className="notion-sc-row">
                <span>关闭浮层 / 返程</span>
                <span className="notion-sc-key">esc</span>
              </div>
            </div>

            {/* 3. 工作流程与连续键 */}
            <div className="notion-shortcuts-card">
              <div className="notion-sc-title" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <i className="ph-bold ph-lightning motion-icon motion-icon-target" />
                <span>工作流程与连续键 (Leader Key: 先按 E)</span>
              </div>
              <div className="notion-sc-row">
                <span>新建日程 (Create)</span>
                <span className="notion-sc-key">C</span>
              </div>
              <div className="notion-sc-row">
                <span>命令行与全局搜索 (Command Menu)</span>
                <span className="notion-sc-key">⌘ K 或 /</span>
              </div>
              <div className="notion-sc-row">
                <span>编辑日程 / 展开抽屉</span>
                <span className="notion-sc-key">E</span>
              </div>
              <div className="notion-sc-row">
                <span>连续键：编辑标题</span>
                <span className="notion-sc-key">E 再 T</span>
              </div>
              <div className="notion-sc-row">
                <span>连续键：编辑日期</span>
                <span className="notion-sc-key">E 再 D</span>
              </div>
              <div className="notion-sc-row">
                <span>连续键：设置开始时间</span>
                <span className="notion-sc-key">E 再 S</span>
              </div>
              <div className="notion-sc-row">
                <span>连续键：设置结束时间</span>
                <span className="notion-sc-key">E 再 Q</span>
              </div>
              <div className="notion-sc-row">
                <span>连续键：设置重复规则</span>
                <span className="notion-sc-key">E 再 R</span>
              </div>
              <div className="notion-sc-row">
                <span>连续键：添加参与者</span>
                <span className="notion-sc-key">E 再 P</span>
              </div>
              <div className="notion-sc-row">
                <span>连续键：添加位置 / 链接</span>
                <span className="notion-sc-key">E 再 L</span>
              </div>
              <div className="notion-sc-row">
                <span>连续键：编辑描述与备注</span>
                <span className="notion-sc-key">E 再 W</span>
              </div>
              <div className="notion-sc-row">
                <span>连续键：切换全天</span>
                <span className="notion-sc-key">E 再 A</span>
              </div>
            </div>

            {/* 4. 鼠标拖拽与键盘微调 */}
            <div className="notion-shortcuts-card">
              <div className="notion-sc-title" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <i className="ph-bold ph-cursor-click motion-icon" />
                <span>鼠标与键盘高级交互</span>
              </div>
              <div className="notion-sc-row">
                <span>拖拽移动日程</span>
                <span className="notion-sc-key">鼠标按住上下拖</span>
              </div>
              <div className="notion-sc-row">
                <span>拉长/缩短时长</span>
                <span className="notion-sc-key">拖拽上下边缘手柄</span>
              </div>
              <div className="notion-sc-row">
                <span>划定时间新建</span>
                <span className="notion-sc-key">空白网格按住向下拖</span>
              </div>
              <div className="notion-sc-row">
                <span>键盘平移时间</span>
                <span className="notion-sc-key">↑ / ↓</span>
              </div>
              <div className="notion-sc-row">
                <span>键盘调整时长</span>
                <span className="notion-sc-key">⇧ + ↑ / ↓</span>
              </div>
              <div className="notion-sc-row">
                <span>多选日程批量拖拽</span>
                <span className="notion-sc-key">⌘ 或 ⇧ 点击多选</span>
              </div>
              <div className="notion-sc-row">
                <span>快速删除日程</span>
                <span className="notion-sc-key">Delete 或 ⌫</span>
              </div>
              <div className="notion-sc-row">
                <span>进入抽屉编辑</span>
                <span className="notion-sc-key">Enter</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   统一居中 Notion 新建日程弹窗 (快捷键 C / 空白拖拽多天新建)
   ============================================================ */
function NotionCreateModal({
  open,
  initialData,
  onClose,
  onCreate,
  cats = CATS,
  baseList = [],
}) {
  if (!open) return null;

  const [title, setTitle] = useState(initialData ? initialData.text || "" : "");
  const [date, setDate] = useState(initialData ? initialData.date || TODAY : TODAY);
  const [endDate, setEndDate] = useState(initialData ? initialData.endDate || (initialData.date || TODAY) : TODAY);
  const [isAllDay, setIsAllDay] = useState(initialData ? !!initialData.isAllDay : false);
  const [startTime, setStartTime] = useState(initialData ? initialData.startTimeStr || "09:00" : "09:00");
  const [endTime, setEndTime] = useState(initialData ? initialData.endTimeStr || "10:00" : "10:00");
  const [category, setCategory] = useState(initialData ? initialData.category || "生活" : "生活");
  const [status, setStatus] = useState(initialData && initialData.status ? initialData.status : "完成");
  const initialType = initialData
    ? initialData.type || (initialData.isDaySummary || initialData.isAllDay ? "一天总结" : "自己安排")
    : "自己安排";
    const [trackTime, setTrackTime] = useState(
    initialType === "一天总结" ? false : (initialData && typeof initialData.trackTime === "boolean" ? initialData.trackTime : true)
  );
  const [reminder, setReminder] = useState(initialData ? initialData.reminder || "提前 5 分钟" : "提前 5 分钟");
  const [type, setType] = useState(
    initialData
      ? initialData.type || (initialData.isDaySummary || initialData.isAllDay ? "一天总结" : "自己安排")
      : "自己安排"
  );
  const [note, setNote] = useState(initialData ? initialData.note || "" : "");
  const [repeatMode, setRepeatMode] = useState(initialData ? initialData.repeatMode || "none" : "none"); // "none" | "daily" | "weekdays" | "weekly"
  const [repeatDays, setRepeatDays] = useState(initialData ? initialData.repeatDays || 7 : 7); // 7 | 14 | 30

  const [popover, setPopover] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [savedDraft, setSavedDraft] = useState(null);
  const titleInputRef = useRef(null);
  const comboboxWrapRef = useRef(null);

  // 恢复未保存草稿检测
  useEffect(() => {
    if (open) {
      try {
        const raw = localStorage.getItem("polaris_event_draft");
        if (raw) {
          const d = JSON.parse(raw);
          if (d && (d.title || d.note)) {
            setSavedDraft(d);
          }
        }
      } catch (e) {}
    } else {
      setSavedDraft(null);
    }
  }, [open]);

  // 输入过程防抖（300ms）静默存稿，防范浏览器误关/刷新崩溃
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      try {
        const cleanTitle = (title || "").trim();
        const cleanNote = (note || "").trim();
        if (cleanTitle || cleanNote) {
          localStorage.setItem(
            "polaris_event_draft",
            JSON.stringify({
              title,
              date,
              endDate,
              isAllDay,
              startTime,
              endTime,
              category,
              status,
              type,
              reminder,
              trackTime,
              note,
              repeatMode,
              repeatDays,
              savedAt: Date.now(),
            })
          );
        }
      } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [open, title, date, endDate, isAllDay, startTime, endTime, category, status, type, reminder, trackTime, note, repeatMode, repeatDays]);

  // 提取历史常用日程标题
  const historyTitles = useMemo(() => getRecentScheduleTitles(baseList), [baseList]);

  // 根据当前输入做模糊匹配过滤
  const filteredTitles = useMemo(() => {
    const t = (title || "").trim().toLowerCase();
    if (!t) return historyTitles;
    return historyTitles.filter((item) => item.text.toLowerCase().includes(t));
  }, [historyTitles, title]);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
    const onDocMouseDown = (e) => {
      if (comboboxWrapRef.current && !comboboxWrapRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const handleSelectHistory = (item) => {
    setTitle(item.text);
    if (item.category) {
      setCategory(item.category);
    }
    setShowDropdown(false);
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  const isRange = endDate && endDate !== date;

  const formatDateLabel = (ds) => {
    if (!ds) return "";
    const p = ds.split("-").map(Number);
    if (p.length < 3) return ds;
    const m = p[1];
    const d = p[2];
    const wd = weekdayOf(p[0], m - 1, d);
    return `${m}月${d}日 ${wd}`;
  };

  const handleCreate = () => {
    const cleanTitle = (title || "").trim();
    if (!cleanTitle) return;

    let targetEndDate = endDate || date;
    if (!isAllDay && endTime < startTime && (!endDate || endDate <= date)) {
      targetEndDate = getNextDayStr(date);
    }

    const startDateTime = isAllDay ? `${date} 00:00:00` : `${date} ${startTime}:00`;
    const endDateTime = isAllDay ? `${targetEndDate} 23:59:00` : `${targetEndDate} ${endTime}:00`;

    // 提交成功，自动销毁本地草稿
    try {
      localStorage.removeItem("polaris_event_draft");
    } catch (e) {}

    onCreate && onCreate({
      text: cleanTitle,
      date: date,
      endDate: targetEndDate,
      startTime: startDateTime,
      endTime: endDateTime,
      startTimeStr: isAllDay ? "00:00" : startTime,
      endTimeStr: isAllDay ? "23:59" : endTime,
      isAllDay: isAllDay,
      category: category,
      status: status || "完成",
      reminder: reminder,
      type: type,
      isDaySummary: type === "一天总结" || (initialData && !!initialData.isDaySummary),
      trackTime: (type === "一天总结" || (initialData && !!initialData.isDaySummary)) ? false : trackTime,
      note: note.trim(),
      repeatMode: repeatMode,
      repeatDays: repeatDays,
    });

    onClose && onClose();
  };

  return (
    <div className="apple-sheet-backdrop" onClick={onClose}>
      <div className="apple-sheet" onClick={(e) => e.stopPropagation()}>
        {/* 顶部标题栏 */}
        <div className="apple-sheet-header">
          <div style={{ width: "22px" }}></div>
          <div className="apple-sheet-title">新建日程</div>
          <button className="apple-sheet-close" onClick={onClose} title="关闭 (Esc)">
            <i className="ph-bold ph-x" />
          </button>
        </div>

        <div className="apple-sheet-body">
          {/* 草稿恢复提示条 */}
          {savedDraft && !title && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "8px",
              marginBottom: "12px",
              fontSize: "12px",
              color: "var(--apple-accent, #007aff)",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="ph-bold ph-note-pencil" />
                <span>检测到未保存草稿：<strong>{savedDraft.title || "（备忘草稿）"}</strong></span>
              </span>
              <span style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  style={{
                    background: "var(--apple-accent, #007aff)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                  onClick={() => {
                    if (savedDraft.title) setTitle(savedDraft.title);
                    if (savedDraft.date) setDate(savedDraft.date);
                    if (savedDraft.endDate) setEndDate(savedDraft.endDate);
                    if (savedDraft.startTime) setStartTime(savedDraft.startTime);
                    if (savedDraft.endTime) setEndTime(savedDraft.endTime);
                    if (typeof savedDraft.isAllDay === "boolean") setIsAllDay(savedDraft.isAllDay);
                    if (savedDraft.category) setCategory(savedDraft.category);
                    if (savedDraft.status) setStatus(savedDraft.status);
                    if (savedDraft.type) setType(savedDraft.type);
                    if (savedDraft.reminder) setReminder(savedDraft.reminder);
                    if (typeof savedDraft.trackTime === "boolean") setTrackTime(savedDraft.trackTime);
                    if (savedDraft.note) setNote(savedDraft.note);
                    setSavedDraft(null);
                  }}
                >
                  恢复草稿
                </button>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    color: "var(--apple-text-tertiary, #999)",
                    border: "none",
                    padding: "3px 6px",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    try { localStorage.removeItem("polaris_event_draft"); } catch (e) {}
                    setSavedDraft(null);
                  }}
                >
                  丢弃
                </button>
              </span>
            </div>
          )}
          {/* Card 1: 标题与备注 */}
          <div className="apple-grouped-card apple-card-overflow-visible" style={{ overflow: "visible", position: "relative", zIndex: showDropdown ? 100 : 2 }}>
            <div className="apple-grouped-row apple-row-overflow-visible" style={{ position: "relative", overflow: "visible" }}>
              <div ref={comboboxWrapRef} className="apple-title-combobox-wrap" style={{ position: "relative", overflow: "visible" }}>
                <input
                  ref={titleInputRef}
                  className="apple-title-input"
                  value={title}
                  placeholder="输入日程标题..."
                  onFocus={() => {
                    if (historyTitles && historyTitles.length > 0) setShowDropdown(true);
                  }}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (historyTitles && historyTitles.length > 0) setShowDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
                      e.preventDefault();
                      handleCreate();
                    } else if (e.key === "Escape") {
                      if (showDropdown) {
                        e.stopPropagation();
                        setShowDropdown(false);
                      } else {
                        onClose();
                      }
                    }
                  }}
                />
                {historyTitles && historyTitles.length > 0 && (
                  <button
                    type="button"
                    className="apple-title-combobox-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown((v) => !v);
                      if (titleInputRef.current) titleInputRef.current.focus();
                    }}
                    title={showDropdown ? "收起常用标题" : "展开常用历史日程标题"}
                  >
                    <i className={"ph-bold " + (showDropdown ? "ph-caret-up" : "ph-clock-counter-clockwise")} />
                    <span style={{ fontSize: "11px" }}>常用</span>
                  </button>
                )}

                {/* 常用历史日程下拉列表 */}
                {showDropdown && filteredTitles && filteredTitles.length > 0 && (
                  <div className="apple-title-dropdown" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="apple-title-dropdown-header">
                      <span>常用历史日程 (点击直接复用)</span>
                      <span>{filteredTitles.length} 项</span>
                    </div>
                    <div className="apple-title-dropdown-list">
                      {filteredTitles.map((item, idx) => {
                        const catInfo = (cats && cats[item.category]) || (CATS && CATS[item.category]) || (CATS && CATS["生活"]);
                        return (
                          <div
                            key={idx}
                            className="apple-title-dropdown-item"
                            onClick={() => handleSelectHistory(item)}
                          >
                            <span className="apple-title-dropdown-item-text" title={item.text}>
                              {item.text}
                            </span>
                            <div className="apple-title-dropdown-item-meta">
                              {item.category && (
                                <span
                                  className="apple-title-dropdown-item-cat"
                                  style={{
                                    backgroundColor: catInfo ? catInfo.tint : "rgba(0,0,0,0.06)",
                                    color: catInfo ? catInfo.solid : "#555",
                                    border: `1px solid ${catInfo ? catInfo.solid + "40" : "transparent"}`,
                                  }}
                                >
                                  {item.category}
                                </span>
                              )}
                              {item.count > 1 && (
                                <span className="apple-title-dropdown-item-count">
                                  {item.count}次
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="apple-grouped-row column">
              <textarea
                className="apple-textarea"
                rows="2"
                value={note}
                placeholder="添加补充备注或待办清单..."
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Card 2: 日期、时间与重复设置 */}
          <div className="apple-grouped-card">
            {/* 全天开关 */}
            <div
              className="apple-grouped-row"
              style={{ cursor: "pointer" }}
              onClick={() => setIsAllDay(!isAllDay)}
            >
              <span className="apple-row-label">全天日程</span>
              <div className={"apple-switch" + (isAllDay ? " active" : "")}>
                <div className="apple-switch-thumb" />
              </div>
            </div>

            {/* 日期选择：并排双日期胶囊 (支持分别独立点击修改开始日期与结束日期) */}
            <div className="apple-grouped-row">
              <span className="apple-row-label">日期</span>
              <div className="apple-row-content" style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                <button
                  type="button"
                  className={`apple-time-pill-btn ${popover && (popover.type === "startDate" || popover.type === "date") ? "active" : ""}`}
                  style={{ flex: 1, justifyContent: "flex-start", padding: "6px 10px", minWidth: 0 }}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setPopover({ type: "startDate", anchorRect: r });
                  }}
                  title="点击更改开始日期"
                >
                  <i className="ph-bold ph-calendar-blank motion-icon" />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formatNotionDateText(date)}</span>
                </button>
                <span style={{ color: "var(--ink-faint, #8a8d91)", fontSize: "13px" }}>→</span>
                <button
                  type="button"
                  className={`apple-time-pill-btn ${popover && popover.type === "endDate" ? "active" : ""}`}
                  style={{ flex: 1, justifyContent: "flex-start", padding: "6px 10px", minWidth: 0 }}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setPopover({ type: "endDate", anchorRect: r });
                  }}
                  title="点击更改结束日期"
                >
                  <i className="ph-bold ph-calendar-blank motion-icon" />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{formatNotionDateText(endDate)}</span>
                </button>
              </div>
            </div>

            {/* 非全天：时间段选择 (支持跨午夜识别与动态时长) */}
            {!isAllDay && (
              <div className="apple-grouped-row">
                <span className="apple-row-label">时间</span>
                <div className="apple-row-content" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <EditableTimePill
                    value={startTime}
                    isActive={popover && popover.type === "startTime"}
                    onActivate={(r) => setPopover({ type: "startTime", anchorRect: r })}
                    onChangeTime={(val) => {
                      setStartTime(val);
                      if (endTime < val && (!endDate || endDate <= date)) {
                        setEndDate(getNextDayStr(date));
                      }
                    }}
                  />
                  <span style={{ color: "#8e8e93", fontSize: "12px" }}>→</span>
                  <EditableTimePill
                    value={endTime}
                    isActive={popover && popover.type === "endTime"}
                    onActivate={(r) => setPopover({ type: "endTime", anchorRect: r })}
                    onChangeTime={(val) => {
                      setEndTime(val);
                      if (val < startTime && (!endDate || endDate <= date)) {
                        setEndDate(getNextDayStr(date));
                      }
                    }}
                  />
                  {formatDurationText(date, startTime, endDate, endTime, isAllDay) && (
                    <span style={{ fontSize: "12px", color: "var(--ink-soft, #787774)", marginLeft: "4px" }}>
                      {formatDurationText(date, startTime, endDate, endTime, isAllDay)}
                    </span>
                  )}
                  {(endDate && endDate > date) || (endTime < startTime) ? (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#ff9500",
                        fontWeight: "600",
                        background: "rgba(255, 149, 0, 0.12)",
                        border: "1px solid rgba(255, 149, 0, 0.25)",
                        padding: "2px 7px",
                        borderRadius: "5px",
                      }}
                      title="此日程跨越午夜至次日"
                    >
                      次日 (+1天)
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {/* 重复规则 */}
            <div className="apple-grouped-row">
              <span className="apple-row-label">重复</span>
              <div className="apple-row-content">
                <div className="apple-segmented-group">
                  {[
                    { key: "none", label: "不重复" },
                    { key: "daily", label: "每天" },
                    { key: "weekdays", label: "工作日" },
                    { key: "weekly", label: "每周" },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      className={"apple-segmented-item" + (repeatMode === item.key ? " active" : "")}
                      onClick={() => setRepeatMode(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 重复天数跨度 */}
            {repeatMode !== "none" && (
              <div className="apple-grouped-row" style={{ background: "rgba(0, 122, 255, 0.04)" }}>
                <span className="apple-row-label" style={{ color: "#007AFF" }}>持续跨度</span>
                <div className="apple-row-content">
                  <div className="apple-segmented-group">
                    {[
                      { days: 7, label: "7天" },
                      { days: 14, label: "14天" },
                      { days: 30, label: "30天" },
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.days}
                        className={"apple-segmented-item" + (repeatDays === p.days ? " active" : "")}
                        onClick={() => setRepeatDays(p.days)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: 分类与状态 */}
          <div className="apple-grouped-card">
            {/* 板块选择 */}
            <div className="apple-grouped-row">
              <span className="apple-row-label">日程类型</span>
              <div className="apple-row-content">
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {["一天总结", "自己安排", "预期安排", "需求表", "飞书任务", "会议"].map((tItem) => {
                    const sel = type === tItem;
                    return (
                      <button
                        type="button"
                        key={tItem}
                        className="notion-prop-pill-tag"
                        style={{
                          cursor: "pointer",
                          background: sel ? (tItem === "一天总结" ? "#eb5757" : "#007AFF") : "rgba(0,0,0,0.05)",
                          color: sel ? "#ffffff" : "#333",
                          border: sel ? "1.5px solid transparent" : "1px solid rgba(0,0,0,0.08)",
                          fontWeight: sel ? "600" : "500",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          transition: "all 0.12s",
                        }}
                        onClick={() => {
                          setType(tItem);
                          if (tItem === "一天总结") {
                            setTrackTime(false);
                            setIsAllDay(true);
                          } else {
                            setTrackTime(true);
                          }
                        }}
                      >
                        {tItem}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="apple-grouped-row">
              <span className="apple-row-label">板块</span>
              <div className="apple-row-content">
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {Object.keys(cats).map((c) => {
                    const sel = category === c;
                    const cat = cats[c];
                    return (
                      <button
                        type="button"
                        key={c}
                        className="notion-prop-pill-tag"
                        style={{
                          cursor: "pointer",
                          background: sel ? cat.solid : cat.tint,
                          color: sel ? "#ffffff" : cat.solid,
                          border: sel ? `1.5px solid ${cat.solid}` : "1px solid transparent",
                          fontWeight: sel ? "600" : "500",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          transition: "all 0.12s",
                          boxShadow: sel ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                        }}
                        onClick={() => setCategory(c)}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 完成状态开关 */}
            <div
              className="apple-grouped-row"
              style={{ cursor: "pointer" }}
              onClick={() => setStatus(status === "完成" ? "" : "完成")}
            >
              <span className="apple-row-label">已完成此事项</span>
              <div className={"apple-switch" + (status === "完成" ? " active" : "")}>
                <div className="apple-switch-thumb" />
              </div>
            </div>

            {/* 计入时间记录开关 */}
            <div
              className="apple-grouped-row"
              style={{ cursor: "pointer" }}
              onClick={() => setTrackTime(!trackTime)}
            >
              <span className="apple-row-label">计入时间记录</span>
              <div className={"apple-switch" + (trackTime ? " active" : "")}>
                <div className="apple-switch-thumb" />
              </div>
            </div>
          </div>
        </div>

        {/* macOS Sheet 底部按钮栏 */}
        <div className="apple-sheet-footer">
          <button type="button" className="apple-btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="apple-btn-primary"
            disabled={!title.trim()}
            onClick={handleCreate}
          >
            创建日程 (Enter)
          </button>
        </div>

        {/* 弹出的时间/日期菜单 */}
        {popover && (popover.type === "startDate" || popover.type === "date") && (
          <NotionMiniCalendarPopover
            date={date}
            anchorRect={popover.anchorRect}
            onSelectDate={(newDate) => {
              setDate(newDate);
              if (endDate < newDate) {
                setEndDate(newDate);
              }
              setPopover(null);
            }}
            onClose={() => setPopover(null)}
          />
        )}

        {popover && popover.type === "endDate" && (
          <NotionMiniCalendarPopover
            date={endDate}
            anchorRect={popover.anchorRect}
            onSelectDate={(newDate) => {
              setEndDate(newDate);
              if (newDate < date) {
                setDate(newDate);
              }
              setPopover(null);
            }}
            onClose={() => setPopover(null)}
          />
        )}

        {popover && popover.type === "startTime" && (
          <NotionTimeMenuPopover
            selectedTime={startTime}
            anchorRect={popover.anchorRect}
            isEnd={false}
            onSelectTime={(val) => {
              setStartTime(val);
              setPopover(null);
            }}
            onClose={() => setPopover(null)}
          />
        )}

        {popover && popover.type === "endTime" && (
          <NotionTimeMenuPopover
            selectedTime={endTime}
            anchorRect={popover.anchorRect}
            isEnd={true}
            startTime={startTime}
            onSelectTime={(val) => {
              setEndTime(val);
              setPopover(null);
            }}
            onClose={() => setPopover(null)}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   macOS 原生“偏好设置”中心 (Settings Window, 快捷键 ⌘,)
   ============================================================ */
function AppSettingsModal({
  open,
  onClose,
  initialTab = "general",
  t = {},
  setTweak = () => {},
  feishuStatus,
  syncInfo,
  onPull,
  onPush,
  syncing,
  snapStep,
  onSnapStepChange,
  onTriggerTestAlert,
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // "general" | "appearance" | "execution" | "shortcuts" | "sync"
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedIcs, setCopiedIcs] = useState(false);

  useEffect(() => {
    if (open && initialTab) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const currentSound = t.alertSound || "Glass";
  const handleTestSound = () => {
    if (window.SFX && window.SFX.playSystemSound) {
      window.SFX.playSystemSound(currentSound);
    }
  };

  const handleTestTTS = () => {
    if (window.SFX && window.SFX.notify) {
      window.SFX.notify({
        title: "语音播报测试",
        message: "测试日程",
        sound: currentSound,
        tts: true,
        speakText: "注意：你的日程「商业计划撰写」已到时间，请立即开始执行",
      });
    }
  };

  return (
    <div className="apple-sheet-backdrop" onClick={onClose}>
      <div className="mac-settings-dialog" onClick={(e) => e.stopPropagation()}>
        {/* 左侧分栏分类导航 (对标 Raycast / Ventura) */}
        <div className="mac-settings-sidebar">
          <div className="mac-settings-sidebar-header">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <i className="ph-bold ph-gear motion-icon motion-icon-gear" style={{ fontSize: "16px", color: "var(--notion-accent)" }} />
              <span>偏好设置</span>
            </span>
            <span style={{ fontSize: "10px", color: "#8e8e93", padding: "1px 5px", background: "rgba(0,0,0,0.06)", borderRadius: "4px" }}>⌘,</span>
          </div>

          <button
            type="button"
            className={"mac-settings-nav-item" + (activeTab === "general" ? " active" : "")}
            onClick={() => setActiveTab("general")}
          >
            <span className="mac-settings-nav-icon mac-nav-icon-general">
              <i className="ph-bold ph-sliders" />
            </span>
            <span>通用</span>
          </button>

          <button
            type="button"
            className={"mac-settings-nav-item" + (activeTab === "appearance" ? " active" : "")}
            onClick={() => setActiveTab("appearance")}
          >
            <span className="mac-settings-nav-icon mac-nav-icon-appearance">
              <i className="ph-bold ph-paint-brush" />
            </span>
            <span>外观与显示</span>
          </button>

          <button
            type="button"
            className={"mac-settings-nav-item" + (activeTab === "execution" ? " active" : "")}
            onClick={() => setActiveTab("execution")}
          >
            <span className="mac-settings-nav-icon mac-nav-icon-execution">
              <i className="ph-bold ph-bell-ringing" />
            </span>
            <span>强提醒与执行</span>
          </button>

          <button
            type="button"
            className={"mac-settings-nav-item" + (activeTab === "shortcuts" ? " active" : "")}
            onClick={() => setActiveTab("shortcuts")}
          >
            <span className="mac-settings-nav-icon mac-nav-icon-shortcuts">
              <i className="ph-bold ph-keyboard" />
            </span>
            <span>快捷键与手势</span>
          </button>

          <button
            type="button"
            className={"mac-settings-nav-item" + (activeTab === "sync" ? " active" : "")}
            onClick={() => setActiveTab("sync")}
          >
            <span className="mac-settings-nav-icon mac-nav-icon-sync">
              <i className="ph-bold ph-cloud" />
            </span>
            <span>云同步与存储</span>
          </button>
        </div>

        {/* 右侧设置内容详情主面板 */}
        <div className="mac-settings-main">
          <div className="mac-settings-main-header">
            <div className="mac-settings-main-title">
              {activeTab === "general" && "通用"}
              {activeTab === "appearance" && "外观与显示"}
              {activeTab === "execution" && "强提醒与执行系统 (Execution-Oriented)"}
              {activeTab === "shortcuts" && "键鼠操作与触控手势全指南"}
              {activeTab === "sync" && "飞书多维表格与离线存储"}
            </div>
            <button className="apple-sheet-close" onClick={onClose} title="关闭 (Esc)">
              <i className="ph-bold ph-x" />
            </button>
          </div>

          <div className="mac-settings-scroll-body">
            {/* Tab 1: 通用 */}
            {activeTab === "general" && (
              <>
                <div className="mac-settings-group-label">时间轴与吸附</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row">
                    <span className="apple-row-label">时间拖拽吸附粒度</span>
                    <div className="apple-row-content">
                      <div className="apple-segmented-group">
                        {[
                          { val: 15, label: "15 分钟" },
                          { val: 30, label: "30 分钟" },
                          { val: 60, label: "60 分钟" },
                        ].map((item) => (
                          <button
                            type="button"
                            key={item.val}
                            className={"apple-segmented-item" + ((snapStep || 15) === item.val ? " active" : "")}
                            onClick={() => onSnapStepChange && onSnapStepChange(item.val)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="apple-grouped-row" style={{ cursor: "pointer" }} onClick={() => setTweak("sfx", !t.sfx)}>
                    <div>
                      <div className="apple-row-label">交互音效与“嘎嘣脆”机械反馈</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>在切月、对齐、卡片放置时播放物理级 WebAudio 咔嚓音</div>
                    </div>
                    <div className={"apple-switch" + (t.sfx ? " active" : "")}>
                      <div className="apple-switch-thumb" />
                    </div>
                  </div>
                </div>

                <div className="mac-settings-group-label">界面控件显示</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row" style={{ cursor: "pointer" }} onClick={() => setTweak("zen", !t.zen)}>
                    <div>
                      <div className="apple-row-label">年看板常驻缩放工具栏</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>在 365 全年画布视图下常驻显示底部填充与缩放工具</div>
                    </div>
                    <div className={"apple-switch" + (!t.zen ? " active" : "")}>
                      <div className="apple-switch-thumb" />
                    </div>
                  </div>
                  <div className="apple-grouped-row" style={{ cursor: "pointer" }} onClick={() => setTweak("fabShow", t.fabShow === false ? true : false)}>
                    <div>
                      <div className="apple-row-label">右下角快捷新建悬浮按钮 (FAB)</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>在右下角悬浮毛玻璃胶囊（侧栏展开时自动避让隐藏；按键盘 N 亦可随时新建）</div>
                    </div>
                    <div className={"apple-switch" + (t.fabShow !== false ? " active" : "")}>
                      <div className="apple-switch-thumb" />
                    </div>
                  </div>
                </div>

                <div className="mac-settings-group-label">运行架构</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row">
                    <span className="apple-row-label">离线持久化能力</span>
                    <span style={{ fontSize: "12px", color: "#34C759", fontWeight: "600" }}>✓ 本地持久化 (Local SQLite/JSON + WebKit 离线可用)</span>
                  </div>
                  <div className="apple-grouped-row">
                    <span className="apple-row-label">客户端形态</span>
                    <span style={{ fontSize: "12px", color: "#8e8e93" }}>macOS 原生执行应用 (v1.1.0 商业版)</span>
                  </div>
                </div>
              </>
            )}

            {/* Tab 2: 外观与显示 */}
            {activeTab === "appearance" && (
              <>
                <div className="mac-settings-group-label">字体排版</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row">
                    <span className="apple-row-label">全局字体族群</span>
                    <div className="apple-row-content">
                      <div className="apple-segmented-group">
                        {["苹方 (系统高清)", "宋体 (墨韵纸感)"].map((f) => (
                          <button
                            type="button"
                            key={f}
                            className={"apple-segmented-item" + ((t.fontStyle || "苹方 (系统高清)") === f ? " active" : "")}
                            onClick={() => setTweak("fontStyle", f)}
                          >
                            {f.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mac-settings-group-label">色彩与主题</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row">
                    <span className="apple-row-label">调色板主题</span>
                    <div className="apple-row-content">
                      <div className="apple-segmented-group">
                        {["经典蓝", "墨韵纸感", "松烟绿", "玄夜"].map((thm) => (
                          <button
                            type="button"
                            key={thm}
                            className={"apple-segmented-item" + (t.theme === thm ? " active" : "")}
                            onClick={() => setTweak("theme", thm)}
                          >
                            {thm}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="apple-grouped-row">
                    <span className="apple-row-label">板块色彩风格</span>
                    <div className="apple-row-content">
                      <div className="apple-segmented-group">
                        {[
                          { val: "彩色", label: "丰富彩色" },
                          { val: "单色", label: "极简黑白" },
                        ].map((m) => (
                          <button
                            type="button"
                            key={m.val}
                            className={"apple-segmented-item" + ((t.colorMode || "彩色") === m.val ? " active" : "")}
                            onClick={() => setTweak("colorMode", m.val)}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mac-settings-group-label">画布与网格细节</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row">
                    <span className="apple-row-label">网格密度</span>
                    <div className="apple-row-content">
                      <div className="apple-segmented-group">
                        {["紧凑", "舒适"].map((den) => (
                          <button
                            type="button"
                            key={den}
                            className={"apple-segmented-item" + (t.density === den ? " active" : "")}
                            onClick={() => setTweak("density", den)}
                          >
                            {den}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="apple-grouped-row" style={{ cursor: "pointer" }} onClick={() => setTweak("weekend", !t.weekend)}>
                    <div>
                      <div className="apple-row-label">周末底纹高亮</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>在周六与周日列头施加专属柔光底色</div>
                    </div>
                    <div className={"apple-switch" + (t.weekend ? " active" : "")}>
                      <div className="apple-switch-thumb" />
                    </div>
                  </div>

                  <div className="apple-grouped-row" style={{ cursor: "pointer" }} onClick={() => setTweak("missed", !t.missed)}>
                    <div>
                      <div className="apple-row-label">过去未填日期柔光底纹</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>醒目标识历史未记录空白单元格</div>
                    </div>
                    <div className={"apple-switch" + (t.missed ? " active" : "")}>
                      <div className="apple-switch-thumb" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab 3: 强提醒与执行 (Execution-Oriented Alert System) */}
            {activeTab === "execution" && (
              <>
                <div className="mac-settings-group-label">执行型闭环模式 (Until Acknowledged)</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row" style={{ cursor: "pointer" }} onClick={() => setTweak("alertEnabled", t.alertEnabled === false)}>
                    <div>
                      <div className="apple-row-label">到点强提醒总开关</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>参考 Remember 核心：提醒不能随手划掉就消失，必须明确确认执行</div>
                    </div>
                    <div className={"apple-switch" + (t.alertEnabled !== false ? " active" : "")}>
                      <div className="apple-switch-thumb" />
                    </div>
                  </div>

                  <div className="apple-grouped-row">
                    <div>
                      <div className="apple-row-label">自愈升级与催促机制</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>若到点 2 分钟未点击响应，自动升级催促并持续重试</div>
                    </div>
                    <span style={{ fontSize: "12px", color: "#007AFF", fontWeight: "600" }}>✓ 2分钟自愈循环开启</span>
                  </div>

                  <div className="apple-grouped-row">
                    <span className="apple-row-label">提前预热提醒</span>
                    <div className="apple-row-content">
                      <div className="apple-segmented-group">
                        {[
                          { val: 0, label: "准点时刻" },
                          { val: 5, label: "提前 5 分钟" },
                          { val: 15, label: "提前 15 分钟" },
                        ].map((lead) => (
                          <button
                            type="button"
                            key={lead.val}
                            className={"apple-segmented-item" + ((t.alertLeadMinutes || 0) === lead.val ? " active" : "")}
                            onClick={() => setTweak("alertLeadMinutes", lead.val)}
                          >
                            {lead.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mac-settings-group-label">系统铃声与音效定制</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row">
                    <div>
                      <div className="apple-row-label">播放铃声音色</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>基于 macOS 原生系统级音频引擎（afplay 0延迟极速发声）</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <div className="mac-select-picker">
                        <select
                          value={currentSound}
                          onChange={(e) => setTweak("alertSound", e.target.value)}
                        >
                          <option value="Glass">Glass (琉璃水晶 - 经典)</option>
                          <option value="Ping">Ping (灵动清音)</option>
                          <option value="Bottle">Bottle (清脆瓶鸣)</option>
                          <option value="Hero">Hero (胜利高亢)</option>
                          <option value="Tink">Tink (微妙回响)</option>
                          <option value="Purr">Purr (柔和微震)</option>
                          <option value="Alarm">Alarm (急促警鸣)</option>
                          <option value="Chime">Chime (日系风铃)</option>
                        </select>
                        <span className="mac-select-caret">
                          <i className="ph-bold ph-caret-up-down" />
                        </span>
                      </div>
                      <button type="button" className="mac-btn-action" onClick={handleTestSound} title="试听当前铃声音色">
                        <i className="ph-bold ph-play" style={{ fontSize: "11px", color: "var(--notion-accent, #007AFF)" }} />
                        <span>试听</span>
                      </button>
                    </div>
                  </div>

                  <div className="apple-grouped-row" style={{ cursor: "pointer" }} onClick={() => setTweak("ttsSpeak", !t.ttsSpeak)}>
                    <div>
                      <div className="apple-row-label">macOS TTS 普通话语音朗读</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>调用系统 Tingting 语音真人念出“注意：日程「xxx」已到时间”</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <button type="button" className="mac-btn-action" onClick={(e) => { e.stopPropagation(); handleTestTTS(); }}>
                        <i className="ph-bold ph-speaker-high" style={{ fontSize: "12px" }} />
                        <span>测试语音</span>
                      </button>
                      <div className={"apple-switch" + (t.ttsSpeak ? " active" : "")}>
                        <div className="apple-switch-thumb" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mac-settings-group-label">苹果系统生态跨端联动</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row" style={{ cursor: "pointer" }} onClick={() => setTweak("syncAppleReminders", t.syncAppleReminders === false)}>
                    <div>
                      <div className="apple-row-label">联动 Apple 提醒事项 (Reminders.app)</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>创建日程时同步至苹果提醒事项，在 iPhone、Apple Watch 同步响铃</div>
                    </div>
                    <div className={"apple-switch" + (t.syncAppleReminders !== false ? " active" : "")}>
                      <div className="apple-switch-thumb" />
                    </div>
                  </div>

                  <div className="apple-grouped-row">
                    <div>
                      <div className="apple-row-label">模拟体验全屏强提醒</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>立刻模拟一个到点强提醒，体验置顶唤醒与执行卡片交互</div>
                    </div>
                    <button
                      type="button"
                      className="mac-btn-action primary"
                      onClick={() => {
                        onClose();
                        onTriggerTestAlert && onTriggerTestAlert();
                      }}
                    >
                      <i className="ph-bold ph-lightning" />
                      <span>⚡ 立即模拟触发</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Tab 4: 快捷键与手势全指南 */}
            {activeTab === "shortcuts" && (
              <>
                <div className="mac-settings-group-label">鼠标与指针交互规范</div>
                <div className="apple-grouped-card">
                  <div className="mac-shortcut-grid">
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">单击网格 / 日期单元格</span>
                      <span style={{ fontSize: "12px", color: "#34C759", fontWeight: "600" }}>仅选中与聚焦（不弹出新建窗口）</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">双击空白网格 / 日期单元格</span>
                      <span className="mac-kbd">双击 (Double Click) 快速新建</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">双击已有日程卡片</span>
                      <span className="mac-kbd">双击快速打开编辑</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">拖拽卡片 / 下拉拉伸调整时长</span>
                      <span className="mac-kbd">按住鼠标直接拖拽</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">右键单击任意卡片或空白处</span>
                      <span className="mac-kbd">唤出多功能上下文菜单</span>
                    </div>
                  </div>
                </div>

                <div className="mac-settings-group-label">触控板手势与物理音效</div>
                <div className="apple-grouped-card">
                  <div className="mac-shortcut-grid">
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">触控板双指左右横向滑动</span>
                      <span className="mac-kbd">阻尼切月 +“嘎嘣脆”机械确认音</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">触控板双指垂直捏合 / 滚轮</span>
                      <span className="mac-kbd">无级缩放时间轴颗粒度</span>
                    </div>
                  </div>
                </div>

                <div className="mac-settings-group-label">键盘核心快捷键</div>
                <div className="apple-grouped-card">
                  <div className="mac-shortcut-grid">
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">快速新建日程事项</span>
                      <span className="mac-kbd">N</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">打开偏好设置中心</span>
                      <span className="mac-kbd">⌘ ,</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">全局日程搜索</span>
                      <span className="mac-kbd">⌘ K</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">快速回到今天</span>
                      <span className="mac-kbd">T</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">前一周期 / 后一周期</span>
                      <span className="mac-kbd">J / K 或 ← / →</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">单日 / 3天 / 周 / 月 / 年视图</span>
                      <span className="mac-kbd">1 / 3 / W / M / Y</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">展开 / 收起侧边抽屉</span>
                      <span className="mac-kbd">D</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">克隆选中日程至次日</span>
                      <span className="mac-kbd">⌘ D</span>
                    </div>
                    <div className="mac-shortcut-row">
                      <span className="mac-shortcut-name">删除当前选中日程</span>
                      <span className="mac-kbd">Delete / ⌫</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab 5: 飞书多维表格同步 */}
            {activeTab === "sync" && (
              <>
                <div className="mac-settings-group-label">连接状态</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row">
                    <span className="apple-row-label">多维表格 Base</span>
                    <span style={{ fontSize: "12px", color: feishuStatus && feishuStatus.configured ? "#34C759" : "#ff9500", fontWeight: "600" }}>
                      {feishuStatus && feishuStatus.configured ? "● 已绑定同步基座" : "○ 离线独立模式"}
                    </span>
                  </div>
                  <div className="apple-grouped-row">
                    <span className="apple-row-label">待写回改动计数</span>
                    <span style={{ fontSize: "12px", color: syncInfo && syncInfo.total > 0 ? "#007AFF" : "#8e8e93", fontWeight: "600" }}>
                      {syncInfo && syncInfo.total > 0 ? `${syncInfo.total} 条改动待同步` : "全部已是最新"}
                    </span>
                  </div>
                </div>

                <div className="mac-settings-group-label">同步模式策略</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row">
                    <div>
                      <div className="apple-row-label">自动实时同步到飞书</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>
                        关闭时所有改动仅保存在本地，点击右上角「写入」时才批量推送到飞书多维表格（推荐）；开启时每次修改即时发起同步。
                      </div>
                    </div>
                    <label className="mac-switch">
                      <input
                        type="checkbox"
                        checked={!!t.realtimeSync}
                        onChange={(e) => setTweak("realtimeSync", e.target.checked)}
                      />
                      <span className="mac-switch-slider" />
                    </label>
                  </div>
                </div>

                <div className="mac-settings-group-label">双向同步操作</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row">
                    <div>
                      <div className="apple-row-label">全量拉取 (Pull)</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>从飞书表格重新拉取最新记录并覆盖本地缓存</div>
                    </div>
                    <button
                      type="button"
                      className="apple-btn-secondary"
                      disabled={syncing}
                      onClick={onPull}
                    >
                      {syncing ? "同步中..." : "立即拉取"}
                    </button>
                  </div>

                  <div className="apple-grouped-row">
                    <div>
                      <div className="apple-row-label">写回修改 (Push)</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", marginTop: "2px" }}>将本地新增、修改与删除的日程写回飞书 Base</div>
                    </div>
                    <button
                      type="button"
                      className="apple-btn-primary"
                      disabled={syncing}
                      onClick={onPush}
                    >
                      {syncing ? "同步中..." : "立即写入"}
                    </button>
                  </div>
                </div>

                <div className="mac-settings-group-label">跨端移动日历订阅 (Webcal / ICS)</div>
                <div className="apple-grouped-card">
                  <div className="apple-grouped-row">
                    <div style={{ flex: 1, marginRight: "12px" }}>
                      <div className="apple-row-label">局域网 / 跨端订阅地址</div>
                      <div style={{ fontSize: "11px", color: "#007AFF", fontFamily: "monospace", marginTop: "4px", wordBreak: "break-all" }}>
                        {feishuStatus && feishuStatus.icsUrl ? feishuStatus.icsUrl : "http://localhost:8080/api/calendar.ics"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="apple-btn-secondary"
                      onClick={() => {
                        const url = (feishuStatus && feishuStatus.icsUrl) ? feishuStatus.icsUrl : `${window.location.origin}/api/calendar.ics`;
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(url);
                        }
                        setCopiedIcs(true);
                        setTimeout(() => setCopiedIcs(false), 2000);
                      }}
                    >
                      {copiedIcs ? "✓ 已复制" : "复制链接"}
                    </button>
                  </div>
                  <div className="apple-grouped-row" style={{ alignItems: "flex-start", paddingTop: "10px", paddingBottom: "10px" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#1f2328", marginBottom: "4px" }}>📱 手机订阅与双向同步指引</div>
                      <div style={{ fontSize: "11.5px", color: "#8e8e93", lineHeight: "1.6" }}>
                        • <b>iPhone / Mac 订阅</b>：打开系统「日历」→ 文件 → 新建日历订阅 → 粘贴上方 URL 即可自动定期拉取。<br />
                        • <b>小米 / Android 订阅</b>：打开「系统日历」→ 设置 → 日历账户管理 / 订阅日历 → 添加网络日历 (URL) 粘贴即可。<br />
                        • <b>小米手机双向读写</b>：标准 ICS/Webcal 订阅在手机端为只读。推荐直接在手机上打开绑定的<b>飞书多维表格</b>，随时随地双向读写修改，电脑端点击“立即拉取”即可实时合流。
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Notion 全局命令面板与搜索浮层 (⌘K) */
function NotionCmdPalette({
  open,
  onClose,
  records = [],
  onSelectDate,
  onViewModeChange,
  onBackToday,
  onNext,
  onPrev,
  onOpenCreate,
  onOpenEdit,
  onToggleWeekend,
  onOpenPomodoro,
  onOpenSettings,
  onOpenGoToDate,
}) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  const COMMAND_ACTIONS = useMemo(() => [
    { id: "day", title: "切换为日视图 (Day)", category: "视图切换", icon: "ph-calendar-blank", shortcut: "D 或 1", run: () => onViewModeChange && onViewModeChange("day", 1) },
    { id: "week", title: "切换为周视图 (Week)", category: "视图切换", icon: "ph-calendar-blank", shortcut: "W 或 2", run: () => onViewModeChange && onViewModeChange("week", 7) },
    { id: "month", title: "切换为月视图 (Month)", category: "视图切换", icon: "ph-calendar-blank", shortcut: "M", run: () => onViewModeChange && onViewModeChange("month") },
    { id: "year", title: "切换为全天总结年看板", category: "视图切换", icon: "ph-squares-four", shortcut: "Y", run: () => onViewModeChange && onViewModeChange("year") },
    { id: "today", title: "回到今天 (Today)", category: "日历导航", icon: "ph-clock-clockwise", shortcut: "T", run: onBackToday },
    { id: "next", title: "跳转到下一个 (明天/下周/下月)", category: "日历导航", icon: "ph-arrow-right", shortcut: "J 或 →", run: onNext },
    { id: "prev", title: "跳转到上一个 (昨天/上周/上月)", category: "日历导航", icon: "ph-arrow-left", shortcut: "K 或 ←", run: onPrev },
    { id: "gotodate", title: "跳转到指定日期 (Go to date...)", category: "日历导航", icon: "ph-calendar-plus", shortcut: ".", run: onOpenGoToDate },
    { id: "create", title: "新建日程 (Create Event)", category: "日程管理", icon: "ph-plus-circle", shortcut: "C", run: onOpenCreate },
    { id: "edit", title: "编辑选中日程 (Edit Event)", category: "日程管理", icon: "ph-pencil-simple", shortcut: "E", run: onOpenEdit },
    { id: "weekend", title: "显示 / 隐藏周末", category: "偏好设置", icon: "ph-eye", shortcut: "⇧ ⌘ E", run: onToggleWeekend },
    { id: "pomodoro", title: "开启番茄钟 / 专注时钟", category: "效率工具", icon: "ph-timer", shortcut: "P", run: onOpenPomodoro },
    { id: "settings", title: "打开偏好设置", category: "偏好设置", icon: "ph-gear", shortcut: "⌘ ,", run: () => onOpenSettings && onOpenSettings("general") },
    { id: "shortcuts", title: "查看快捷键与手势全指南", category: "帮助", icon: "ph-keyboard", shortcut: "?", run: () => onOpenSettings && onOpenSettings("shortcuts") },
  ], [onViewModeChange, onBackToday, onNext, onPrev, onOpenGoToDate, onOpenCreate, onOpenEdit, onToggleWeekend, onOpenPomodoro, onOpenSettings]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [open]);

  if (!open) return null;

  const q = query.trim().toLowerCase();

  // 1. 过滤指令
  const matchedActions = COMMAND_ACTIONS.filter((act) => {
    if (!q) return true;
    return (
      act.title.toLowerCase().includes(q) ||
      act.category.toLowerCase().includes(q) ||
      act.shortcut.toLowerCase().includes(q) ||
      act.id.toLowerCase().includes(q)
    );
  });

  // 2. 过滤日程记录
  const matchedRecords = [];
  if (q) {
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (
        (r.text && r.text.toLowerCase().includes(q)) ||
        (r.note && r.note.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.date && r.date.includes(q))
      ) {
        matchedRecords.push(r);
        if (matchedRecords.length >= 20) break;
      }
    }
  } else {
    matchedRecords.push(...records.slice(Math.max(0, records.length - 6)).reverse());
  }

  // 扁平列表（用于键盘上下方向键选中）
  const flatItems = [
    ...matchedActions.map((a) => ({ type: "action", data: a })),
    ...matchedRecords.map((r) => ({ type: "record", data: r })),
  ];

  const handleExecute = (item) => {
    if (!item) return;
    if (item.type === "action") {
      item.data.run && item.data.run();
      onClose();
    } else if (item.type === "record") {
      onSelectDate && onSelectDate(item.data.date);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(0,0,0,0.38)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div className="notion-cmd-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="notion-cmd-input"
          placeholder="键入指令或搜索日程/日期 (如: 日视图, 周末, 2026-09)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIdx(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onClose();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIdx((i) => (i + 1) % Math.max(1, flatItems.length));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIdx((i) => (i - 1 + flatItems.length) % Math.max(1, flatItems.length));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (flatItems.length > 0) {
                handleExecute(flatItems[selectedIdx] || flatItems[0]);
              }
            }
          }}
        />

        <div className="notion-cmd-list">
          {flatItems.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "var(--ink-soft)", fontSize: "13px" }}>
              没有找到匹配的指令或日程
            </div>
          ) : (
            <>
              {matchedActions.length > 0 && (
                <div className="notion-cmd-section-title">常用操作与快捷指令</div>
              )}
              {matchedActions.map((act, idx) => {
                const isSelected = selectedIdx === idx;
                return (
                  <div
                    key={`act_${act.id}`}
                    className={"notion-cmd-item" + (isSelected ? " is-selected" : "")}
                    onClick={() => handleExecute({ type: "action", data: act })}
                    onMouseEnter={() => setSelectedIdx(idx)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <i className={`ph-bold ${act.icon}`} style={{ color: "#007aff", fontSize: "15px", flexShrink: 0 }} />
                      <span style={{ fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {act.title}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>· {act.category}</span>
                    </div>
                    <span className="notion-cmd-badge">{act.shortcut}</span>
                  </div>
                );
              })}

              {matchedRecords.length > 0 && (
                <div className="notion-cmd-section-title" style={{ marginTop: matchedActions.length > 0 ? "8px" : 0 }}>
                  {q ? "匹配的日程记录" : "最近日程安排"}
                </div>
              )}
              {matchedRecords.map((r, rIdx) => {
                const overallIdx = matchedActions.length + rIdx;
                const isSelected = selectedIdx === overallIdx;
                const cat = CATS[r.category] || CATS["生活"];
                return (
                  <div
                    key={`rec_${r.record_id || r._uid || r.date + '_' + rIdx}`}
                    className={"notion-cmd-item" + (isSelected ? " is-selected" : "")}
                    onClick={() => handleExecute({ type: "record", data: r })}
                    onMouseEnter={() => setSelectedIdx(overallIdx)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: cat.solid,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.text || "（无标题日程）"}
                      </span>
                      {r.category ? (
                        <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
                          · {r.category}
                        </span>
                      ) : null}
                    </div>
                    <span className="notion-cmd-date">{r.date}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* 跳转指定日期轻量浮窗 (快捷键 .) */
function GoToDateModal({ open, onClose, onSelectDate, currentDate }) {
  if (!open) return null;
  const [dateInput, setDateInput] = useState(currentDate || TODAY);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  const handleJump = (target) => {
    if (!target) return;
    let finalDate = target.trim();
    const currentYear = new Date().getFullYear();
    if (/^\d{1,2}-\d{1,2}$/.test(finalDate)) {
      const parts = finalDate.split("-");
      finalDate = `${currentYear}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
    } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(finalDate)) {
      const parts = finalDate.split("-");
      finalDate = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) {
      onSelectDate && onSelectDate(finalDate);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(0,0,0,0.38)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div className="notion-goto-date-card" onClick={(e) => e.stopPropagation()}>
        <div className="notion-goto-hd">
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <i className="ph-bold ph-calendar-blank" style={{ color: "#007aff", fontSize: "16px" }} />
            跳转到指定日期 (Go to date)
          </span>
          <button className="notion-icon-btn" onClick={onClose} title="关闭 (Esc)">✕</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            ref={inputRef}
            type="date"
            className="notion-goto-input"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJump(dateInput);
              else if (e.key === "Escape") onClose();
            }}
          />
          <button
            type="button"
            className="notion-goto-btn-confirm"
            onClick={() => handleJump(dateInput)}
          >
            跳转 (↵)
          </button>
        </div>
        <div className="notion-goto-quick-chips">
          <span onClick={() => handleJump(TODAY)}>今天 (T)</span>
          <span onClick={() => handleJump(getNextDayStr(TODAY))}>明天 (+1)</span>
          <span onClick={() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            handleJump(d.toISOString().slice(0, 10));
          }}>下周 (+7)</span>
          <span onClick={() => {
            const d = new Date();
            d.setMonth(d.getMonth() + 1);
            handleJump(d.toISOString().slice(0, 10));
          }}>下月 (+30)</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Apple 风格“相同内容同步取消/删除”确认 Sheet
   ============================================================ */
function SameContentConfirmModal({
  modal,
  onConfirmAll,
  onConfirmSingle,
  onClose,
}) {
  if (!modal || !modal.event) return null;
  const { event, sameEvents = [] } = modal;
  const count = sameEvents.length;

  const dateListPreview = sameEvents
    .map((e) => e.date)
    .filter(Boolean)
    .sort()
    .slice(0, 6)
    .join("、");
  const moreText = count > 6 ? ` 等共 ${count} 天` : "";

  return (
    <div className="apple-confirm-backdrop" onClick={onClose} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="apple-confirm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="apple-confirm-icon-wrap">
          <i className="ph-bold ph-warning-circle motion-icon motion-icon-pulse" style={{ color: "#ff9500", fontSize: "36px" }} />
        </div>

        <div className="apple-confirm-title">
          检测到 {count} 个相同日程
        </div>
        <div className="apple-confirm-desc">
          当前日程「{event.text || "无标题"}」在其他 {count - 1} 天也有相同记录：
          <div className="apple-confirm-dates">{dateListPreview}{moreText}</div>
          请选择要取消哪一部分？
        </div>

        <div className="apple-confirm-actions">
          <button
            type="button"
            className="apple-confirm-btn danger"
            onClick={(e) => {
              e.stopPropagation();
              onConfirmAll && onConfirmAll(sameEvents);
            }}
          >
            全部同步取消 ({count})
          </button>
          <button
            type="button"
            className="apple-confirm-btn secondary"
            onClick={(e) => {
              e.stopPropagation();
              onConfirmSingle && onConfirmSingle(event);
            }}
          >
            仅取消这一天
          </button>
          <button
            type="button"
            className="apple-confirm-btn cancel"
            onClick={onClose}
          >
            暂不取消
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Notion 风格右键菜单组件 (极简动效矢量图标)
   ============================================================ */
/* 执行型强提醒全屏卡片模态窗 (Remember + Upupup 精髓) */
function ExecutionAlertModal({ alert, onStart, onComplete, onSnooze }) {
  if (!alert || !alert.event) return null;
  const ev = alert.event;
  return (
    <div className="execution-alert-backdrop" onClick={(e) => e.stopPropagation()}>
      <div className="execution-alert-card">
        <div className="execution-alert-header">
          <span className="execution-alert-tag">
            <i className="ph-bold ph-lightning motion-icon motion-icon-pulse" />
            <span>{alert.isEscalated ? "强烈催促 · 待响应" : "强提醒 · 现在该做"}</span>
          </span>
          <span style={{ fontSize: "12px", color: "#ff3b30", fontWeight: "600" }}>
            {ev.startTimeStr || "准点"}
          </span>
        </div>

        <div>
          <div className="execution-alert-title">{ev.title || "未命名日程"}</div>
          <div className="execution-alert-meta" style={{ marginTop: "6px" }}>
            {ev.category ? <span className="notion-dmp-cat-badge">{ev.category}</span> : null}
            <span>{ev.date || "今天"}</span>
            {ev.durationStr ? <span>· 预计时长 {ev.durationStr}</span> : null}
          </div>
          {ev.desc ? (
            <div style={{ fontSize: "12.5px", color: "#636366", marginTop: "8px", lineHeight: "1.4", maxHeight: "60px", overflow: "hidden" }}>
              {ev.desc}
            </div>
          ) : null}
        </div>

        <div className="execution-alert-actions">
          <button className="execution-btn-start" onClick={() => onStart(ev)}>
            <i className="ph-bold ph-play-fill" />
            <span>⚡ 立即开始执行</span>
          </button>
          <div className="execution-btn-sub-group">
            <button className="execution-btn-sub" onClick={() => onSnooze(ev, 5)}>
              <i className="ph-bold ph-clock" />
              <span>稍后 5 分钟 (Snooze)</span>
            </button>
            <button className="execution-btn-sub" onClick={() => onComplete(ev)}>
              <i className="ph-bold ph-check" />
              <span>标为已完成</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   番茄钟 / 专注时钟模块 (深度融合极简黑白自由专注仪表盘与外圈日程)
   ============================================================ */
function formatPomodoroTime(sec) {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

// 原生 Web Audio 轻量白噪音与音效发生器 (零外部依赖，极速纯净)
const PomodoroAudio = {
  ctx: null,
  noiseNode: null,
  tickTimer: null,
  currentType: "none",

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  },

  play(type) {
    this.stop();
    this.init();
    if (!this.ctx) return;
    this.currentType = type;

    if (type === "rain") {
      try {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
          b6 = white * 0.115926;
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(650, this.ctx.currentTime);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.06, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        whiteNoise.start();
        this.noiseNode = { source: whiteNoise, gain: gainNode };
      } catch (e) {}
    } else if (type === "tick") {
      this.tickTimer = setInterval(() => {
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.035);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.04);
        } catch (e) {}
      }, 1000);
    }
  },

  stop() {
    if (this.noiseNode) {
      try {
        this.noiseNode.source.stop();
        this.noiseNode.source.disconnect();
      } catch (e) {}
      this.noiseNode = null;
    }
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.currentType = "none";
  },

  ringBell() {
    this.init();
    if (window.SFX && window.SFX.bell) {
      window.SFX.bell();
      return;
    }
    if (!this.ctx) return;
    try {
      // 优雅清脆三和弦音：C6 (1046.5Hz), E6 (1318.5Hz), G6 (1567.98Hz)
      const freqs = [1046.5, 1318.5, 1567.98];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        const st = this.ctx.currentTime + idx * 0.12;
        osc.frequency.setValueAtTime(f, st);
        gain.gain.setValueAtTime(0.12, st);
        gain.gain.exponentialRampToValueAtTime(0.0001, st + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(st);
        osc.stop(st + 1.3);
      });
    } catch (e) {}
  }
};

// 辅助函数：计算极坐标转换为笛卡尔坐标与圆弧 SVG Path
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  let diff = endAngle - startAngle;
  if (diff < 0) diff += 360;
  if (diff >= 360) diff = 359.99;
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const arcSweep = diff <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, arcSweep, 0, end.x, end.y
  ].join(" ");
}

/* 专注时钟 / 番茄钟全屏卡片模态窗 (PomodoroModal) */
function PomodoroModal({
  open,
  onClose,
  state,
  onStart,
  onPause,
  onReset,
  onSelectDuration,
  onSwitchMode,
  onSetWhiteNoise,
  onUpdateTarget,
  onSaveAsEvent,
  byDate,
}) {
  if (!open) return null;

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState(state.targetText || "深度专注");
  const [showDrawer, setShowDrawer] = useState(false);

  // 快捷预设档位 (分钟)
  const PRESETS = [1, 5, 10, 15, 25, 30, 45, 60];

  // 进度计算 (半径 r = 104, 周长 C ≈ 653.45)
  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const progress = state.totalSeconds > 0
    ? (state.totalSeconds - state.remainingSeconds) / state.totalSeconds
    : 0;
  // 专注时倒计环随时间递减；休息时随时间递增
  const dashoffset = state.mode === "break"
    ? circumference * (1 - progress)
    : circumference * progress;

  // 今日已过去时间感知 (百分比)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayPassedPct = Math.round((currentMinutes / 1440) * 100);

  // 当前时间指针角度 (12小时制，360度)
  const currentHour12 = (now.getHours() % 12) + now.getMinutes() / 60;
  const currentTimeAngle = currentHour12 * 30; // 0度在12点方向

  // 外圈日程圆弧投影 (借鉴 02 原型：将今日接下来的时间块投射在表盘外圈)
  const todayEvents = useMemo(() => {
    if (!byDate) return [];
    const evList = byDate[TODAY] || [];
    return evList.filter((ev) => !ev.markedDelete && ev.startTimeStr);
  }, [byDate]);

  // 计算今日日程在 12 小时钟面上的圆弧
  const eventArcs = useMemo(() => {
    return todayEvents.map((ev) => {
      const sMin = parseTimeToMinutes(ev.startTimeStr || "09:00");
      const eMin = ev.endTimeStr ? parseTimeToMinutes(ev.endTimeStr) : (sMin + 60);
      const sH12 = (Math.floor(sMin / 60) % 12) + (sMin % 60) / 60;
      const eH12 = (Math.floor(eMin / 60) % 12) + (eMin % 60) / 60;
      let startAngle = sH12 * 30;
      let endAngle = eH12 * 30;
      if (endAngle <= startAngle) endAngle += 360;
      return {
        event: ev,
        path: describeArc(160, 160, 142, startAngle, endAngle),
        color: ev.color || (ev.category && CATS[ev.category] && CATS[ev.category].solid) || "#007aff",
      };
    });
  }, [todayEvents]);

  // 键盘快捷键响应 (Space 开始/暂停, Esc 最小化, R 重置)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (state.isRunning) onPause();
        else onStart();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        onReset();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.isRunning, onStart, onPause, onClose, onReset]);

  return (
    <div className="pomodoro-backdrop" onClick={onClose}>
      <div className="pomodoro-card" onClick={(e) => e.stopPropagation()}>
        {/* 顶部标题栏与关闭胶囊 */}
        <div className="pomodoro-header">
          <div className="pomodoro-header-left">
            <span className="pomodoro-badge">
              <span className={`pomodoro-pulse-dot ${state.isRunning ? "is-running" : ""}`} />
              <span>{state.mode === "break" ? "舒缓休息模式" : "专注心流模式"}</span>
            </span>
            <span className="pomodoro-day-percent" title="今日已过时间占比">
              今日已过 {dayPassedPct}%
            </span>
          </div>

          <div className="pomodoro-header-right">
            {/* 极简白噪音开关 (参考 12 原型) */}
            <div className="pomodoro-noise-switcher" title="环境白噪音与时钟滴答">
              <button
                type="button"
                className={`noise-btn ${state.whiteNoise === "none" ? "active" : ""}`}
                onClick={() => onSetWhiteNoise("none")}
                title="静音"
              >
                <i className="ph-bold ph-speaker-slash" />
              </button>
              <button
                type="button"
                className={`noise-btn ${state.whiteNoise === "rain" ? "active" : ""}`}
                onClick={() => onSetWhiteNoise("rain")}
                title="舒缓雨声白噪音"
              >
                <i className="ph-bold ph-cloud-rain" />
              </button>
              <button
                type="button"
                className={`noise-btn ${state.whiteNoise === "tick" ? "active" : ""}`}
                onClick={() => onSetWhiteNoise("tick")}
                title="机械表盘滴答音"
              >
                <i className="ph-bold ph-timer" />
              </button>
            </div>

            {/* 最小化/收起按钮 */}
            <button
              type="button"
              className="pomodoro-close-btn"
              onClick={onClose}
              title="最小化收起到顶栏 (Esc / P)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* 核心专注目标编辑 */}
        <div className="pomodoro-target-section">
          {isEditingTarget ? (
            <div className="pomodoro-target-input-wrap">
              <input
                type="text"
                className="pomodoro-target-input"
                value={targetDraft}
                autoFocus
                placeholder="正在专注的目标事项..."
                onChange={(e) => setTargetDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onUpdateTarget(targetDraft.trim() || "深度专注");
                    setIsEditingTarget(false);
                  } else if (e.key === "Escape") {
                    setIsEditingTarget(false);
                  }
                }}
                onBlur={() => {
                  onUpdateTarget(targetDraft.trim() || "深度专注");
                  setIsEditingTarget(false);
                }}
              />
            </div>
          ) : (
            <div
              className="pomodoro-target-display"
              onClick={() => {
                setTargetDraft(state.targetText || "深度专注");
                setIsEditingTarget(true);
              }}
              title="轻点修改当前专注目标"
            >
              <span className="pomodoro-target-icon">🎯</span>
              <span className="pomodoro-target-text">{state.targetText || "深度专注"}</span>
              <span className="pomodoro-target-edit-hint">
                <i className="ph-bold ph-pencil-simple" />
              </span>
            </div>
          )}
        </div>

        {/* 核心 360° 阻尼刻度盘与倒计时环 (融合 18 与 02 原型) */}
        <div className="pomodoro-dial-wrap">
          <svg className="pomodoro-svg" width="320" height="320" viewBox="0 0 320 320">
            {/* 1. 最外层 12 小时钟面基准细轨道 */}
            <circle cx="160" cy="160" r="142" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.08" />

            {/* 2. 外圈日程投影弧段 (小初 02 原型精髓：当天日程时段在表盘上直观可见) */}
            {eventArcs.map((arc, i) => (
              <path
                key={i}
                d={arc.path}
                fill="none"
                stroke={arc.color}
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.75"
                className="pomodoro-schedule-arc"
              >
                <title>{arc.event.text || arc.event.title} ({arc.event.startTimeStr} - {arc.event.endTimeStr})</title>
              </path>
            ))}

            {/* 当前真实时间指针外标点 */}
            {(() => {
              const pt = polarToCartesian(160, 160, 142, currentTimeAngle);
              return (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#ff9500"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="pomodoro-now-pointer"
                >
                  <title>当前时间 {pad2(now.getHours())}:{pad2(now.getMinutes())}</title>
                </circle>
              );
            })()}

            {/* 3. 60 根精细机械阻尼刻度线 (Focus 18 原型精髓) */}
            {Array.from({ length: 60 }).map((_, i) => {
              const angle = i * 6; // 每分钟 6 度
              const isMajor = i % 5 === 0;
              const isQuarter = i % 15 === 0;
              const rOuter = 130;
              const rInner = isQuarter ? 116 : (isMajor ? 120 : 124);
              const p1 = polarToCartesian(160, 160, rInner, angle);
              const p2 = polarToCartesian(160, 160, rOuter, angle);
              return (
                <line
                  key={i}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="currentColor"
                  strokeWidth={isMajor ? (isQuarter ? 2 : 1.5) : 0.8}
                  strokeLinecap="round"
                  opacity={isMajor ? 0.7 : 0.25}
                />
              );
            })}

            {/* 0, 15, 30, 45 极简刻度数字 */}
            <text x="160" y="44" textAnchor="middle" className="pomodoro-dial-number">60</text>
            <text x="278" y="164" textAnchor="middle" className="pomodoro-dial-number">15</text>
            <text x="160" y="284" textAnchor="middle" className="pomodoro-dial-number">30</text>
            <text x="42" y="164" textAnchor="middle" className="pomodoro-dial-number">45</text>

            {/* 4. 内部主倒计时圆弧 (平滑过渡) */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              opacity="0.08"
            />
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke={state.mode === "break" ? "#34c759" : (state.isRunning ? "var(--notion-accent, #007aff)" : "var(--ink, #1c1c1e)")}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              transform="rotate(-90 160 160)"
              className="pomodoro-progress-circle"
            />

            {/* 进度环端点流光小圆点 */}
            {state.isRunning && (
              (() => {
                const currentAngle = -90 + (progress * 360);
                const pt = polarToCartesian(160, 160, radius, currentAngle + 90);
                return (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#ffffff"
                    stroke={state.mode === "break" ? "#34c759" : "var(--notion-accent, #007aff)"}
                    strokeWidth="3"
                    className="pomodoro-glow-thumb"
                  />
                );
              })()
            )}
          </svg>

          {/* 表盘中心高对比大字号数字 */}
          <div className="pomodoro-dial-center">
            <div
              className={`pomodoro-time-number ${state.isRunning ? "is-pulsing" : ""}`}
              onClick={() => setShowDrawer((v) => !v)}
              title="轻点展开/收起 8 档预设时长抽屉"
            >
              {formatPomodoroTime(state.remainingSeconds)}
            </div>

            <div className="pomodoro-status-tag">
              {state.isRunning ? (
                <span className="status-chip is-running">
                  {state.mode === "break" ? "☕ 舒缓休息中" : "🔥 专注心流中"}
                </span>
              ) : state.remainingSeconds === 0 ? (
                <span className="status-chip is-done">🎉 专注达成</span>
              ) : (
                <span className="status-chip is-ready">
                  {state.mode === "break" ? "☕ 准备休息" : "⚡ 准备开始"}
                </span>
              )}
            </div>

            {/* 今日已完成番茄累计统计 */}
            <div className="pomodoro-stats-badge" title="今日累计专注成果">
              <span>🍅 今日已完成 {state.completedCount} 个番茄</span>
              <span className="stats-sep">·</span>
              <span>{state.completedCount * 25} 分钟</span>
            </div>
          </div>
        </div>

        {/* 8 档预设时长抽屉 (Focus 18 原型精髓：磨砂抽屉与直切档位) */}
        <div className={`pomodoro-presets-drawer ${showDrawer ? "is-open" : ""}`}>
          <div className="pomodoro-presets-header">
            <span>选择专注时长</span>
            <div className="pomodoro-duration-stepper">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => onSelectDuration(Math.max(1, Math.round(state.totalSeconds / 60) - 1))}
                title="减少 1 分钟"
              >
                -1m
              </button>
              <span className="stepper-val">{Math.round(state.totalSeconds / 60)} 分钟</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => onSelectDuration(Math.min(120, Math.round(state.totalSeconds / 60) + 1))}
                title="增加 1 分钟"
              >
                +1m
              </button>
            </div>
          </div>
          <div className="pomodoro-preset-chips">
            {PRESETS.map((m) => {
              const active = Math.round(state.totalSeconds / 60) === m;
              return (
                <button
                  key={m}
                  type="button"
                  className={`pomodoro-preset-chip ${active ? "active" : ""}`}
                  onClick={() => {
                    onSelectDuration(m);
                    setShowDrawer(false);
                  }}
                >
                  <span className="preset-chip-num">{m}</span>
                  <span className="preset-chip-unit">m</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 专注完成后的成果沉淀结算卡片 (10 与 16 原型闭环) */}
        {state.showFinishedCard && (
          <div className="pomodoro-finished-card">
            <div className="finished-badge">🎉 达成专注里程碑</div>
            <div className="finished-title">
              完成了一次「{state.targetText || "深度专注"}」
            </div>
            <div className="finished-desc">
              专注时长 {Math.round(state.totalSeconds / 60)} 分钟 · 已计入今日习惯统计
            </div>
            <div className="finished-actions">
              <button
                type="button"
                className="finished-save-btn"
                onClick={() => {
                  onSaveAsEvent();
                }}
              >
                <i className={state.targetEvent ? "ph-bold ph-check-circle" : "ph-bold ph-calendar-plus"} />
                <span>{state.targetEvent ? "标记原日程为完成并打卡" : "沉淀为今日日程并打卡"}</span>
              </button>
              <button
                type="button"
                className="finished-break-btn"
                onClick={() => onSwitchMode("break")}
              >
                <i className="ph-bold ph-coffee" />
                <span>开启 5 分钟休息</span>
              </button>
            </div>
          </div>
        )}

        {/* 底部主控按钮区域 */}
        <div className="pomodoro-actions">
          {state.isRunning ? (
            <div className="pomodoro-action-group">
              <button
                type="button"
                className="pomodoro-btn-primary is-pause"
                onClick={onPause}
                title="暂停专注 (Space)"
              >
                <i className="ph-bold ph-pause-fill" />
                <span>暂停</span>
              </button>
              <button
                type="button"
                className="pomodoro-btn-sub"
                onClick={onReset}
                title="重置当前计时"
              >
                <i className="ph-bold ph-arrow-counter-clockwise" />
                <span>重置</span>
              </button>
              {state.mode === "focus" && (
                <button
                  type="button"
                  className="pomodoro-btn-sub"
                  onClick={() => onSwitchMode("break")}
                  title="提前进入休息"
                >
                  <i className="ph-bold ph-coffee" />
                  <span>休息</span>
                </button>
              )}
            </div>
          ) : (
            <div className="pomodoro-action-group">
              <button
                type="button"
                className="pomodoro-btn-primary is-start"
                onClick={onStart}
                title="开启专注心流 (Space)"
              >
                <i className="ph-bold ph-play-fill" />
                <span>{state.remainingSeconds < state.totalSeconds ? "继续专注" : "开始专注"}</span>
              </button>

              <button
                type="button"
                className="pomodoro-btn-sub"
                onClick={() => setShowDrawer((v) => !v)}
                title="展开预设档位"
              >
                <i className="ph-bold ph-sliders-horizontal" />
                <span>{Math.round(state.totalSeconds / 60)}m 档位</span>
              </button>

              <button
                type="button"
                className={`pomodoro-btn-sub ${state.mode === "break" ? "active" : ""}`}
                onClick={() => onSwitchMode(state.mode === "focus" ? "break" : "focus")}
                title="切换专注与休息模式"
              >
                <i className={`ph-bold ${state.mode === "focus" ? "ph-coffee" : "ph-lightning"}`} />
                <span>{state.mode === "focus" ? "休息模式" : "专注模式"}</span>
              </button>
            </div>
          )}
        </div>

        {/* 底部快捷键指南提示 */}
        <div className="pomodoro-footer-hint">
          <span>快捷键：Space 启动/暂停 · P/Esc 最小化收起 · R 重置</span>
        </div>
      </div>
    </div>
  );
}

/* Apple / Motion 风格右键悬浮菜单 (支持日程卡片与空白画布双场景) */
function NotionContextMenu({
  menu,
  onEdit,
  onStartFocus,
  onStartExecution,
  onCut,
  onCopy,
  onDuplicate,
  onRemoveDate,
  onOpenFeishu,
  onDelete,
  onSyncAppleReminder,
  onNewEventAt,
  onGoToday,
  onSwitchView,
  onOpenSettings,
  onClose,
}) {
  if (!menu) return null;
  const { event, ds, timeStr, x, y } = menu;
  const menuRef = useRef(null);
  const winW = (typeof window !== "undefined" && window.innerWidth) || 1200;
  const winH = (typeof window !== "undefined" && window.innerHeight) || 800;
  const menuWidth = 224;
  const estH = event ? 480 : 260;

  // 初始预估边界约束：防止首次挂载超出视口
  let initialX = Math.max(10, Math.min(x || 100, winW - menuWidth - 12));
  let initialY = y || 100;
  if (initialY + estH > winH - 12) {
    initialY = Math.max(12, initialY - estH >= 12 ? initialY - estH : winH - estH - 12);
  }

  const [coords, setCoords] = useState({ x: initialX, y: initialY });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const currentWinW = window.innerWidth || 1200;
      const currentWinH = window.innerHeight || 800;
      let nextX = x || 100;
      let nextY = y || 100;
      if (nextX + rect.width > currentWinW - 12) {
        nextX = Math.max(12, currentWinW - rect.width - 12);
      }
      if (nextY + rect.height > currentWinH - 12) {
        if (nextY - rect.height >= 12) {
          nextY = nextY - rect.height;
        } else {
          nextY = Math.max(12, currentWinH - rect.height - 12);
        }
      }
      setCoords({ x: nextX, y: nextY });
    }
  }, [x, y, event]);

  // 场景 A：空白画布/网格处右键
  if (!event) {
    return (
      <div className="notion-ctx-backdrop" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
        <div
          ref={menuRef}
          className="notion-ctx-menu"
          style={{ left: coords.x, top: coords.y, width: "224px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="notion-ctx-header">
            {ds ? `${ds} ${timeStr || ""}` : "空白画板"}
          </div>

          <button
            className="notion-ctx-item"
            onClick={() => {
              onNewEventAt && onNewEventAt(ds, timeStr);
              onClose();
            }}
          >
            <div className="notion-ctx-left">
              <span className="notion-ctx-icon">
                <i className="ph-bold ph-plus-circle motion-icon motion-icon-task" />
              </span>
              <span>在此处新建日程</span>
            </div>
            <span className="notion-ctx-shortcut">双击 / N</span>
          </button>

          <button
            className="notion-ctx-item"
            onClick={() => {
              onGoToday && onGoToday();
              onClose();
            }}
          >
            <div className="notion-ctx-left">
              <span className="notion-ctx-icon">
                <i className="ph-bold ph-calendar-blank motion-icon motion-icon-calendar" />
              </span>
              <span>回到今天</span>
            </div>
            <span className="notion-ctx-shortcut">T</span>
          </button>

          <div className="notion-ctx-divider"></div>

          <button
            className="notion-ctx-item"
            onClick={() => {
              onSwitchView && onSwitchView("week", 7);
              onClose();
            }}
          >
            <div className="notion-ctx-left">
              <span className="notion-ctx-icon">
                <i className="ph-bold ph-calendar-check motion-icon motion-icon-pulse" />
              </span>
              <span>切换至周视图</span>
            </div>
            <span className="notion-ctx-shortcut">W</span>
          </button>

          <button
            className="notion-ctx-item"
            onClick={() => {
              onSwitchView && onSwitchView("month");
              onClose();
            }}
          >
            <div className="notion-ctx-left">
              <span className="notion-ctx-icon">
                <i className="ph-bold ph-calendar motion-icon motion-icon-pulse" />
              </span>
              <span>切换至月视图</span>
            </div>
            <span className="notion-ctx-shortcut">M</span>
          </button>

          <div className="notion-ctx-divider"></div>

          <button
            className="notion-ctx-item"
            onClick={() => {
              onOpenSettings && onOpenSettings();
              onClose();
            }}
          >
            <div className="notion-ctx-left">
              <span className="notion-ctx-icon">
                <i className="ph-bold ph-gear motion-icon motion-icon-gear" />
              </span>
              <span>偏好设置...</span>
            </div>
            <span className="notion-ctx-shortcut">⌘,</span>
          </button>
        </div>
      </div>
    );
  }

  // 场景 B：日程卡片上右键
  return (
    <div className="notion-ctx-backdrop" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
      <div
        ref={menuRef}
        className="notion-ctx-menu"
        style={{ left: coords.x, top: coords.y, width: "224px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notion-ctx-header">
          {event.title || event.text || "日程操作"}
        </div>

        <button
          className="notion-ctx-item"
          style={{ color: "#007aff", fontWeight: "600" }}
          onClick={() => {
            onEdit && onEdit(event, ds || event.date);
            onClose();
          }}
        >
          <div className="notion-ctx-left">
            <span className="notion-ctx-icon">
              <i className="ph-bold ph-pencil-simple motion-icon motion-icon-pulse" />
            </span>
            <span>编辑日程详情</span>
          </div>
          <span className="notion-ctx-shortcut">单击 / ↵</span>
        </button>

        <button
          className="notion-ctx-item"
          style={{ color: "#007aff", fontWeight: "600" }}
          onClick={() => {
            const timePart = event.startTimeStr || (event.startTime ? event.startTime.slice(11, 16) : "09:00");
            onNewEventAt && onNewEventAt(ds || event.date, timePart);
            onClose();
          }}
        >
          <div className="notion-ctx-left">
            <span className="notion-ctx-icon">
              <i className="ph-bold ph-plus-circle motion-icon motion-icon-task" />
            </span>
            <span>在此时间插入新日程 (重叠/插队)</span>
          </div>
          <span className="notion-ctx-shortcut">C / N</span>
        </button>

        <button
          className="notion-ctx-item"
          style={{ color: "#eb5757", fontWeight: "600" }}
          onClick={() => {
            onStartFocus && onStartFocus(event);
            onClose();
          }}
        >
          <div className="notion-ctx-left">
            <span className="notion-ctx-icon">
              <i className="ph-bold ph-timer" style={{ color: "#eb5757" }} />
            </span>
            <span>开启专注番茄钟 (25m)</span>
          </div>
          <span className="notion-ctx-shortcut">P</span>
        </button>

        <button
          className="notion-ctx-item"
          style={{ color: "#007AFF", fontWeight: "600" }}
          onClick={() => {
            onStartExecution && onStartExecution(event);
            onClose();
          }}
        >
          <div className="notion-ctx-left">
            <span className="notion-ctx-icon">
              <i className="ph-bold ph-lightning motion-icon motion-icon-pulse" />
            </span>
            <span>立即开始执行</span>
          </div>
        </button>

        <div className="notion-ctx-divider"></div>

        <button
          className="notion-ctx-item"
          onClick={() => {
            onCut(event, ds);
            onClose();
          }}
        >
          <div className="notion-ctx-left">
            <span className="notion-ctx-icon">
              <i className="ph-bold ph-scissors motion-icon motion-icon-scissors" />
            </span>
            <span>剪切</span>
          </div>
          <span className="notion-ctx-shortcut">⌘X</span>
        </button>

        <button
          className="notion-ctx-item"
          onClick={() => {
            onCopy(event, ds);
            onClose();
          }}
        >
          <div className="notion-ctx-left">
            <span className="notion-ctx-icon">
              <i className="ph-bold ph-copy motion-icon motion-icon-copy" />
            </span>
            <span>拷贝标题</span>
          </div>
          <span className="notion-ctx-shortcut">⌘C</span>
        </button>

        <button
          className="notion-ctx-item"
          onClick={() => {
            onDuplicate(event, ds);
            onClose();
          }}
        >
          <div className="notion-ctx-left">
            <span className="notion-ctx-icon">
              <i className="ph-bold ph-copy-simple motion-icon motion-icon-duplicate" />
            </span>
            <span>创建副本</span>
          </div>
          <span className="notion-ctx-shortcut">⌘D</span>
        </button>

        <div className="notion-ctx-divider"></div>

        <button
          className="notion-ctx-item"
          onClick={() => {
            onRemoveDate(event, ds);
            onClose();
          }}
        >
          <div className="notion-ctx-left">
            <span className="notion-ctx-icon">
              <i className="ph-bold ph-clock motion-icon motion-icon-clock" />
            </span>
            <span>{event.isAllDay ? "设为时间段" : "转为全天日程"}</span>
          </div>
        </button>

        <button
          className="notion-ctx-item"
          onClick={() => {
            onSyncAppleReminder && onSyncAppleReminder(event);
            onClose();
          }}
        >
          <div className="notion-ctx-left">
            <span className="notion-ctx-icon">
              <i className="ph-bold ph-bell-simple motion-icon motion-icon-bell" />
            </span>
            <span>同步至 Apple 提醒事项</span>
          </div>
        </button>

        <button
          className="notion-ctx-item"
          onClick={() => {
            onOpenFeishu(event);
            onClose();
          }}
        >
          <div className="notion-ctx-left">
            <span className="notion-ctx-icon">
              <i className="ph-bold ph-table motion-icon motion-icon-table" />
            </span>
            <span>在飞书表格中管理</span>
          </div>
          <span className="notion-ctx-shortcut">↗</span>
        </button>

        <div className="notion-ctx-divider"></div>

        <button
          className="notion-ctx-item danger"
          onClick={() => {
            onDelete(event, ds);
            onClose();
          }}
        >
          <div className="notion-ctx-left">
            <span className="notion-ctx-icon">
              <i className="ph-bold ph-trash motion-icon motion-icon-trash" />
            </span>
            <span>删除日程</span>
          </div>
          <span className="notion-ctx-shortcut">⌫</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   主应用
   ------------------------------------------------------------ */

function App() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  const [infoOpen, setInfoOpen] = useState(() => window.innerWidth > 640);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [edits, setEdits] = useState(() => loadEdits(DEFAULT_YEAR));
  const [createModal, setCreateModal] = useState(null); // { date, endDate, startTimeStr, endTimeStr, isAllDay }
  const [storageWarn, setStorageWarn] = useState(false); // 浏览器禁止本地存储时提醒
  const [pendingImport, setPendingImport] = useState(null); // { bundle, count }
  const [importMsg, setImportMsg] = useState(null); // { ok, text }
  const [fillMode, setFillMode] = useState(false); // 下拉填充模式
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [viewMode, setViewMode] = useState(() => {
    const qv = urlParams.get("view");
    if (["day", "week", "days", "month", "year"].includes(qv)) return qv;
    try {
      return localStorage.getItem("board-view-mode") || "day";
    } catch (e) {
      return "day";
    }
  });
  const [timelineDays, setTimelineDays] = useState(() => {
    const qd = parseInt(urlParams.get("days"), 10);
    if (qd >= 1 && qd <= 9) return qd;
    const qv = urlParams.get("view");
    if (qv === "week") return 7;
    return 1;
  });
  const [hourHeight, setHourHeight] = useState(50);
  const [focusedDate, setFocusedDate] = useState(() => TODAY);
  const [selectedDate, setSelectedDate] = useState(() => TODAY);
  const [currentMonth, setCurrentMonth] = useState(() => NOW.getMonth());
  const [drawerOpen, setDrawerOpen] = useState(() => urlParams.get("drawer") === "1");
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [todayTick, setTodayTick] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState(() => {
    try {
      return localStorage.getItem("board-cat-filter") || "all";
    } catch (e) {
      return "all";
    }
  });

  const handleCategoryFilterChange = useCallback((cat) => {
    setCategoryFilter(cat);
    try {
      localStorage.setItem("board-cat-filter", cat);
    } catch (e) {}
  }, []);

  // 今日三件事 (Eat That Frog · 常驻顶栏三青蛙微岛)
  const [threeThings, setThreeThings] = useState(() => {
    try {
      const raw = localStorage.getItem("polaris_three_things");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { text: "REDMI K80 澎湃OS真机适配与排程", done: true },
      { text: "北极星多维表格 7 大板块数据双向绑定", done: false },
      { text: "身体锻炼跑步与心率监测", done: false },
    ];
  });

  const handleToggleThreeFrog = useCallback((idx) => {
    setThreeThings((prev) => {
      const next = prev.map((item, i) => (i === idx ? { ...item, done: !item.done } : item));
      try { localStorage.setItem("polaris_three_things", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  const handleUpdateThreeFrogText = useCallback((idx, text) => {
    setThreeThings((prev) => {
      const next = prev.map((item, i) => (i === idx ? { ...item, text } : item));
      try { localStorage.setItem("polaris_three_things", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  const handleDropThreeFrogTask = useCallback((idx, text) => {
    setThreeThings((prev) => {
      const next = prev.map((item, i) => (i === idx ? { ...item, text, done: false } : item));
      try { localStorage.setItem("polaris_three_things", JSON.stringify(next)); } catch (e) {}
      return next;
    });
    if (window.__triggerToast) {
      window.__triggerToast(`🎯 已设为今日青蛙：${text}`);
    }
  }, []);

  // 03 任务管理库 (四象限任务列表，可拖入时间轴排程)
  const [tasks, setTasks] = useState(() => {
    try {
      const raw = localStorage.getItem("polaris_tasks");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return INITIAL_DEFAULT_TASKS;
  });

  const handleAddTask = useCallback((title, priority = "P0") => {
    const newTask = {
      id: "task_" + Date.now(),
      title,
      priority,
      done: false,
      category: "工作",
    };
    setTasks((prev) => {
      const next = [newTask, ...prev];
      try { localStorage.setItem("polaris_tasks", JSON.stringify(next)); } catch (e) {}
      return next;
    });
    if (window.__triggerToast) {
      window.__triggerToast(`✓ 新增任务：${title}`);
    }
  }, []);

  const handleToggleTask = useCallback((taskId) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
      try { localStorage.setItem("polaris_tasks", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  const handleDeleteTask = useCallback((taskId) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== taskId);
      try { localStorage.setItem("polaris_tasks", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  const handleStartPomodoroWithText = useCallback((text) => {
    setPomodoroState((prev) => ({
      ...prev,
      isOpen: true,
      targetText: text,
      targetEvent: null,
      targetEventId: null,
    }));
  }, []);

  // 跨天检测与实时焦点校准：系统时间跨过午夜或休眠唤醒激活窗口时，自动更新全局 TODAY 并触发重绘
  useEffect(() => {
    const checkTodayChange = () => {
      const current = getToday();
      if (current !== TODAY) {
        const n = getNow();
        refreshToday();
        setCurrentMonth(n.getMonth());
        setTodayTick((v) => v + 1);
      }
    };
    const timer = setInterval(checkTodayChange, 5000);
    window.addEventListener("focus", checkTodayChange);
    document.addEventListener("visibilitychange", checkTodayChange);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", checkTodayChange);
      document.removeEventListener("visibilitychange", checkTodayChange);
    };
  }, []);

  // 彻底清除 macOS 原生窗口标题（避免与顶栏分段控件重叠显示）
  useEffect(() => {
    document.title = "";
  }, [viewMode]);
  const [drawerTab, setDrawerTab] = useState("detail");

  const mapRecordData = (r) => ({
    _uid: r._uid || r.record_id || `${r.date}_${r.text}_${r.startTime || ""}_${Math.random().toString(36).slice(2, 7)}`,
    date: r.date,
    text: r.text || "",
    category: r.category || "生活",
    note: r.note || "",
    status: r.status || "",
    record_id: r.record_id || "",
    startTime: r.startTime || "",
    endTime: r.endTime || "",
    type: r.type || "自己安排",
    markedDelete: !!r.markedDelete,
    googleEventId: r.googleEventId || "",
    contentHash: r.contentHash || "",
    syncStatus: r.syncStatus || "待同步",
    externalEventId: r.externalEventId || "",
    externalSource: r.externalSource || "手动",
    reminder: r.reminder || "不提醒",
    repeatRule: r.repeatRule || r.repeatMode || "不重复",
    trackTime: r.trackTime !== undefined ? !!r.trackTime : true,
    linkedHabit: r.linkedHabit || "",
    linkedTask: r.linkedTask || "",
    linkedTimeRecord: r.linkedTimeRecord || "",
    _dirty: !!r._dirty,
    _local: !!r._local || !r.record_id,
  });

  const [selectedEvent, setSelectedEvent] = useState(() => {
    const all = (window.BOARD_DATA && window.BOARD_DATA.records ? window.BOARD_DATA.records : [])
      .filter((r) => !r.markedDelete && !(r.date === "2026-10-04" && r.text === "媒体制作"))
      .map(mapRecordData);
    return all.find((r) => r.date === TODAY) || (all.length > 0 ? all[0] : null);
  });
  const [cmdOpen, setCmdOpen] = useState(() => urlParams.get("cmd") === "1");
  const [goToDateOpen, setGoToDateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("general");

  // 绑定全局设置事件
  useEffect(() => {
    const onToggleTweaks = () => {
      setSettingsTab("general");
      setSettingsOpen((v) => !v);
    };
    window.addEventListener("tweaks:toggle", onToggleTweaks);
    return () => window.removeEventListener("tweaks:toggle", onToggleTweaks);
  }, []);

  const [fillSel, setFillSel] = useState(null); // 拖选中的范围 { src, mi, from, to }
  const [fillToast, setFillToast] = useState(null); // 填充结果条 { count, cleared, undo }
  const [cutSrc, setCutSrc] = useState(null); // 剪切剪贴板快照 { ds, text, category, note, status }
  const [baseList, setBaseList] = useState(() => {
    let pendingEvents = [];
    try {
      const raw = localStorage.getItem("polaris_pending_local_events");
      if (raw) pendingEvents = JSON.parse(raw) || [];
    } catch (e) {}

    const base = (window.BOARD_DATA && window.BOARD_DATA.records ? window.BOARD_DATA.records : [])
      .filter((r) => !r.markedDelete && !(r.date === "2026-10-04" && r.text === "媒体制作"))
      .map(mapRecordData);

    const map = new Map();
    base.forEach((r) => map.set(getEventUid(r), r));
    pendingEvents.forEach((r) => map.set(getEventUid(r), r));

    // 守护恢复：针对 2026-10-12 正在记录的日程进行保障性恢复
    const currentList = Array.from(map.values());
    const hasCook = currentList.some((x) => x.date === "2026-10-12" && x.text === "打扫卫生做饭");
    const hasPhone = currentList.some((x) => x.date === "2026-10-12" && x.text === "玩手机");
    if (!hasCook) {
      const cookEv = {
        _uid: "local_cook_20261012",
        _local: true,
        text: "打扫卫生做饭",
        date: "2026-10-12",
        endDate: "2026-10-12",
        startTime: "2026-10-12 14:15:00",
        endTime: "2026-10-12 15:26:00",
        startTimeStr: "14:15",
        endTimeStr: "15:26",
        durationStr: "1小时11分",
        category: "生活",
        type: "自己安排",
        status: "完成",
        isAllDay: false,
        trackTime: true,
      };
      map.set(getEventUid(cookEv), cookEv);
    }
    if (!hasPhone) {
      const phoneEv = {
        _uid: "local_phone_20261012",
        _local: true,
        text: "玩手机",
        date: "2026-10-12",
        endDate: "2026-10-12",
        startTime: "2026-10-12 15:07:00",
        endTime: "2026-10-12 16:07:00",
        startTimeStr: "15:07",
        endTimeStr: "16:07",
        durationStr: "1小时",
        category: "生活",
        type: "自己安排",
        status: "完成",
        isAllDay: false,
        trackTime: true,
      };
      map.set(getEventUid(phoneEv), phoneEv);
    }

    const merged = Array.from(map.values());
    try {
      const pendings = merged.filter((r) => (!r.record_id || r._local || r._dirty) && !r.markedDelete && r.type !== "一天总结");
      localStorage.setItem("polaris_pending_local_events", JSON.stringify(pendings));
    } catch (e) {}
    return merged;
  });

  // 全生命周期持久化守卫：任何本地新增/编辑/变更，实时写入 localStorage，永不丢失
  useEffect(() => {
    try {
      const pendings = baseList.filter((r) => (!r.record_id || r._local || r._dirty) && !r.markedDelete && r.type !== "一天总结");
      localStorage.setItem("polaris_pending_local_events", JSON.stringify(pendings));
    } catch (e) {}
  }, [baseList]);
  const [feishuStatus, setFeishuStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState([]); // 离线/手动同步时，待写回飞书软删除的已有记录
  const [snapStep, setSnapStep] = useState(15);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const selectedEventRef = useRef(selectedEvent);
  const selectedEventIdsRef = useRef(selectedEventIds);
  const lastAnchorEventRef = useRef(null);
  selectedEventRef.current = selectedEvent;
  selectedEventIdsRef.current = selectedEventIds;
  const [contextMenu, setContextMenu] = useState(null);
  const [activeExecutionAlert, setActiveExecutionAlert] = useState(null);
  const acknowledgedAlertsRef = useRef({});
  const [globalToast, setGlobalToast] = useState(null);
  const [sameContentModal, setSameContentModal] = useState(null); // { event, sameEvents }
  const [undoBatch, setUndoBatch] = useState(null); // { type: 'delete' | 'create', items: [] }
  const globalToastTimerRef = useRef(null);

  const triggerToast = (msg, duration = 3000) => {
    setGlobalToast(msg);
    if (globalToastTimerRef.current) clearTimeout(globalToastTimerRef.current);
    globalToastTimerRef.current = setTimeout(() => {
      setGlobalToast(null);
    }, duration);
  };
  window.__triggerToast = triggerToast;

  // 番茄钟 / 专注时钟全局状态（常驻后台不掉线，深度绑定日程对象）
  const [pomodoroState, setPomodoroState] = useState(() => {
    let savedCount = 0;
    try {
      savedCount = parseInt(localStorage.getItem("pomodoro_count_" + TODAY) || "0", 10);
    } catch (e) {}
    return {
      isOpen: false,
      isRunning: false,
      mode: "focus", // "focus" | "break"
      remainingSeconds: 25 * 60,
      totalSeconds: 25 * 60,
      targetText: "深度专注",
      targetEvent: null,
      targetEventId: null,
      whiteNoise: "none", // "none" | "rain" | "tick"
      completedCount: isNaN(savedCount) ? 0 : savedCount,
      startedAt: null,
      showFinishedCard: false,
    };
  });

  // 番茄钟核心倒计时引擎 (精准 1 秒步进)
  useEffect(() => {
    if (!pomodoroState.isRunning) return;
    const timer = setInterval(() => {
      setPomodoroState((prev) => {
        if (!prev.isRunning) return prev;
        if (prev.remainingSeconds <= 1) {
          PomodoroAudio.ringBell();
          PomodoroAudio.stop();
          const newCount = prev.mode === "focus" ? prev.completedCount + 1 : prev.completedCount;
          if (prev.mode === "focus") {
            try {
              localStorage.setItem("pomodoro_count_" + TODAY, String(newCount));
            } catch (e) {}
          }
          return {
            ...prev,
            isRunning: false,
            remainingSeconds: 0,
            completedCount: newCount,
            showFinishedCard: prev.mode === "focus",
          };
        }
        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pomodoroState.isRunning]);

  // 番茄钟控制方法
  const handleTogglePomodoro = () => {
    setPomodoroState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const handleStartPomodoro = () => {
    if (pomodoroState.whiteNoise !== "none") {
      PomodoroAudio.play(pomodoroState.whiteNoise);
    }
    setPomodoroState((prev) => ({
      ...prev,
      isRunning: true,
      showFinishedCard: false,
      startedAt: prev.startedAt || new Date().toISOString(),
      remainingSeconds: prev.remainingSeconds <= 0 ? prev.totalSeconds : prev.remainingSeconds,
    }));
  };

  const handlePausePomodoro = () => {
    PomodoroAudio.stop();
    setPomodoroState((prev) => ({ ...prev, isRunning: false }));
  };

  const handleResetPomodoro = () => {
    PomodoroAudio.stop();
    setPomodoroState((prev) => ({
      ...prev,
      isRunning: false,
      showFinishedCard: false,
      remainingSeconds: prev.totalSeconds,
      startedAt: null,
    }));
  };

  const handleSelectPomodoroDuration = (minutes) => {
    const sec = minutes * 60;
    setPomodoroState((prev) => ({
      ...prev,
      totalSeconds: sec,
      remainingSeconds: sec,
      isRunning: false,
      showFinishedCard: false,
    }));
  };

  const handleSwitchPomodoroMode = (mode) => {
    PomodoroAudio.stop();
    const duration = mode === "break" ? 5 * 60 : 25 * 60;
    setPomodoroState((prev) => ({
      ...prev,
      mode,
      isRunning: false,
      showFinishedCard: false,
      totalSeconds: duration,
      remainingSeconds: duration,
    }));
  };

  const handleSetPomodoroNoise = (type) => {
    if (pomodoroState.isRunning) {
      if (type === "none") PomodoroAudio.stop();
      else PomodoroAudio.play(type);
    }
    setPomodoroState((prev) => ({ ...prev, whiteNoise: type }));
  };

  const handleUpdatePomodoroTarget = (text) => {
    setPomodoroState((prev) => ({ ...prev, targetText: text }));
  };

  // 从日程卡片一键开启专注 (默认 25m 并自动起跑)
  const handleStartFocusWithEvent = (ev, autoStart = true) => {
    if (!ev) return;
    const title = ev.title || ev.text || "深度专注";
    const evId = getEventUid(ev);
    setPomodoroState((prev) => {
      const next = {
        ...prev,
        isOpen: true,
        targetText: title,
        targetEvent: ev,
        targetEventId: evId,
        mode: "focus",
        totalSeconds: 25 * 60,
        remainingSeconds: 25 * 60,
        showFinishedCard: false,
        isRunning: autoStart,
        startedAt: autoStart ? new Date().toISOString() : prev.startedAt,
      };
      if (autoStart && prev.whiteNoise !== "none") {
        PomodoroAudio.play(prev.whiteNoise);
      }
      return next;
    });
    triggerToast(`🍅 已启动专注：「${title.length > 12 ? title.slice(0, 12) + "…" : title}」 (25m)`);
  };

  // 专注完成沉淀：关联日程自动标记完成并打卡，或沉淀为合法 Base 新日程
  const handleSavePomodoroAsEvent = () => {
    const curNow = new Date();
    const endMinutes = curNow.getHours() * 60 + curNow.getMinutes();
    const durMinutes = Math.max(1, Math.round(pomodoroState.totalSeconds / 60));
    const startMinutes = Math.max(0, endMinutes - durMinutes);
    const sTimeStr = formatTimeFromMinutes(startMinutes);
    const eTimeStr = formatTimeFromMinutes(endMinutes);

    if (pomodoroState.targetEvent) {
      // 场景 1：有关联日程，直接标记原日程为“完成”，并在备注中追加打卡记录
      const ev = pomodoroState.targetEvent;
      const prevNote = (ev.note || "").trim();
      const focusStamp = `[已专注 ${durMinutes}m (${sTimeStr}-${eTimeStr})]`;
      const updatedNote = prevNote ? (prevNote.includes(focusStamp) ? prevNote : `${prevNote} ${focusStamp}`) : focusStamp;
      
      handleUpdateEvent({
        ...ev,
        status: "完成",
        note: updatedNote,
      });
      triggerToast(`🎉 太棒了！已将日程「${ev.text || ev.title}」标记为完成并记录专注！`);
    } else {
      // 场景 2：独立专注，沉淀为新的日程（确保板块与状态严格对齐 Base 枚举）
      const eventTitle = `[专注] ${pomodoroState.targetText || "深度专注"}`;
      handleCreateNewEvent({
        text: eventTitle,
        date: TODAY,
        startTimeStr: sTimeStr,
        endTimeStr: eTimeStr,
        startTime: `${TODAY} ${sTimeStr}:00`,
        endTime: `${TODAY} ${eTimeStr}:00`,
        durationStr: formatDurationFromMinutes(durMinutes),
        category: "生活",
        type: "自己安排",
        status: "完成",
        isAllDay: false,
        note: `完成了一次 ${durMinutes} 分钟番茄专注`,
      });
      triggerToast(`✨ 已成功将「${eventTitle}」沉淀为今日日程！`);
    }

    setPomodoroState((prev) => ({
      ...prev,
      showFinishedCard: false,
      remainingSeconds: prev.totalSeconds,
      targetEvent: null,
      targetEventId: null,
    }));
  };


  /* 处理事件点选（支持普通点选、⌘/Ctrl 跳跃散选、Shift 连续时间区间多选，双击展开抽屉） */
  const handleSelectEvent = (rec, ds, isMulti, openDrawer = false) => {
    if (!rec) {
      setSelectedEvent(null);
      selectedEventRef.current = null;
      setSelectedEventIds([]);
      selectedEventIdsRef.current = [];
      lastAnchorEventRef.current = null;
      return;
    }
    if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
      document.activeElement.blur();
    }
    const evId = rec.record_id || rec._uid || (rec.text + "_" + (rec.startTime || ""));
    const effectiveRec = (rec._crossDayPart === "next" && rec._parentDate)
      ? (baseList.find((b) => (b.record_id && b.record_id === rec.record_id) || (b._uid && b._uid === rec._uid) || (b.date === rec._parentDate && b.text === rec.text)) || rec)
      : rec;
    const effectiveDs = effectiveRec.date || ds || rec.date || "";

    const isShift = typeof isMulti === "object" ? !!isMulti.shiftKey : false;
    const isCmd = typeof isMulti === "object" ? !!(isMulti.metaKey || isMulti.ctrlKey) : !!isMulti;

    if (isShift && lastAnchorEventRef.current) {
      // Shift + Click：计算与锚点的时间区间 [minT, maxT]，连续全选该区间内的所有中间日程
      const t1 = getEventTimestamp(lastAnchorEventRef.current);
      const t2 = getEventTimestamp(effectiveRec);
      const minT = Math.min(t1, t2);
      const maxT = Math.max(t1, t2);

      const inRangeIds = [];
      (baseList || []).forEach((r) => {
        if (!r.markedDelete && r.type !== "一天总结") {
          const tr = getEventTimestamp(r);
          if (tr >= minT && tr <= maxT) {
            inRangeIds.push(getEventUid(r));
          }
        }
      });

      const anchorId = getEventUid(lastAnchorEventRef.current);
      if (!inRangeIds.includes(anchorId)) inRangeIds.push(anchorId);
      if (!inRangeIds.includes(evId)) inRangeIds.push(evId);

      const uniqueIds = Array.from(new Set(inRangeIds));
      setSelectedEventIds(uniqueIds);
      selectedEventIdsRef.current = uniqueIds;
      setSelectedEvent(effectiveRec);
      selectedEventRef.current = effectiveRec;
      if (window.SFX) window.SFX.play("tap");
    } else if (isCmd) {
      // ⌘ / Ctrl + Click：跳跃散选 (类似单元格按住 Ctrl 逐个挑选)
      setSelectedEventIds((prev) => {
        const next = prev.includes(evId) ? prev.filter((id) => id !== evId) : [...prev, evId];
        selectedEventIdsRef.current = next;
        return next;
      });
      setSelectedEvent(effectiveRec);
      selectedEventRef.current = effectiveRec;
      lastAnchorEventRef.current = effectiveRec;
      if (window.SFX) window.SFX.play("tap");
    } else {
      // 普通单选：单选并重设选区锚点
      setSelectedEventIds([evId]);
      setSelectedEvent(effectiveRec);
      selectedEventRef.current = effectiveRec;
      selectedEventIdsRef.current = [evId];
      lastAnchorEventRef.current = effectiveRec;
      setSelectedDate(effectiveDs);
      setFocusedDate(effectiveDs);
      if (openDrawer) {
        setDrawerTab("detail");
        setDrawerOpen(true);
      }
    }
  };

  /* 单条或批量同步就地更新（抽屉表单输入、拖拽位移、拉伸） */
  const handleUpdateEvent = (updated, isSyncAll = false, originalText = "", originalEvent = null) => {
    if (!updated) return;
    const targetDate = updated.date || (originalEvent && originalEvent.date) || (selectedEventRef.current && selectedEventRef.current.date) || selectedDate || focusedDate || TODAY;
    const safeUpdated = Object.assign({}, selectedEventRef.current, originalEvent, updated, { date: targetDate });
    setSelectedEvent(safeUpdated);
    selectedEventRef.current = safeUpdated;

    if (isSyncAll) {
      const matchText = (originalText || updated.text || "").trim();
      let matchedCount = 0;
      const prevItems = [];
      const pushChanges = [];

      setBaseList((prev) => {
        return prev.map((r) => {
          const isMatch = !r.markedDelete && (
            (updated.record_id && r.record_id === updated.record_id) ||
            (updated._uid && r._uid && r._uid === updated._uid) ||
            (matchText && (r.text || "").trim() === matchText)
          );
          if (isMatch) {
            matchedCount++;
            prevItems.push(Object.assign({}, r));

            const d = r.date || (r.startTime ? r.startTime.slice(0, 10) : TODAY);
            let sTime = r.startTime;
            let eTime = r.endTime;
            let sStr = r.startTimeStr;
            let eStr = r.endTimeStr;
            if (updated.isAllDay) {
              sTime = `${d} 00:00:00`;
              eTime = `${d} 23:59:00`;
              sStr = "00:00";
              eStr = "23:59";
            } else if (updated.startTimeStr && updated.endTimeStr) {
              sTime = `${d} ${updated.startTimeStr}:00`;
              eTime = `${d} ${updated.endTimeStr}:00`;
              sStr = updated.startTimeStr;
              eStr = updated.endTimeStr;
            }

            const merged = Object.assign({}, r, {
              text: updated.text,
              category: updated.category,
              status: updated.status,
              type: updated.type,
              isAllDay: !!updated.isAllDay,
              startTime: sTime,
              endTime: eTime,
              startTimeStr: sStr,
              endTimeStr: eStr,
              reminder: updated.reminder,
              repeatRule: updated.repeatRule,
              repeatMode: updated.repeatMode,
              trackTime: updated.trackTime,
              linkedHabit: updated.linkedHabit,
              linkedTask: updated.linkedTask,
              linkedTimeRecord: updated.linkedTimeRecord,
              note: updated.note,
              externalSource: updated.externalSource,
            });

            if (r.record_id) {
              pushChanges.push({
                op: "update",
                record_id: r.record_id,
                fields: buildPushFields(merged),
              });
            }
            return merged;
          }
          return r;
        });
      });

      if (pushChanges.length > 0 && t && t.realtimeSync) {
        fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ changes: pushChanges }),
        }).catch(() => {});
      }

      if (matchedCount > 1) {
        setUndoBatch({ type: "update", items: prevItems });
        triggerToast(
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <span>{`已同步更新全部 ${matchedCount} 项「${updated.text}」同名日程`}</span>
            <button
              className="notion-toast-undo-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleUndoBatch();
              }}
            >
              撤销 (⌘Z)
            </button>
          </span>,
          6000
        );
      }
      return;
    }

    const targetId = updated.record_id || (originalEvent && originalEvent.record_id);
    const targetUid = updated._uid || (originalEvent && originalEvent._uid) || (selectedEventRef.current && selectedEventRef.current._uid);

    // 默认单条更新：多重优先级定位原条目，杜绝修改原日程变分裂新建
    setBaseList((prev) => {
      const origText = (originalEvent && originalEvent.text) || originalText;
      const origDate = (originalEvent && originalEvent.date) || (selectedEventRef.current && selectedEventRef.current.date) || updated.date;
      const origStart = (originalEvent && originalEvent.startTime) || (selectedEventRef.current && selectedEventRef.current.startTime) || updated.startTime;

      let idx = prev.findIndex((r) => {
        if (targetUid && r._uid && r._uid === targetUid) return true;
        if (targetId && r.record_id && r.record_id === targetId) return true;
        if (r === updated || (originalEvent && r === originalEvent)) return true;
        if (selectedEventRef.current && r === selectedEventRef.current) return true;
        if (origText && r.text === origText && r.date === origDate && (!origStart || r.startTime === origStart)) return true;
        return false;
      });

      if (idx === -1 && selectedEventRef.current) {
        const cur = selectedEventRef.current;
        idx = prev.findIndex((r) =>
          (cur._uid && r._uid === cur._uid) ||
          (cur.record_id && r.record_id === cur.record_id) ||
          r === cur ||
          (cur.date && r.date === cur.date && cur.startTime && r.startTime === cur.startTime)
        );
      }

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = Object.assign({}, next[idx], safeUpdated, {
          date: safeUpdated.date || next[idx].date || targetDate,
          endDate: safeUpdated.endDate || next[idx].endDate || safeUpdated.date || next[idx].date || targetDate,
          _uid: safeUpdated._uid || next[idx]._uid || targetUid,
          record_id: safeUpdated.record_id || next[idx].record_id || targetId,
          _dirty: true,
        });
        return next;
      }
      return [...prev, safeUpdated];
    });

    // 若更新的是「一天总结」，同步更新本地 edits 存储
    if (safeUpdated.type === "一天总结") {
      saveEdit(targetDate, safeUpdated);
    }

    if (updated.record_id && t && t.realtimeSync) {
      fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changes: [
            {
              op: "update",
              record_id: updated.record_id,
              fields: buildPushFields(updated),
            },
          ],
        }),
      }).then(() => {
        setBaseList((prev) => prev.map((r) => ((targetUid && r._uid === targetUid) || (updated.record_id && r.record_id === updated.record_id) ? Object.assign({}, r, { _dirty: false }) : r)));
      }).catch(() => {});
    }
  };

  /* 多选批量等距平移 */
  const handleBatchUpdateEvents = (eventIds, delta) => {
    setBaseList((prev) =>
      prev.map((ev) => {
        const evId = getEventUid(ev);
        if (!eventIds.includes(evId)) return ev;
        const parsed = parseEventTime(ev.startTime, ev.endTime);
        if (parsed.isAllDay) return ev;
        const duration = parsed.diffMinutes || 60;
        const newStartMin = Math.max(0, Math.min(1440 - duration, parsed.startMinutes + delta));
        const newEndMin = newStartMin + duration;
        const newStart = `${ev.date} ${formatTimeFromMinutes(newStartMin)}:00`;
        const newEnd = `${ev.date} ${formatTimeFromMinutes(newEndMin)}:00`;
        return Object.assign({}, ev, {
          startTime: newStart,
          endTime: newEnd,
          startTimeStr: formatTimeFromMinutes(newStartMin),
          endTimeStr: formatTimeFromMinutes(newEndMin),
        });
      })
    );
  };

  /* 空白拖拽或快捷键新建日程 */
  const handleCreateEvent = (newEvent) => {
    let ev = Object.assign({}, newEvent);
    if (!ev._uid) {
      ev._uid = "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    }
    // 用户明确铁律：新建日程默认都是“完成”，不是“未完成”
    if (!ev.status) {
      ev.status = "完成";
    }
    // 如果为一天总结，开始时间必须为 0:00，结束时间与预期时间必须为 11:59 (23:59)
    if (ev.type === "一天总结") {
      const d = ev.date || TODAY;
      ev = Object.assign({}, ev, {
        isAllDay: true,
        startTime: `${d} 00:00:00`,
        endTime: `${d} 23:59:00`,
        startTimeStr: "00:00",
        endTimeStr: "23:59",
        expectedTime: `${d} 23:59:00`,
        durationStr: "全天 (24小时)",
      });
      saveEdit(d, ev);
    }
    setBaseList((prev) => [...prev, ev]);
    setSelectedEvent(ev);
    selectedEventRef.current = ev;
    setSelectedDate(ev.date);
    setFocusedDate(ev.date);
    const evId = ev.record_id || ev._uid || (ev.text + "_" + (ev.startTime || ""));
    setSelectedEventIds([evId]);
    selectedEventIdsRef.current = [evId];
    setDrawerTab("detail");
    setDrawerOpen(true);

    // 仅在开启实时同步开关时才即时发送，默认仅保存在本地待手动批量写回
    if (t && t.realtimeSync) {
      fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changes: [
            {
              op: "create",
              _uid: ev._uid,
              fields: {
                "日期": ev.date,
                "日程标题": ev.text,
                "开始时间": ev.startTime,
                "结束时间": ev.endTime,
                "板块": ev.category || "生活",
                "完成状态": ev.status || "完成",
                "日程类型": ev.type || "自己安排",
                "计入时间记录": ev.trackTime !== undefined ? !!ev.trackTime : true,
              },
            },
          ],
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          let assignedId = null;
          if (res && res.createdRecords && res.createdRecords.length > 0) {
            const found = res.createdRecords.find((c) => c._uid === ev._uid) || res.createdRecords[0];
            assignedId = found ? (found.record_id || found.id) : null;
          }
          if (assignedId) {
            setSelectedEvent((cur) => (cur ? Object.assign({}, cur, { record_id: assignedId, _local: false }) : cur));
            setBaseList((prev) =>
              prev.map((r) => {
                if ((ev._uid && r._uid === ev._uid) || r === ev) {
                  return Object.assign({}, r, { record_id: assignedId, _local: false, _dirty: false });
                }
                return r;
              })
            );
          }
        })
        .catch(() => {});
    }
  };

  /* 执行底层删除日程（支持单个或批量） */
  const executeDeleteEvents = (eventsToDelete, isBatch = false) => {
    if (!eventsToDelete || eventsToDelete.length === 0) return;

    const idsToDelete = new Set();
    const pushChanges = [];

    eventsToDelete.forEach((ev) => {
      const id = ev.record_id || ev._uid || (ev.text + "_" + (ev.startTime || ""));
      idsToDelete.add(id);
      if (ev.record_id) {
        pushChanges.push({ op: "delete", record_id: ev.record_id, fields: { "标记删除": true } });
      }
    });

    // 记录撤销快照
    setUndoBatch({
      type: "delete",
      items: eventsToDelete,
    });

    setBaseList((prev) =>
      prev.filter((r) => {
        if (eventsToDelete.includes(r)) return false;
        if (selectedEventRef.current && r === selectedEventRef.current) return false;
        const rId = r.record_id || r._uid || (r.text + "_" + (r.startTime || ""));
        if (idsToDelete.has(rId)) return false;
        if (r._uid && eventsToDelete.some((e) => e._uid && e._uid === r._uid)) return false;
        if (eventsToDelete.some((e) => e.record_id && e.record_id === r.record_id)) return false;
        if (eventsToDelete.some((e) => e.text === r.text && e.date === r.date && (!e.startTime || e.startTime === r.startTime))) return false;
        return true;
      })
    );

    setEdits((prev) => {
      const next = Object.assign({}, prev);
      eventsToDelete.forEach((ev) => {
        if (!ev || !ev.date) return;
        if (ev.type === "一天总结") {
          if (BASE_BY_DATE[ev.date]) {
            next[ev.date] = { deleted: true };
          } else {
            delete next[ev.date];
          }
        }
      });
      if (!persistEdits(year, next)) setStorageWarn(true);
      return next;
    });

    setSelectedEvent(null);
    setSelectedEventIds([]);
    selectedEventRef.current = null;
    selectedEventIdsRef.current = [];
    setDrawerOpen(false);

    if (window.SFX) window.SFX.play("back");

    if (pushChanges.length > 0) {
      if (t && t.realtimeSync) {
        fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ changes: pushChanges }),
        }).catch(() => {});
      } else {
        const validDeletes = eventsToDelete.filter((e) => e.record_id);
        if (validDeletes.length > 0) {
          setPendingDeletions((prev) => [...prev, ...validDeletes]);
        }
      }
    }

    const firstItem = eventsToDelete[0];
    const tip = isBatch
      ? `已同步删除全部 ${eventsToDelete.length} 个「${firstItem ? firstItem.text : ''}」日程`
      : `已删除日程「${firstItem ? firstItem.text : ''}」`;

    triggerToast(
      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <span>{tip}</span>
        <button
          className="notion-toast-undo-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleUndoBatch();
          }}
        >
          撤销 (⌘Z)
        </button>
      </span>,
      6000
    );
  };

  /* 删除日程：支持单删、同名多项智能检测分流与批量多选删除 */
  const handleDeleteEvent = (evToDelete, forceSingle = false) => {
    const target = evToDelete || selectedEventRef.current || selectedEvent;
    const targetIds = (selectedEventIdsRef.current && selectedEventIdsRef.current.length > 0)
      ? selectedEventIdsRef.current
      : (selectedEventIds || []);
    if (!target && (!targetIds || targetIds.length === 0)) return;

    // 如果是多选批量选中的多个日程，直接批量删除
    if (targetIds && targetIds.length > 1) {
      const selectedEvents = baseList.filter((r) => {
        const rId = r.record_id || r._uid || (r.text + "_" + (r.startTime || ""));
        return targetIds.includes(rId);
      });
      executeDeleteEvents(selectedEvents.length > 0 ? selectedEvents : [target], true);
      return;
    }

    // 单项日程删除：检索日历中是否有相同内容的未删除日程（新建日程或未持久化草稿直接删除，不弹阻断窗）
    const targetText = target ? (target.text || "").trim() : "";
    if (!forceSingle && targetText && target.record_id && !target.isNew) {
      const sameEvents = baseList.filter((r) => {
        if (r.markedDelete) return false;
        return (r.text || "").trim() === targetText;
      });

      if (sameEvents.length > 1) {
        setSameContentModal({ event: target, sameEvents });
        return;
      }
    }

    executeDeleteEvents([target], false);
  };

  /* 撤销批量操作（支持撤销批量删除与撤销批量创建） */
  const handleUndoBatch = () => {
    if (!undoBatch) return;
    if (undoBatch.type === "delete") {
      const itemsToRestore = undoBatch.items;
      setBaseList((prev) => [...prev, ...itemsToRestore]);
      setEdits((prev) => {
        const next = Object.assign({}, prev);
        itemsToRestore.forEach((it) => {
          if (it.date && it.type === "一天总结") {
            const entry = normalizeEditEntry(it.date, it);
            if (entry) next[it.date] = entry;
            else delete next[it.date];
          }
        });
        if (!persistEdits(year, next)) setStorageWarn(true);
        return next;
      });
      const restoreChanges = itemsToRestore
        .filter((i) => i.record_id)
        .map((i) => ({ op: "update", record_id: i.record_id, fields: { "标记删除": false } }));
      if (restoreChanges.length > 0) {
        fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ changes: restoreChanges }),
        }).catch(() => {});
      }
      triggerToast(`已撤销并恢复 ${itemsToRestore.length} 项日程`);
      if (window.SFX) window.SFX.play("save");
    } else if (undoBatch.type === "create") {
      const idsToDelete = new Set(undoBatch.items.map((i) => i.record_id || i._uid || (i.text + "_" + (i.startTime || ""))));
      setBaseList((prev) =>
        prev.filter((r) => {
          const rId = r.record_id || r._uid || (r.text + "_" + (r.startTime || ""));
          return !idsToDelete.has(rId);
        })
      );
      triggerToast(`已撤销批量创建的 ${undoBatch.items.length} 项日程`);
      if (window.SFX) window.SFX.play("back");
    } else if (undoBatch.type === "update") {
      const prevItems = undoBatch.items;
      const prevMap = new Map();
      prevItems.forEach((it) => {
        const id = it.record_id || (it.text + "_" + it.date + "_" + (it.startTime || ""));
        prevMap.set(id, it);
      });
      setBaseList((prev) =>
        prev.map((r) => {
          const id = r.record_id || (r.text + "_" + r.date + "_" + (r.startTime || ""));
          if (prevMap.has(id)) {
            return Object.assign({}, r, prevMap.get(id));
          }
          return r;
        })
      );
      const restoreChanges = prevItems
        .filter((i) => i.record_id)
        .map((i) => ({
          op: "update",
          record_id: i.record_id,
          fields: {
            "日程标题": i.text,
            "开始时间": i.startTime,
            "结束时间": i.endTime,
            "板块": i.category || "生活",
            "完成状态": i.status === "完成" ? "完成" : "未完成",
            "日程类型": i.type || "自己安排",
            "提醒时间": i.reminder || "提前 5 分钟",
            "重复规则": i.repeatRule || "不重复",
            "计入时间记录": i.trackTime !== undefined ? !!i.trackTime : true,
            "备注": i.note || "",
          },
        }));
      if (restoreChanges.length > 0) {
        fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ changes: restoreChanges }),
        }).catch(() => {});
      }
      triggerToast(`已撤销同步修改，恢复 ${prevItems.length} 项日程`);
      if (window.SFX) window.SFX.play("undo");
    }
    setUndoBatch(null);
  };

  /* 快捷微调时长 (+15m, -15m, +10m, -10m) */
  const handleNudgeDuration = (ev, delta) => {
    const parsed = parseEventTime(ev.startTime, ev.endTime);
    if (parsed.isAllDay) return;
    const currentDiff = parsed.diffMinutes || 60;
    const newDiff = Math.max(snapStep, currentDiff + delta);
    const startMin = parsed.startMinutes !== undefined ? parsed.startMinutes : 540;
    const newEndMin = Math.min(1440, startMin + newDiff);
    const newEnd = `${ev.date} ${formatTimeFromMinutes(newEndMin)}:00`;
    handleUpdateEvent(Object.assign({}, ev, {
      endTime: newEnd,
      endTimeStr: formatTimeFromMinutes(newEndMin),
      durationStr: formatDurationFromMinutes(newEndMin - startMin),
    }));
  };

  /* 键盘快捷微调开始时间 (方向键 ↑ / ↓ 提前/推迟) */
  const handleNudgeTime = (ev, delta) => {
    const parsed = parseEventTime(ev.startTime, ev.endTime);
    if (parsed.isAllDay) return;
    const duration = parsed.diffMinutes || 60;
    const startMin = parsed.startMinutes !== undefined ? parsed.startMinutes : 540;
    const newStartMin = Math.max(0, Math.min(1440 - duration, startMin + delta));
    const newEndMin = newStartMin + duration;
    const newStart = `${ev.date} ${formatTimeFromMinutes(newStartMin)}:00`;
    const newEnd = `${ev.date} ${formatTimeFromMinutes(newEndMin)}:00`;
    handleUpdateEvent(Object.assign({}, ev, {
      startTime: newStart,
      endTime: newEnd,
      startTimeStr: formatTimeFromMinutes(newStartMin),
      endTimeStr: formatTimeFromMinutes(newEndMin),
    }));
  };

  /* 呼出 Apple / Motion 风格右键悬浮菜单 (支持日程卡片与空白画布双场景) */
  const handleContextMenu = (e, ev, ds, timeStr) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setContextMenu({
      x: e ? e.clientX : (window.innerWidth || 1200) / 2,
      y: e ? e.clientY : (window.innerHeight || 800) / 2,
      event: ev || null,
      ds: ds || (ev ? ev.date : (selectedDate || focusedDate || TODAY)),
      timeStr: timeStr || null,
    });
  };

  /* 执行卡片动作 */
  const handleStartExecution = (ev) => {
    setActiveExecutionAlert(null);
    triggerToast(`⚡ 已进入执行模式：${ev.title || ev.text}`);
    if (ev.record_id) {
      handleUpdateEvent(Object.assign({}, ev, { status: "进行中" }));
    }
  };

  const handleCompleteExecution = (ev) => {
    setActiveExecutionAlert(null);
    triggerToast(`✓ 已完成日程：${ev.title || ev.text}`);
    handleUpdateEvent(Object.assign({}, ev, { status: "完成" }));
  };

  const handleSnoozeExecution = (ev, mins = 5) => {
    setActiveExecutionAlert(null);
    triggerToast(`⏰ 已稍后 ${mins} 分钟提醒`);
    setTimeout(() => {
      fetch("/api/open-app", { method: "POST" }).catch(() => {});
      if (window.SFX && window.SFX.playSystemSound) {
        window.SFX.playSystemSound(t.alertSound || "Glass");
      }
      setActiveExecutionAlert({
        event: ev,
        triggerTime: Date.now(),
        isEscalated: true,
      });
    }, mins * 60 * 1000);
  };

  const handleTriggerTestAlert = () => {
    fetch("/api/open-app", { method: "POST" }).catch(() => {});
    if (window.SFX && window.SFX.playSystemSound) {
      window.SFX.playSystemSound(t.alertSound || "Glass");
    }
    setActiveExecutionAlert({
      event: {
        title: "撰写季度核心商业规划",
        text: "撰写季度核心商业规划",
        category: "工作",
        date: TODAY,
        startTimeStr: "14:00",
        endTimeStr: "15:30",
        durationStr: "1小时30分钟",
        desc: "梳理产品增长闭环、团队分工矩阵以及Q4关键里程碑交付物。",
      },
      triggerTime: Date.now(),
      isEscalated: false,
    });
  };

  const handleSyncAppleReminder = (ev) => {
    if (window.SFX && window.SFX.addAppleReminder) {
      window.SFX.addAppleReminder({
        title: ev.text || ev.title || "日程提醒",
        notes: `[年度看板] 分类: ${ev.category || "日程"} | 时间: ${ev.date || ""} ${ev.startTimeStr || ""}\n${ev.note || ""}`,
      }).then(() => {
        triggerToast("✓ 已成功同步至 macOS 提醒事项 (Apple Reminders)");
      });
    }
  };

  /* 全局系统右键菜单统一拦截与定位唤起 */
  useEffect(() => {
    const handleGlobalContextMenu = (e) => {
      const isInput = e.target.closest("input, textarea, [contenteditable='true']");
      if (isInput) return;
      e.preventDefault();
      const cellEl = e.target.closest ? e.target.closest(".cell[data-date]") : null;
      const targetDs = cellEl ? cellEl.getAttribute("data-date") : (selectedDate || focusedDate || TODAY);
      handleContextMenu(e, null, targetDs);
    };

    window.addEventListener("contextmenu", handleGlobalContextMenu);
    return () => {
      window.removeEventListener("contextmenu", handleGlobalContextMenu);
    };
  }, [selectedDate, focusedDate]);

  /* 剪切日程 (⌘X) */
  const handleCutEvent = (ev, ds) => {
    if (!ev) return;
    window._notionClipboardEvent = Object.assign({}, ev);
    handleDeleteEvent(ev);
    triggerToast("已剪切日程，可在目标日期按 ⌘V 粘贴");
  };

  /* 拷贝日程 (⌘C) */
  const handleCopyEvent = (ev, ds) => {
    if (!ev) return;
    window._notionClipboardEvent = Object.assign({}, ev);
    triggerToast("已拷贝日程，可在目标日期按 ⌘V 粘贴");
  };

  /* 创建副本 (⌘D) */
  const handleDuplicateEvent = (ev, ds) => {
    if (!ev) return;
    const targetDate = ds || ev.date || focusedDate || TODAY;
    const copy = Object.assign({}, ev, {
      _uid: "copy_" + Date.now(),
      record_id: undefined,
      text: ev.text + " (副本)",
      date: targetDate,
    });
    handleCreateEvent(copy);
    triggerToast("已创建副本");
  };

  /* 转为全天日程 / 设为时间段 */
  const handleRemoveEventTime = (ev, ds) => {
    if (!ev) return;
    const d = ds || ev.date || TODAY;
    if (ev.isAllDay) {
      const updated = Object.assign({}, ev, {
        isAllDay: false,
        startTime: `${d} 09:00:00`,
        endTime: `${d} 10:00:00`,
        startTimeStr: "09:00",
        endTimeStr: "10:00",
      });
      handleUpdateEvent(updated);
      triggerToast("已转为时间段 (09:00-10:00)");
    } else {
      const updated = Object.assign({}, ev, {
        isAllDay: true,
        startTime: `${d} 00:00:00`,
        endTime: `${d} 23:59:00`,
        startTimeStr: "00:00",
        endTimeStr: "23:59",
      });
      handleUpdateEvent(updated);
      triggerToast("已转为全天日程");
    }
  };

  /* 在飞书多维表格中跳转查看与管理 */
  const handleOpenFeishu = (ev) => {
    const BASE_TOKEN = "SQbpb4osNaAkY7s8UVdcupkYnqe";
    const TABLE_ID = "tblC5R0w900sav9H";
    let url = "https://feishu.cn/base/" + BASE_TOKEN + "?table=" + TABLE_ID;
    if (ev && ev.record_id) {
      url += "&record=" + encodeURIComponent(ev.record_id);
    }
    window.open(url, "_blank");
  };

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((st) => {
        if (st && st.ok) setFeishuStatus(st);
      })
      .catch(() => {});
  }, []);

  const viewportRef = useRef(null);
  const wrapRef = useRef(null);
  const pctRef = useRef(null);
  const apiRef = useRef(null);
  // 供手势引擎回调的最新引用（避免闭包过期）
  const cellClickRef = useRef(null);
  const viewCtxRef = useRef({});
  const editingRef = useRef(false); // 弹窗开着时屏蔽全局快捷键
  const fileRef = useRef(null); // 迁移包导入的文件选择器
  const fillModeRef = useRef(false); // 手势引擎实时读（mount 一次，闭包过期）
  const fillApplyRef = useRef(null); // 手势引擎松手时回调 applyFill
  const fillTapRef = useRef(null); // 手势引擎轻点松手时回调：剪切/粘贴
  const toastTimerRef = useRef(null); // 填充结果条自动隐藏计时

  /* ---- 基础数据 + 本地编辑合并（双轨分离：年看板仅总结，天周月全量日程） ---- */
  const byDate = useMemo(() => {
    const map = {}; // 年看板专用：仅收录「一天总结」
    const eventsByDate = {}; // 天/周/多天/月视图专用：全量日程事件列表

    baseList.forEach((r) => {
      if (!r || r.markedDelete) return;
      const rDate = r.date || (r.startTime && typeof r.startTime === "string" && r.startTime.length >= 10 ? r.startTime.slice(0, 10) : "");
      if (!rDate || typeof rDate !== "string" || rDate.length < 10) return;
      if (!r.date) r.date = rDate; // 自动纠正补齐缺失字段

      const parsedTime = parseEventTime(r.startTime, r.endTime);
      const isAllDay = !!r.isAllDay || r.type === "一天总结" || !!parsedTime.isAllDay || !r.startTime;
      const ev = Object.assign({}, r, parsedTime, { date: rDate, isAllDay });

      // 1. 全量日程归集（天/周/多天/月视图消费）
      if (!eventsByDate[rDate]) eventsByDate[rDate] = [];
      if (isAllDay) {
        const cleanText = (ev.text || "").trim().toLowerCase();
        const dupIdx = eventsByDate[rDate].findIndex((item) => {
          if (!item.isAllDay && item.type !== "一天总结") return false;
          return (item.text || "").trim().toLowerCase() === cleanText;
        });
        if (dupIdx >= 0) {
          const old = eventsByDate[rDate][dupIdx];
          if (ev.type === "一天总结" || (!old.record_id && ev.record_id)) {
            eventsByDate[rDate][dupIdx] = Object.assign({}, old, ev);
          }
        } else {
          eventsByDate[rDate].push(ev);
        }
      } else {
        // 时段事件智能防重守卫：同日期、同标题、完全相同起止时段自动合并，杜绝重叠双胞胎
        const cleanText = (ev.text || "").trim().toLowerCase();
        const sTime = (ev.startTime || "").slice(0, 16);
        const eTime = (ev.endTime || "").slice(0, 16);
        const dupIdx = eventsByDate[rDate].findIndex((item) => {
          if (item.isAllDay || item.type === "一天总结") return false;
          const itemS = (item.startTime || "").slice(0, 16);
          const itemE = (item.endTime || "").slice(0, 16);
          return (item.text || "").trim().toLowerCase() === cleanText && itemS === sTime && itemE === eTime;
        });
        if (dupIdx >= 0) {
          const old = eventsByDate[rDate][dupIdx];
          if (!old.record_id && ev.record_id) {
            eventsByDate[rDate][dupIdx] = Object.assign({}, old, ev);
          }
        } else {
          eventsByDate[rDate].push(ev);
        }
      }

      // 跨天全天日程支持：若日程跨越连续多天全天，每一天都应在全天专区展示
      if (isAllDay && r.endDate && typeof r.endDate === "string" && r.endDate > rDate) {
        let cur = getNextDayStr(rDate);
        while (cur <= r.endDate && cur <= "2035-12-31") {
          if (!eventsByDate[cur]) eventsByDate[cur] = [];
          eventsByDate[cur].push(Object.assign({}, ev, { date: cur, _multiDaySpan: true }));
          cur = getNextDayStr(cur);
        }
      }

      // 跨天日程连贯支持：若日程跨越午夜延展至次日，自动在次日生成连贯延续段
      if (parsedTime.isCrossDay && r.startTime && r.endTime) {
        const eDate = new Date(r.endTime);
        if (!isNaN(eDate.getTime())) {
          const nextDs = `${eDate.getFullYear()}-${pad2(eDate.getMonth() + 1)}-${pad2(eDate.getDate())}`;
          if (nextDs !== rDate) {
            if (!eventsByDate[nextDs]) eventsByDate[nextDs] = [];
            const eh = eDate.getHours();
            const em = eDate.getMinutes();
            const nextEndMinutes = Math.min(1440, Math.max(15, eh * 60 + em));
            const nextPart = Object.assign({}, ev, {
              _crossDayPart: "next",
              _parentDate: rDate,
              date: nextDs,
              startMinutes: 0,
              diffMinutes: nextEndMinutes,
              startTop: 0,
              height: Math.max(26, (nextEndMinutes / 60) * 50),
              startTimeStr: "00:00",
              endTimeStr: pad2(eh) + ":" + pad2(em),
              timeRangeStr: `00:00 → ${pad2(eh)}:${pad2(em)} (自昨天 ${ev.startTimeStr || ""} 延续)`,
            });
            eventsByDate[nextDs].push(nextPart);
          }
        }
      }

      // 2. 年看板仅收录属于该年份的「一天总结」（年看板纯粹总结全天事项，绝不受琐碎时段日程干扰）
      if (rDate.slice(0, 4) === String(year)) {
        if (r.type === "一天总结") {
          map[rDate] = Object.assign(
            { date: rDate, type: "一天总结", weekday: weekdayOf(year, Number(rDate.slice(5, 7)) - 1, Number(rDate.slice(8, 10))) },
            ev,
            { date: rDate }
          );
        }
      }
    });

    // 对每个日期的日程按起止时间升序排列（全天置顶）
    Object.keys(eventsByDate).forEach((ds) => {
      eventsByDate[ds].sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return (a.startTime || "").localeCompare(b.startTime || "");
      });
    });

    let local = 0;
    Object.keys(edits).forEach((k) => {
      if (!k || typeof k !== "string" || k.length < 10 || k.slice(0, 4) !== String(year)) return;
      const v = edits[k];
      if (v.deleted) {
        delete map[k];
        if (eventsByDate[k]) {
          eventsByDate[k] = eventsByDate[k].filter((ev) => ev.type !== "一天总结");
        }
        return;
      }
      map[k] = Object.assign({ date: k, type: "一天总结" }, map[k], v, {
        date: k,
        type: "一天总结",
        _local: true,
        weekday: weekdayOf(year, Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10))),
      });
      local += 1;

      // 同步天/周/月视图中的「一天总结」
      if (!eventsByDate[k]) eventsByDate[k] = [];
      const sumIdx = eventsByDate[k].findIndex((ev) => ev.type === "一天总结");
      const summaryEv = Object.assign(
        {
          date: k,
          type: "一天总结",
          isAllDay: true,
          startTime: `${k} 00:00:00`,
          endTime: `${k} 23:59:00`,
          startTimeStr: "00:00",
          endTimeStr: "23:59",
          category: "生活",
          status: "完成",
        },
        sumIdx >= 0 ? eventsByDate[k][sumIdx] : (BASE_BY_DATE[k] || {}),
        v,
        {
          date: k,
          type: "一天总结",
          isAllDay: true,
          _local: true,
        }
      );
      if (sumIdx >= 0) {
        eventsByDate[k][sumIdx] = summaryEv;
      } else if ((summaryEv.text || "").trim()) {
        const matchTextIdx = eventsByDate[k].findIndex(
          (ev) => (ev.text || "").trim() === (summaryEv.text || "").trim() && (ev.isAllDay || !ev.startTime)
        );
        if (matchTextIdx >= 0) {
          eventsByDate[k][matchTextIdx] = Object.assign({}, eventsByDate[k][matchTextIdx], summaryEv);
        } else {
          eventsByDate[k].unshift(summaryEv);
        }
      }
    });

    const monthCounts = new Array(12).fill(0);
    let done = 0;
    let last = "";
    const counts = {};
    Object.keys(map).forEach((k) => {
      if (!k || typeof k !== "string" || k.length < 10) return;
      const r = map[k];
      if (!r) return;
      monthCounts[Number(k.slice(5, 7)) - 1] += 1;
      if (r.status === "完成") done += 1;
      if (k > last) last = k;
      if (r.category) {
        counts[r.category] = (counts[r.category] || 0) + 1;
      }
    });
    const lastLabel = last ? Number(last.slice(5, 7)) + " 月 " + Number(last.slice(8)) + " 日" : "";
    return { map, eventsByDate, monthCounts, total: Object.keys(map).length, done, lastLabel, last, counts, local };
  }, [year, edits, baseList]);

  const stats = byDate;

  /* ---- 执行型强提醒检测心跳 (Remember + Upupup 精髓) ---- */
  const activeExecutionAlertRef = useRef(activeExecutionAlert);
  activeExecutionAlertRef.current = activeExecutionAlert;

  useEffect(() => {
    if (t.alertEnabled === false) return;

    const checkAlerts = () => {
      const now = new Date();
      const currentDs = formatDate(now);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // 1. 如果当前已有强提醒处于待响应状态，检查是否超 2 分钟未响应（自愈催促升级循环）
      const curAlert = activeExecutionAlertRef.current;
      if (curAlert && curAlert.triggerTime && !curAlert.isEscalated) {
        const elapsed = (Date.now() - curAlert.triggerTime) / 1000;
        if (elapsed >= 120) { // 2分钟未响应
          fetch("/api/open-app", { method: "POST" }).catch(() => {});
          if (window.SFX && window.SFX.playSystemSound) {
            window.SFX.playSystemSound(t.alertSound || "Alarm");
          }
          if (t.ttsSpeak && window.SFX && window.SFX.notify) {
            window.SFX.notify({
              title: "强烈催促：日程待执行",
              message: curAlert.event.text || curAlert.event.title,
              sound: t.alertSound || "Glass",
              tts: true,
              speakText: `强烈催促！你的日程「${curAlert.event.text || curAlert.event.title}」已等待超过两分钟，请立即开始执行！`,
            });
          }
          setActiveExecutionAlert((prev) => (prev ? Object.assign({}, prev, { isEscalated: true }) : null));
        }
      }

      // 2. 扫描今天的日程
      const todayEvents = (byDate.eventsByDate && byDate.eventsByDate[currentDs]) || [];
      const leadMin = Number(t.alertLeadMinutes) || 0;

      todayEvents.forEach((ev) => {
        if (ev.isAllDay || !ev.startTimeStr || ev.status === "完成") return;
        const parsed = parseEventTime(ev.startTime, ev.endTime);
        if (parsed.startMinutes === undefined) return;

        const evId = ev.record_id || (ev.text + "_" + ev.date + "_" + ev.startTimeStr);
        if (acknowledgedAlertsRef.current[evId]) return;

        const triggerMin = parsed.startMinutes - leadMin;
        if (currentMinutes >= triggerMin && currentMinutes <= parsed.startMinutes + 15) {
          acknowledgedAlertsRef.current[evId] = true;
          fetch("/api/open-app", { method: "POST" }).catch(() => {});
          if (window.SFX && window.SFX.playSystemSound) {
            window.SFX.playSystemSound(t.alertSound || "Glass");
          }
          if (window.SFX && window.SFX.notify) {
            window.SFX.notify({
              title: "日程到点强提醒",
              message: ev.text || ev.title,
              sound: t.alertSound || "Glass",
              tts: !!t.ttsSpeak,
              speakText: `注意：你的日程「${ev.text || ev.title}」已到时间，请开始执行`,
            });
          }
          setActiveExecutionAlert({
            event: Object.assign({}, ev, { title: ev.text || ev.title }),
            triggerTime: Date.now(),
            isEscalated: false,
          });
        }
      });
    };

    const timer = setInterval(checkAlerts, 10000);
    return () => clearInterval(timer);
  }, [t.alertEnabled, t.alertSound, t.alertLeadMinutes, t.ttsSpeak, byDate]);

  /* ---- 写回包：字段级覆盖层 → Base 定向 upsert 载荷（assets/base-upsert.js） ---- */
  const upsert = useMemo(
    () =>
      window.buildUpsertPayload
        ? window.buildUpsertPayload(edits, year)
        : { counts: { create: 0, update: 0, soft_delete: 0 }, changes: [], payload: null },
    [edits, year]
  );
  const pendingCreates = useMemo(
    () => baseList.filter((r) => (!r.record_id || r._local) && !r.markedDelete && r.type !== "一天总结"),
    [baseList]
  );
  const pendingUpdates = useMemo(
    () => baseList.filter((r) => r.record_id && r._dirty && !r.markedDelete && r.type !== "一天总结"),
    [baseList]
  );

  const syncInfo = useMemo(() => {
    const yearCount = upsert && upsert.changes ? upsert.changes.length : 0;
    const total = yearCount + pendingCreates.length + pendingUpdates.length + pendingDeletions.length;
    return {
      total,
      create: (upsert && upsert.counts ? upsert.counts.create : 0) + pendingCreates.length,
      update: (upsert && upsert.counts ? upsert.counts.update : 0) + pendingUpdates.length,
      softDelete: (upsert && upsert.counts ? upsert.counts.soft_delete : 0) + pendingDeletions.length,
    };
  }, [upsert, pendingCreates, pendingUpdates, pendingDeletions]);

  const downloadJSON = (json, name) => {
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      /* 下载不可用时仍尝试剪贴板 */
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).catch(() => {});
    }
  };

  const exportUpsert = () => {
    if (!upsert.payload || !upsert.changes.length) return;
    const json = JSON.stringify(upsert.payload, null, 2);
    downloadJSON(json, "board-upsert-" + year + "-" + TODAY + ".json");
    if (window.SFX) window.SFX.play("save");
  };

  /* ---- 飞书 Base 双向直连同步：拉取与写回 ---- */
  const onPullFromBase = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/pull");
      const data = await res.json();
      if (data.ok && Array.isArray(data.records)) {
        const fresh = data.records.filter((r) => !r.markedDelete).map(mapRecordData);
        window.BOARD_DATA = { records: fresh };
        Object.keys(BASE_BY_DATE).forEach((k) => delete BASE_BY_DATE[k]);
        fresh.forEach((r) => {
          if (r.type === "一天总结") BASE_BY_DATE[r.date] = r;
        });

        // 增量安全合并：以飞书远端最新数据为主，同时严格保留本地尚未被远端索引的新建日程 (_local: true 或 !record_id)
        setBaseList((prev) => {
          const freshIds = new Set(fresh.map((f) => f.record_id).filter(Boolean));
          const localOnly = prev.filter((r) => {
            if (!r.record_id) return true;
            if (r._local && !freshIds.has(r.record_id)) return true;
            return false;
          });
          return [...fresh, ...localOnly];
        });

        showFillToast({ custom: true, text: "✅ 已同步多维表格最新数据（共 " + fresh.length + " 条）" });
        if (window.SFX) window.SFX.play("save");
      } else {
        alert("拉取失败：" + (data.error || "未知错误"));
      }
    } catch (err) {
      alert("网络连接失败：" + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const onPushToBase = async () => {
    // 1. 收集来自覆盖层的 edits 变动
    const allChanges = [...(upsert.changes || [])];

    // 2. 收集本地新建但尚未同步到飞书多维表格的日常日程（无 record_id 或 _local: true）
    pendingCreates.forEach((item) => {
      allChanges.push({
        op: "create",
        _uid: item._uid,
        fields: Object.assign({ "日期": item.date }, buildPushFields(item)),
      });
    });

    // 3. 收集本地修改过的已有日程 (_dirty: true)
    pendingUpdates.forEach((item) => {
      allChanges.push({
        op: "update",
        record_id: item.record_id,
        fields: buildPushFields(item),
      });
    });

    // 4. 收集本地已删除的已有日程 (pendingDeletions)
    pendingDeletions.forEach((delItem) => {
      allChanges.push({
        op: "delete",
        record_id: delItem.record_id,
        fields: { "标记删除": true },
      });
    });

    if (!allChanges.length) {
      showFillToast({ custom: true, text: "✓ 本地所有日程均已与飞书 Base 保持最新同步" });
      if (window.SFX) window.SFX.play("toggle");
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: allChanges }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.removeItem(editsKey(year));
        localStorage.removeItem("polaris_pending_local_events");
        setEdits({});
        setPendingDeletions([]);

        // ID 精准对齐：以飞书返回的真实 record_id 回填本地 UID，严禁整表擦除
        const idMap = new Map();
        if (data.createdRecords && Array.isArray(data.createdRecords)) {
          data.createdRecords.forEach((c) => {
            if (c._uid && c.record_id) idMap.set(c._uid, c.record_id);
          });
        }

        setBaseList((prev) =>
          prev.map((r) => {
            if (r._uid && idMap.has(r._uid)) {
              return Object.assign({}, r, { record_id: idMap.get(r._uid), _dirty: false, _local: false });
            }
            if (r._dirty || r._local) {
              return Object.assign({}, r, { _dirty: false, _local: false });
            }
            return r;
          })
        );
        showFillToast({
          custom: true,
          text: "🎉 成功写回飞书表格（新增 " + (data.results ? data.results.created : 0) + " · 修改 " + (data.results ? data.results.updated : 0) + " · 软删 " + (data.results ? data.results.deleted : 0) + "）",
        });
        if (window.SFX) window.SFX.play("save");
      } else {
        alert("写回失败：" + (data.error || "未知错误"));
      }
    } catch (err) {
      alert("写入网络错误：" + err.message);
    } finally {
      setSyncing(false);
    }
  };

  /* ---- 数据迁移：全部本地编辑＋风格设置打包，换设备/浏览器导入即恢复 ---- */
  const exportData = () => {
    const bundle = {
      app: "年度画板 · 迁移包",
      version: 1,
      exported_at: new Date().toISOString(),
      years: {},
      tweaks: Object.assign({}, window.TWEAK_DEFAULTS, t),
    };
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
      try {
        const raw = localStorage.getItem(editsKey(y));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Object.keys(parsed).length) bundle.years[String(y)] = parsed;
        }
      } catch (err) {
        /* 跳过年份 */
      }
    }
    downloadJSON(JSON.stringify(bundle, null, 2), "board-migration-" + TODAY + ".json");
    if (window.SFX) window.SFX.play("save");
  };

  const importBundle = (bundle) => {
    if (!bundle || typeof bundle !== "object" || !bundle.years || typeof bundle.years !== "object") {
      return { ok: false, text: "导入失败：不是有效的迁移包" };
    }
    let imported = 0;
    let storeFailed = false;
    Object.keys(bundle.years).forEach((ys) => {
      const y = Number(ys);
      if (!/^\d{4}$/.test(ys) || y < YEAR_MIN || y > YEAR_MAX) return;
      const src = bundle.years[ys];
      if (!src || typeof src !== "object") return;
      const next = Object.assign({}, loadEdits(y));
      Object.keys(src).forEach((ds) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(ds)) return;
        const n = normalizeEditEntry(ds, src[ds]);
        if (n) {
          next[ds] = n;
          imported += 1;
        } else delete next[ds]; // 导入方与 Base 一致 → 该日回到 Base 原貌
      });
      if (!persistEdits(y, next)) storeFailed = true;
      if (y === year) setEdits(next);
    });
    if (storeFailed) setStorageWarn(true);
    if (bundle.tweaks && typeof bundle.tweaks === "object") {
      const patch = {};
      Object.keys(window.TWEAK_DEFAULTS).forEach((k) => {
        if (k in bundle.tweaks) patch[k] = bundle.tweaks[k];
      });
      if (Object.keys(patch).length) setTweak(patch);
    }
    return { ok: true, text: "已导入 " + imported + " 条本地编辑与风格设置" };
  };

  const importFile = () => {
    if (fileRef.current) fileRef.current.click();
  };

  const onFileChosen = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = ""; // 允许重复选同一文件
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bundle = JSON.parse(String(reader.result));
        let n = 0;
        if (bundle && bundle.years) {
          Object.keys(bundle.years).forEach((ys) => {
            n += Object.keys(bundle.years[ys] || {}).length;
          });
        }
        if (!n && !(bundle.tweaks && Object.keys(bundle.tweaks).length)) throw new Error("empty");
        setPendingImport({ bundle: bundle, count: n });
        setImportMsg(null);
      } catch (err) {
        setImportMsg({ ok: false, text: "文件格式不对，无法导入" });
      }
    };
    reader.readAsText(f);
  };

  const applyImport = () => {
    const p = pendingImport;
    setPendingImport(null);
    if (!p) return;
    const res = importBundle(p.bundle);
    setImportMsg(res);
    if (window.SFX) window.SFX.play(res.ok ? "save" : "back");
  };

  /* ---- 全部合并记录（供 ⌘K 跨年月全量搜索） ---- */
  const allRecords = useMemo(() => {
    const list = [];
    const processedSummaryDates = new Set();
    baseList.forEach((r) => {
      if (!r || !r.date || r.markedDelete) return;
      if (r.type === "一天总结") {
        processedSummaryDates.add(r.date);
        const edit = edits[r.date];
        if (edit && edit.deleted) return;
        if (edit) list.push(Object.assign({}, r, edit, { type: "一天总结", date: r.date }));
        else list.push(r);
      } else {
        list.push(r);
      }
    });
    Object.keys(edits).forEach((k) => {
      if (!k || typeof k !== "string" || processedSummaryDates.has(k)) return;
      const e = edits[k];
      if (e && !e.deleted && (e.text || "").trim()) {
        list.push(Object.assign({ date: k, type: "一天总结", category: "生活", status: "完成" }, e, { date: k }));
      }
    });
    return list.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [baseList, edits]);

  /* ---- 视图切换：天 (1) / 2~6天 / 周 (7) / 月 (Notion) / 年看板 ---- */
  const handleViewModeChange = (mode, days = 1) => {
    setViewMode(mode);
    if (mode === "day") setTimelineDays(1);
    else if (mode === "week") setTimelineDays(7);
    else if (mode === "days") setTimelineDays(days);
    else if (mode === "month") {
      const parts = (focusedDate || TODAY).split("-").map(Number);
      setCurrentMonth(parts[1] - 1);
    }

    try {
      localStorage.setItem("board-view-mode", mode);
    } catch (e) {}
  };

  /* ---- 翻页导航 (J / K / 左右箭头 / 双指手势) ---- */
  const handlePrev = () => {
    if (viewMode === "day" || viewMode === "week" || viewMode === "days") {
      const step = viewMode === "week" ? 7 : (viewMode === "days" ? (timelineDays <= 3 ? 1 : timelineDays) : 1);
      const parts = (focusedDate || TODAY).split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2] - step);
      const ds = d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
      setFocusedDate(ds);
      setSelectedDate(ds);
      setCurrentMonth(d.getMonth());
      setYear(d.getFullYear());
    } else if (viewMode === "month") {
      let nextM = currentMonth - 1;
      let nextY = year;
      if (nextM < 0) {
        nextM = 11;
        nextY = year - 1;
        changeYear(nextY);
      }
      setCurrentMonth(nextM);
      const parts = (focusedDate || TODAY).split("-").map(Number);
      const curDay = parts[2] || 1;
      const maxDaysInNextM = new Date(nextY, nextM + 1, 0).getDate();
      const targetDay = Math.min(curDay, maxDaysInNextM);
      const ds = nextY + "-" + pad2(nextM + 1) + "-" + pad2(targetDay);
      setFocusedDate(ds);
      setSelectedDate(ds);
    } else {
      changeYear(year - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === "day" || viewMode === "week" || viewMode === "days") {
      const step = viewMode === "week" ? 7 : (viewMode === "days" ? (timelineDays <= 3 ? 1 : timelineDays) : 1);
      const parts = (focusedDate || TODAY).split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2] + step);
      const ds = d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
      setFocusedDate(ds);
      setSelectedDate(ds);
      setCurrentMonth(d.getMonth());
      setYear(d.getFullYear());
    } else if (viewMode === "month") {
      let nextM = currentMonth + 1;
      let nextY = year;
      if (nextM > 11) {
        nextM = 0;
        nextY = year + 1;
        changeYear(nextY);
      }
      setCurrentMonth(nextM);
      const parts = (focusedDate || TODAY).split("-").map(Number);
      const curDay = parts[2] || 1;
      const maxDaysInNextM = new Date(nextY, nextM + 1, 0).getDate();
      const targetDay = Math.min(curDay, maxDaysInNextM);
      const ds = nextY + "-" + pad2(nextM + 1) + "-" + pad2(targetDay);
      setFocusedDate(ds);
      setSelectedDate(ds);
    } else {
      changeYear(year + 1);
    }
  };

  /* ---- 年份切换 ---- */
  const changeYear = (ny) => {
    if (ny < YEAR_MIN || ny > YEAR_MAX) return;
    setYear(ny);
    setEdits(loadEdits(ny));
    setCreateModal(null);
    requestAnimationFrame(() => {
      const a = apiRef.current;
      if (a && a.best) a.best();
    });
  };

  /* ---- 回到今天：一键直达当前时间与今天 ---- */
  const backToday = () => {
    const realNow = getNow();
    const realToday = getToday(realNow);
    refreshToday();
    setTodayTick((v) => v + 1);
    const cy = realNow.getFullYear();
    const cm = realNow.getMonth();
    if (year !== cy) changeYear(cy);
    setCurrentMonth(cm);
    setFocusedDate(realToday);
    setSelectedDate(realToday);
    setSelectedEvent(byDate.map[realToday] || null);
    if (viewMode === "year") {
      requestAnimationFrame(() => {
        const a = apiRef.current;
        if (a) (a.today || a.best)();
      });
    }
  };

  /* ---- 打开居中新建弹窗 ---- */
  const openCreateModal = (initData) => {
    const isYear = viewMode === "year";
    const defaultData = {
      date: selectedDate || focusedDate || TODAY,
      isAllDay: isYear,
      type: isYear ? "一天总结" : "自己安排",
      isDaySummary: isYear,
    };
    const merged = Object.assign({}, defaultData, initData);
    if (isYear && merged.isAllDay && (!initData || !initData.type)) {
      merged.type = "一天总结";
      merged.isDaySummary = true;
    }
    // 用户铁律定死：只要是“一天总结”，强制不勾选时间！
    if (merged.type === "一天总结" || merged.isDaySummary) {
      merged.trackTime = false;
    } else if (merged.trackTime === undefined) {
      merged.trackTime = true;
    }
    setCreateModal(merged);
  };
  const openCreateModalRef = useRef(openCreateModal);
  openCreateModalRef.current = openCreateModal;
  window._openCreateModalGlobal = openCreateModal;

  /* ---- 跨月份/跨年份日期点选跳转 (单击仅选择聚焦) ---- */
  const handleSelectDate = (ds) => {
    const y = Number(ds.slice(0, 4));
    const m = Number(ds.slice(5, 7)) - 1;
    if (y !== year) changeYear(y);
    setCurrentMonth(m);
    setSelectedDate(ds);
    const rec = byDate.map[ds] || BASE_BY_DATE[ds] || null;
    if (rec) {
      const safeRec = Object.assign({ date: ds, type: rec.type || "一天总结" }, rec, { date: ds });
      setSelectedEvent(safeRec);
      setDrawerOpen(true);
      setDrawerTab("detail");
    } else {
      setSelectedEvent(null);
    }
  };

  /* ---- 单元格点击分流：已有内容打开右侧抽屉，空白处仅高亮聚焦选择 ---- */
  const openCell = (ds) => {
    setSelectedDate(ds);
    const rec = byDate.map[ds] || BASE_BY_DATE[ds] || null;
    if (rec) {
      const safeRec = Object.assign({ date: ds, type: rec.type || "一天总结" }, rec, { date: ds });
      setSelectedEvent(safeRec);
      setDrawerOpen(true);
      setDrawerTab("detail");
    } else {
      setSelectedEvent(null);
    }
  };
  cellClickRef.current = openCell;
  viewCtxRef.current = { year: year, lastDate: byDate.last || null };

  /* ---- 处理从居中弹窗创建新日程 (支持单日、多天区间与重复规则批量创建) ---- */
  const handleCreateNewEvent = (evData) => {
    const ds = evData.date || TODAY;
    const repeat = evData.repeatMode || "none";
    const repeatDays = Number(evData.repeatDays) || 7;
    const isMulti = evData.endDate && evData.endDate !== ds;
    const isDaySummary = evData.type === "一天总结" || evData.isDaySummary || (viewMode === "year" && evData.isAllDay);
    const resolvedType = isDaySummary ? "一天总结" : (evData.type || "自己安排");
    const rec = {
      text: evData.text,
      category: evData.category || "生活",
      status: evData.status || "",
      note: evData.note || "",
      date: ds,
      endDate: evData.endDate || ds,
      startTime: evData.startTime,
      endTime: evData.endTime,
      startTimeStr: evData.startTimeStr,
      endTimeStr: evData.endTimeStr,
      durationStr: evData.isAllDay ? "全天" : formatDurationText(ds, evData.startTimeStr || "09:00", evData.endDate || ds, evData.endTimeStr || "10:00", evData.isAllDay),
      isAllDay: !!evData.isAllDay,
      type: resolvedType,
      reminder: evData.reminder || "提前 5 分钟",
      trackTime: resolvedType === "一天总结" ? false : (typeof evData.trackTime === "boolean" ? evData.trackTime : true),
      _local: true,
    };

    if (repeat !== "none") {
      // 批量重复创建：按照每天/工作日/每周规则在指定范围内批量生成独立任务
      const sDate = new Date(ds + "T00:00:00");
      const nextEdits = Object.assign({}, edits);
      const newItems = [];
      for (let i = 0; i < repeatDays; i++) {
        const cur = new Date(sDate);
        cur.setDate(cur.getDate() + i);
        const dayOfWeek = cur.getDay(); // 0: 周日, 6: 周六
        if (repeat === "weekdays" && (dayOfWeek === 0 || dayOfWeek === 6)) {
          continue;
        }
        if (repeat === "weekly" && i % 7 !== 0) {
          continue;
        }
        const curDs = cur.getFullYear() + "-" + pad2(cur.getMonth() + 1) + "-" + pad2(cur.getDate());
        const curStart = evData.isAllDay ? `${curDs} 00:00:00` : `${curDs} ${evData.startTimeStr || "09:00"}:00`;
        const curEnd = evData.isAllDay ? `${curDs} 23:59:00` : `${curDs} ${evData.endTimeStr || "10:00"}:00`;
        const itemRec = Object.assign({}, rec, {
          date: curDs,
          endDate: curDs,
          startTime: curStart,
          endTime: curEnd,
          _uid: `${curDs}_${Date.now()}_${i}`,
        });
        newItems.push(itemRec);
        if (evData.type === "一天总结" || evData.isDaySummary) {
          const curEntry = normalizeEditEntry(curDs, itemRec);
          if (curEntry) nextEdits[curDs] = curEntry;
        }
      }
      if (evData.type === "一天总结" || evData.isDaySummary) {
        persistEdits(year, nextEdits);
        setEdits(nextEdits);
      }
      setBaseList((prev) => [...prev, ...newItems]);
      setUndoBatch({
        type: "create",
        items: newItems,
      });
      triggerToast(
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span>已批量创建 {newItems.length} 项「{rec.text}」日程</span>
          <button
            className="notion-toast-undo-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleUndoBatch();
            }}
          >
            撤销 (⌘Z)
          </button>
        </span>,
        6000
      );
      fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changes: newItems.map((item) => ({
            op: "create",
            _uid: item._uid,
            fields: {
              "日期": item.date,
              "日程标题": item.text,
              "开始时间": item.startTime,
              "结束时间": item.endTime,
              "板块": item.category || "生活",
              "完成状态": item.status === "完成" ? "完成" : "未完成",
              "日程类型": item.type || "自己安排",
              "计入时间记录": !!item.trackTime,
              "备注": item.note || "",
              "提醒时间": item.reminder || "提前 5 分钟",
              "重复规则": evData.repeatMode === "daily" ? "每天" : evData.repeatMode === "weekdays" ? "工作日" : evData.repeatMode === "weekly" ? "每周" : "不重复",
            },
          })),
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res && res.ok && Array.isArray(res.createdRecords)) {
            const idMap = new Map();
            res.createdRecords.forEach((c) => {
              if (c._uid && c.record_id) idMap.set(c._uid, c.record_id);
            });
            setBaseList((prev) =>
              prev.map((r) => {
                if (r._uid && idMap.has(r._uid)) {
                  return Object.assign({}, r, { record_id: idMap.get(r._uid), _local: false, _dirty: false });
                }
                return r;
              })
            );
          }
        })
        .catch(() => {});
    } else if (evData.isAllDay && isMulti) {
      const sDate = new Date(ds + "T00:00:00");
      const eDate = new Date(evData.endDate + "T00:00:00");
      const cur = new Date(sDate);
      const nextEdits = Object.assign({}, edits);
      const newItems = [];
      while (cur <= eDate) {
        const curDs = cur.getFullYear() + "-" + pad2(cur.getMonth() + 1) + "-" + pad2(cur.getDate());
        const curRec = Object.assign({}, rec, { date: curDs, endDate: curDs, _uid: `${curDs}_${Date.now()}` });
        newItems.push(curRec);
        if (evData.type === "一天总结" || evData.isDaySummary) {
          const curEntry = normalizeEditEntry(curDs, curRec);
          if (curEntry) nextEdits[curDs] = curEntry;
        }
        cur.setDate(cur.getDate() + 1);
      }
      if (evData.type === "一天总结" || evData.isDaySummary) {
        persistEdits(year, nextEdits);
        setEdits(nextEdits);
      }
      setBaseList((prev) => [...prev, ...newItems]);
      setUndoBatch({
        type: "create",
        items: newItems,
      });
      triggerToast(
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span>已批量创建跨天日程（共 {newItems.length} 天）</span>
          <button
            className="notion-toast-undo-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleUndoBatch();
            }}
          >
            撤销 (⌘Z)
          </button>
        </span>,
        6000
      );
      fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changes: newItems.map((item) => ({
            op: "create",
            _uid: item._uid,
            fields: {
              "日期": item.date,
              "日程标题": item.text,
              "开始时间": item.startTime,
              "结束时间": item.endTime,
              "板块": item.category || "生活",
              "完成状态": item.status === "完成" ? "完成" : "未完成",
              "日程类型": item.type || "自己安排",
              "计入时间记录": !!item.trackTime,
              "备注": item.note || "",
              "提醒时间": item.reminder || "提前 5 分钟",
            },
          })),
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res && res.ok && Array.isArray(res.createdRecords)) {
            const idMap = new Map();
            res.createdRecords.forEach((c) => {
              if (c._uid && c.record_id) idMap.set(c._uid, c.record_id);
            });
            setBaseList((prev) =>
              prev.map((r) => {
                if (r._uid && idMap.has(r._uid)) {
                  return Object.assign({}, r, { record_id: idMap.get(r._uid), _local: false, _dirty: false });
                }
                return r;
              })
            );
          }
        })
        .catch(() => {});
    } else {
      if (rec.type === "一天总结" || isDaySummary) {
        saveEdit(ds, rec);
      }
      // 防重检查：如果同日期已存在同标题全天日程或已存在「一天总结」，原地升级/替换，杜绝重复分裂
      let existingRecordId = null;
      const itemUid = rec._uid || `${ds}_${Date.now()}`;
      rec._uid = itemUid;
      setBaseList((prev) => {
        const next = [...prev];
        const matchIdx = next.findIndex((r) => {
          if (!r || r.markedDelete) return false;
          if (r.date !== ds) return false;
          if (rec.type === "一天总结" && r.type === "一天总结") return true;
          if ((r.text || "").trim() === (rec.text || "").trim() && (r.isAllDay || r.type === "一天总结")) return true;
          return false;
        });
        if (matchIdx >= 0) {
          existingRecordId = next[matchIdx].record_id || null;
          next[matchIdx] = Object.assign({}, next[matchIdx], rec, {
            _uid: next[matchIdx]._uid || itemUid,
            record_id: existingRecordId,
          });
          return next;
        }
        return [...next, Object.assign({}, rec, { _uid: itemUid })];
      });

      const pushOp = existingRecordId ? "update" : "create";
      const changePayload = {
        op: pushOp,
        _uid: itemUid,
        fields: {
          "日期": rec.date,
          "日程标题": rec.text,
          "开始时间": rec.startTime,
          "结束时间": rec.endTime,
          "板块": rec.category || "生活",
          "完成状态": rec.status === "完成" ? "完成" : "未完成",
          "日程类型": rec.type || "自己安排",
          "计入时间记录": !!rec.trackTime,
          "备注": rec.note || "",
          "提醒时间": rec.reminder || "提前 5 分钟",
        },
      };
      if (existingRecordId) {
        changePayload.record_id = existingRecordId;
      }

      fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changes: [changePayload],
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res && res.ok) {
            let assignedId = existingRecordId;
            if (!assignedId && res.createdRecords && res.createdRecords.length > 0) {
              const found = res.createdRecords.find((c) => c._uid === itemUid) || res.createdRecords[0];
              assignedId = found ? (found.record_id || found.id) : null;
            }
            if (assignedId) {
              setBaseList((prev) =>
                prev.map((r) => {
                  if (itemUid && r._uid === itemUid) {
                    return Object.assign({}, r, { record_id: assignedId, _local: false, _dirty: false });
                  }
                  return r;
                })
              );
            }
          }
        })
        .catch(() => {});
    }

    if (window.SFX) window.SFX.play("save");
    setSelectedDate(ds);
    setSelectedEvent(rec);
  };


  const saveEdit = (ds, rec) => {
    const entry = normalizeEditEntry(ds, rec); // 只记改动字段；与 Base 一致＝清除条目
    setEdits((prev) => {
      const next = Object.assign({}, prev);
      if (entry) next[ds] = entry;
      else delete next[ds];
      if (!persistEdits(year, next)) setStorageWarn(true);
      return next;
    });
    if (selectedDate === ds) {
      setSelectedEvent(Object.assign({}, rec, { date: ds }));
    }
  };

  const deleteRecord = (ds) => {
    setEdits((prev) => {
      const next = Object.assign({}, prev);
      if (BASE_BY_DATE[ds]) next[ds] = { deleted: true }; // 软删：写回包转 标记删除=true
      else delete next[ds]; // 本地新增又删除＝对 Base 无操作
      if (!persistEdits(year, next)) setStorageWarn(true);
      return next;
    });
    if (selectedDate === ds) {
      setSelectedEvent(null);
    }
  };

  /* ---- 下拉填充（类表格拖-fill）：模式开关 / 应用 / 撤销 / 剪切粘贴 ---- */
  const setFill = (on) => {
    fillModeRef.current = on;
    setFillMode(on);
    if (!on) {
      setFillSel(null);
      setCutSrc(null); // 退出填充模式同时清空剪贴板状态，不留悬挂的虚线框
    }
  };

  const dsLabel = (ds) => Number(ds.slice(5, 7)) + "月" + Number(ds.slice(8, 10)) + "日";

  const showFillToast = (obj) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setFillToast(obj);
    toastTimerRef.current = setTimeout(() => setFillToast(null), 6000);
  };

  /* 松手应用：把源格四字段写进范围内每个日期（与逐格编辑同一覆盖层管道，
     自动进入「写回 Base」统计）；空源下拖＝清空该段，语义同逐格删除 */
  const applyFill = (srcDs, mi, d1, d2) => {
    const days = monthDays(year, mi);
    const lo = Math.max(1, Math.min(d1, d2));
    const hi = Math.min(days, Math.max(d1, d2));
    const src = byDate.map[srcDs] || null;
    const srcEmpty = !src || !String(src.text || "").trim();
    const undoMap = {};
    let count = 0;
    const next = Object.assign({}, edits);
    for (let d = lo; d <= hi; d++) {
      const ds = year + "-" + pad2(mi + 1) + "-" + pad2(d);
      if (ds === srcDs) continue;
      undoMap[ds] = edits[ds];
      if (!srcEmpty) {
        const entry = normalizeEditEntry(ds, {
          text: src.text || "",
          category: src.category || "",
          note: src.note || "",
          status: src.status || "",
        });
        if (entry) next[ds] = entry;
        else delete next[ds];
      } else {
        if (BASE_BY_DATE[ds]) next[ds] = { deleted: true };
        else delete next[ds];
      }
      count++;
    }
    if (!persistEdits(year, next)) setStorageWarn(true);
    setEdits(next);
    if (count > 0) showFillToast({ count: count, cleared: srcEmpty, undo: undoMap });
    if (window.SFX) window.SFX.play("save");
  };
  fillApplyRef.current = applyFill;

  /* 轻点式剪切/粘贴：轻点有内容格＝剪切（快照四字段进剪贴板），再轻点其他格＝粘贴。
     剪贴板存快照而非现读——即使源格之后被拖动填充/编辑覆盖，粘出的仍是剪切那一刻的内容；
     连续粘贴时源格只清空一次（后续幂等），目标格可跨月任意选。 */
  const tapFill = (ds) => {
    if (!cutSrc) {
      const rec = byDate.map[ds];
      if (!rec || !String(rec.text || "").trim()) return; // 空格无可剪切，轻点无操作
      setCutSrc({
        ds: ds,
        text: rec.text || "",
        category: rec.category || "",
        note: rec.note || "",
        status: rec.status || "",
      });
      if (window.SFX) window.SFX.play("toggle");
      return;
    }
    if (ds === cutSrc.ds) {
      // 再点源格＝取消剪切（源格内容不动）
      setCutSrc(null);
      if (window.SFX) window.SFX.play("back");
      return;
    }
    applyPaste(ds);
  };
  fillTapRef.current = tapFill;

  /* 粘贴：剪贴板快照写入目标格四字段，源格清空（与逐格删除同语义，自动进写回 Base 统计）；
     undoMap 同时记录源格与目标格原值，一次撤销整体回滚 */
  const applyPaste = (dstDs) => {
    const cut = cutSrc;
    const undoMap = {};
    undoMap[cut.ds] = edits[cut.ds];
    undoMap[dstDs] = edits[dstDs];
    const next = Object.assign({}, edits);
    const entry = normalizeEditEntry(dstDs, {
      text: cut.text,
      category: cut.category,
      note: cut.note,
      status: cut.status,
    });
    if (entry) next[dstDs] = entry;
    else delete next[dstDs];
    if (BASE_BY_DATE[cut.ds]) next[cut.ds] = { deleted: true };
    else delete next[cut.ds]; // 本地新增格清空＝直接删条目（幂等，连续粘贴安全）
    if (!persistEdits(year, next)) setStorageWarn(true);
    setEdits(next);
    showFillToast({ pasted: true, dstLabel: dsLabel(dstDs), undo: undoMap });
    if (window.SFX) window.SFX.play("save");
  };

  const undoFill = () => {
    const undoMap = fillToast && fillToast.undo;
    if (!undoMap) return;
    const next = Object.assign({}, edits);
    Object.keys(undoMap).forEach((ds) => {
      if (undoMap[ds]) next[ds] = undoMap[ds];
      else delete next[ds];
    });
    if (!persistEdits(year, next)) setStorageWarn(true);
    setEdits(next);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setFillToast(null);
    if (window.SFX) window.SFX.play("back");
  };

  /* ---- 音效开关同步 ---- */
  useEffect(() => {
    if (window.SFX) window.SFX.setEnabled(t.sfx !== false);
  }, [t.sfx]);

  editingRef.current = !!createModal; // 每次渲染同步，供全局快捷键判断

  /* ---- 键盘快捷键：1~9/0/W/M/Y 视图 · T/J/K 导航 · C 新建 · / 或 ⌘K 搜索 · ? 抽屉速查 · E 连续键 ---- */
  useEffect(() => {
    let leaderTimer = null;
    let leaderKey = null;

    const onKey = (e) => {
      const el = e.target;
      const tag = el && el.tagName ? el.tagName.toLowerCase() : "";
      const isInput = tag === "input" || tag === "textarea" || (el && el.isContentEditable);

      // 如果当前正处于输入框或文本域内编辑文字，除 Escape 键外，全部放行给浏览器原生输入，严禁全局快捷键拦截
      if (isInput) {
        if (e.key === "Escape") {
          el.blur();
          if (drawerOpen && el.closest && el.closest(".notion-drawer")) {
            setDrawerOpen(false);
          }
        }
        return;
      }

      // ⌘, 或 Ctrl+, 全局打开偏好设置（支持中英文输入法状态逗号键）
      if ((e.metaKey || e.ctrlKey) && (e.key === "," || e.key === "，")) {
        e.preventDefault();
        setSettingsTab("general");
        setSettingsOpen((v) => !v);
        return;
      }
      // ⌘K 或 Ctrl+K 全局呼出搜索
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setCmdOpen((v) => !v);
        return;
      }
      // ⌘Z 全局撤销
      if ((e.metaKey || e.ctrlKey) && (e.key === "z" || e.key === "Z") && !e.shiftKey) {
        if (!editingRef.current) {
          e.preventDefault();
          if (undoBatch) {
            handleUndoBatch();
            return;
          }
          undoFill();
          return;
        }
      }

      // ⌘X 剪切
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "x" || e.key === "X")) {
        const cur = selectedEventRef.current || selectedEvent;
        if (cur && !editingRef.current) {
          e.preventDefault();
          handleCutEvent(cur, cur.date);
          return;
        }
      }

      // ⌘C 拷贝
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "c" || e.key === "C")) {
        const cur = selectedEventRef.current || selectedEvent;
        if (cur && !editingRef.current) {
          e.preventDefault();
          handleCopyEvent(cur, cur.date);
          return;
        }
      }

      // ⌘D 创建副本
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "d" || e.key === "D")) {
        const cur = selectedEventRef.current || selectedEvent;
        if (cur && !editingRef.current) {
          e.preventDefault();
          handleDuplicateEvent(cur, cur.date);
          return;
        }
      }

      // ⌘V 粘贴
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "v" || e.key === "V")) {
        if (window._notionClipboardEvent && !editingRef.current) {
          e.preventDefault();
          const targetDate = selectedDate || focusedDate || TODAY;
          const pasted = Object.assign({}, window._notionClipboardEvent, {
            _uid: "paste_" + Date.now(),
            record_id: undefined,
            date: targetDate,
            startTime: window._notionClipboardEvent.startTime ? `${targetDate} ${window._notionClipboardEvent.startTime.slice(11)}` : "",
            endTime: window._notionClipboardEvent.endTime ? `${targetDate} ${window._notionClipboardEvent.endTime.slice(11)}` : "",
          });
          handleCreateEvent(pasted);
          triggerToast("已粘贴日程到 " + targetDate);
          return;
        }
      }

      // 组合键：Shift + ⌘ 系列 (Notion 视图控制)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          setTweak("weekend", !t.weekend);
          return;
        }
        if (e.key === "." || e.key === ">") {
          e.preventDefault();
          setHourHeight((h) => Math.min(100, h + 10));
          return;
        }
        if (e.key === "," || e.key === "<") {
          e.preventDefault();
          setHourHeight((h) => Math.max(20, h - 10));
          return;
        }
      }

      // Option + T (在视图中对齐今天)
      if (e.altKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        backToday();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (editingRef.current) return; // 弹窗开着不响应

      // 键盘微调与拖拽：方向键 ↑ / ↓ 整体提前或推迟时间；按住 Shift 则拉长或缩短时长
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (selectedEvent && !selectedEvent.isAllDay) {
          e.preventDefault();
          const delta = e.key === "ArrowUp" ? -snapStep : snapStep;
          if (e.shiftKey) {
            handleNudgeDuration(selectedEvent, delta);
          } else {
            handleNudgeTime(selectedEvent, delta);
          }
          return;
        }
      }

      // 键盘删除：Delete 或 Backspace 快速删除当前选中日程 (免弹窗直接删除)
      if (e.key === "Delete" || e.key === "Backspace" || e.keyCode === 8 || e.keyCode === 46) {
        const cur = selectedEventRef.current || selectedEvent;
        const curIds = (selectedEventIdsRef.current && selectedEventIdsRef.current.length > 0)
          ? selectedEventIdsRef.current
          : (selectedEventIds || []);
        if (cur || (curIds && curIds.length > 0)) {
          e.preventDefault();
          handleDeleteEvent(cur);
          return;
        }
      }

      // 键盘 Enter：打开抽屉开始编辑
      if (e.key === "Enter") {
        if (selectedEvent) {
          e.preventDefault();
          setDrawerTab("detail");
          setDrawerOpen(true);
          return;
        }
      }

      // Notion 连续键 (Leader Key: 先按 E，再按后续字母 T/D/S/Q/R/P/L/W)
      if (leaderKey === "E") {
        leaderKey = null;
        if (leaderTimer) clearTimeout(leaderTimer);
        const k = e.key.toLowerCase();
        if (k === "t") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("notion:focus-field", { detail: { field: "title" } }));
          return;
        }
        if (k === "d") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("notion:focus-field", { detail: { field: "date" } }));
          return;
        }
        if (k === "s") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("notion:focus-field", { detail: { field: "startTime" } }));
          return;
        }
        if (k === "q") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("notion:focus-field", { detail: { field: "endTime" } }));
          return;
        }
        if (k === "r") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("notion:focus-field", { detail: { field: "repeat" } }));
          return;
        }
        if (k === "w") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("notion:focus-field", { detail: { field: "note" } }));
          return;
        }
        if (k === "a") {
          e.preventDefault();
          const cur = selectedEventRef.current || selectedEvent;
          if (cur) {
            handleUpdateEvent(Object.assign({}, cur, { isAllDay: !cur.isAllDay }));
          }
          return;
        }
      }

      // E：编辑日程 / 展开抽屉，并启动连续键监听
      if (e.key === "e" || e.key === "E") {
        const cur = selectedEventRef.current || selectedEvent;
        e.preventDefault();
        setDrawerTab("detail");
        setDrawerOpen(true);
        leaderKey = "E";
        leaderTimer = setTimeout(() => { leaderKey = null; }, 1500);
        return;
      }

      // 跳转到指定日期 (.)，弹出日期选择器
      if (e.key === ".") {
        e.preventDefault();
        setGoToDateOpen(true);
        return;
      }

      if (e.key === "Escape") {
        if (sameContentModal) {
          setSameContentModal(null);
          return;
        }
        if (taskDrawerOpen) {
          setTaskDrawerOpen(false);
          return;
        }
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
        if (pomodoroState && pomodoroState.isOpen) {
          setPomodoroState((prev) => ({ ...prev, isOpen: false }));
          return;
        }
        if (goToDateOpen) {
          setGoToDateOpen(false);
          return;
        }
        if (cmdOpen) setCmdOpen(false);
        else if (drawerOpen) setDrawerOpen(false);
        else if (fillModeRef.current) setFill(false);
        else if (selectedEvent) {
          setSelectedEvent(null);
          selectedEventRef.current = null;
          setSelectedEventIds([]);
          selectedEventIdsRef.current = [];
        }
        return;
      }

      // 03 任务管理侧抽屉开关 ([ / 【)
      if (e.key === "[" || e.key === "【") {
        e.preventDefault();
        setTaskDrawerOpen((v) => !v);
        return;
      }

      // 视图切换：D / 1 (日视图), W / 2 / 0 (周视图), M (月视图), 1-0 (自定义天数), Y (全天总结年看板)
      if (e.key === "1" || e.key === "d" || e.key === "D") {
        handleViewModeChange("day", 1);
        return;
      }
      if (e.key === "w" || e.key === "W" || e.key === "0" || e.key === "2") {
        handleViewModeChange("week", 7);
        return;
      }
      if (e.key >= "3" && e.key <= "9") {
        handleViewModeChange("days", Number(e.key));
        return;
      }
      if (e.key === "m" || e.key === "M") {
        handleViewModeChange("month");
        return;
      }
      if (e.key === "y" || e.key === "Y") {
        handleViewModeChange("year");
        return;
      }

      // 导航：T (今天), J (下一个周期), K (上一个周期)
      if (e.key === "t" || e.key === "T") {
        backToday();
        return;
      }
      if (e.key === "j" || e.key === "J" || e.key === "ArrowRight") {
        handleNext();
        return;
      }
      if (e.key === "k" || e.key === "K" || e.key === "ArrowLeft") {
        handlePrev();
        return;
      }

      // 快速创建日程 (C 或 N)
      if (e.key === "c" || e.key === "C" || e.key === "n" || e.key === "N") {
        e.preventDefault();
        if (selectedEvent) {
          const sTime = selectedEvent.startTimeStr || (selectedEvent.startTime ? selectedEvent.startTime.slice(11, 16) : "09:00");
          const eTime = selectedEvent.endTimeStr || (selectedEvent.endTime ? selectedEvent.endTime.slice(11, 16) : "10:00");
          openCreateModal({
            date: selectedEvent.date || selectedDate || focusedDate || TODAY,
            startTimeStr: sTime,
            endTimeStr: eTime,
            isAllDay: selectedEvent.isAllDay,
          });
        } else {
          openCreateModal({ date: selectedDate || focusedDate || TODAY });
        }
        return;
      }

      // 搜索 (/)
      if (e.key === "/") {
        e.preventDefault();
        setCmdOpen(true);
        return;
      }

      // 快捷键速查面板 (?)
      if (e.key === "?") {
        e.preventDefault();
        setDrawerTab("shortcuts");
        setDrawerOpen((v) => !v);
        return;
      }

      // 番茄钟 / 专注时钟 (P)
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        if (selectedEventRef.current) {
          handleStartFocusWithEvent(selectedEventRef.current);
        } else {
          setPomodoroState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
        }
        return;
      }

      // 年视图缩放
      const a = apiRef.current;
      if (a && viewMode === "year") {
        if (e.key === "+" || e.key === "=") a.zoomBy(1.35);
        else if (e.key === "-" || e.key === "_") a.zoomBy(1 / 1.35);
        else if (e.key === "f" || e.key === "F") setFill(!fillModeRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (leaderTimer) clearTimeout(leaderTimer);
    };
  }, [cmdOpen, drawerOpen, taskDrawerOpen, sameContentModal, undoBatch, viewMode, timelineDays, focusedDate, currentMonth, year, selectedDate, t.weekend, selectedEvent, snapStep]);

    /* 填充模式开关时切换视口光标 */
  useEffect(() => {
    const vp = viewportRef.current;
    if (vp) vp.classList.toggle("fill-mode", fillMode);
  }, [fillMode]);

  /* ---- 画板手势引擎（一次挂载） ---- */
  useEffect(() => {
    const vp = viewportRef.current;
    const el = wrapRef.current;
    if (!vp || !el) return undefined;

    const view = { s: 1, tx: 0, ty: 0 };
    const clampS = (s) => Math.min(MAX_S, Math.max(MIN_S, s));

    let saveTimer = null;
    let animId = null;
    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const persist = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        try {
          localStorage.setItem(STORE_KEY, JSON.stringify(view));
        } catch (err) {
          /* 忽略 */
        }
      }, 300);
    };

    const apply = () => {
      el.style.transform =
        "translate(" + view.tx + "px," + view.ty + "px) scale(" + view.s + ")";
      if (pctRef.current) pctRef.current.textContent = Math.round(view.s * 100) + "%";
      persist();
    };

    const stopAnim = () => {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    const animateTo = (target, dur) => {
      stopAnim();
      if (reduceMotion) {
        view.s = target.s;
        view.tx = target.tx;
        view.ty = target.ty;
        apply();
        return;
      }
      const from = { s: view.s, tx: view.tx, ty: view.ty };
      const t0 = performance.now();
      const ease = (x) => 1 - Math.pow(1 - x, 3);
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const k = ease(p);
        view.s = from.s + (target.s - from.s) * k;
        view.tx = from.tx + (target.tx - from.tx) * k;
        view.ty = from.ty + (target.ty - from.ty) * k;
        apply();
        if (p < 1) animId = requestAnimationFrame(step);
        else animId = null;
      };
      animId = requestAnimationFrame(step);
    };

    const setView = (target) => {
      view.s = target.s;
      view.tx = target.tx;
      view.ty = target.ty;
      apply();
    };

    const zoomAt = (cx, cy, factor, animate) => {
      stopAnim();
      const ns = clampS(view.s * factor);
      const wx = (cx - view.tx) / view.s;
      const wy = (cy - view.ty) / view.s;
      const target = { s: ns, tx: cx - wx * ns, ty: cy - wy * ns };
      if (animate) animateTo(target, 240);
      else setView(target);
    };

    const fit = (animate) => {
      const vw = vp.clientWidth;
      const vh = vp.clientHeight;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const s = clampS(Math.min((vw - 72) / w, (vh - 72) / h));
      const target = { s: s, tx: (vw - w * s) / 2, ty: (vh - h * s) / 2 };
      if (animate) animateTo(target, 420);
      else setView(target);
    };

    /* 板面几何令牌：必须读 .board——密度类（density-compact/comfy）在 .board 上
       重定义 --cell-h/--month-h/--cell-w 等，读外层 .board-wrap 只能拿到 :root 初值 */
    const geoOf = () => {
      const bEl = el.querySelector ? el.querySelector(".board") || el : el;
      const cs = getComputedStyle(bEl);
      return {
        cw:
          (parseFloat(cs.getPropertyValue("--cell-w")) || 224) +
          (parseFloat(cs.getPropertyValue("--mark-w")) || 32) +
          (parseFloat(cs.getPropertyValue("--wd-w")) || 50),
        chh: parseFloat(cs.getPropertyValue("--cell-h")) || 78,
        mh: parseFloat(cs.getPropertyValue("--month-h")) || 62,
      };
    };

    /* 最佳观看：按当前视口选择舒适阅读比例，并定位到关注月份 */
    /* 月-日 → 视图目标：聚焦月份列与日期行，按视口宽选 1/2/3 个月列 */
    const mdTarget = (fmi, fd) => {
      const vw = vp.clientWidth;
      const vh = vp.clientHeight;
      const g = geoOf();
      // 手机看 1 个月、笔记本看 2 个月、大屏看 3 个月，字都清晰可读
      const cols = vw < 700 ? 1 : vw < 1400 ? 2 : 3;
      const s = clampS(Math.min((vw - 56) / (cols * g.cw), 2.4));
      const cx = (fmi + 0.5) * g.cw;
      const cy = g.mh + (fd - 0.5) * g.chh;
      return { s: s, tx: vw / 2 - cx * s, ty: vh / 2 - cy * s };
    };

    /* 最佳观看：当前年聚焦今天；其他年聚焦最后一条记录；上下文缺失时按当前年处理 */
    const bestView = (animate) => {
      const ctx = viewCtxRef.current || {};
      const now = new Date();
      let fmi;
      let fd;
      if (!ctx.year || ctx.year === now.getFullYear()) {
        // ctx 缺失时宁可落到今天，也不瞎落默认的 1 月 15
        fmi = now.getMonth();
        fd = now.getDate();
      } else if (ctx.lastDate && Number(ctx.lastDate.slice(0, 4)) === ctx.year) {
        fmi = Number(ctx.lastDate.slice(5, 7)) - 1;
        fd = Number(ctx.lastDate.slice(8, 10));
      } else {
        fmi = 0;
        fd = 15;
      }
      const target = mdTarget(fmi, fd);
      if (animate) animateTo(target, 420);
      else setView(target);
    };

    /* 回到今天专用：无条件聚焦此刻日期，不读 viewCtx，杜绝上下文异常时落错位置 */
    const todayView = (animate) => {
      const now = new Date();
      const target = mdTarget(now.getMonth(), now.getDate());
      if (animate) animateTo(target, 420);
      else setView(target);
    };

    /* 点月份表头：平滑平移到该月起始，缩放过小时先提到可读档 */
    const jumpMonth = (mi) => {
      const vw = vp.clientWidth;
      const g = geoOf();
      const s =
        view.s < 0.55 ? clampS(Math.min((vw - 56) / (2 * g.cw), 2.4)) : view.s;
      animateTo({ s: s, tx: 72 - mi * g.cw * s, ty: 96 }, 360);
    };

    apiRef.current = {
      zoomBy: (factor) => zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, factor, true),
      fit: () => fit(true),
      best: () => bestView(true),
      today: () => todayView(true),
      jump: (mi) => jumpMonth(mi),
    };
    /* ---- 手势状态 ---- */
    const pointers = new Map();
    let panStart = null;
    let pinchStart = null;
    let moved = false;
    let downTarget = null;
    let velSamples = []; // 惯性速度采样 {t, x, y}
    let lastTap = null; // 双击/双触检测 {t, x, y}
    const fillDrag = { active: false, src: null, mi: 0, from: 0, to: 0, moved: false }; // 下拉填充拖选

    const midOf = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const distOf = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    const sampleVel = (x, y) => {
      const now = performance.now();
      velSamples.push({ t: now, x: x, y: y });
      while (velSamples.length > 2 && now - velSamples[0].t > 120) velSamples.shift();
    };

    /* 惯性滑动：甩动后按指数衰减继续滑行 */
    const glide = (vx, vy) => {
      if (reduceMotion || Math.hypot(vx, vy) < 250) return;
      stopAnim();
      let lastT = performance.now();
      const step = (nowT) => {
        const dt = Math.min(0.05, (nowT - lastT) / 1000);
        lastT = nowT;
        view.tx += vx * dt;
        view.ty += vy * dt;
        const decay = Math.exp(-dt / 0.32);
        vx *= decay;
        vy *= decay;
        apply();
        if (Math.hypot(vx, vy) > 20) animId = requestAnimationFrame(step);
        else animId = null;
      };
      animId = requestAnimationFrame(step);
    };

    const onDown = (e) => {
      downTarget = e.target;
      try { vp.setPointerCapture(e.pointerId); } catch (err) { /* 合成事件/指针已释放时忽略 */ }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      stopAnim();
      moved = false;
      velSamples = [];
      /* 填充模式：按住日期格进入纵向拖选，不做平移/缩放 */
      if (fillModeRef.current && !editingRef.current) {
        if (pointers.size === 1) {
          const cellEl = e.target && e.target.closest ? e.target.closest(".cell[data-date]") : null;
          if (cellEl) {
            const ds = cellEl.getAttribute("data-date");
            fillDrag.active = true;
            fillDrag.src = ds;
            fillDrag.mi = Number(ds.slice(5, 7)) - 1;
            fillDrag.from = Number(ds.slice(8, 10));
            fillDrag.to = fillDrag.from;
            fillDrag.moved = false;
            setFillSel({ src: ds, mi: fillDrag.mi, from: fillDrag.from, to: fillDrag.to });
          }
        }
        return;
      }
      if (pointers.size === 1) {
        panStart = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
        vp.classList.add("grabbing");
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchStart = {
          dist: distOf(pts[0], pts[1]),
          mid: midOf(pts[0], pts[1]),
          s: view.s,
          tx: view.tx,
          ty: view.ty,
        };
        panStart = null;
      }
    };

    const onMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      /* 填充拖选：命中同月日期格才扩展范围（跨月忽略，只纵向） */
      if (fillModeRef.current) {
        if (fillDrag.active && pointers.size === 1) {
          const hit = document.elementFromPoint(e.clientX, e.clientY);
          const cellEl = hit && hit.closest ? hit.closest(".cell[data-date]") : null;
          if (cellEl) {
            const ds = cellEl.getAttribute("data-date");
            if (Number(ds.slice(5, 7)) - 1 === fillDrag.mi) {
              const dd = Number(ds.slice(8, 10));
              if (dd !== fillDrag.to) {
                fillDrag.to = dd;
                fillDrag.moved = true;
                setFillSel({ src: fillDrag.src, mi: fillDrag.mi, from: fillDrag.from, to: dd });
              }
            }
          }
        }
        return;
      }

      if (pointers.size === 2 && pinchStart) {
        const pts = [...pointers.values()];
        const dist = distOf(pts[0], pts[1]);
        const mid = midOf(pts[0], pts[1]);
        const ns = clampS(pinchStart.s * (dist / pinchStart.dist));
        const wx = (pinchStart.mid.x - pinchStart.tx) / pinchStart.s;
        const wy = (pinchStart.mid.y - pinchStart.ty) / pinchStart.s;
        view.s = ns;
        view.tx = mid.x - wx * ns;
        view.ty = mid.y - wy * ns;
        moved = true;
        apply();
      } else if (pointers.size === 1 && panStart) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) {
          moved = true;
        }
        view.tx = panStart.tx + dx;
        view.ty = panStart.ty + dy;
        sampleVel(e.clientX, e.clientY);
        apply();
      }
    };

    const onEnd = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 1) {
        const p = [...pointers.values()][0];
        panStart = { x: p.x, y: p.y, tx: view.tx, ty: view.ty };
        pinchStart = null;
        velSamples = []; // 双指→单指，速度重新积累
        return;
      }
      if (pointers.size !== 0) return;
      /* 填充模式：松手结算拖选并应用；同时屏蔽点击开弹窗/双击缩放/惯性 */
      if (fillModeRef.current) {
        vp.classList.remove("grabbing");
        downTarget = null;
        velSamples = [];
        if (fillDrag.active) {
          const fin = { src: fillDrag.src, mi: fillDrag.mi, from: fillDrag.from, to: fillDrag.to, moved: fillDrag.moved };
          fillDrag.active = false;
          setFillSel(null);
          if (fin.moved && fin.from !== fin.to && fillApplyRef.current) {
            fillApplyRef.current(fin.src, fin.mi, fin.from, fin.to);
          } else if (!fin.moved && fillTapRef.current) {
            fillTapRef.current(fin.src); // 轻点：剪切 / 粘贴 / 取消剪切（同格再点）
          }
        }
        return;
      }
      const wasPanning = !!panStart;
      const releaseX = e.clientX;
      const releaseY = e.clientY;
      panStart = null;
      pinchStart = null;
      vp.classList.remove("grabbing");

      if (!moved && downTarget && downTarget.closest) {
        // 轻点：日期格 → 打开编辑；双击 → 直接新建；空白背景 → 缩放检测
        const cellEl = downTarget.closest(".cell[data-date]");
        const ds = cellEl ? cellEl.getAttribute("data-date") : null;
        const now = performance.now();
        if (cellEl && ds) {
          if (lastTap && lastTap.ds === ds && now - lastTap.t < 350) {
            // 双击同一日期格交由 React 内部 cell.onDoubleClick 处理，杜绝 pointer 与 React 双重触发
            lastTap = null;
          } else {
            lastTap = { t: now, x: releaseX, y: releaseY, ds: ds };
            if (cellClickRef.current) {
              const cr = cellEl.getBoundingClientRect();
              cellClickRef.current(ds, {
                x: cr.left + cr.width / 2,
                y: cr.top + cr.height / 2,
              });
            }
          }
        } else {
          if (lastTap && now - lastTap.t < 320 && Math.hypot(releaseX - lastTap.x, releaseY - lastTap.y) < 32) {
            lastTap = null;
            zoomAt(releaseX, releaseY, view.s < 1 ? 2.2 : 1.8, !reduceMotion);
          } else {
            lastTap = { t: now, x: releaseX, y: releaseY };
          }
        }
      } else if (wasPanning && e.type === "pointerup") {
        // 甩动惯性：取最近 120ms 采样估算速度
        const now = performance.now();
        const recent = velSamples.filter((s) => now - s.t < 120);
        if (recent.length >= 2) {
          const f = recent[0];
          const l = recent[recent.length - 1];
          const dt = (l.t - f.t) / 1000;
          if (dt > 0.016) glide((l.x - f.x) / dt, (l.y - f.y) / dt);
        }
      }
      downTarget = null;
      velSamples = [];
    };

    const onWheel = (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0022), false);
    };

    vp.addEventListener("pointerdown", onDown);
    vp.addEventListener("pointermove", onMove);
    vp.addEventListener("pointerup", onEnd);
    vp.addEventListener("pointercancel", onEnd);
    vp.addEventListener("wheel", onWheel, { passive: false });

    /* ---- 初始视图 ---- */
    let restored = false;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (v && typeof v.s === "number" && v.s > 0 && isFinite(v.tx) && isFinite(v.ty)) {
          view.s = clampS(v.s);
          view.tx = v.tx;
          view.ty = v.ty;
          restored = true;
        }
      }
    } catch (err) {
      /* 恢复失败则重新适应 */
    }
    if (!restored) bestView(false);
    else apply();

    return () => {
      vp.removeEventListener("pointerdown", onDown);
      vp.removeEventListener("pointermove", onMove);
      vp.removeEventListener("pointerup", onEnd);
      vp.removeEventListener("pointercancel", onEnd);
      vp.removeEventListener("wheel", onWheel);
      clearTimeout(saveTimer);
      stopAnim();
    };
  }, []);

  /* 始终读实时 apiRef：首渲染时手势引擎尚未挂好，快照会把按钮永久绑到空操作上 */
  const callApi = (fn, arg) => {
    const a = apiRef.current;
    if (a && a[fn]) a[fn](arg);
  };
  const rootCls =
    "app-root" +
    (THEME_CLS[t.theme] || "") +
    (t.zen ? " zen" : "") +
    (t.colorMode === "单色" ? " color-mono" : "") +
    (t.density === "紧凑" ? " density-compact" : "") +
    (viewMode === "year" ? " view-year" : " view-notion") +
    (t.fontStyle === "宋体 (墨韵纸感)" ? " font-song" : " font-sans");

  return (
    <div className={rootCls}>
      {/* Notion 极简顶栏 */}
      <NotionTopBar
        year={year}
        currentMonth={currentMonth}
        focusedDate={focusedDate}
        viewMode={viewMode}
        timelineDays={timelineDays}
        onViewModeChange={handleViewModeChange}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={backToday}
        onOpenSearch={() => setCmdOpen(true)}
        onNewEvent={(ds) => openCreateModal({ date: ds || selectedDate || focusedDate || TODAY, isAllDay: false })}
        onPull={onPullFromBase}
        onPush={onPushToBase}
        syncInfo={syncInfo}
        syncing={syncing}
        onToggleDrawer={() => setDrawerOpen((v) => !v)}
        drawerOpen={drawerOpen}
        taskDrawerOpen={taskDrawerOpen}
        onToggleTaskDrawer={() => setTaskDrawerOpen((v) => !v)}
        threeThings={threeThings}
        onToggleThreeFrog={handleToggleThreeFrog}
        onUpdateThreeFrogText={handleUpdateThreeFrogText}
        onStartPomodoroWithText={handleStartPomodoroWithText}
        onDropThreeFrogTask={handleDropThreeFrogTask}
        onToggleInfo={() => setInfoOpen((v) => !v)}
        infoOpen={infoOpen}
        onOpenSettings={() => {
          setSettingsTab("general");
          setSettingsOpen(true);
        }}
        onOpenShortcuts={() => {
          setSettingsTab("shortcuts");
          setSettingsOpen(true);
        }}
        pomodoro={pomodoroState}
        onTogglePomodoro={handleTogglePomodoro}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={handleCategoryFilterChange}
      />

      {/* 日 / 周 / 多天时间轴视图 (Notion Calendar 标志性时间轴) */}
      {viewMode === "day" || viewMode === "week" || viewMode === "days" ? (
        <NotionTimelineView
          days={buildTimelineDays(focusedDate, viewMode, timelineDays, t.weekend)}
          byDate={byDate}
          baseList={baseList}
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
          selectedEventIds={selectedEventIds}
          hourHeight={hourHeight}
          onHourHeightChange={setHourHeight}
          snapStep={snapStep}
          onSnapStepChange={setSnapStep}
          onSelectDay={(ds) => {
            setSelectedDate(ds);
            setFocusedDate(ds);
          }}
          onSelectEvent={handleSelectEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
          onBatchUpdateEvents={handleBatchUpdateEvents}
          onCreateEvent={handleCreateEvent}
          onOpenCreateModal={openCreateModal}
          onContextMenu={handleContextMenu}
          onPrev={handlePrev}
          onNext={handleNext}
          pomodoro={pomodoroState}
          onStartFocus={handleStartFocusWithEvent}
          categoryFilter={categoryFilter}
        />
      ) : null}

      {/* 年视图：365天无限年墙画板 */}
      <div
        className="viewport"
        ref={viewportRef}
        style={{ display: viewMode === "year" ? "block" : "none" }}
      >
        <div className="board-wrap" ref={wrapRef}>
          <MemoizedBoard
            t={t}
            year={year}
            byDate={byDate}
            fillSel={fillSel}
            cutDs={cutSrc ? cutSrc.ds : null}
            onJump={(mi) => {
              setCurrentMonth(mi);
              handleViewModeChange("month");
            }}
            onJumpDay={(ds) => {
              setSelectedDate(ds);
              setFocusedDate(ds);
              handleViewModeChange("day", 1);
            }}
            categoryFilter={categoryFilter}
            active={viewMode === "year"}
          />
        </div>
      </div>

      {/* 月视图：Notion Calendar 标准月网格 */}
      {viewMode === "month" ? (
        <NotionMonthView
          year={year}
          monthIndex={currentMonth}
          byDate={byDate}
          selectedDate={selectedDate}
          onSelectDay={(ds) => {
            setSelectedDate(ds);
            setFocusedDate(ds);
          }}
          onSelectEvent={(rec, ds, isMulti, openDrawer) => {
            handleSelectEvent(rec, ds, isMulti, openDrawer !== undefined ? openDrawer : true);
          }}
          onDeleteEvent={handleDeleteEvent}
          onUpdateEvent={handleUpdateEvent}
          onContextMenu={handleContextMenu}
          onPrevMonth={handlePrev}
          onNextMonth={handleNext}
          onJumpDay={(ds) => {
            setFocusedDate(ds);
            setSelectedDate(ds);
            handleViewModeChange("day", 1);
          }}
          onOpenCreateModal={openCreateModal}
          categoryFilter={categoryFilter}
        />
      ) : null}

      {/* 移动端全展开底升抽屉遮罩 (点按空白收起) */}
      {drawerOpen && (
        <div
          className="notion-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* 右侧 Notion 纯净内联编辑与快捷键抽屉 */}
      <NotionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedEvent={selectedEvent}
        selectedDate={selectedDate || focusedDate || TODAY}
        onOpenCreateModal={openCreateModal}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        onNudgeDuration={handleNudgeDuration}
        tab={drawerTab}
        onTabChange={setDrawerTab}
        snapStep={snapStep}
        baseList={baseList}
        onStartFocus={handleStartFocusWithEvent}
      />

      {/* 左侧 03 任务管理侧抽屉 (四象限任务库 & 拖拽排程) */}
      <TaskDrawer
        open={taskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        tasks={tasks}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
        onStartFocus={(task) => handleStartPomodoroWithText(task.title)}
      />

      {/* 全局 ⌘K 命令面板与搜索浮层 */}
      <NotionCmdPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        records={allRecords}
        onSelectDate={handleSelectDate}
        onViewModeChange={handleViewModeChange}
        onBackToday={backToday}
        onNext={handleNext}
        onPrev={handlePrev}
        onOpenCreate={() => openCreateModal({ date: selectedDate || focusedDate || TODAY })}
        onOpenEdit={() => {
          setDrawerTab("detail");
          setDrawerOpen(true);
        }}
        onToggleWeekend={() => setTweak("weekend", !t.weekend)}
        onOpenPomodoro={() => setPomodoroState((prev) => ({ ...prev, isOpen: true }))}
        onOpenSettings={(tab) => {
          setSettingsTab(tab || "general");
          setSettingsOpen(true);
        }}
        onOpenGoToDate={() => setGoToDateOpen(true)}
      />

      {/* 跳转到指定日期浮窗 (快捷键 .) */}
      <GoToDateModal
        open={goToDateOpen}
        onClose={() => setGoToDateOpen(false)}
        onSelectDate={handleSelectDate}
        currentDate={selectedDate || focusedDate || TODAY}
      />

      {/* 侧边信息卡：仅在年看板模式下挂载，彻底杜绝在新页面中与左侧时间轴发生重合 */}
      {viewMode === "year" ? (
        <InfoCard
          open={infoOpen}
          onToggle={() => setInfoOpen((v) => !v)}
          year={year}
          onYear={changeYear}
          stats={stats}
          sync={syncInfo}
          onExport={exportUpsert}
          onExportData={exportData}
          onImport={importFile}
          pendingImport={pendingImport}
          importMsg={importMsg}
          onConfirmImport={applyImport}
          onCancelImport={() => setPendingImport(null)}
          feishuStatus={feishuStatus}
          syncing={syncing}
          onPullFromBase={onPullFromBase}
          onPushToBase={onPushToBase}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={handleCategoryFilterChange}
        />
      ) : null}

      {storageWarn ? (
        <div className="hud storage-warn" role="status">
          浏览器未允许本地存储：改动刷新后会丢失，建议及时导出迁移包
        </div>
      ) : null}

      {fillMode && viewMode === "year" ? (
        <div className="hud fill-hint" role="status">
          {cutSrc ? (
            <span>
              已剪切 {dsLabel(cutSrc.ds)}
              {cutSrc.text
                ? "「" + (cutSrc.text.length > 14 ? cutSrc.text.slice(0, 14) + "…" : cutSrc.text) + "」"
                : ""}
              · 轻点目标格粘贴（可连续）· 再点源格取消 · F 或 Esc 退出
            </span>
          ) : (
            <span>
              填充模式：按住日期格向上/向下拖动＝批量填充 · 轻点有内容的格＝剪切，再轻点目标格＝粘贴 · F 或 Esc 退出
            </span>
          )}
        </div>
      ) : null}

      {fillToast ? (
        <div className="hud fill-toast" role="status">
          <span>
            {fillToast.custom
              ? fillToast.text
              : fillToast.pasted
              ? "已粘贴到 " + fillToast.dstLabel
              : (fillToast.cleared ? "已清空 " : "已填充 ") + fillToast.count + " 天"}
          </span>
          {fillToast.undo ? <button className="fill-undo" onClick={undoFill}>撤销</button> : null}
          <button className="fill-toast-x" onClick={() => setFillToast(null)} aria-label="关闭提示">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18"></line>
              <line x1="18" y1="6" x2="6" y2="18"></line>
            </svg>
          </button>
        </div>
      ) : null}

      <input
        type="file"
        ref={fileRef}
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={onFileChosen}
      ></input>

      {/* 年视图缩放栏 */}
      {viewMode === "year" ? (
        <div className="hud zoombar" role="toolbar" aria-label="缩放控制">
          <button className="zbtn-icon" onClick={() => callApi("zoomBy", 1 / 1.35)} aria-label="缩小" title="缩小（快捷键 -）">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <span className="zpct" ref={pctRef}>100%</span>
          <button className="zbtn-icon" onClick={() => callApi("zoomBy", 1.35)} aria-label="放大" title="放大（快捷键 +）">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <span className="zsep"></span>
          <button className="zbtn-txt" onClick={backToday} title="快捷键 T">回到今天</button>
          <button className="zbtn-txt" onClick={() => callApi("fit")} title="快捷键 0">适应</button>
          <button className="zbtn-txt zbtn-best" onClick={() => callApi("best")} title="快捷键 1">最佳观看</button>
          <span className="zsep"></span>
          <button
            className={"zbtn-txt" + (fillMode ? " active" : "")}
            onClick={() => setFill(!fillMode)}
            title="下拉填充：按住日期格向上/向下拖动，松开填充（快捷键 F）"
          >
            填充
          </button>
          <span className="zsep"></span>
          <button
            className="zbtn-txt"
            onClick={() => window.dispatchEvent(new CustomEvent('tweaks:toggle'))}
            title="看板样式与格式设置（配色、标签、网格密度等）"
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <i className="ph-bold ph-palette motion-icon" style={{ marginRight: "5px" }} />
            <span>格式</span>
          </button>
        </div>
      ) : null}

      {/* 纯净模式开关：隐藏侧栏/缩放条等悬浮控件（仅在年视图显示） */}
      {viewMode === "year" ? (
        <button
          className="hud zen-btn sfx-knock"
          onClick={() => setTweak("zen", !t.zen)}
          title={t.zen ? "显示侧栏与缩放控件" : "隐藏侧栏与缩放控件"}
        >
          {t.zen ? "显示界面" : "隐藏界面"}
        </button>
      ) : null}

      <TweaksPanel title="风格">
        <TweakSection label="字体风格" />
        <TweakRadio
          label="界面字体"
          value={t.fontStyle || "苹方 (系统高清)"}
          options={["苹方 (系统高清)", "宋体 (墨韵纸感)"]}
          onChange={(v) => setTweak("fontStyle", v)}
        />
        <TweakSection label="配色主题" />
        <TweakSelect
          label="色系"
          value={t.theme}
          options={["墨韵纸感", "经典蓝", "松烟绿", "玄夜"]}
          onChange={(v) => setTweak("theme", v)}
        />
        <TweakSection label="看板样式" />
        <TweakRadio
          label="板块配色"
          value={t.colorMode}
          options={["彩色", "单色"]}
          onChange={(v) => setTweak("colorMode", v)}
        />
        <TweakRadio
          label="标签位置"
          value={t.chipPos}
          options={["右下", "居中", "左下"]}
          onChange={(v) => setTweak("chipPos", v)}
        />
        <TweakToggle
          label="显示标签"
          value={t.chipShow}
          onChange={(v) => setTweak("chipShow", v)}
        />
        <TweakToggle
          label="周末底纹"
          value={t.weekend}
          onChange={(v) => setTweak("weekend", v)}
        />
        <TweakToggle
          label="未填底纹"
          value={t.missed}
          onChange={(v) => setTweak("missed", v)}
        />
        <TweakSection label="布局" />
        <TweakRadio
          label="网格密度"
          value={t.density}
          options={["舒适", "紧凑"]}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakSection label="界面" />
        <TweakToggle
          label="音效"
          value={t.sfx}
          onChange={(v) => setTweak("sfx", v)}
        />
        <TweakToggle
          label="悬浮控件（侧栏/缩放条）"
          value={!t.zen}
          onChange={(v) => setTweak("zen", !v)}
        />
      </TweaksPanel>

      {createModal ? (
        <NotionCreateModal
          open={!!createModal}
          initialData={createModal}
          cats={CATS}
          baseList={baseList}
          onCreate={handleCreateNewEvent}
          onClose={() => setCreateModal(null)}
        />
      ) : null}

      {/* macOS 原生偏好设置中心 (⌘,) */}
      <AppSettingsModal
        open={settingsOpen}
        initialTab={settingsTab}
        onClose={() => setSettingsOpen(false)}
        t={t}
        setTweak={setTweak}
        feishuStatus={feishuStatus}
        syncInfo={syncInfo}
        onPull={onPullFromBase}
        onPush={onPushToBase}
        syncing={syncing}
        snapStep={snapStep}
        onSnapStepChange={setSnapStep}
        onTriggerTestAlert={handleTriggerTestAlert}
      />

      {/* 执行型强提醒全屏卡片模态窗 (Remember + Upupup 精髓) */}
      <ExecutionAlertModal
        alert={activeExecutionAlert}
        onStart={handleStartExecution}
        onComplete={handleCompleteExecution}
        onSnooze={handleSnoozeExecution}
      />

      {/* 沉浸式番茄钟 / 专注时钟全屏卡片模态窗 (Focus 18 + 小初 02 + yiiiii 01) */}
      <PomodoroModal
        open={pomodoroState.isOpen}
        onClose={() => setPomodoroState((prev) => ({ ...prev, isOpen: false }))}
        state={pomodoroState}
        onStart={handleStartPomodoro}
        onPause={handlePausePomodoro}
        onReset={handleResetPomodoro}
        onSelectDuration={handleSelectPomodoroDuration}
        onSwitchMode={handleSwitchPomodoroMode}
        onSetWhiteNoise={handleSetPomodoroNoise}
        onUpdateTarget={handleUpdatePomodoroTarget}
        onSaveAsEvent={handleSavePomodoroAsEvent}
        byDate={byDate}
      />

      {/* 右下角常驻悬浮新建按钮 (FAB - 极简纯圆形加号，年看板下不显示) */}
      {t.fabShow !== false && viewMode !== "year" && (
        <button
          type="button"
          className={"board-fab-new" + (drawerOpen ? " drawer-open" : "")}
          onClick={() => {
            if (window.SFX && window.SFX.cardSwipe) window.SFX.cardSwipe();
            else if (window.SFX && window.SFX.tap) window.SFX.tap();
            openCreateModal({ date: selectedDate || focusedDate || TODAY, isAllDay: false });
          }}
          title="新建日程事项 (快捷键 N)"
        >
          <span className="board-fab-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </span>
        </button>
      )}

      {/* Apple 风格“相同内容同步取消/删除”确认 Sheet */}
      <SameContentConfirmModal
        modal={sameContentModal}
        onConfirmAll={(events) => {
          const list = (Array.isArray(events) && events.length > 0) ? events : (sameContentModal && sameContentModal.sameEvents);
          if (list && list.length > 0) executeDeleteEvents(list, true);
          setSameContentModal(null);
        }}
        onConfirmSingle={(ev) => {
          const target = (ev && (ev.text !== undefined || ev.startTime !== undefined)) ? ev : (sameContentModal && sameContentModal.event);
          if (target) executeDeleteEvents([target], false);
          setSameContentModal(null);
        }}
        onClose={() => setSameContentModal(null)}
      />

      {/* Apple / Motion 风格右键悬浮菜单 (日程卡片与空白画布双场景) */}
      <NotionContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onEdit={(ev, ds) => handleSelectEvent(ev, ds, false, true)}
        onStartFocus={handleStartFocusWithEvent}
        onStartExecution={handleStartExecution}
        onCut={handleCutEvent}
        onCopy={handleCopyEvent}
        onDuplicate={handleDuplicateEvent}
        onRemoveDate={handleRemoveEventTime}
        onOpenFeishu={handleOpenFeishu}
        onSyncAppleReminder={handleSyncAppleReminder}
        onNewEventAt={(ds, timeStr) => openCreateModal({
          date: ds || selectedDate || focusedDate || TODAY,
          startTimeStr: timeStr || "09:00",
          endTimeStr: timeStr ? formatTimeFromMinutes(Math.min(1440, parseTimeToMinutes(timeStr) + 60)) : "10:00",
          isAllDay: !timeStr,
        })}
        onGoToday={backToday}
        onSwitchView={handleViewModeChange}
        onOpenSettings={() => setSettingsOpen(true)}
        onDelete={(ev, ds) => {
          handleDeleteEvent(ev);
        }}
      />

      {/* 全局轻提示 Toast */}
      {globalToast ? (
        <div className="notion-toast-pop">{globalToast}</div>
      ) : null}

      <div className="build-tag">{APP_BUILD}</div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          padding: "24px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "var(--text-main, #333)",
          backgroundColor: "var(--bg-app, #fdfcf9)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>⚠️</div>
          <h2 style={{ fontSize: "17px", fontWeight: "600", marginBottom: "8px", color: "#1c1c1e" }}>看板遇到轻微运行异常，已保护数据安全</h2>
          <p style={{ fontSize: "12px", color: "#8e8e93", maxWidth: "460px", marginBottom: "20px", wordBreak: "break-all" }}>
            {this.state.error ? String(this.state.error.message || this.state.error) : "未知异常"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: "8px 20px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              boxShadow: "0 2px 8px rgba(59,130,246,0.25)"
            }}
          >
            刷新重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
