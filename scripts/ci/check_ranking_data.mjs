import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { aggregateRankingData } from '../../src/features/ranking/utils/rankingHelpers.js';
import { loadPublicRankingData } from '../../src/features/ranking/utils/loadPublicRankingData.js';

const NOW = Date.parse('2026-10-01T12:00:00Z');
const shops = [
  { id: 'shop-a', name: '店舗A', area: ['渋谷', '恵比寿'], prefecture: '東京都' },
  { id: 'shop-b', name: '店舗B', area: '横浜', prefecture: '神奈川県' },
];
const therapists = [
  { id: 'person-a', shop_id: 'shop-a', name: 'あい', image_url: '/a.webp' },
  { id: 'person-b', shop_id: 'shop-a', name: 'あい', image_url: '/b.webp', raw_data: { tags: ['新人'] } },
  { id: 'person-c', shop_id: 'shop-b', name: 'ゆい' },
];
const review = (id, therapist_id = 'person-a', extra = {}) => ({
  id, shop_id: 'shop-a', therapist_id, therapist_name: 'あい', is_public: true,
  rating: 4, detailed_ratings: { looks: 2, intimacy: 3 }, created_at: '2026-09-30T00:00:00Z', ...extra,
});

function verifyAggregation(aggregate) {
  const rows = [
    review('a1', 'person-a', { rating: '5', detailed_ratings: { looks: 1 } }),
    review('a2', 'person-a', { rating: 4, detailed_ratings: { looks: 2 } }),
    review('a3', 'person-a', { rating: 3, detailed_ratings: { looks: 3 } }),
    ...['b1', 'b2', 'b3'].map(id => review(id, 'person-b', { rating: 5 })),
    review('private', 'person-a', { is_public: false, rating: 1 }),
  ];
  const total = aggregate([...rows, rows[0]], shops, therapists, { now: NOW });
  assert.equal(total.targetReviewCount, 6, 'non-public and duplicate rows must not count');
  assert.deepEqual(total.ranking.map(item => [item.therapistId, item.count, item.averageRating, item.image]), [
    ['person-b', 3, 5, '/b.webp'], ['person-a', 3, 4, '/a.webp'],
  ], 'same-name people keep their own IDs, photos, and scores');
  const looks = aggregate(rows, shops, therapists, { category: 'looks', now: NOW });
  assert.equal(looks.ranking.find(item => item.therapistId === 'person-a').averageRating, 2, 'use detailed_ratings');
  const missingAxis = aggregate(rows, shops, therapists, { category: 'massage', now: NOW });
  assert.equal(missingAxis.ranking.length, 0, 'missing department scores must not become overall scores');
  assert.equal(missingAxis.targetReviewCount, 6, 'existing reviews remain distinguishable from no reviews');
  assert.equal(aggregate(rows.slice(0, 2), shops, therapists, { now: NOW }).ranking.length, 0, 'minimum sample is three');
  assert.equal(aggregate(rows.slice(0, 2), shops, therapists, { now: NOW, minReviews: 1 }).ranking.length, 1, 'ranking page keeps its existing one-review eligibility');
  assert.equal(aggregate(rows, shops, therapists, { area: '恵比寿', now: NOW }).ranking.length, 2, 'multi-area shops match every area');
  assert.equal(aggregate(rows, shops, therapists, { area: '横浜', now: NOW }).targetReviewCount, 0);
  const periods = [
    review('recent'), review('month', 'person-a', { created_at: '2026-09-10T00:00:00Z' }),
    review('old', 'person-a', { created_at: '2026-08-01T00:00:00Z' }),
    review('future', 'person-a', { created_at: '2026-10-02T00:00:00Z' }),
  ];
  assert.equal(aggregate(periods, shops, therapists, { period: 'monthly', now: NOW }).targetReviewCount, 2);
  assert.equal(aggregate(periods, shops, therapists, { period: 'weekly', now: NOW }).targetReviewCount, 1);
  assert.deepEqual(aggregate(rows, shops, therapists, { period: 'newcomer', now: NOW }).ranking.map(item => item.therapistId), ['person-b']);
  const legacy = [review('legacy1', null), review('legacy2', null), review('legacy3', null)];
  assert.equal(aggregate(legacy, shops, therapists, { now: NOW }).ranking.length, 0, 'ambiguous legacy names remain unmatched');
  assert.equal(aggregate(legacy, shops, therapists.slice(0, 1), { now: NOW }).ranking[0].therapistId, 'person-a');
  const archived = ['archived1', 'archived2', 'archived3'].map(id => review(id, 'retired-id'));
  assert.equal(aggregate(archived, shops, therapists, { now: NOW }).ranking[0].therapistId, 'retired-id', 'retired exact IDs must survive');
  const invalid = ['x1', 'x2', 'x3'].map(id => review(id, 'person-a', { rating: 0 }));
  assert.equal(aggregate(invalid, shops, therapists, { now: NOW }).ranking.length, 0, 'out-of-range ratings are not ranked');
}

