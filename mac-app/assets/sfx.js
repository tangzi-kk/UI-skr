/* ============================================================
   年度一天总结无限画板 — 界面音效（水滴 / 气泡「啵啵」+ 木板敲击）
   全部由 WebAudio 现场合成，无音频文件：
   水滴：正弦振荡器 + 快速音高滑动 + 指数衰减，叠高八度泛音；
   敲击：带通噪声瞬态 + 低中频正弦快衰减的木质共鸣体；
   每次播放带随机音高抖动。
   浏览器自动播放策略要求首次用户手势后才解锁，
   因此在首个 pointerdown 时创建 AudioContext。
   ============================================================ */

(function () {
  var VOLUME = 0.42; // 总线音量，保持轻、不刺耳
  var TONE_HZ = 5200; // 总线滤波：保留清脆高频质感，同时滤除极高频刺耳噪音

  var ctx = null;
  var master = null;
  var enabled = true;

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = VOLUME;
      var tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = TONE_HZ;
      tone.Q.value = 0.4;
      master.connect(tone);
      tone.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  /* 单颗水滴：f0 → f1 音高滑动，dur 内指数衰减；
     泛音为高八度、音量 18%，drop 的「圆」来自这里 */
  function drop(dest, t, o) {
    var jit = 1 + (Math.random() - 0.5) * 0.08; // 有机感：每次略有不同
    var f0 = o.f0 * jit;
    var f1 = o.f1 * jit;

    var osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + o.slide);

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain, t + 0.012); // 起音放缓，不发硬
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);

    var osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(f0 * 2, t);
    osc2.frequency.exponentialRampToValueAtTime(Math.max(f1 * 2, 1), t + o.slide);

    var g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(o.gain * 0.08, t + 0.012); // 泛音减半，防尖锐
    g2.gain.exponentialRampToValueAtTime(0.0001, t + o.dur * 0.7);

    osc.connect(g);
    g.connect(dest);
    osc2.connect(g2);
    g2.connect(dest);
    osc.start(t);
    osc.stop(t + o.dur + 0.02);
    osc2.start(t);
    osc2.stop(t + o.dur + 0.02);
  }

  /* 噪声缓冲（敲击瞬态用），懒创建复用 */
  var noiseBuf = null;
  function getNoise() {
    if (!noiseBuf) {
      var len = Math.floor(ctx.sampleRate * 0.08);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  /* 木板敲击：带通噪声做「嗒」的瞬态，低中频正弦快衰减做木质共鸣体 */
  function knock(dest, t, o) {
    var jit = 1 + (Math.random() - 0.5) * 0.06;

    var n = ctx.createBufferSource();
    n.buffer = getNoise();
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 950 * jit; // 瞬态降频：木头味，不脆刺
    bp.Q.value = 4;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(o.gain * 0.7, t + 0.004);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(bp);
    bp.connect(ng);
    ng.connect(dest);
    n.start(t);
    n.stop(t + 0.06);

    var osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520 * jit, t);
    osc.frequency.exponentialRampToValueAtTime(400 * jit, t + 0.04);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain * 0.9, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  /* 饼干脆断 / 嘎嘣脆机械吸附卡片音效：
     两道极快的高频微破裂瞬态（4600Hz / 3400Hz，衰减仅 6~12ms）+ 微下冲脆裂脉冲，
     形成干脆、解压、物理质感强烈的「嘎嘣脆」咔哒断开声 */
  function crack(dest, t, o) {
    var jit = 1 + (Math.random() - 0.5) * 0.08;
    var gain = (o && o.gain) || 0.65;

    // 1. 第一道微断裂脆响 (~4600Hz 尖锐微脉冲，仅 10ms)
    var n1 = ctx.createBufferSource();
    n1.buffer = getNoise();
    var bp1 = ctx.createBiquadFilter();
    bp1.type = "bandpass";
    bp1.frequency.value = 4600 * jit;
    bp1.Q.value = 5.0;
    var g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.0001, t);
    g1.gain.exponentialRampToValueAtTime(gain * 0.95, t + 0.002);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    n1.connect(bp1);
    bp1.connect(g1);
    g1.connect(dest);
    n1.start(t);
    n1.stop(t + 0.015);

    // 瞬态下行硬质脉冲
    var osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(2400 * jit, t);
    osc1.frequency.exponentialRampToValueAtTime(750 * jit, t + 0.014);
    var og1 = ctx.createGain();
    og1.gain.setValueAtTime(0.0001, t);
    og1.gain.exponentialRampToValueAtTime(gain * 0.75, t + 0.002);
    og1.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
    osc1.connect(og1);
    og1.connect(dest);
    osc1.start(t);
    osc1.stop(t + 0.022);

    // 2. 延迟 13ms 的第二道脆断回响 (两瓣掰断的清脆回响与微木质共鸣)
    var t2 = t + 0.013;
    var n2 = ctx.createBufferSource();
    n2.buffer = getNoise();
    var bp2 = ctx.createBiquadFilter();
    bp2.type = "bandpass";
    bp2.frequency.value = 3200 * jit;
    bp2.Q.value = 4.2;
    var g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t2);
    g2.gain.exponentialRampToValueAtTime(gain * 0.68, t2 + 0.002);
    g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.015);
    n2.connect(bp2);
    bp2.connect(g2);
    g2.connect(dest);
    n2.start(t2);
    n2.stop(t2 + 0.02);

    var osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(620 * jit, t2);
    osc2.frequency.exponentialRampToValueAtTime(280 * jit, t2 + 0.028);
    var og2 = ctx.createGain();
    og2.gain.setValueAtTime(0.0001, t2);
    og2.gain.exponentialRampToValueAtTime(gain * 0.45, t2 + 0.003);
    og2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.032);
    osc2.connect(og2);
    og2.connect(dest);
    osc2.start(t2);
    osc2.stop(t2 + 0.038);
  }

  /* 动作音效谱 */
  var RECIPES = {
    // 普通按钮：短促一颗小气泡，上扬
    click: function (t) {
      drop(master, t, { f0: 340, f1: 600, slide: 0.05, dur: 0.11, gain: 0.5 });
    },
    // 风格面板开关/选项：更轻的一点水声
    toggle: function (t) {
      drop(master, t, { f0: 520, f1: 840, slide: 0.04, dur: 0.09, gain: 0.32 });
    },
    // 弹窗浮现：两颗气泡接连升起
    open: function (t) {
      drop(master, t, { f0: 250, f1: 460, slide: 0.09, dur: 0.17, gain: 0.48 });
      drop(master, t + 0.07, { f0: 360, f1: 700, slide: 0.09, dur: 0.19, gain: 0.42 });
    },
    // 弹窗缩回：一颗水滴落下 + 尾音回落
    close: function (t) {
      drop(master, t, { f0: 540, f1: 210, slide: 0.12, dur: 0.18, gain: 0.42 });
      drop(master, t + 0.06, { f0: 320, f1: 170, slide: 0.08, dur: 0.13, gain: 0.26 });
    },
    // 保存：双泡上行，纯五度的愉悦确认
    save: function (t) {
      drop(master, t, { f0: 440, f1: 720, slide: 0.06, dur: 0.14, gain: 0.46 });
      drop(master, t + 0.09, { f0: 550, f1: 920, slide: 0.06, dur: 0.17, gain: 0.46 });
    },
    // 删除：低频单泡「咕」一声沉下去
    back: function (t) {
      drop(master, t, { f0: 260, f1: 150, slide: 0.11, dur: 0.18, gain: 0.46 });
    },
    // 木板敲击：胶囊元素与取消键的「嗒」
    knock: function (t) {
      knock(master, t, { gain: 0.5 });
    },
    // 嘎嘣脆 / 饼干掰碎：触控板翻页、卡片机械吸附瞬间
    snap: function (t) {
      crack(master, t, { gain: 0.68 });
    },
    crack: function (t) {
      crack(master, t, { gain: 0.68 });
    },
    // 预热风铃提醒：明朗三和弦上扬
    chime: function (t) {
      drop(master, t, { f0: 523, f1: 659, slide: 0.08, dur: 0.22, gain: 0.45 });
      drop(master, t + 0.08, { f0: 659, f1: 784, slide: 0.08, dur: 0.22, gain: 0.45 });
      drop(master, t + 0.16, { f0: 784, f1: 1046, slide: 0.08, dur: 0.35, gain: 0.48 });
    },
    // 到点强提醒警鸣：急促双音警示脉冲
    alarm: function (t) {
      for (var i = 0; i < 3; i++) {
        var st = t + i * 0.18;
        drop(master, st, { f0: 880, f1: 1760, slide: 0.04, dur: 0.12, gain: 0.65 });
        drop(master, st + 0.07, { f0: 1760, f1: 1320, slide: 0.04, dur: 0.12, gain: 0.65 });
      }
    },
  };

  function play(name) {
    if (!enabled) return;
    if (!ensure()) return;
    var fn = RECIPES[name];
    if (!fn) return;
    fn(ctx.currentTime + 0.01);
  }

  // 跨端系统级音效与通知调用（优先走 macOS 原生后端，断网/离线时走 WebAudio 兜底）
  function playSystemSound(soundName) {
    var s = soundName || "Glass";
    if (s === "Alarm" || s === "Chime") {
      play(s.toLowerCase());
      return;
    }
    fetch("/api/play-sound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sound: s }),
    }).catch(function () {
      play("chime");
    });
  }

  function notify(opts) {
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts || {}),
    }).catch(function () {});
  }

  function addAppleReminder(opts) {
    return fetch("/api/add-apple-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts || {}),
    }).then(function(r){ return r.json(); }).catch(function () { return { ok: false }; });
  }

  window.SFX = {
    play: play,
    playSystemSound: playSystemSound,
    notify: notify,
    addAppleReminder: addAppleReminder,
    unlock: ensure,
    setEnabled: function (v) {
      enabled = !!v;
    },
  };

  /* 全局按钮音：事件委托，业务代码零侵入。
     弹窗内的动作按钮（保存/删除/关闭/取消）由 dialog 自行配音，这里跳过。 */
  window.addEventListener(
    "pointerdown",
    function (e) {
      ensure(); // 借首次手势解锁音频
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest(".sfx-knock")) {
        play("knock"); // 胶囊形元素：板块/状态胶囊、信息卡 tab 等
        return;
      }
      if (t.closest(".dlg-btn, .dlg-close")) return;
      var btn = t.closest("button, select.twk-field");
      if (!btn) return;
      if (btn.closest(".twk-panel")) play("toggle");
      else play("click");
    },
    true
  );
})();
