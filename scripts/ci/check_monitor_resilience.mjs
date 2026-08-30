import assert from 'node:assert/strict';
import { fetchWithRetry, isTransientMonitorStatus } from '../lib/monitorFetch.mjs';

const noWait = async () => {};
const response = (status, contentType = 'text/plain') => new Response('', {
  status,
  headers: { 'content-type': contentType },
});

async function sequenceFetch(sequence) {
  let calls = 0;
  const fetchImpl = async () => {
    const value = sequence[Math.min(calls, sequence.length - 1)];
    calls += 1;
    if (value instanceof Error) throw value;
    return value;
  };
  const run = (options = {}) => fetchWithRetry('https://monitor.test/resource', {}, {
    attempts: 3,
    delaysMs: [0, 0],
    sleepImpl: noWait,
    fetchImpl,
    ...options,
  });
  return { run, calls: () => calls };
}

assert.equal(isTransientMonitorStatus(408), true);
assert.equal(isTransientMonitorStatus(429), true);
assert.equal(isTransientMonitorStatus(503), true);
assert.equal(isTransientMonitorStatus(404), false);

{
  const test = await sequenceFetch([response(503), response(503), response(200)]);
  assert.equal((await test.run()).status, 200);
  assert.equal(test.calls(), 3, '一時的な5xxは3回まで再試行する');
}

{
  const test = await sequenceFetch([new TypeError('socket closed'), new TypeError('DNS'), response(200)]);
  assert.equal((await test.run()).status, 200);
  assert.equal(test.calls(), 3, 'ネットワーク例外も再試行する');
}

{
  const test = await sequenceFetch([response(404)]);
  assert.equal((await test.run()).status, 404);
  assert.equal(test.calls(), 1, '通常ページの恒久4xxを再試行で隠さない');
}

{
  const test = await sequenceFetch([response(404), response(404), response(404)]);
  assert.equal((await test.run({ retryStatuses: [404] })).status, 404);
  assert.equal(test.calls(), 3, 'chunkの404はデプロイ境界を考慮して確認し直す');
}

{
  const test = await sequenceFetch([response(500), response(500), response(500)]);
  assert.equal((await test.run()).status, 500);
  assert.equal(test.calls(), 3, '恒久5xxは3回確認後も失敗として返す');
}

console.log('✅ 外形監視の再試行・恒久障害判定チェック OK');
