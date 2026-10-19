const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { handleHealthRequest } = require('./health-service');
function getSyncModule() {
  try {
    const syncPath = require.resolve('./sync');
    delete require.cache[syncPath];
  } catch (e) {}
  return require('./sync');
}

const PORT = 8080;
const ASSETS_DIR = path.join(__dirname, 'assets');

function getLocalIP() {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('198.18')) {
          return net.address;
        }
      }
    }
  } catch (e) {}
  return '127.0.0.1';
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jsx': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.apk': 'application/vnd.android.package-archive',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

let cachedStatus = { ok: true, available: true, userName: '已授权用户' };
let lastCheckTime = 0;

function refreshStatusAsync() {
  const now = Date.now();
  if (now - lastCheckTime < 30000) return;
  lastCheckTime = now;
  getSyncModule().checkStatus().then((st) => {
    if (st && st.ok) cachedStatus = st;
  }).catch(() => {});
}
refreshStatusAsync();

const requestHandler = async (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const urlObj = new URL(req.url, `http://${host}`);
  const pathname = urlObj.pathname;

  // Health isolation: explicit-token API, does not touch existing schedule sync.
  if (await handleHealthRequest(req, res, pathname)) return;

  // 0. API: /api/log (诊断收集客户端日志与报错)
  if (pathname === '/api/log') {
    readBody(req).then(b => {
      try {
        fs.appendFileSync('/tmp/client_debug.log', new Date().toISOString() + ' ' + JSON.stringify(b) + '\n');
      } catch (e) {}
    }).catch(() => {});
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end('{"ok":true}');
  }

  // 1. API: /api/status (极速健康探针，毫秒级返回避免 AppKit 主线程卡死)
  if (pathname === '/api/status' && req.method === 'GET') {
    refreshStatusAsync();
    const localIp = getLocalIP();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({
      ...cachedStatus,
      localIP: localIp,
      port: PORT,
      icsUrl: `http://${localIp}:${PORT}/api/calendar.ics`
    }));
  }

  // 2. API: /api/pull
  if (pathname === '/api/pull' && (req.method === 'GET' || req.method === 'POST')) {
    try {
      const result = await getSyncModule().pullRecords(ASSETS_DIR);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  }

  // 3. API: /api/push
  if (pathname === '/api/push' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const changes = body.changes || [];
      const result = await getSyncModule().pushChanges(changes, ASSETS_DIR);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  }

  // 3.1 API: /api/save-architecture (持久化保存用户在网页端对 architecture.html 的文字与架构修改)
  if (pathname === '/api/save-architecture' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      if (body && body.html && typeof body.html === 'string' && body.html.length > 500) {
        const targetFile = path.join(__dirname, 'architecture.html');
        fs.writeFileSync(targetFile, body.html, 'utf8');
        // 同时同步至母体工作区（若存在且路径不同）
        const workspaceFile = '/Users/changbeifenggongzuoshi/Desktop/代码·归档/年度日历/architecture.html';
        if (targetFile !== workspaceFile && fs.existsSync(path.dirname(workspaceFile))) {
          try { fs.writeFileSync(workspaceFile, body.html, 'utf8'); } catch (e) {}
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ ok: true, size: body.html.length, timestamp: Date.now() }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ ok: false, error: '缺少有效的 html 内容' }));
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  }

  // 4. API: /api/events (快速获取全量日程数据)
  if (pathname === '/api/events' && req.method === 'GET') {
    try {
      const dataFile = path.join(ASSETS_DIR, 'board_data.js');
      if (fs.existsSync(dataFile)) {
        const raw = fs.readFileSync(dataFile, 'utf8');
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          const parsed = JSON.parse(raw.slice(start, end + 1));
          const clean = (parsed.records || []).filter((r) => !r.markedDelete);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify(clean));
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end('[]');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  }

  // 5. API: /api/open-app (激活并前置主程序窗口)
  if (pathname === '/api/open-app' && req.method === 'POST') {
    require('child_process').exec(`osascript -e 'tell application "年度看板" to activate'`, () => {});
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end('{"ok":true}');
  }

  // 6. API: /api/play-sound (播放系统音效与试听)
  if (pathname === '/api/play-sound' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const sound = (body.sound || 'Glass').replace(/[^a-zA-Z0-9_-]/g, '');
      const soundPath = `/System/Library/Sounds/${sound}.aiff`;
      if (fs.existsSync(soundPath)) {
        require('child_process').exec(`afplay "${soundPath}"`, () => {});
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end('{"ok":true}');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  }

  // 7. API: /api/notify (触发系统通知横幅 + 音效 + 可选 TTS 语音播报)
  if (pathname === '/api/notify' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const title = (body.title || '日程提醒').replace(/"/g, '\\"');
      const msg = (body.message || '').replace(/"/g, '\\"');
      const sound = (body.sound || 'Glass').replace(/[^a-zA-Z0-9_-]/g, '');
      const soundCmd = sound ? `sound name "${sound}"` : '';
      require('child_process').exec(`osascript -e 'display notification "${msg}" with title "${title}" ${soundCmd}'`, () => {});

      if (body.tts && body.message) {
        const speakText = (body.speakText || `注意：你的日程「${body.message}」已到时间，请开始执行`).replace(/"/g, '\\"');
        require('child_process').exec(`say -v Tingting "${speakText}"`, () => {});
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end('{"ok":true}');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  }

  // 8. API: /api/add-apple-reminder (联动 macOS 原生「提醒事项」)
  if (pathname === '/api/add-apple-reminder' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const title = (body.title || '日程提醒').replace(/"/g, '\\"');
      const notes = (body.notes || '').replace(/"/g, '\\"');
      const script = `tell application "Reminders"
        tell default list
          make new reminder with properties {name:"${title}", body:"${notes}"}
        end tell
      end tell`;
      require('child_process').exec(`osascript -e '${script}'`, (err) => {
        if (err) console.error('Apple Reminders sync error:', err);
      });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end('{"ok":true}');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  }

  // 9. API: /api/calendar.ics (RFC 5545 标准跨端日历订阅端点)
  if (pathname === '/api/calendar.ics' && req.method === 'GET') {
    try {
      const dataFile = path.join(ASSETS_DIR, 'board_data.js');
      let records = [];
      if (fs.existsSync(dataFile)) {
        const raw = fs.readFileSync(dataFile, 'utf8');
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          records = (JSON.parse(raw.slice(start, end + 1)).records || []).filter(r => !r.markedDelete);
        }
      }

      function formatICSDate(dStr, fallbackDate) {
        if (!dStr && fallbackDate) {
          const clean = fallbackDate.replace(/[^0-9]/g, '');
          return clean ? `${clean}T090000` : '20260101T090000';
        }
        const d = new Date(dStr || Date.now());
        if (isNaN(d.getTime())) return '20260101T090000';
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
      }

      function escapeICS(str) {
        if (!str) return '';
        return String(str).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
      }

      let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Polaris Board//Annual Calendar//CN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:年度看板日程',
        'X-WR-TIMEZONE:Asia/Shanghai',
        'X-PUBLISHED-TTL:PT15M',
        'REFRESH-INTERVAL;VALUE=DURATION:PT15M'
      ];

      records.forEach((r, idx) => {
        const uid = r.record_id || `rec-${idx}-${Date.now()}@polaris.board`;
        const summary = escapeICS(r.text || '无标题日程');
        const description = escapeICS(r.note || '');
        const dtstart = formatICSDate(r.startTime, r.date);
        const dtend = formatICSDate(r.endTime, r.date);
        ics.push('BEGIN:VEVENT');
        ics.push(`UID:${uid}`);
        ics.push(`DTSTAMP:${formatICSDate(new Date())}`);
        ics.push(`DTSTART:${dtstart}`);
        ics.push(`DTEND:${dtend}`);
        ics.push(`SUMMARY:${summary}`);
        if (description) ics.push(`DESCRIPTION:${description}`);
        if (r.category) ics.push(`CATEGORIES:${escapeICS(r.category)}`);
        ics.push('END:VEVENT');
      });

      ics.push('END:VCALENDAR');
      const icsBody = ics.join('\r\n');
      res.writeHead(200, {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="calendar.ics"',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      return res.end(icsBody);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Error generating ics: ' + err.message);
    }
  }

  // 10. 静态文件响应（增加基准路径越界校验）
  let safeRelPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  try {
    safeRelPath = decodeURIComponent(safeRelPath);
  } catch (e) {}
  const resolvedPath = path.resolve(__dirname, safeRelPath);
  if (!resolvedPath.startsWith(__dirname + path.sep) && resolvedPath !== path.join(__dirname, 'index.html')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Forbidden: Access Denied');
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.stat(resolvedPath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Error');
      }
      return;
    }

    if (stats.isDirectory()) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    const totalSize = stats.size;
    const baseHeaders = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
    };

    if (ext === '.apk') {
      baseHeaders['Content-Disposition'] = 'attachment; filename="year-calendar-k80.apk"';
    }

    // HEAD 请求仅返回响应头
    if (req.method === 'HEAD') {
      res.writeHead(200, {
        ...baseHeaders,
        'Content-Length': totalSize,
      });
      return res.end();
    }

    // HTTP Range 分片断点续传（移动端浏览器及多线程下载必备）
    const range = req.headers.range;
    if (range && ext === '.apk') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize || start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
        return res.end();
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(resolvedPath, { start, end });
      res.writeHead(206, {
        ...baseHeaders,
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Content-Length': chunksize,
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        ...baseHeaders,
        'Content-Length': totalSize,
        'Cache-Control': ext === '.apk' ? 'public, max-age=3600' : 'no-cache, no-store, must-revalidate',
      });
      fs.createReadStream(resolvedPath).pipe(res);
    }
  });
};

// 1. 主服务监听 8080 (支持 0.0.0.0 局域网各设备访问)
const server = http.createServer(requestHandler);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/ (LAN: http://${getLocalIP()}:${PORT}/)`);
});

// 2. 备用服务监听 8088 (满足用户通过 8088 访问/下载的需求，双端口全通)
const ALT_PORT = 8088;
const altServer = http.createServer(requestHandler);
altServer.on('error', (err) => {
  console.warn(`[Alt Port ${ALT_PORT}] Warning:`, err.message);
});
altServer.listen(ALT_PORT, '0.0.0.0', () => {
  console.log(`Alt server running at http://0.0.0.0:${ALT_PORT}/ (LAN: http://${getLocalIP()}:${ALT_PORT}/)`);
});
