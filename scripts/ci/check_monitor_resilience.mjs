import assert from 'node:assert/strict';
import { fetchWithRetry, isTransientMonitorStatus } from '../lib/monitorFetch.mjs';
import { classifyDnsFailure, isClosureEvidence } from '../lib/dnsVerdict.mjs';

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

// ── 名前解決の失敗をどう読むか（2026-09-15）──────────────────────────
// 🚩 閉店の判断は名前解決だけを根拠にする決まり。だがその実装がエラーの種類を見ておらず、
//    引けなければ全部「ドメイン消滅」にしていた＝回線が細い環境では営業中の店が閉店候補に出る。
//    実際 bellrose-osaka.com / wife-room.com が ETIMEOUT で消滅扱いになっていた。
{
  assert.equal(classifyDnsFailure('ENOTFOUND'), 'domain_gone',
    'NXDOMAIN（登録されていない）はドメイン消滅と判定する');

  // ⭐ ここが本体。「引けなかった」を「無い」と読まないこと。
  for (const code of ['ETIMEOUT', 'ESERVFAIL', 'EAI_AGAIN', 'ECONNREFUSED', 'UNKNOWN', undefined, '']) {
    assert.equal(classifyDnsFailure(code), 'dns_unresolved',
      `${code} は「調べられなかった」であって「ドメインが無い」ではない`);
    assert.equal(isClosureEvidence(classifyDnsFailure(code)), false,
      `${code} を閉店の根拠にしてはいけない（2026-09-13「応答しない≠店が無い」と同じ誤り）`);
  }

  assert.equal(isClosureEvidence('domain_gone'), true, 'NXDOMAINだけが閉店の根拠になる');
  assert.equal(isClosureEvidence('no_a_record'), false, 'Aレコードが無いだけでは閉店の根拠にならない');
  assert.equal(isClosureEvidence('alive'), false, '生きているドメインは当然根拠にならない');
}

console.log('✅ 外形監視の再試行・恒久障害判定チェック OK');
