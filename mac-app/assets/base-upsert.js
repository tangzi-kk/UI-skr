/* ============================================================
   年度画板 — Base 写回包构建器（北极星 Base「00 🗓日程」表）
   口径来源：《编辑直写 Base 事实源与并发冲突口径方案》+ 实测结构约定
   - 定位键：日期 + 日程类型（「一天总结」每日至多一条）
   - 命中 → 只 update 改动字段；未命中 → create；删除 → 标记删除=true（软删）
   - 静态页无法直连 Base（凭证与跨域限制），本模块只生成符合规范的
     写回包 JSON，交由同步管道/人工在 Base 侧重放。
   ============================================================ */

(function () {
  var BASE_TOKEN = "SQbpb4osNaAkY7s8UVdcupkYnqe";
  var TABLE_ID = "tblC5R0w900sav9H";
  var TABLE_NAME = "00 🗓日程";
  var REC_TYPE = "一天总结";

  var FIELD_IDS = {
    日期: "fld2XW0lT3",
    开始时间: "flddCMDaNq",
    结束时间: "fldGlL6Y20",
    日程类型: "fldJsSkUgC",
    日程标题: "fldeVFa1m9",
    板块: "fldogzvCGi",
    完成状态: "fldAT1VKEy",
    备注: "fldiupVrjP",
    标记删除: "fld8KZ5xHC",
    计入时间记录: "fld6rhaYdA",
  };

  /* 同步管道专属字段：写回一律不触碰（重放方亦应遵守） */
  var DO_NOT_TOUCH = [
    "谷歌事件 ID", "同步状态", "同步错误", "Notion 哈希", "谷歌哈希",
    "内容哈希", "飞书事件 ID", "外部来源", "Notion 页 ID", "重复规则",
    "外部事件 ID", "关联时间记录", "关联打卡", "关联任务", "月份",
  ];

  function baseByDate() {
    var map = {};
    var recs = (window.BOARD_DATA && window.BOARD_DATA.records) || [];
    recs.forEach(function (r) {
      if (r && r.type === REC_TYPE && r.date) {
        map[r.date] = r;
      }
    });
    return map;
  }

  function dtOf(ds) {
    return ds + "T00:00:00.000+08:00";
  }

  function keyOf(ds) {
    return { 日期: dtOf(ds), 日程类型: [REC_TYPE] };
  }

  /* 覆盖层字段 → Base 字段（select 数组写法、checkbox 布尔、datetime 带时区） */
  function translate(entry, fields) {
    if ("text" in entry) fields["日程标题"] = entry.text;
    if ("category" in entry && entry.category) {
      var cat = entry.category === "睡觉" ? "睡眠" : entry.category;
      fields["板块"] = [cat];
    }
    if ("status" in entry) fields["完成状态"] = [entry.status === "完成" ? "完成" : "未完成"];
    if ("note" in entry) fields["备注"] = entry.note;
    if ("trackTime" in entry) fields["计入时间记录"] = !!entry.trackTime;
    return fields;
  }

  /* edits：当前年份的字段级覆盖层（{date: {改动字段…} 或 {deleted:true}}）
     返回 { counts, changes, payload }；无任何改动时 changes 为空数组 */
  window.buildUpsertPayload = function (edits, year) {
    var base = baseByDate();
    var counts = { create: 0, update: 0, soft_delete: 0 };
    var changes = [];

    Object.keys(edits)
      .sort()
      .forEach(function (ds) {
        if (ds.slice(0, 4) !== String(year)) return;
        var e = edits[ds];
        var rec = base[ds];

        if (e && e.deleted) {
          if (!rec) return; // 本地新增又删除＝对 Base 无操作
          changes.push({
            op: "delete",
            record_id: rec.record_id,
            key: keyOf(ds),
            fields: { 标记删除: true },
          });
          counts.soft_delete += 1;
          return;
        }

        if (rec) {
          var upd = translate(e, {});
          if (!Object.keys(upd).length) return; // 与 Base 一致，无需写回
          changes.push({ op: "update", record_id: rec.record_id, key: keyOf(ds), fields: upd });
          counts.update += 1;
        } else {
          var cre = translate(e, {
            日期: dtOf(ds),
            开始时间: ds + "T00:00:00.000+08:00",
            结束时间: ds + "T23:59:00.000+08:00",
            日程类型: [REC_TYPE],
          });
          changes.push({ op: "create", key: keyOf(ds), fields: cre });
          counts.create += 1;
        }
      });

    return {
      counts: counts,
      changes: changes,
      payload: {
        app: "年度画板 · 编辑写回包",
        version: 1,
        generated_at: new Date().toISOString(),
        year: Number(year),
        base: { base_token: BASE_TOKEN, table_id: TABLE_ID, table_name: TABLE_NAME },
        upsert_key: ["日期", "日程类型"],
        field_ids: FIELD_IDS,
        do_not_touch: DO_NOT_TOUCH,
        discipline:
          "按记录定向 upsert：定位键命中→仅 update fields 内列出的字段；未命中→create；软删写 标记删除=true，禁止物理删与整表重建。写前重读目标记录做字段级合并（LWW：同字段后写覆盖）。",
        counts: counts,
        changes: changes,
      },
    };
  };
})();
