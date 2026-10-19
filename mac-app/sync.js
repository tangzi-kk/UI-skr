var { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_TOKEN = 'SQbpb4osNaAkY7s8UVdcupkYnqe';
const TABLE_ID = 'tblC5R0w900sav9H';
const LARK_CLI = '/usr/local/bin/lark-cli';

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

function decodeTaskName(val) {
  if (!val) return '';
  let s = String(val).trim();
  try {
    const o = JSON.parse(s);
    if (o && o.id) s = o.id;
  } catch (e) {}
  return TASK_ID_MAP[s] || s;
}

function decodeHabitName(val) {
  if (!val) return '';
  let s = String(val).trim();
  try {
    const o = JSON.parse(s);
    if (o && o.id) s = o.id;
  } catch (e) {}
  return HABIT_ID_MAP[s] || s;
}

function safeParseJson(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    const s = trimmed.indexOf('{');
    const eIdx = trimmed.lastIndexOf('}');
    if (s !== -1 && eIdx !== -1 && eIdx > s) {
      try {
        return JSON.parse(trimmed.slice(s, eIdx + 1));
      } catch (err) {}
    }
  }
  return null;
}

/**
 * 飞书 CLI 适配器（模块化设计，防御性处理 CLI 版本演进与返回结构差异）
 */
const LarkCliAdapter = {
  // 提取批量创建返回的 record IDs
  extractCreatedRecordIds(stdout) {
    const parsed = safeParseJson(stdout);
    if (!parsed) return [];
    if (parsed.data && Array.isArray(parsed.data.records)) {
      return parsed.data.records.map((r) => r.record_id || (r.fields && r.fields.record_id) || '').filter(Boolean);
    }
    if (parsed.data && Array.isArray(parsed.data.record_id_list)) {
      return parsed.data.record_id_list.filter(Boolean);
    }
    if (Array.isArray(parsed.record_id_list)) {
      return parsed.record_id_list.filter(Boolean);
    }
    if (Array.isArray(parsed.records)) {
      return parsed.records.map((r) => (typeof r === 'string' ? r : (r.record_id || ''))).filter(Boolean);
    }
    return [];
  },

  // 构造基础参数
  buildBaseArgs(subCommand, options = {}) {
    const args = ['base', subCommand];
    if (options.baseToken) args.push('--base-token', options.baseToken);
    if (options.tableId) args.push('--table-id', options.tableId);
    if (options.asUser !== false) args.push('--as', 'user');
    if (options.json) args.push('--json', options.json);
    if (options.yes) args.push('--yes');
    return args;
  },
};

function runLarkCli(args) {
  return new Promise((resolve, reject) => {
    const env = Object.assign({}, process.env, {
      PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:' + (process.env.PATH || ''),
    });
    execFile(LARK_CLI, args, { env, maxBuffer: 10 * 1024 * 1024, timeout: 30000 }, (err, stdout, stderr) => {
      if (err) {
        let msg = stderr || stdout || err.message;
        if (err.killed || err.signal === 'SIGTERM') {
          msg = '飞书 CLI 调用超时 (30秒)，请检查网络连接或稍后重试';
        } else {
          try {
            const parsed = safeParseJson(stdout || stderr);
            if (parsed && parsed.error && parsed.error.message) {
              msg = parsed.error.message;
              if (parsed.error.hint) msg += ` (${parsed.error.hint})`;
            }
          } catch (e) {}
        }
        return reject(new Error(msg));
      }
      resolve(stdout);
    });
  });
}

