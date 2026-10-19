'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

process.env.POLARIS_HEALTH_DATA_DIR = path.join(os.tmpdir(), 'polaris-health-test-' + process.pid);
process.env.POLARIS_HEALTH_INGEST_TOKEN = 'test-token-should-not-be-shipped';
delete process.env.POLARIS_HEALTH_WEBHOOK_URL;
delete process.env.POLARIS_HEALTH_WEBHOOK_TOKEN;
const { validateDaily, handleHealthRequest } = require('./health-service');

test('health record validation never fabricates unavailable fields', () => {
  assert.deepEqual(validateDaily({ date: '2026-10-19', steps: 0 }), {
    record_key: '2026-10-19_xiaomi_band_11_nfc', date: '2026-10-19', source: 'health_connect', steps: 0
  });
  assert.equal(Object.hasOwn(validateDaily({ date: '2026-10-19', avg_hr: 70 }), 'steps'), false);
  assert.throws(() => validateDaily({ date: '2026-02-30', steps: 100 }));
  assert.throws(() => validateDaily({ date: '2026-10-19', steps: '100' }));
  assert.throws(() => validateDaily({ date: '2026-10-19' }));
  assert.throws(() => validateDaily({ date: '2026-10-19', steps: -1 }));
});

test('authenticated ingest, idempotent upsert, partial merge and private read', async () => {
  const server = http.createServer((req, res) => {
    handleHealthRequest(req, res, new URL(req.url, 'http://localhost').pathname);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  const send = (body, token = process.env.POLARIS_HEALTH_INGEST_TOKEN) =>
    fetch(url + '/api/health/daily', { method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(body) });
  try {
    assert.equal((await send({ date: '2026-10-19', steps: 123 }, 'wrong')).status, 401);
    const first = await (await send({ date: '2026-10-19', steps: 123 })).json();
    assert.equal(first.ok, true);
    assert.equal(first.feishu_synced, false); // no fake cloud success
    const second = await (await send({ date: '2026-10-19', avg_hr: 65 })).json();
    assert.equal(second.ok, true);
    assert.equal((await fetch(url + '/api/health/daily')).status, 401);
    const response = await fetch(url + '/api/health/daily', {
      headers: { Authorization: 'Bearer ' + process.env.POLARIS_HEALTH_INGEST_TOKEN }
    });
    const rows = (await response.json()).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].steps, 123);
    assert.equal(rows[0].avg_hr, 65);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(process.env.POLARIS_HEALTH_DATA_DIR, { recursive: true, force: true });
  }
});
