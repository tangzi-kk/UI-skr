'use strict';
// Polaris / 小米手环 11 NFC: authenticated LAN health ingestion + Feishu webhook relay.
// No credentials or private health samples are stored in GitHub.
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const DATA_DIR = process.env.POLARIS_HEALTH_DATA_DIR || path.join(os.homedir(), '.polaris-health');
const DATA_FILE = path.join(DATA_DIR, 'daily.json');
const KEYS = ['steps', 'active_kcal', 'avg_hr', 'resting_hr', 'sleep_minutes', 'deep_sleep', 'rem_sleep', 'spo2', 'energy_level', 'mood'];
const RANGES = { steps: [0, 200000], active_kcal: [0, 20000], avg_hr: [25, 240], resting_hr: [25, 240],
  sleep_minutes: [0, 1440], deep_sleep: [0, 1440], rem_sleep: [0, 1440], spo2: [0, 100], energy_level: [1, 5], mood: [1, 5] };

function validateDaily(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('数据必须为 JSON 对象');
  const date = String(input.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) {
    throw new Error('日期必须是有效的 YYYY-MM-DD');
  }
  const record = { record_key: date + '_xiaomi_band_11_nfc', date, source: 'health_connect' };
  for (const key of KEYS) {
    if (input[key] === null || input[key] === undefined) continue; // Missing != zero
    const value = input[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < RANGES[key][0] || value > RANGES[key][1]) {
      throw new Error('无效健康字段: ' + key);
    }
    if (['steps', 'sleep_minutes', 'deep_sleep', 'rem_sleep', 'energy_level', 'mood'].includes(key) && !Number.isInteger(value)) {
      throw new Error('健康字段需要整数: ' + key);
    }
    record[key] = value;
  }
  if (!KEYS.some(k => Object.prototype.hasOwnProperty.call(record, k))) throw new Error('没有有效的健康数据');
  return record;
}

function authorized(req) {
  const token = process.env.POLARIS_HEALTH_INGEST_TOKEN || '';
  const supplied = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(token), b = Buffer.from(supplied);
  return !!token && a.length === b.length && crypto.timingSafeEqual(a, b);
}
function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(value));
}
async function bodyJSON(req) {
  let content = '', size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16 * 1024) throw new Error('请求内容超过 16KB');
    content += chunk.toString('utf8');
  }
  try { return JSON.parse(content); } catch { throw new Error('请求不是有效的 JSON'); }
}
async function loadDaily() {
  try {
    const text = await fs.readFile(DATA_FILE, 'utf8');
    const value = JSON.parse(text);
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}
async function saveDaily(records) {
  await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
  const temp = DATA_FILE + '.' + process.pid + '.tmp';
  try {
    await fs.writeFile(temp, JSON.stringify(records, null, 2), { encoding: 'utf8', mode: 0o600 });
    await fs.rename(temp, DATA_FILE);
  } finally { await fs.rm(temp, { force: true }).catch(() => {}); }
}
async function forwardToFeishu(record) {
  const url = process.env.POLARIS_HEALTH_WEBHOOK_URL || '';
  const token = process.env.POLARIS_HEALTH_WEBHOOK_TOKEN || '';
  if (!url || !token) return { synced: false, message: '未配置飞书 Webhook；仅保存本地缓存' };
  if (!url.startsWith('https://')) throw new Error('飞书 Webhook 必须使用 HTTPS');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('飞书 Webhook 返回 HTTP ' + response.status);
  // Feishu may acknowledge the webhook before asynchronous workflow completes.
  return { synced: true, message: '已提交飞书工作流；请在飞书运行日志确认最终写入' };
}
let serial = Promise.resolve();
function enqueue(task) {
  const pending = serial.then(task);
  serial = pending.catch(() => {});
  return pending;
}
async function handleHealthRequest(req, res, pathname) {
  if (!pathname.startsWith('/api/health/')) return false;
  if (pathname === '/api/health/status' && req.method === 'GET') {
    return json(res, 200, { ok: true, ready: !!process.env.POLARIS_HEALTH_INGEST_TOKEN,
      feishu_configured: !!(process.env.POLARIS_HEALTH_WEBHOOK_URL && process.env.POLARIS_HEALTH_WEBHOOK_TOKEN) }), true;
  }
  if (!authorized(req)) { json(res, 401, { ok: false, error: '请提供正确的同步访问令牌' }); return true; }
  if (pathname === '/api/health/daily' && req.method === 'GET') {
    try {
      const days = Math.min(365, Math.max(1, Number(new URL(req.url, 'http://localhost').searchParams.get('days')) || 30));
      const rows = (await loadDaily()).slice(-days);
      json(res, 200, { ok: true, rows });
    } catch { json(res, 500, { ok: false, error: '读取健康数据失败' }); }
    return true;
  }
  if (pathname === '/api/health/daily' && req.method === 'POST') {
    try {
      const record = validateDaily(await bodyJSON(req));
      const row = await enqueue(async () => {
        const records = await loadDaily();
        const old = records.find(r => r.record_key === record.record_key) || {};
        const merged = { ...old, ...record, synced_at: new Date().toISOString() };
        const next = records.filter(r => r.record_key !== record.record_key);
        next.push(merged);
        next.sort((a, b) => a.date.localeCompare(b.date));
        await saveDaily(next);
        return merged;
      });
      try {
        const forwarded = await forwardToFeishu(row);
        json(res, 200, { ok: true, stored: true, feishu_synced: forwarded.synced, message: forwarded.message, record_key: row.record_key });
      } catch {
        json(res, 502, { ok: false, stored: true, feishu_synced: false,
          error: '已保存在 Mac 本地，但飞书未确认接收。请检查工作流及网络后重试。' });
      }
    } catch (error) {
      json(res, 400, { ok: false, error: error.message });
    }
    return true;
  }
  json(res, 404, { ok: false, error: '健康接口不存在' });
  return true;
}
module.exports = { handleHealthRequest, validateDaily, loadDaily };
