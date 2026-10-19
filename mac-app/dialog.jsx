/* ============================================================
   年度一天总结无限画板 — 编辑弹窗
   ============================================================ */

var { useRef, useEffect, useState } = React;

function parseDate(ds) {
  const [y, m, d] = ds.split("-").map(Number);
  return { y, m, d };
}

function EditDialog({ date, rec, cats, onSave, onDelete, onClose, origin }) {
  const isExisting = !!rec;
  const { m, d } = parseDate(date);
  const wdName = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
    new Date(date + "T00:00:00").getDay()
  ];

  const [text, setText] = useState(rec ? rec.text : "");
  const [category, setCategory] = useState(rec ? rec.category : "生活");
  const [status, setStatus] = useState(rec ? (rec.status === "完成" ? "完成" : "") : "完成");
  const [note, setNote] = useState(rec && rec.note ? rec.note : "");
  const [confirmDel, setConfirmDel] = useState(false);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const taRef = useRef(null);

  /* iOS 式关闭：先播缩回动画，再真正卸载 */
  const requestClose = (sound) => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (window.SFX) window.SFX.play(typeof sound === "string" ? sound : "close");
    setClosing(true);
    setTimeout(onClose, 190);
  };

  /* 打开音效（仅挂载时一次） */
  useEffect(() => {
    if (window.SFX) window.SFX.play("open");
  }, []);

  /* 触发格中心相对屏幕中心的偏移，作为缩放起点 */
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ox = origin && typeof origin.x === "number" ? origin.x : vw / 2;
  const oy = origin && typeof origin.y === "number" ? origin.y : vh / 2;
  const dlgAnimStyle = {
    "--dx": (ox - vw / 2).toFixed(1) + "px",
    "--dy": (oy - vh / 2).toFixed(1) + "px",
  };

  useEffect(() => {
    if (taRef.current) taRef.current.focus();
    const onKey = (e) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    const t = text.trim();
    if (!t) return;
    onSave(date, { text: t, category: category, status: status, note: note.trim() });
    if (window.SFX) window.SFX.play("save");
    requestClose();
  };

  const onTaKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
  };

  return (
    <div className={"dlg-backdrop" + (closing ? " closing" : "")} onClick={requestClose}>
      <div
        className={"dlg" + (closing ? " closing" : "")}
        style={dlgAnimStyle}
        role="dialog"
        aria-modal="true"
        aria-label={"编辑 " + m + " 月 " + d + " 日的一天总结"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dlg-head">
          <div>
            <div className="dlg-date">
              {m} 月 {d} 日 · {wdName}
            </div>
            <div className="dlg-sub">
              {isExisting ? "编辑这一天的一天总结" : "新增这一天的一天总结"}
            </div>
          </div>
          {rec && rec._local ? <span className="dlg-local">本地编辑</span> : null}
          <button className="dlg-close" onClick={requestClose} aria-label="关闭">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18"></line>
              <line x1="18" y1="6" x2="6" y2="18"></line>
            </svg>
          </button>
        </div>

        <label className="dlg-label">内容</label>
        <textarea
          ref={taRef}
          className="dlg-textarea"
          rows="3"
          value={text}
          placeholder="这一天做了什么…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onTaKeyDown}
        ></textarea>

        <label className="dlg-label">板块</label>
        <div className="dlg-cats">
          {Object.keys(cats).map((c) => {
            const st = cats[c];
            const sel = category === c;
            return (
              <button
                type="button"
                key={c}
                className={"cat-opt sfx-knock" + (sel ? " sel" : "")}
                style={
                  sel
                    ? { background: "var(--" + st.cls + "-solid)", borderColor: "var(--" + st.cls + "-solid)", color: "var(--chip-ink)" }
                    : { background: "var(--" + st.cls + "-tint)", borderColor: "var(--" + st.cls + "-tint)", color: "var(--" + st.cls + "-solid)" }
                }
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            );
          })}
        </div>

        <label className="dlg-label">完成状态</label>
        <div className="dlg-status">
          <button
            type="button"
            className={"st-opt sfx-knock" + (status === "完成" ? " sel" : "")}
            onClick={() => setStatus("完成")}
          >
            已完成
          </button>
          <button
            type="button"
            className={"st-opt sfx-knock" + (status === "" ? " sel" : "")}
            onClick={() => setStatus("")}
          >
            未完成
          </button>
        </div>

        <label className="dlg-label">备注</label>
        <input
          className="dlg-input"
          type="text"
          value={note}
          placeholder="补充备注（可留空）· 回车保存"
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
        />

        <div className="dlg-foot">
          {isExisting ? (
            confirmDel ? (
              <button type="button" className="dlg-btn danger confirm" onClick={() => { if (window.SFX) window.SFX.play("back"); onDelete(date); requestClose(); }}>
                确认删除
              </button>
            ) : (
              <button type="button" className="dlg-btn danger" onClick={() => setConfirmDel(true)}>
                删除
              </button>
            )
          ) : (
            <span></span>
          )}
          <div className="dlg-foot-right">
            <button type="button" className="dlg-btn" onClick={() => requestClose("knock")}>
              取消
            </button>
            <button type="button" className="dlg-btn primary" disabled={!text.trim()} onClick={save}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EditDialog });
