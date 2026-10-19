/* Polaris Health · small native sheet, no demo/fake health readings. */
(function () {
  'use strict';
  if (window.PolarisHealth) return;
  var current = null;
  var panel = null;
  var statusNode = null;
  var values = null;
  function elt(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  function message(text, error) {
    if (!statusNode) return;
    statusNode.textContent = text;
    statusNode.style.color = error ? '#ad544b' : '#506d54';
  }
  function display(data) {
    if (!values) return;
    values.querySelector('[data-key="steps"]').textContent = data.steps == null ? '—' : Number(data.steps).toLocaleString();
    values.querySelector('[data-key="avg_hr"]').textContent = data.avg_hr == null ? '—' : String(data.avg_hr);
    values.querySelector('[data-key="sleep_minutes"]').textContent = data.sleep_minutes == null ? '—' : (data.sleep_minutes / 60).toFixed(1);
    values.querySelector('[data-key="date"]').textContent = data.date || '未读取';
  }
  window.PolarisHealth = {
    onNativeResult: function (result) {
      if (!result || !result.ok) { message((result && result.message) || '读取失败', true); return; }
      current = result;
      display(current);
      message('已读取真实健康样本；无数据的字段显示 —');
    },
    onUploadResult: function (result) {
      message((result && result.message) || '同步结果未知', !result || !result.ok);
    }
  };
  function boot() {
    var style = elt('style');
    style.textContent = `
      .ph-launch {position:fixed;right:18px;bottom:104px;z-index:99990;width:46px;height:46px;border-radius:50%;border:1px solid #b8cdb9;background:#edf4ed;color:#355b3b;box-shadow:0 8px 24px #294c3633;font-size:21px;touch-action:manipulation}
      .ph-shadow {position:fixed;inset:0;background:#14221774;z-index:99991;display:none}
      .ph-shadow.open {display:block}
      .ph-panel {position:absolute;left:0;right:0;bottom:0;background:#f3f5ee;border-radius:30px 30px 0 0;padding:20px 20px max(30px,env(safe-area-inset-bottom));max-height:87vh;overflow-y:auto;color:#243628;box-shadow:0 -10px 50px #0002;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}
      .ph-head {display:flex;justify-content:space-between;align-items:center;gap:16px}
      .ph-eyebrow {font-size:11px;letter-spacing:2px;color:#78957d}
      .ph-title {font-size:27px;line-height:1.2;font-weight:650;margin:6px 0 16px}
      .ph-close {border:0;background:#e4ece3;border-radius:50%;height:38px;width:38px;font-size:23px;color:#42604a}
      .ph-metrics {background:#fff;border:1px solid #dce7dd;padding:16px;border-radius:22px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .ph-metric {font-size:29px;font-weight:650;letter-spacing:-1px}.ph-label {display:block;font-size:12px;color:#718374;font-weight:500;letter-spacing:0;margin-top:2px}
      .ph-row {display:flex;gap:9px;margin-top:14px}.ph-btn {flex:1;padding:13px 8px;border:0;border-radius:15px;background:#a1bca3;color:#1d3b24;font-size:14px;font-weight:700}
      .ph-btn.secondary {background:#e0ebe1;color:#38543e}
      .ph-field {display:block;font-size:12px;color:#536a59;margin-top:14px}
      .ph-input {display:block;width:100%;box-sizing:border-box;margin-top:5px;border:1px solid #c7d8c8;border-radius:12px;padding:11px 12px;background:#fff;color:#293b2f;font:inherit;font-size:13px;user-select:text}
      .ph-state {font-size:12px;line-height:1.6;color:#536d58;margin-top:12px;min-height:24px}
      .ph-small {font-size:11px;color:#758a79;line-height:1.7;margin-top:12px}
    `;
    document.head.appendChild(style);
    var button = elt('button', 'ph-launch', '♡');
    button.type = 'button';
    button.setAttribute('aria-label', '打开健康数据');
    var overlay = elt('div', 'ph-shadow');
    var sheet = elt('section', 'ph-panel');
    sheet.setAttribute('aria-label', 'Polaris 健康记录');
    sheet.innerHTML = '<div class="ph-head"><div><div class="ph-eyebrow">POLARIS · VITALITY</div><div class="ph-title">身体有迹可循</div></div><button class="ph-close" aria-label="关闭健康面板">×</button></div>'
      + '<div class="ph-metrics"><div><div class="ph-metric" data-key="steps">—</div><span class="ph-label">步数 / 昨日</span></div>'
      + '<div><div class="ph-metric" data-key="avg_hr">—</div><span class="ph-label">平均心率 / bpm</span></div>'
      + '<div><div class="ph-metric" data-key="sleep_minutes">—</div><span class="ph-label">睡眠 / h（待接入）</span></div>'
      + '<div><div class="ph-metric" data-key="date">未读取</div><span class="ph-label">数据日期</span></div></div>'
      + '<div class="ph-row"><button class="ph-btn secondary" data-act="grant">授权</button><button class="ph-btn" data-act="read">读取昨日</button></div>'
      + '<label class="ph-field">Mac 健康接口地址<input class="ph-input" data-field="endpoint" placeholder="http://192.168.1.x:8080/api/health/daily" /></label>'
      + '<label class="ph-field">同步令牌（仅保存到当前 App 会话）<input class="ph-input" data-field="token" type="password" autocomplete="off" placeholder="Mac 环境变量 POLARIS_HEALTH_INGEST_TOKEN" /></label>'
      + '<div class="ph-row"><button class="ph-btn" data-act="upload">同步到飞书</button></div>'
      + '<div class="ph-state" role="status" aria-live="polite">等待连接 Health Connect</div>'
      + '<p class="ph-small">小米手环 11 NFC → 小米运动健康 → Health Connect → Mac 中转 → 飞书。<br>只读取经过授权的健康类型。请先确认小米运动健康已经向 Health Connect 写入数据；不要在公共 Wi-Fi 上传健康资料。</p>';
    overlay.appendChild(sheet);
    document.body.appendChild(button);
    document.body.appendChild(overlay);
    panel = overlay;
    statusNode = sheet.querySelector('.ph-state');
    values = sheet.querySelector('.ph-metrics');
    var endpointInput = sheet.querySelector('[data-field="endpoint"]');
    var tokenInput = sheet.querySelector('[data-field="token"]');
    endpointInput.value = localStorage.getItem('polaris_health_endpoint') || '';
    endpointInput.addEventListener('change', function () {
      localStorage.setItem('polaris_health_endpoint', endpointInput.value.trim());
    });
    button.addEventListener('click', function () { panel.classList.add('open'); });
    sheet.querySelector('.ph-close').addEventListener('click', function () { panel.classList.remove('open'); });
    overlay.addEventListener('click', function (event) { if (event.target === overlay) overlay.classList.remove('open'); });
    sheet.querySelector('[data-act="grant"]').addEventListener('click', function () {
      if (!window.PolarisNativeHealth) return message('请在正式 Android APK 中使用（浏览器预览不能读取健康数据）', true);
      window.PolarisNativeHealth.requestPermissions();
      message('请在系统弹窗中授权步数和心率');
    });
    sheet.querySelector('[data-act="read"]').addEventListener('click', function () {
      if (!window.PolarisNativeHealth) return message('请在正式 Android APK 中读取', true);
      message('正在读取 Health Connect…');
      window.PolarisNativeHealth.readYesterday();
    });
    sheet.querySelector('[data-act="upload"]').addEventListener('click', function () {
      if (!current) return message('请先读取真实健康数据', true);
      if (!window.PolarisNativeHealth) return message('请在正式 Android APK 中上传', true);
      var endpoint = endpointInput.value.trim(), token = tokenInput.value;
      if (!endpoint || !token) return message('请填写 Mac 健康接口和同步令牌', true);
      var payload = {date: current.date};
      ['steps','avg_hr','sleep_minutes','active_kcal','resting_hr'].forEach(function (key) {
        if (current[key] != null) payload[key] = current[key];
      });
      message('正在向 Mac 发送数据…');
      window.PolarisNativeHealth.uploadDaily(JSON.stringify(payload), endpoint, token);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
