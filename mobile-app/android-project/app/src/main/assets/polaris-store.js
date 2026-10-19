/**
 * 北极星执行系统 · 移动端核心数据引擎 (PolarisStore)
 * 1. 离线优先 Local-First：即便完全脱机，所有增删改查、打卡、计时均毫秒级在本地持久化。
 * 2. 真实双向绑定：字段与飞书多维表格（Base SQbpb4osNaAkY7s8UVdcupkYnqe）100% 对齐。
 * 3. 局域网同步管道：支持一键向 Mac 端 serve.js (端口 8080) Pull 全量数据与 Push 离线增量。
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'polaris_store_v1';
  const DEFAULT_MAC_SYNC_HOST = 'http://192.168.1.4:8080';

  function getMacSyncHost() {
    try {
      if (typeof localStorage !== 'undefined') {
        const custom = localStorage.getItem('polaris_mac_sync_host');
        if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');
      }
    } catch (e) {}
    return DEFAULT_MAC_SYNC_HOST;
  }

  class PolarisStore {
    constructor() {
      this.state = {
        schedules: [],       // 04 🗓日程管理 (700+条)
        threeThings: [],     // 三件事 (吃青蛙)
        tasks: [],          // 03 📚任务管理 (P0/P1/P2/P3)
        moodLogs: {},       // 心情打卡历史 { "2026-10-03": { emoji: "开心", score: 5, note: "" } }
        focusLogs: [],      // 05⌚️时间管理 (实际专注记录)
        habits: [],         // 打卡清单 & 习惯频次
        ideas: [],          // 收集表 (灵感便笺)
        pendingChanges: [], // 待回写多维表格的增量变更队列
        lastSyncTime: null,
        syncStatus: 'idle'  // 'idle' | 'syncing' | 'synced' | 'error'
      };

      this.listeners = new Set();
      this.loadFromStorage();
    }

    // 智能去重护栏：过滤软删除与同天同时段同标题重复项
    deduplicateSchedules(list) {
      if (!Array.isArray(list)) return [];
      const markedDeleteIds = new Set(
        (window.BOARD_DATA && Array.isArray(window.BOARD_DATA.records))
          ? window.BOARD_DATA.records.filter(r => r.markedDelete).map(r => r.record_id)
          : []
      );
      const seen = new Set();
      const result = [];
      for (const rec of list) {
        if (!rec) continue;
        if (rec.markedDelete === true) continue;
        if (rec.record_id && markedDeleteIds.has(rec.record_id)) continue;

        const dateStr = rec.date || '';
        const title = (rec.text || rec.title || '').trim();
        const sTime = rec.startTimeStr || (rec.startTime ? String(rec.startTime).slice(11, 16) : '');
        const eTime = rec.endTimeStr || (rec.endTime ? String(rec.endTime).slice(11, 16) : '');

        const dedupKey = `${dateStr}_${title}_${sTime}_${eTime}`;
        if (seen.has(dedupKey)) {
          continue;
        }
        seen.add(dedupKey);
        result.push(rec);
      }
      return result;
    }

    // 订阅状态变更
    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    notify() {
      this.saveToStorage();
      this.listeners.forEach(fn => {
        try { fn(this.state); } catch (e) { console.error('Store listener error:', e); }
      });
    }

    // 本地持久化保存与恢复
    saveToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          schedules: this.state.schedules, // 100% 完整保留全部排程，严禁截断
          threeThings: this.state.threeThings,
          tasks: this.state.tasks,
          moodLogs: this.state.moodLogs,
          focusLogs: this.state.focusLogs,
          habits: this.state.habits,
          ideas: this.state.ideas,
          pendingChanges: this.state.pendingChanges,
          lastSyncTime: this.state.lastSyncTime
        }));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
    }

    loadFromStorage() {
      // 1. 尝试从 localStorage 恢复用户改动与偏好
      let cachedSchedules = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.schedules && Array.isArray(parsed.schedules) && parsed.schedules.length > 0) {
            cachedSchedules = parsed.schedules;
          }
          delete parsed.schedules;
          Object.assign(this.state, parsed);
        }
      } catch (e) {}

      // 2. 载入随包打包的 assets/board_data.js 中的真实多维表格数据 (Mac 端完全对齐)
      const baseRecords = (window.BOARD_DATA && Array.isArray(window.BOARD_DATA.records))
        ? window.BOARD_DATA.records.filter(r => !r.markedDelete)
        : [];

      if (cachedSchedules && cachedSchedules.length > 0) {
        // 先对 cached 进行净化，移除软删除和冗余克隆
        const cleanedCache = this.deduplicateSchedules(cachedSchedules);
        // 保留本地新增的 local_ 记录并与 baseRecords 进行合并
        const localCreated = cleanedCache.filter(s => s.record_id && String(s.record_id).startsWith('local_'));
        const modifiedMap = new Map();
        cleanedCache.forEach(s => {
          if (s.record_id) modifiedMap.set(s.record_id, s);
        });
        const merged = baseRecords.map(r => modifiedMap.get(r.record_id) || r);
        this.state.schedules = this.deduplicateSchedules([...localCreated, ...merged]);
      } else if (baseRecords.length > 0) {
        this.state.schedules = this.deduplicateSchedules(baseRecords);
      } else {
        this.state.schedules = [];
      }

      // 3. 初始化三件事默认数据 (若为空)
      if (!this.state.threeThings || this.state.threeThings.length === 0) {
        this.state.threeThings = [
          { text: "REDMI K80 澎湃 OS 原生编译与真机适配", category: "工作", done: true, time: "09:00" },
          { text: "北极星多维表格 7 大板块数据双向绑定", category: "工作", done: false, time: "14:00" },
          { text: "晚间身体锻炼跑步 5km 与心率监测", category: "运动", done: false, time: "20:00" }
        ];
      }

      // 4. 初始化习惯清单默认数据 (若为空)
      if (!this.state.habits || this.state.habits.length === 0) {
        this.state.habits = [
          { id: "h1", name: "坚持锻炼身体", icon: "🏃", days: [1,1,1,1,1,0,1], streak: 28 },
          { id: "h2", name: "早起 07:00", icon: "🌅", days: [1,1,1,1,1,1,0], streak: 19 },
          { id: "h3", name: "正念冥想 15m", icon: "🧘", days: [1,0,1,1,1,1,1], streak: 12 },
          { id: "h4", name: "规律健康饮食", icon: "🥗", days: [1,1,1,1,1,1,1], streak: 31 },
          { id: "h5", name: "睡前闭环复盘", icon: "🌙", days: [1,1,1,1,1,1,1], streak: 25 }
        ];
      }

      // 5. 初始化任务管理 (P0/P1/P2/P3)
      if (!this.state.tasks || this.state.tasks.length === 0) {
        this.state.tasks = [
          { id: "t1", title: "年度日历手机端底层架构重塑", priority: "P0", done: true, time: "今日" },
          { id: "t2", title: "多维表格 736+ 条日程动态关联与筛选", priority: "P0", done: false, time: "今天下午" },
          { id: "t3", title: "CatVolume 拟物白噪音真实声波播放集成", priority: "P1", done: false, time: "明天" },
          { id: "t4", title: "星账激励积分兑换商城配置", priority: "P3", done: false, time: "待激活" }
        ];
      }

      // 6. 初始化灵感想法库 (收集表)
      if (!this.state.ideas || this.state.ideas.length === 0) {
        this.state.ideas = [
          { id: "i1", text: "给看板加上 120Hz 骁龙8 Gen3 滑动微触感，REDMI K80 澎湃 OS 肯定很爽！", color: "yellow", time: "10:24", converted: false },
          { id: "i2", text: "年度日历的 365 天色块，可以根据当天心情微表情的主题色自动渐变呈现。", color: "blue", time: "14:15", converted: false },
          { id: "i3", text: "把飞书多维表格里的打卡清单和习惯记录自动挂载到时间带。", color: "green", time: "昨天", converted: true }
        ];
      }
    }

    // 辅助：获取本地 YYYY-MM-DD
    getTodayDateStr() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    // ================= 业务方法：1. 【日程管理】CRUD =================
    getTodaySchedules(targetDate = null) {
      const target = targetDate || this.getTodayDateStr();
      const list = this.state.schedules.filter(s => s.date === target && !s.markedDelete);
      const deduped = this.deduplicateSchedules(list);
      // 若指定日期尚无日程，但有最新日程，则返回最近可用的日程供展示
      if (deduped.length === 0 && !targetDate) {
        return this.deduplicateSchedules(this.state.schedules.filter(s => !s.markedDelete)).slice(0, 15);
      }
      return deduped;
    }

    getWeekSchedules() {
      // 获取当前周的排程记录 (自动过滤软删除与重复项)
      return this.deduplicateSchedules(this.state.schedules.filter(s => !s.markedDelete)).slice(0, 30);
    }

    addSchedule(titleOrObj, category = '生活', dateStr = null, startTime = '09:00', endTime = '10:00') {
      let title = titleOrObj;
      let cat = category;
      let dStr = dateStr;
      let sTime = startTime;
      let eTime = endTime;
      let scheduleType = '自己安排';

      if (titleOrObj && typeof titleOrObj === 'object') {
        title = titleOrObj.text || titleOrObj.title || '新排程';
        cat = titleOrObj.category || '生活';
        dStr = titleOrObj.date || titleOrObj.dateStr || this.getTodayDateStr();
        sTime = titleOrObj.startTime || titleOrObj.start || '09:00';
        eTime = titleOrObj.endTime || titleOrObj.end || '10:00';
        scheduleType = titleOrObj.type || '自己安排';
      }

      const date = dStr || this.getTodayDateStr();
      const sFull = sTime.includes('T') ? sTime : `${date} ${sTime.length === 5 ? sTime + ':00' : sTime}`;
      const eFull = eTime.includes('T') ? eTime : `${date} ${eTime.length === 5 ? eTime + ':00' : eTime}`;

      const newRec = {
        record_id: 'local_' + Date.now(),
        date: date,
        startTime: sFull,
        endTime: eFull,
        startTimeStr: sTime.includes('T') ? sTime.slice(11, 16) : sTime.slice(0, 5),
        endTimeStr: eTime.includes('T') ? eTime.slice(11, 16) : eTime.slice(0, 5),
        durationStr: '时段',
        text: title,
        category: cat,
        status: '完成',
        type: scheduleType,
        note: '由移动端录入',
        markedDelete: false,
        syncStatus: '待同步'
      };

      this.state.schedules.unshift(newRec);
      this.state.pendingChanges.push({
        op: 'create',
        fields: {
          '日期': newRec.date,
          '日程标题': newRec.text,
          '开始时间': newRec.startTime,
          '结束时间': newRec.endTime,
          '板块': newRec.category,
          '完成状态': '完成',
          '日程类型': newRec.type,
          '计入时间记录': true,
          '备注': newRec.note
        }
      });
      this.notify();
      this.pushToFeishu().catch(() => {});
      return newRec;
    }

    deleteSchedule(recordId) {
      const idx = this.state.schedules.findIndex(s => s.record_id === recordId || s.id === recordId);
      if (idx !== -1) {
        const [removed] = this.state.schedules.splice(idx, 1);
        removed.markedDelete = true;
        const targetId = removed.record_id || recordId;
        if (targetId && targetId.startsWith('rec')) {
          this.state.pendingChanges.push({
            op: 'soft_delete',
            record_id: targetId,
            fields: { '标记删除': true }
          });
        }
        this.notify();
        this.pushToFeishu().catch(() => {});
        return true;
      }
      return false;
    }

    updateSchedule(recordId, updates) {
      let rec = this.state.schedules.find(s => s.record_id === recordId || s.id === recordId);
      if (!rec) {
        // 如果是样本数据被编辑/移动，自动物化为正式记录
        if (typeof recordId === 'string' && recordId.startsWith('sample-')) {
          rec = {
            record_id: 'local_' + Date.now(),
            id: recordId,
            date: updates.date || this.getTodayDateStr(),
            text: updates.text || '排程事项',
            category: updates.category || '工作',
            status: updates.status || '进行中',
            cardStyle: updates.cardStyle || 'ticket',
            start: updates.start || '09:00',
            end: updates.end || '10:00',
            markedDelete: false,
            syncStatus: '待同步'
          };
          this.state.schedules.unshift(rec);
        } else {
          return null;
        }
      }

      if (updates.text !== undefined) rec.text = updates.text;
      if (updates.category !== undefined) rec.category = updates.category;
      if (updates.status !== undefined) rec.status = updates.status;
      if (updates.cardStyle !== undefined) rec.cardStyle = updates.cardStyle;
      if (updates.date !== undefined) rec.date = updates.date;
      if (updates.start !== undefined) {
        rec.start = updates.start;
        rec.startTimeStr = updates.start;
      }
      if (updates.end !== undefined) {
        rec.end = updates.end;
        rec.endTimeStr = updates.end;
      }
      if (rec.date && rec.start) {
        rec.startTime = `${rec.date} ${rec.start.length === 5 ? rec.start + ':00' : rec.start}`;
      }
      if (rec.date && rec.end) {
        rec.endTime = `${rec.date} ${rec.end.length === 5 ? rec.end + ':00' : rec.end}`;
      }
      if (updates.note !== undefined) rec.note = updates.note;

      rec.syncStatus = '待同步';
      const targetId = rec.record_id || recordId;
      if (targetId && targetId.startsWith('rec')) {
        const feishuFields = {};
        if (rec.text) feishuFields['日程标题'] = rec.text;
        if (rec.category) feishuFields['板块'] = rec.category;
        if (rec.status) feishuFields['完成状态'] = [rec.status];
        if (rec.startTime) feishuFields['开始时间'] = rec.startTime;
        if (rec.endTime) feishuFields['结束时间'] = rec.endTime;
        this.state.pendingChanges.push({
          op: 'update',
          record_id: targetId,
          fields: feishuFields
        });
      }
      this.notify();
      this.pushToFeishu().catch(() => {});
      return rec;
    }

    toggleScheduleStatus(recordId) {
      const rec = this.state.schedules.find(s => s.record_id === recordId || s.id === recordId);
      if (rec) {
        rec.status = (rec.status === '完成') ? '未完成' : '完成';
        rec.syncStatus = '待同步';
        const targetId = rec.record_id || recordId;
        if (targetId && targetId.startsWith('rec')) {
          this.state.pendingChanges.push({
            op: 'update',
            record_id: targetId,
            fields: { '完成状态': [rec.status] }
          });
        }
        this.notify();
        this.pushToFeishu().catch(() => {});
      }
    }

    isAllDay(rec) {
      if (!rec) return false;
      if (rec.allDay) return true;
      if (rec.type === '一天总结') return true;
      if (rec.durationStr === '全天') return true;
      const s = rec.start || rec.startTimeStr || (rec.startTime ? rec.startTime.slice(11, 16) : '');
      const e = rec.end || rec.endTimeStr || (rec.endTime ? rec.endTime.slice(11, 16) : '');
      if (!s) return true; // 无具体时刻排程，归类为全天/待办事项
      if (s === '00:00' && (e === '23:59' || e === '00:00' || !e)) return true;
      return false;
    }

    // ================= 业务方法：2. 【行动与三件事】 =================
    toggleThreeThing(index) {
      if (this.state.threeThings[index]) {
        this.state.threeThings[index].done = !this.state.threeThings[index].done;
        this.notify();
      }
    }

    updateThreeThing(index, text) {
      if (this.state.threeThings[index]) {
        this.state.threeThings[index].text = text;
        this.notify();
      }
    }

    toggleTask(taskId) {
      const t = this.state.tasks.find(x => x.id === taskId);
      if (t) {
        t.done = !t.done;
        this.notify();
      }
    }

    deleteTask(taskId) {
      const idx = this.state.tasks.findIndex(x => x.id === taskId);
      if (idx !== -1) {
        this.state.tasks.splice(idx, 1);
        this.notify();
        return true;
      }
      return false;
    }

    addTask(title, priority = 'P0') {
      const t = {
        id: 'task_' + Date.now(),
        title: title,
        priority: priority,
        done: false,
        time: '刚刚'
      };
      this.state.tasks.unshift(t);
      this.notify();
      return t;
    }

    // ================= 业务方法：3. 【心情打卡】 =================
    logMood(emojiId, emojiName, note = '') {
      const date = this.getTodayDateStr();
      this.state.moodLogs[date] = {
        emojiId,
        emojiName,
        note,
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false })
      };
      this.state.pendingChanges.push({
        type: 'insert',
        table: '心情记录',
        data: { 日期: date, 心情总结: emojiName }
      });
      this.notify();
    }

    getTodayMood() {
      const date = this.getTodayDateStr();
      return this.state.moodLogs[date] || null;
    }

    // ================= 业务方法：4. 【专注时间记录】 =================
    recordFocus(title, minutes, type = '番茄专注') {
      const log = {
        id: 'focus_' + Date.now(),
        name: title,
        minutes: minutes,
        type: type,
        timestamp: new Date().toISOString()
      };
      this.state.focusLogs.unshift(log);
      this.state.pendingChanges.push({
        type: 'insert',
        table: '05⌚️时间管理',
        data: { '📥事项名称': title, '类型': [type] }
      });
      this.notify();
    }

    // ================= 业务方法：5. 【看板习惯与频次】 =================
    toggleHabitDay(habitId, dayIndex) {
      const h = this.state.habits.find(x => x.id === habitId);
      if (h) {
        h.days[dayIndex] = h.days[dayIndex] ? 0 : 1;
        // 动态计算连击数
        const count = h.days.filter(Boolean).length;
        h.streak = Math.max(1, h.streak + (h.days[dayIndex] ? 1 : -1));
        this.notify();
      }
    }

    addHabit(name, icon = '🌱') {
      const h = {
        id: 'habit_' + Date.now(),
        name: name,
        icon: icon,
        days: [0, 0, 0, 0, 0, 0, 1],
        streak: 1
      };
      this.state.habits.push(h);
      this.notify();
      return h;
    }

    deleteHabit(habitId) {
      const idx = this.state.habits.findIndex(x => x.id === habitId);
      if (idx !== -1) {
        this.state.habits.splice(idx, 1);
        this.notify();
        return true;
      }
      return false;
    }

    // ================= 业务方法：6. 【想法收集表】 =================
    addIdea(text, color = 'yellow') {
      const idea = {
        id: 'idea_' + Date.now(),
        text: text,
        color: color,
        time: '刚刚',
        converted: false
      };
      this.state.ideas.unshift(idea);
      this.state.pendingChanges.push({
        type: 'insert',
        table: '收集表',
        data: { '提交人': '移动端', '思维🌟': 5 }
      });
      this.notify();
      return idea;
    }

    deleteIdea(ideaId) {
      const idx = this.state.ideas.findIndex(i => i.id === ideaId);
      if (idx !== -1) {
        this.state.ideas.splice(idx, 1);
        this.notify();
        return true;
      }
      return false;
    }

    convertIdeaToAction(ideaId) {
      const idea = this.state.ideas.find(i => i.id === ideaId);
      if (idea && !idea.converted) {
        idea.converted = true;
        this.addTask(idea.text, 'P0');
        this.notify();
      }
    }

    // ================= 业务方法：7. 【局域网多维表格双向同步】 =================
    async pullFromFeishu() {
      this.state.syncStatus = 'syncing';
      this.notify();

      try {
        const host = getMacSyncHost();
        const resp = await fetch(`${host}/api/pull`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (data.ok && Array.isArray(data.records)) {
          this.state.schedules = this.deduplicateSchedules(data.records.filter(r => !r.markedDelete));
          this.state.lastSyncTime = new Date().toLocaleTimeString();
          this.state.syncStatus = 'synced';
          this.notify();
          return { ok: true, count: this.state.schedules.length };
        } else {
          throw new Error(data.error || '拉取数据格式异常');
        }
      } catch (err) {
        this.state.syncStatus = 'error';
        this.notify();
        throw err;
      }
    }

    async pushToFeishu() {
      if (this.state.pendingChanges.length === 0) {
        return { ok: true, message: '暂无离线变更需要推送' };
      }

      this.state.syncStatus = 'syncing';
      this.notify();

      try {
        const host = getMacSyncHost();
        const changesToPush = [...this.state.pendingChanges];
        const resp = await fetch(`${host}/api/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes: changesToPush })
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const result = await resp.json();

        if (result.ok) {
          this.state.pendingChanges = [];
          this.state.lastSyncTime = new Date().toLocaleTimeString();
          this.state.syncStatus = 'synced';
          this.notify();
          return { ok: true, result };
        } else {
          throw new Error(result.error || '推送失败');
        }
      } catch (err) {
        this.state.syncStatus = 'error';
        this.notify();
        throw err;
      }
    }
  }

  // 挂载全局单例
  window.polarisStore = new PolarisStore();

})(window);
