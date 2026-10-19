/* ============================================================
   年度一天总结无限画板 — 编辑弹窗
   ============================================================ */

var {
  useRef,
  useEffect,
  useState
} = React;
function parseDate(ds) {
  const [y, m, d] = ds.split("-").map(Number);
  return {
    y,
    m,
    d
  };
}
function EditDialog({
  date,
  rec,
  cats,
  onSave,
  onDelete,
  onClose,
  origin
}) {
  const isExisting = !!rec;
  const {
    m,
    d
  } = parseDate(date);
  const wdName = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][new Date(date + "T00:00:00").getDay()];
  const [text, setText] = useState(rec ? rec.text : "");
  const [category, setCategory] = useState(rec ? rec.category : "生活");
  const [status, setStatus] = useState(rec ? rec.status === "完成" ? "完成" : "" : "完成");
  const [note, setNote] = useState(rec && rec.note ? rec.note : "");
  const [confirmDel, setConfirmDel] = useState(false);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const taRef = useRef(null);

  /* iOS 式关闭：先播缩回动画，再真正卸载 */
  const requestClose = sound => {
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
    "--dy": (oy - vh / 2).toFixed(1) + "px"
  };
  useEffect(() => {
    if (taRef.current) taRef.current.focus();
    const onKey = e => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const save = () => {
    const t = text.trim();
    if (!t) return;
    onSave(date, {
      text: t,
      category: category,
      status: status,
      note: note.trim()
    });
    if (window.SFX) window.SFX.play("save");
    requestClose();
  };
  const onTaKeyDown = e => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "dlg-backdrop" + (closing ? " closing" : ""),
    onClick: requestClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "dlg" + (closing ? " closing" : ""),
    style: dlgAnimStyle,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "编辑 " + m + " 月 " + d + " 日的一天总结",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "dlg-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "dlg-date"
  }, m, " \u6708 ", d, " \u65E5 \xB7 ", wdName), /*#__PURE__*/React.createElement("div", {
    className: "dlg-sub"
  }, isExisting ? "编辑这一天的一天总结" : "新增这一天的一天总结")), rec && rec._local ? /*#__PURE__*/React.createElement("span", {
    className: "dlg-local"
  }, "\u672C\u5730\u7F16\u8F91") : null, /*#__PURE__*/React.createElement("button", {
    className: "dlg-close",
    onClick: requestClose,
    "aria-label": "\u5173\u95ED"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  })))), /*#__PURE__*/React.createElement("label", {
    className: "dlg-label"
  }, "\u5185\u5BB9"), /*#__PURE__*/React.createElement("textarea", {
    ref: taRef,
    className: "dlg-textarea",
    rows: "3",
    value: text,
    placeholder: "\u8FD9\u4E00\u5929\u505A\u4E86\u4EC0\u4E48\u2026",
    onChange: e => setText(e.target.value),
    onKeyDown: onTaKeyDown
  }), /*#__PURE__*/React.createElement("label", {
    className: "dlg-label"
  }, "\u677F\u5757"), /*#__PURE__*/React.createElement("div", {
    className: "dlg-cats"
  }, Object.keys(cats).map(c => {
    const st = cats[c];
    const sel = category === c;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: c,
      className: "cat-opt sfx-knock" + (sel ? " sel" : ""),
      style: sel ? {
        background: "var(--" + st.cls + "-solid)",
        borderColor: "var(--" + st.cls + "-solid)",
        color: "var(--chip-ink)"
      } : {
        background: "var(--" + st.cls + "-tint)",
        borderColor: "var(--" + st.cls + "-tint)",
        color: "var(--" + st.cls + "-solid)"
      },
      onClick: () => setCategory(c)
    }, c);
  })), /*#__PURE__*/React.createElement("label", {
    className: "dlg-label"
  }, "\u5B8C\u6210\u72B6\u6001"), /*#__PURE__*/React.createElement("div", {
    className: "dlg-status"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "st-opt sfx-knock" + (status === "完成" ? " sel" : ""),
    onClick: () => setStatus("完成")
  }, "\u5DF2\u5B8C\u6210"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "st-opt sfx-knock" + (status === "" ? " sel" : ""),
    onClick: () => setStatus("")
  }, "\u672A\u5B8C\u6210")), /*#__PURE__*/React.createElement("label", {
    className: "dlg-label"
  }, "\u5907\u6CE8"), /*#__PURE__*/React.createElement("input", {
    className: "dlg-input",
    type: "text",
    value: note,
    placeholder: "\u8865\u5145\u5907\u6CE8\uFF08\u53EF\u7559\u7A7A\uFF09\xB7 \u56DE\u8F66\u4FDD\u5B58",
    onChange: e => setNote(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") {
        e.preventDefault();
        save();
      }
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "dlg-foot"
  }, isExisting ? confirmDel ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dlg-btn danger confirm",
    onClick: () => {
      if (window.SFX) window.SFX.play("back");
      onDelete(date);
      requestClose();
    }
  }, "\u786E\u8BA4\u5220\u9664") : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dlg-btn danger",
    onClick: () => setConfirmDel(true)
  }, "\u5220\u9664") : /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("div", {
    className: "dlg-foot-right"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dlg-btn",
    onClick: () => requestClose("knock")
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "dlg-btn primary",
    disabled: !text.trim(),
    onClick: save
  }, "\u4FDD\u5B58")))));
}
Object.assign(window, {
  EditDialog
});