import assert from 'node:assert/strict';
import { normalizeReturnTo, withReturnTo, authCompletePath } from '../../src/utils/authRedirect.js';
import { parseViewingCredits, fetchViewingCredits } from '../../src/utils/viewingCredits.js';

const returnTo = '/shops/shop/threads/天音%20しおり?tab=reviews#review-r_1';
assert.equal(normalizeReturnTo(returnTo), returnTo);
assert.equal(normalizeReturnTo('/shops/a/threads/天音%E3%80%80しおり#review-r_2'), '/shops/a/threads/天音%E3%80%80しおり#review-r_2');
for (const base of ['/login', '/register']) {
  assert.equal(new URL(withReturnTo(base, returnTo), 'https://example.test').searchParams.get('redirect'), returnTo);
}
assert.equal(new URL(authCompletePath(returnTo), 'https://example.test').searchParams.get('next'), returnTo);
for (const hostile of ['//evil.test', '/%2F%2Fevil.test', '/%5Cevil.test', 'https://evil.test', 'javascript:alert(1)', '/a\n', '/a%0A', '/a%0D', '/a%09', '/a%00', '/a%7F', '/a b', '/%6Cogin', '/auth/complete']) {
  assert.equal(normalizeReturnTo(hostile, '/mypage'), '/mypage', hostile);
}

const now = Date.parse('2026-10-01T00:00:00Z');
assert.deepEqual(parseViewingCredits([], now), { status: 'expired', days: 0 });
assert.deepEqual(parseViewingCredits([{ credits_days: 3, expires_at: '2026-10-02T00:00:00Z' }], now), { status: 'active', days: 1 });
assert.deepEqual(parseViewingCredits([{ credits_days: 0, expires_at: '2026-10-02T00:00:00Z' }], now), { status: 'active', days: 1 });
assert.deepEqual(parseViewingCredits([{ credits_days: 3, expires_at: null }], now), { status: 'expired', days: 0 });
assert.deepEqual(parseViewingCredits([{ credits_days: 3, expires_at: '2026-10-01T00:00:00Z' }], now), { status: 'expired', days: 0 });
assert.deepEqual(parseViewingCredits([{ credits_days: 0, expires_at: null }], now), { status: 'expired', days: 0 });
for (const invalid of [{ error: 'server' }, [{}], [{ credits_days: true }], [{ credits_days: '' }], [{ credits_days: -1 }], [{ credits_days: 3, expires_at: 'invalid' }], [null]]) {
  assert.throws(() => parseViewingCredits(invalid, now));
}
await assert.rejects(fetchViewingCredits('/credits', {}, async () => new Response('[]', { status: 503 })));
await assert.rejects(fetchViewingCredits('/credits', {}, async () => { throw new TypeError('network'); }));
await assert.rejects(fetchViewingCredits('/credits', {}, async () => new Response('{')));
await assert.rejects(fetchViewingCredits('/credits', {}, async () => new Response('{}')));
// 一度失敗しても同じ問い合わせを再実行すると閲覧可能へ復帰する。
let attempts = 0;
const fetcher = async (_url, options) => {
  assert.equal(options.headers.Authorization, 'Bearer test');
  if (++attempts === 1) return new Response('{}', { status: 500 });
  return Response.json([{ credits_days: 3, expires_at: new Date(Date.now() + 86400000).toISOString() }]);
};
await assert.rejects(fetchViewingCredits('/credits', { Authorization: 'Bearer test' }, fetcher));
const recovered = await fetchViewingCredits('/credits', { Authorization: 'Bearer test' }, fetcher);
assert.equal(recovered.status, 'active');
assert.equal(recovered.days, 1);
assert.ok(Date.parse(recovered.expiresAt) > Date.now());
assert.equal(attempts, 2);
console.log('✅ 空白を含む戻り先と閲覧権の失敗・再試行を検証');
