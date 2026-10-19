const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'polaris-store.js'), 'utf8');

function assertAndroidAssetsAreCurrent() {
  const mobileRoot = path.join(__dirname, '..');
  const androidAssets = path.join(mobileRoot, 'android-project', 'app', 'src', 'main', 'assets');
  for (const file of ['mobile-app.html', 'polaris-store.js']) {
    assert.equal(
      fs.readFileSync(path.join(androidAssets, file), 'utf8'),
      fs.readFileSync(path.join(mobileRoot, file), 'utf8'),
      `Android WebView asset is stale: ${file}`
    );
  }
}

function setup(fetchImpl) {
  const values = new Map();
  const localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  const window = { BOARD_DATA: { records: [] } };
  vm.runInNewContext(source, { window, localStorage, fetch: fetchImpl, console, Date, Math });
  return window.polarisStore;
}

async function run() {
  assertAndroidAssetsAreCurrent();

  let pushes = 0;
  const store = setup(async (url, options) => {
    if (url.endsWith('/api/pull')) {
      return { ok: true, json: async () => ({
        ok: true,
        records: [
          { record_id: 'rec1', date: '2026-10-20', text: '远端旧标题' },
          { record_id: 'rec2', date: '2026-10-20', text: '远端正常记录' }
        ]
      }) };
    }
    pushes++;
    const changes = JSON.parse(options.body).changes;
    assert.equal(changes.length, 2);
    assert(changes.every(c => c.op));
    return { ok: true, json: async () => ({
      ok: true,
      createdRecords: [{ _uid: 'local_1', record_id: 'recNew' }]
    }) };
  });

  store.state.schedules = [
    { record_id: 'local_1', date: '2026-10-20', text: '离线新建' },
    { record_id: 'rec1', date: '2026-10-20', text: '本地改过' }
  ];
  store.state.pendingChanges = [
    { _uid: 'local_1', op: 'create', fields: { '日程标题': '离线新建' } },
    { op: 'update', record_id: 'rec1', fields: { '日程标题': '本地改过' } },
    { type: 'insert', table: '心情记录', data: { '心情总结': '平静' } }
  ];

  await store.pullFromFeishu();
  assert.deepEqual(Array.from(store.state.schedules, r => r.text),
    ['离线新建', '本地改过', '远端正常记录']);
  assert.equal(store.state.pendingChanges.length, 3);
  assert.equal(store.getTodaySchedules('2026-10-21').length, 0);

  const [first, second] = await Promise.all([store.pushToFeishu(), store.pushToFeishu()]);
  assert.strictEqual(first, second);
  assert.equal(pushes, 1);
  assert.equal(first.pending, 1);
  assert.equal(store.state.pendingChanges.length, 1);
  assert.equal(store.state.pendingChanges[0].table, '心情记录');
  assert.equal(store.state.schedules[0].record_id, 'recNew');
  assert.equal(store.state.syncStatus, 'pending');

  const localOnly = setup(async () => { throw new Error('should not request Mac'); });
  localOnly.state.pendingChanges = [{ type: 'insert', table: '收集表', data: {} }];
  const unsent = await localOnly.pushToFeishu();
  assert.equal(unsent.pending, 1);
  assert.equal(unsent.ok, false);
  assert.equal(localOnly.state.pendingChanges.length, 1);

  let finishCreate, sentUid;
  const race = setup(async (url, options) => {
    sentUid = JSON.parse(options.body).changes[0]._uid;
    return new Promise(resolve => {
      finishCreate = () => resolve({ ok: true, json: async () => ({
        ok: true, createdRecords: [{ _uid: sentUid, record_id: 'recRace' }]
      }) });
    });
  });
  const created = race.addSchedule('初稿', '工作', '2026-10-20');
  race.updateSchedule(created.record_id, { text: '编辑后的标题' });
  finishCreate();
  await race.pushToFeishu();
  assert.equal(race.state.schedules[0].record_id, 'recRace');
  assert.equal(race.state.pendingChanges[0].op, 'update');
  assert.equal(race.state.pendingChanges[0].record_id, 'recRace');
  assert.equal(race.state.pendingChanges[0].fields['日程标题'], '编辑后的标题');

  console.log('PolarisStore sync safety checks passed');
}

run().catch(err => { console.error(err); process.exitCode = 1; });