async function checkStatus() {
  try {
    const out = await runLarkCli(['auth', 'status']);
    const data = JSON.parse(out);
    return {
      ok: true,
      userName: (data.identities && data.identities.user && data.identities.user.userName) || '已授权用户',
      available: !!(data.identities && data.identities.user && data.identities.user.available),
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function pullRecords(assetsDir) {
  const tmpNdjson = path.join('/tmp', `board_records_${Date.now()}.ndjson`);
  try {
    const args = [
      'base',
      '+record-list',
      '--base-token',
      BASE_TOKEN,
      '--table-id',
      TABLE_ID,
      '--field-id', '日期',
      '--field-id', '开始时间',
      '--field-id', '结束时间',
      '--field-id', '日程标题',
      '--field-id', '板块',
      '--field-id', '完成状态',
      '--field-id', '备注',
      '--field-id', '日程类型',
      '--field-id', '标记删除',
      '--field-id', '谷歌事件 ID',
      '--field-id', '内容哈希',
      '--field-id', '同步状态',
      '--field-id', '外部事件 ID',
      '--field-id', '外部来源',
      '--field-id', '提醒时间',
      '--field-id', '重复规则',
      '--field-id', '计入时间记录',
      '--field-id', '关联打卡',
      '--field-id', '关联任务',
      '--field-id', '关联时间记录',
      '--format', 'ndjson',
      '--output', tmpNdjson,
      '--overwrite',
    ];

    await runLarkCli(args);

    if (!fs.existsSync(tmpNdjson)) {
      throw new Error('未能生成多维表格数据文件');
    }

    const content = fs.readFileSync(tmpNdjson, 'utf8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);

    const records = [];
    for (const line of lines) {
      try {
        const row = JSON.parse(line);
        // 核心过滤卫兵：若多维表格中标记删除为真，绝不装载入日历看板
        if (row['标记删除'] === true || row['标记删除'] === 'true' || row['标记删除'] === 1) {
          continue;
        }
        const rawDate = row['日期'] || row['开始时间'];
        if (!rawDate) continue;
        const dateStr = String(rawDate).slice(0, 10);
        records.push({
          date: dateStr,
          startTime: row['开始时间'] ? String(row['开始时间']) : '',
          endTime: row['结束时间'] ? String(row['结束时间']) : '',
          text: row['日程标题'] || '',
          category: (Array.isArray(row['板块']) ? row['板块'][0] : row['板块']) || '生活',
          note: row['备注'] || '',
          status: (Array.isArray(row['完成状态']) ? row['完成状态'][0] : row['完成状态']) || '',
          type: (Array.isArray(row['日程类型']) ? row['日程类型'][0] : row['日程类型']) || '自己安排',
          record_id: row['record_id'] || '',
          markedDelete: !!row['标记删除'],
          googleEventId: row['谷歌事件 ID'] || '',
          contentHash: row['内容哈希'] || '',
          syncStatus: (Array.isArray(row['同步状态']) ? row['同步状态'][0] : row['同步状态']) || '',
          externalEventId: row['外部事件 ID'] || '',
          externalSource: (Array.isArray(row['外部来源']) ? row['外部来源'][0] : row['外部来源']) || '',
          reminder: (Array.isArray(row['提醒时间']) ? row['提醒时间'][0] : row['提醒时间']) || '',
          repeatRule: (Array.isArray(row['重复规则']) ? row['重复规则'][0] : row['重复规则']) || '不重复',
          trackTime: !!row['计入时间记录'],
          linkedHabit: (Array.isArray(row['关联打卡']) ? row['关联打卡'].map((x) => {
            if (typeof x === 'object' && x) {
              const id = x.id || x.record_id || '';
              return decodeHabitName(id) || x.text || x.name || '';
            }
            return decodeHabitName(x);
          }).filter(Boolean).join(', ') : decodeHabitName(row['关联打卡'])),
          linkedTask: (Array.isArray(row['关联任务']) ? row['关联任务'].map((x) => {
            if (typeof x === 'object' && x) {
              const id = x.id || x.record_id || '';
              return decodeTaskName(id) || x.text || x.name || '';
            }
            return decodeTaskName(x);
          }).filter(Boolean).join(', ') : decodeTaskName(row['关联任务'])),
          linkedTimeRecord: (Array.isArray(row['关联时间记录']) ? row['关联时间记录'].map((x) => (typeof x === 'object' ? (x.text || x.name || JSON.stringify(x)) : String(x))).join(', ') : String(row['关联时间记录'] || '')),
        });
      } catch (e) {
        // ignore malformed line
      }
    }

    // 按日期升序排序
    records.sort((a, b) => a.date.localeCompare(b.date));

    // 写回 assets/board_data.js
    if (assetsDir) {
      const targetFile = path.join(assetsDir, 'board_data.js');
      const jsContent = `window.BOARD_DATA = ${JSON.stringify({ records }, null, 2)};\n`;
      fs.writeFileSync(targetFile, jsContent, 'utf8');
    }

    return { ok: true, count: records.length, records };
  } finally {
    if (fs.existsSync(tmpNdjson)) {
      try { fs.unlinkSync(tmpNdjson); } catch (e) {}
    }
  }
}

const WRITABLE_FIELDS = new Set([
  '日程标题',
  '板块',
  '完成状态',
  '日程类型',
  '日期',
  '开始时间',
  '结束时间',
  '计入时间记录',
  '标记删除',
  '提醒时间',
  '重复规则',
  '备注',
  '外部来源',
  '外部事件 ID',
  '谷歌事件 ID',
]);

function normalizeFields(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const f = {};

  // 1. 字段别名映射
  let title = raw['日程标题'] || raw['总结/日程内容'] || raw['text'] || '';
  let category = raw['板块'] || raw['日程分类'] || raw['category'] || '';
  let status = raw['完成状态'] || raw['status'] || '';
  let type = raw['日程类型'] || raw['type'] || '';
  let date = raw['日期'] || raw['date'] || '';
  let startTime = raw['开始时间'] || raw['startTime'] || '';
  let endTime = raw['结束时间'] || raw['endTime'] || '';
  let note = raw['备注'] || raw['note'] || '';
  let reminder = raw['提醒时间'] || raw['reminder'] || '';
  let repeatRule = raw['重复规则'] || raw['repeatRule'] || '';
  let trackTime = raw['计入时间记录'] !== undefined ? raw['计入时间记录'] : raw['trackTime'];
  let markedDelete = raw['标记删除'] !== undefined ? raw['标记删除'] : raw['markedDelete'];

  if (title) f['日程标题'] = String(title).trim();

  // 板块：多维表格单选，支持工作, 生活, 运动, 睡眠, 学习, 娱乐, 无匹配标签
  const validCats = ['工作', '生活', '运动', '睡眠', '学习', '娱乐', '无匹配标签'];
  if (category) {
    let catStr = Array.isArray(category) ? category[0] : String(category);
    if (catStr === '睡觉') catStr = '睡眠';
    f['板块'] = validCats.includes(catStr) ? [catStr] : ['生活'];
  }

  // 完成状态：多维表格单选，仅支持 完成, 未完成, 继续, 中断, 超时
  if (status !== undefined && status !== null && status !== '') {
    const stStr = Array.isArray(status) ? status[0] : String(status);
    if (['完成', '未完成', '继续', '中断', '超时'].includes(stStr)) {
      f['完成状态'] = [stStr];
    } else {
      f['完成状态'] = ['完成'];
    }
  } else {
    f['完成状态'] = ['完成'];
  }

  // 日程类型
  const validTypes = ['一天总结', '预期安排', '自己安排', '需求表', '飞书任务', '项目', '定时', '会议', '智能体安排'];
  if (type) {
    const typeStr = Array.isArray(type) ? type[0] : String(type);
    f['日程类型'] = validTypes.includes(typeStr) ? [typeStr] : ['自己安排'];
  }

  // 日期与时段
  if (date) {
    f['日期'] = String(date).slice(0, 10);
  }
  if (startTime) {
    let sStr = String(startTime).replace('T', ' ').trim();
    if (sStr.length === 10) sStr += ' 00:00';
    f['开始时间'] = sStr.slice(0, 16);
  }
  if (endTime) {
    let eStr = String(endTime).replace('T', ' ').trim();
    if (eStr.length === 10) eStr += ' 23:59';
    f['结束时间'] = eStr.slice(0, 16);
  }

  // 针对“一天总结”全天特性自动补全标准起止时间
  if (f['日程类型'] && f['日程类型'][0] === '一天总结' && f['日期']) {
    if (!f['开始时间']) f['开始时间'] = `${f['日期']} 00:00`;
    if (!f['结束时间']) f['结束时间'] = `${f['日期']} 23:59`;
  }

  // 备注
  if (note !== undefined && note !== null) {
    f['备注'] = String(note);
  }

  // 提醒时间
  if (reminder) {
    const remStr = Array.isArray(reminder) ? reminder[0] : String(reminder);
    const validReminders = ['不提醒', '准时', '提前 5 分钟', '提前 15 分钟', '提前 30 分钟', '提前 1 小时', '提前 1 天', '提前 1 周'];
    if (validReminders.includes(remStr)) {
      f['提醒时间'] = [remStr];
    }
  }

  // 重复规则
  if (repeatRule) {
    const repStr = Array.isArray(repeatRule) ? repeatRule[0] : String(repeatRule);
    const validRepeats = ['不重复', '每天', '工作日', '每周', '每月', '每年'];
    if (validRepeats.includes(repStr)) {
      f['重复规则'] = [repStr];
    }
  }

  // 计入时间记录 (checkbox)
  if (trackTime !== undefined) {
    f['计入时间记录'] = Boolean(trackTime);
  }

  // 标记删除 (checkbox)
  if (markedDelete !== undefined) {
    f['标记删除'] = Boolean(markedDelete);
  }

  // 关联打卡 与 关联任务
  let linkedTask = raw['关联任务'] !== undefined ? raw['关联任务'] : raw['linkedTask'];
  if (linkedTask !== undefined) {
    if (!linkedTask || linkedTask === '无关联' || (Array.isArray(linkedTask) && linkedTask.length === 0)) {
      f['关联任务'] = [];
    } else {
      const items = Array.isArray(linkedTask) ? linkedTask : [linkedTask];
      const linkArr = [];
      for (const it of items) {
        if (!it || it === '无关联') continue;
        let id = '';
        if (typeof it === 'object' && it && it.id) {
          id = it.id;
        } else if (typeof it === 'string') {
          const s = it.trim();
          if (s.startsWith('rec')) {
            id = s;
          } else {
            id = TASK_NAME_TO_ID[s] || '';
          }
        }
        if (id) linkArr.push({ id });
      }
      f['关联任务'] = linkArr;
    }
  }

  let linkedHabit = raw['关联打卡'] !== undefined ? raw['关联打卡'] : raw['linkedHabit'];
  if (linkedHabit !== undefined) {
    if (!linkedHabit || linkedHabit === '无关联' || (Array.isArray(linkedHabit) && linkedHabit.length === 0)) {
      f['关联打卡'] = [];
    } else {
      const items = Array.isArray(linkedHabit) ? linkedHabit : [linkedHabit];
      const linkArr = [];
      for (const it of items) {
        if (!it || it === '无关联') continue;
        let id = '';
        if (typeof it === 'object' && it && it.id) {
          id = it.id;
        } else if (typeof it === 'string') {
          const s = it.trim();
          if (s.startsWith('rec')) {
            id = s;
          } else {
            id = HABIT_NAME_TO_ID[s] || '';
          }
        }
        if (id) linkArr.push({ id });
      }
      f['关联打卡'] = linkArr;
    }
  }

  // 针对“一天总结”类型：铁律定死，绝对不计入时间记录
  if (f['日程类型'] && f['日程类型'][0] === '一天总结') {
    f['计入时间记录'] = false;
  }

  // 复制其他在白名单中的显式字段
  for (const k of Object.keys(raw)) {
    if (WRITABLE_FIELDS.has(k) && f[k] === undefined) {
      f[k] = raw[k];
    }
  }

  return f;
}

async function pushChanges(changes, assetsDir) {
  if (!Array.isArray(changes) || changes.length === 0) {
    return { ok: true, message: '无需要推送的变更', results: { updated: 0, created: 0, deleted: 0 }, createdRecords: [] };
  }

  const updates = {};
  const creates = [];
  const hardDeletes = new Set();

  for (const c of changes) {
    if (!c) continue;
    const rawFields = c.fields || c;
    const fields = normalizeFields(rawFields);
    const op = c.op || c.action || (c.record_id ? 'update' : 'create');
    const hasValidRecordId = !!(c.record_id && typeof c.record_id === 'string' && c.record_id.startsWith('rec'));

    if (op === 'delete' || op === 'soft_delete' || fields['标记删除'] === true) {
      if (hasValidRecordId) {
        hardDeletes.add(c.record_id);
      }
    } else if (op === 'create' || !hasValidRecordId) {
      // 若标为 update 但缺乏合法飞书 record_id（本地新建），自动降级为 create 新建
      if (fields['计入时间记录'] === undefined) {
        fields['计入时间记录'] = true;
      }
      // 过滤完全没有任何核心字段的空记录
      if (fields['日程标题'] || fields['日期']) {
        creates.push({
          _uid: c._uid || c.uid || (c.key && c.key['日期'] ? `upsert_${c.key['日期']}` : null),
          fields,
        });
      }
    } else if (op === 'update' && hasValidRecordId) {
      if (Object.keys(fields).length > 0) {
        updates[c.record_id] = fields;
      }
    }
  }

  const results = { updated: 0, created: 0, deleted: 0 };
  const createdRecordMappings = [];

  // 1. 批量物理删除记录（分片防超限：每批上限 100 条）
  const deleteList = Array.from(hardDeletes);
  if (deleteList.length > 0) {
    for (let i = 0; i < deleteList.length; i += 100) {
      const chunk = deleteList.slice(i, i + 100);
      const deletePayload = JSON.stringify({ record_id_list: chunk });
      try {
        await runLarkCli([
          'base',
          '+record-delete',
          '--base-token',
          BASE_TOKEN,
          '--table-id',
          TABLE_ID,
          '--as',
          'user',
          '--json',
          deletePayload,
          '--yes',
        ]);
      } catch (err) {
        console.error('物理删除接口异常，降级为标记软删除:', err.message);
        const fallbackChunk = {};
        for (const id of chunk) {
          fallbackChunk[id] = { 标记删除: true };
        }
        await runLarkCli([
          'base',
          '+record-batch-update',
          '--base-token',
          BASE_TOKEN,
          '--table-id',
          TABLE_ID,
          '--as',
          'user',
          '--json',
          JSON.stringify({ update_records: fallbackChunk }),
        ]);
      }
    }
    results.deleted = deleteList.length;
  }

  // 2. 批量更新现有记录（分片防超限：每批上限 100 条）
  const updateEntries = Object.entries(updates);
  for (let i = 0; i < updateEntries.length; i += 100) {
    const chunk = Object.fromEntries(updateEntries.slice(i, i + 100));
    const updatePayload = JSON.stringify({ update_records: chunk });
    await runLarkCli([
      'base',
      '+record-batch-update',
      '--base-token',
      BASE_TOKEN,
      '--table-id',
      TABLE_ID,
      '--as',
      'user',
      '--json',
      updatePayload,
    ]);
  }
  results.updated = Object.keys(updates).length;

  // 3. 批量新建（分片防超限：每批上限 100 条）
  for (let i = 0; i < creates.length; i += 100) {
    const chunk = creates.slice(i, i + 100);
    const chunkPayload = chunk.map((item) => item.fields);
    const createPayload = JSON.stringify({ create_records: chunkPayload });
    const stdout = await runLarkCli([
      'base',
      '+record-batch-create',
      '--base-token',
      BASE_TOKEN,
      '--table-id',
      TABLE_ID,
      '--as',
      'user',
      '--json',
      createPayload,
    ]);

    // 遵守飞书官方规范：直接使用 CLI 返回的 record_id 与提交行建立绑定，严禁写后立即拉取全量
    const recordIds = LarkCliAdapter.extractCreatedRecordIds(stdout);
    chunk.forEach((item, idx) => {
      const assignedId = recordIds[idx] || '';
      createdRecordMappings.push({
        _uid: item._uid,
        record_id: assignedId,
        fields: item.fields,
      });
    });
  }
  results.created = creates.length;

  // 4. 增量同步更新本地 assets/board_data.js 快照，毫秒级响应且杜绝远端索引延迟冲掉新数据
  let currentRecords = [];
  if (assetsDir) {
    try {
      const targetFile = path.join(assetsDir, 'board_data.js');
      if (fs.existsSync(targetFile)) {
        const raw = fs.readFileSync(targetFile, 'utf8');
        const s = raw.indexOf('{');
        const e = raw.lastIndexOf('}');
        if (s !== -1 && e !== -1) {
          const parsed = safeParseJson(raw.slice(s, e + 1));
          if (parsed && Array.isArray(parsed.records)) {
            currentRecords = parsed.records;
          }
        }
      }

      // 4.1 移除物理删除项
      if (hardDeletes.size > 0) {
        currentRecords = currentRecords.filter((r) => !hardDeletes.has(r.record_id));
      }

      // 4.2 应用更新项
      if (Object.keys(updates).length > 0) {
        currentRecords = currentRecords.map((r) => {
          if (r.record_id && updates[r.record_id]) {
            const u = updates[r.record_id];
            return Object.assign({}, r, {
              text: u['日程标题'] !== undefined ? u['日程标题'] : r.text,
              category: u['板块'] !== undefined ? (Array.isArray(u['板块']) ? u['板块'][0] : u['板块']) : r.category,
              status: u['完成状态'] !== undefined ? (Array.isArray(u['完成状态']) ? u['完成状态'][0] : u['完成状态']) : r.status,
              type: u['日程类型'] !== undefined ? (Array.isArray(u['日程类型']) ? u['日程类型'][0] : u['日程类型']) : r.type,
              date: u['日期'] !== undefined ? u['日期'] : r.date,
              startTime: u['开始时间'] !== undefined ? u['开始时间'] : r.startTime,
              endTime: u['结束时间'] !== undefined ? u['结束时间'] : r.endTime,
              note: u['备注'] !== undefined ? u['备注'] : r.note,
              trackTime: u['计入时间记录'] !== undefined ? u['计入时间记录'] : r.trackTime,
              reminder: u['提醒时间'] !== undefined ? (Array.isArray(u['提醒时间']) ? u['提醒时间'][0] : u['提醒时间']) : r.reminder,
              repeatRule: u['重复规则'] !== undefined ? (Array.isArray(u['重复规则']) ? u['重复规则'][0] : u['重复规则']) : r.repeatRule,
            });
          }
          return r;
        });
      }

      // 4.3 追加新增项（携带飞书分配的 record_id 与完整字段）
      for (const m of createdRecordMappings) {
        const f = m.fields;
        currentRecords.push({
          date: f['日期'] || '',
          startTime: f['开始时间'] || '',
          endTime: f['结束时间'] || '',
          text: f['日程标题'] || '',
          category: (Array.isArray(f['板块']) ? f['板块'][0] : f['板块']) || '生活',
          note: f['备注'] || '',
          status: (Array.isArray(f['完成状态']) ? f['完成状态'][0] : f['完成状态']) || '完成',
          type: (Array.isArray(f['日程类型']) ? f['日程类型'][0] : f['日程类型']) || '自己安排',
          record_id: m.record_id || '',
          _uid: m._uid || '',
          trackTime: f['计入时间记录'] !== undefined ? f['计入时间记录'] : true,
          reminder: (Array.isArray(f['提醒时间']) ? f['提醒时间'][0] : f['提醒时间']) || '',
          repeatRule: (Array.isArray(f['重复规则']) ? f['重复规则'][0] : f['重复规则']) || '不重复',
        });
      }

      currentRecords.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const jsContent = `window.BOARD_DATA = ${JSON.stringify({ records: currentRecords }, null, 2)};\n`;
      fs.writeFileSync(targetFile, jsContent, 'utf8');
    } catch (e) {
      console.warn('[sync.js] 本地快照增量刷新异常:', e.message);
    }
  }

  return {
    ok: true,
    results,
    createdRecords: createdRecordMappings,
    freshCount: currentRecords.length,
    records: currentRecords,
  };
}

module.exports = {
  checkStatus,
  pullRecords,
  pushChanges,
  normalizeFields,
  TASK_ID_MAP,
  HABIT_ID_MAP,
  decodeTaskName,
  decodeHabitName,
};

// 支持直接命令行测试
if (require.main === module) {
  const assetsDir = path.join(__dirname, 'assets');
  const action = process.argv[2] || 'pull';
  if (action === 'pull') {
    console.log('正在拉取飞书多维表格「00 🗓日程」数据...');
    pullRecords(assetsDir).then((res) => {
      console.log(`成功拉取 ${res.count} 条记录，已写入 assets/board_data.js`);
    }).catch((err) => {
      console.error('拉取失败:', err);
      process.exit(1);
    });
  } else if (action === 'status') {
    checkStatus().then((res) => {
      console.log('状态:', res);
    });
  }
}