function mockClient(database, fail = () => false) {
  const calls = [];
  return {
    calls,
    from(table) {
      const call = { table, filters: [] };
      const query = {
        select(fields) { call.fields = fields; return query; },
        eq(column, value) { call.filters.push(row => row[column] === value); call.publicOnly = column === 'is_public' && value === true; return query; },
        in(column, values) { call.filters.push(row => values.includes(row[column])); return query; },
        order(column) { call.order = column; return query; },
        async range(from, to) {
          Object.assign(call, { from, to });
          calls.push(call);
          if (fail(call)) return { data: null, error: new Error('Simulated fetch failure') };
          const rows = (database[table] || []).filter(row => call.filters.every(filter => filter(row)))
            .sort((a, b) => String(a[call.order]).localeCompare(String(b[call.order])));
          return { data: rows.slice(from, to + 1), error: null };
        },
      };
      return query;
    },
  };
}

verifyAggregation(aggregateRankingData);
const database = {
  reviews: Array.from({ length: 1002 }, (_, i) => review(`review-${String(i).padStart(4, '0')}`, `person-${i % 105}`)),
  shops,
  therapists: Array.from({ length: 105 }, (_, i) => ({ id: `person-${i}`, shop_id: 'shop-a', name: `名前${i}` })),
};
database.reviews.push(review('private', 'person-a', { is_public: false }));
const client = mockClient(database);
const result = await loadPublicRankingData(client);
assert.equal(result.reviews.length, 1002, 'public reviews must not stop at PostgREST max rows');
assert.equal(result.therapists.length, 105, 'referenced IDs must be batched without omissions');
assert.deepEqual(client.calls.filter(call => call.table === 'reviews').map(call => call.from), [0, 500, 1000]);
assert(client.calls.filter(call => call.table === 'reviews').every(call => call.publicOnly && call.order === 'id'));
assert(client.calls.filter(call => call.table === 'reviews').every(call => !/\b(content|user_id|user_name)\b/.test(call.fields)), 'ranking fetch must not include text or user details');
const failed = mockClient(database, call => call.table === 'reviews' && call.from === 500);
await assert.rejects(loadPublicRankingData(failed), /Simulated fetch failure/, 'partial data must not be reported as success');
const retry = await loadPublicRankingData(mockClient(database));
assert.equal(retry.reviews.length, 1002, 'retry restarts complete aggregation');
await assert.rejects(loadPublicRankingData(mockClient(database, call => call.table === 'therapists')), /Simulated fetch failure/, 'profile lookup failure is not an empty ranking');
const legacyClient = mockClient({ reviews: [review('legacy', null)], shops, therapists });
assert.equal((await loadPublicRankingData(legacyClient)).therapists.length, 2, 'legacy matching requires the full shop roster');

// Deliberately break the implementation in isolated modules and ensure the same assertions reject it.
let source = await readFile(new URL('../../src/features/ranking/utils/rankingHelpers.js', import.meta.url), 'utf8');
for (const relative of ['../../../utils/reviewIdentity.js', '../../../utils/shopFields.js']) {
  source = source.replace(relative, new URL(`../../src/utils/${relative.split('/').pop()}`, import.meta.url).href);
}
for (const [before, after] of [
  ['review.is_public !== true || ', ''],
  ['review.detailed_ratings?.[category]', 'review.rating'],
  ['item.count >= minReviews', 'item.count >= 1'],
]) {
  assert(source.includes(before), `mutation target exists: ${before}`);
  const broken = await import(`data:text/javascript;base64,${Buffer.from(source.replace(before, after)).toString('base64')}`);
  assert.throws(() => verifyAggregation(broken.aggregateRankingData), assert.AssertionError, `tests reject mutation: ${before}`);
}
console.log('✅ Ranking public data, identity, scores, eligibility, pagination, failure/retry, and mutation checks passed');
