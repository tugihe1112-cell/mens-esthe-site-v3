/** ホーム口コミの取得失敗を「公開口コミ0件」に変えない。実際のloader・SSR・表示を検証する。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { loadHomeReviews } from '../../server/homeReviews.js';
import * as feedHelpers from '../../src/utils/homeReviews.js';

const fixtureReviews = Array.from({ length: 34 }, (_, i) => ({
  id: `qa-home-review-${i}`, shop_id: `qa-shop-${i % 20}`, therapist_id: `qa-therapist-${i}`,
  therapist_name: `QA人物${i}`, content: `QA専用の公開口コミ本文${i}。`.repeat(20),
  rating: 4, detailed_ratings: { massage: 4 }, user_name: 'QA投稿者',
  created_at: new Date(Date.now() - i * 60_000).toISOString(),
}));
const fixtureIndex = fixtureReviews.map(({ shop_id, created_at }) => ({ shop_id, created_at }));
const fixtureShops = Array.from({ length: 20 }, (_, i) => ({
  id: `qa-shop-${i}`, name: `QA店舗${i}`, prefecture: i % 2 ? '東京都' : '大阪府', area: ['QA地域'], city: 'QA市',
}));
const fixtureTherapists = fixtureReviews.map((row, i) => ({ id: row.therapist_id, image_url: null, is_active: i !== 0 }));
const ok = (data, extra = {}) => ({ data, error: null, status: 200, ...extra });
const unavailable = (status = 503) => ({ data: null, error: { message: 'QA unavailable', code: 'QA_TRANSIENT' }, status });

function mockSupabase(overrides = {}) {
  const calls = [];
  const counters = new Map();
  const defaults = {
    feed: ok(fixtureReviews), index: ok(fixtureIndex, { count: 34 }), shops: ok(fixtureShops),
    therapists: ok(fixtureTherapists), hero: ok([{ id: 'qa-hero', name: 'QAヒーロー', image_url: null }]),
  };
  const resolve = async (query) => {
    const kind = query.table === 'reviews' ? (query.columns.includes('content') ? 'feed' : 'index')
      : query.table === 'therapists' ? 'therapists' : query.columns.includes('prefecture') ? 'shops' : 'hero';
    const attempt = counters.get(kind) || 0;
    counters.set(kind, attempt + 1);
    calls.push({ ...query, kind });
    const plan = Object.hasOwn(overrides, kind) ? overrides[kind] : defaults[kind];
    const response = Array.isArray(plan) ? plan[Math.min(attempt, plan.length - 1)] : plan;
    if (response instanceof Error) throw response;
    if (response === 'hang') {
      return new Promise((resolveHang) => {
        const fail = () => resolveHang({ data: null, error: { name: 'AbortError', message: 'QA request aborted' }, status: 0 });
        if (query.signal?.aborted) fail();
        else query.signal?.addEventListener('abort', fail, { once: true });
      });
    }
    return response;
  };
  return {
    calls,
    from(table) {
      const query = { table, columns: '', filters: [] };
      const builder = {
        select(columns, options) { query.columns = columns; query.selectOptions = options; return builder; },
        eq(...args) { query.filters.push(['eq', ...args]); return builder; },
        not(...args) { query.filters.push(['not', ...args]); return builder; },
        order(...args) { query.order = args; return builder; },
        limit(value) { query.limit = value; return builder; },
        in(...args) { query.in = args; return builder; },
        retry(value) { query.retry = value; return builder; },
        abortSignal(signal) { query.signal = signal; return builder; },
        then(success, failure) { return resolve(query).then(success, failure); },
      };
      return builder;
    },
  };
}

const testOptions = { timeoutMs: 1000, retryDelayMs: 0 };
for (const status of [0, 408, 425, 429, 500, 502, 503, 504]) {
  const mock = mockSupabase({ feed: [unavailable(status), ok(fixtureReviews)] });
  const result = await loadHomeReviews(mock, testOptions);
  assert.equal(result.reviewLoadFailed, false, `HTTP ${status} recovery`);
  assert.equal(result.reviewStats.total, 34);
  assert.ok(result.latestReviews.some((row) => row.id === fixtureReviews[0].id));
  assert.ok(result.latestReviews.every((row) => row.snippet.length <= 120 && !Object.hasOwn(row, 'content')), 'home props must retain teaser only');
  const attempts = mock.calls.filter((call) => call.kind === 'feed');
  assert.equal(attempts.length, 2, 'transient retry must be bounded to two attempts');
  assert.ok(attempts.every((call) => call.retry === false), 'Supabase internal retries must be disabled');
  assert.ok(attempts.every((call) => call.filters.some((filter) => filter[0] === 'eq' && filter[1] === 'is_public' && filter[2] === true)), 'only public reviews');
  assert.equal(attempts[0].signal, attempts[1].signal, 'retry must share the original timeout budget');
}
const networkRecovery = await loadHomeReviews(mockSupabase({ feed: [new TypeError('QA network failure'), ok(fixtureReviews)] }), testOptions);
assert.equal(networkRecovery.reviewLoadFailed, false);
assert.equal(networkRecovery.reviewStats.total, 34);

const failedMock = mockSupabase({ feed: unavailable() });
const failed = await loadHomeReviews(failedMock, testOptions);
assert.equal(failed.reviewLoadFailed, true);
assert.equal(failed.latestReviews.length, 0);
assert.notEqual(failed.reviewStats?.total, 0, 'failure must not claim zero published reviews');
assert.equal(failedMock.calls.filter((call) => call.kind === 'feed').length, 2);

for (const status of [400, 401, 403, 404]) {
  const mock = mockSupabase({ feed: unavailable(status) });
  assert.equal((await loadHomeReviews(mock, testOptions)).reviewLoadFailed, true);
  assert.equal(mock.calls.filter((call) => call.kind === 'feed').length, 1, `permanent HTTP ${status} must not retry`);
}
const abortError = Object.assign(new Error('QA aborted'), { name: 'AbortError' });
const abortedMock = mockSupabase({ feed: abortError });
assert.equal((await loadHomeReviews(abortedMock, testOptions)).reviewLoadFailed, true);
assert.equal(abortedMock.calls.filter((call) => call.kind === 'feed').length, 1);

const empty = await loadHomeReviews(mockSupabase({ feed: ok([]), index: ok([], { count: 0 }) }), testOptions);
assert.equal(empty.reviewLoadFailed, false);
assert.deepEqual(empty.latestReviews, []);
assert.equal(empty.reviewStats.total, 0);
for (const metadata of ['index', 'shops', 'therapists']) {
  const result = await loadHomeReviews(mockSupabase({ [metadata]: new Error(`QA optional ${metadata} failed`) }), testOptions);
  assert.equal(result.reviewLoadFailed, false, `${metadata} must not erase fetched reviews`);
  assert.ok(result.latestReviews.some((row) => row.id === fixtureReviews[0].id));
  assert.ok(result.latestReviews[0].shopId && result.latestReviews[0].therapistId);
  if (metadata === 'index') assert.equal(result.reviewStats.total, null, 'unknown count must remain unknown');
  if (metadata === 'therapists') assert.ok(result.latestReviews.every((row) => row.notListed === false), 'failed roster lookup must not invent departure');
}
const missingRoster = await loadHomeReviews(mockSupabase({ therapists: ok([]) }), testOptions);
assert.equal(missingRoster.reviewLoadFailed, false);
assert.ok(missingRoster.latestReviews.every((row) => row.notListed === true), 'successful lookup with no matching roster rows must retain archive marking');
const inactiveRoster = await loadHomeReviews(mockSupabase(), testOptions);
assert.equal(inactiveRoster.latestReviews.find((row) => row.id === fixtureReviews[0].id)?.notListed, true, 'explicit inactive roster row must retain archive marking');
assert.equal(inactiveRoster.latestReviews.find((row) => row.id === fixtureReviews[1].id)?.notListed, false);
for (const bad of [ok(null), ok({}), ok('invalid')]) {
  assert.equal((await loadHomeReviews(mockSupabase({ feed: bad }), testOptions)).reviewLoadFailed, true, 'malformed response must not claim empty');
}
const timeoutMock = mockSupabase({ feed: 'hang' });
const keepAlive = setTimeout(() => {}, 1000);
const timedOut = await loadHomeReviews(timeoutMock, { timeoutMs: 20, retryDelayMs: 0 });
clearTimeout(keepAlive);
assert.equal(timedOut.reviewLoadFailed, true);
assert.equal(timeoutMock.calls.filter((call) => call.kind === 'feed').length, 1, 'timeout must not start a second timeout budget');
const retryDelayMock = mockSupabase({ feed: unavailable() });
const retryDelayStartedAt = Date.now();
const delayAborted = await loadHomeReviews(retryDelayMock, { timeoutMs: 30, retryDelayMs: 2000 });
assert.equal(delayAborted.reviewLoadFailed, true);
assert.equal(retryDelayMock.calls.filter((call) => call.kind === 'feed').length, 1);
assert.ok(Date.now() - retryDelayStartedAt < 1000, 'retry delay must stop when the shared timeout expires');

// 実際のNextページをトランスパイルしてgetServerSidePropsを実行する。React表示やDB・CDN接続だけ差し替える。
function compileModule(source, dependencies) {
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} };
  const mockedRequire = (specifier) => {
    if (Object.hasOwn(dependencies, specifier)) return dependencies[specifier];
    throw new Error(`Unexpected QA import ${specifier}`);
  };
  const run = vm.runInNewContext(`(function(require, module, exports) { ${code}\n})`, {
    process, console: { ...console, error() {}, warn() {} },
  });
  run(mockedRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

const source = fs.readFileSync('pages/index.jsx', 'utf8');
const loaderSpecifier = /from\s*['"]([^'"]*server\/homeReviews(?:\.js)?)['"]/.exec(source)?.[1];
assert.ok(loaderSpecifier, 'homepage must import the tested review loader');
const dependencies = {
  react: React, 'next/head': ({ children }) => React.createElement(React.Fragment, null, children),
  '../src/pages/Home': function MockHome() {},
  '../src/data/heroShops': { HERO_SHOP_IDS: ['qa-hero'], buildInitialHero: (rows) => rows || [] },
  '../src/utils/liveCountsCache': { createCountsCache: () => ({ peek() {}, waitFor: async () => ({ totalShops: 1234, totalTherapists: 56789 }) }) },
  [loaderSpecifier]: { loadHomeReviews: (supabase) => loadHomeReviews(supabase, testOptions) },
  // 複数ルームのブランドのルーム数（2026-10-10）。最初のHTMLの店舗リンクを /brands/ にするため。
  '../server/roomCounts.js': { loadMultiRoomCounts: async () => ({ qa_group: 2 }) },
};
async function runSsr(mock, overrides = {}) {
  const page = compileModule(source, { ...dependencies, ...overrides, '../server/supabaseServer': { createServerSupabase: () => mock } });
  const response = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key.toLowerCase()] = value; } };
  const result = await page.getServerSideProps({ res: response });
  const rendered = page.default(result.props);
  const homeElement = React.Children.toArray(rendered.props.children).find((child) => child.type === dependencies['../src/pages/Home']);
  assert.ok(homeElement, 'Next route must render Home');
  assert.equal(homeElement.props.reviewLoadFailed, result.props.reviewLoadFailed, 'route must forward the failure flag');
  return { response, props: result.props };
}
const recoveredSsr = await runSsr(mockSupabase({ feed: [unavailable(), ok(fixtureReviews)] }));
assert.equal(recoveredSsr.response.statusCode, 200);
assert.equal(recoveredSsr.props.reviewStats.total, 34);
assert.equal(recoveredSsr.props.reviewLoadFailed, false);
const failedSsr = await runSsr(mockSupabase({ feed: unavailable() }));
assert.ok(failedSsr.props.initialHero.length > 0 && failedSsr.props.liveCounts, 'failure fixture must contain successful optional data');
assert.equal(failedSsr.props.reviewLoadFailed, true);
assert.equal(failedSsr.response.statusCode, 503, 'review failure must return 503 even when hero/counts are available');
assert.equal(failedSsr.response.headers['cache-control'], 'no-store');
assert.ok(Number(failedSsr.response.headers['retry-after']) > 0);
const emptySsr = await runSsr(mockSupabase({ feed: ok([]), index: ok([], { count: 0 }) }));
assert.equal(emptySsr.response.statusCode, 200);
assert.equal(emptySsr.props.reviewLoadFailed, false);
assert.equal(emptySsr.props.reviewStats.total, 0);
assert.deepEqual(recoveredSsr.props.ssrRoomCounts, { qa_group: 2 }, 'home SSR must pass room counts so first-HTML shop links skip the 301');
const roomCountsFailedSsr = await runSsr(mockSupabase(), { '../server/roomCounts.js': { loadMultiRoomCounts: async () => { throw new Error('QA room counts failure'); } } });
assert.equal(roomCountsFailedSsr.response.statusCode, 200, 'room-count failure must not take the home page down');
// ⚠️ ページはテスト用の別の実行環境で動くので、{} どうしでも厳密比較は型の出どころの違いで落ちる。中身で見る。
assert.equal(JSON.stringify(roomCountsFailedSsr.props.ssrRoomCounts), '{}', 'room-count failure falls back to shop URLs (same as before)');
const heroFailedSsr = await runSsr(mockSupabase({ hero: new Error('QA hero failure') }));
assert.equal(heroFailedSsr.response.statusCode, 200);
assert.ok(heroFailedSsr.props.latestReviews.some((row) => row.id === fixtureReviews[0].id), 'optional hero failure must not cancel reviews');
const heroShapeFailedSsr = await runSsr(mockSupabase(), { '../src/data/heroShops': {
  HERO_SHOP_IDS: ['qa-hero'], buildInitialHero() { throw new Error('QA hero shaping failure'); },
} });
assert.equal(heroShapeFailedSsr.response.statusCode, 200);
assert.equal(heroShapeFailedSsr.props.reviewLoadFailed, false);
assert.ok(heroShapeFailedSsr.props.latestReviews.some((row) => row.id === fixtureReviews[0].id));

// 実際の口コミ欄をReact SSRで描き、エラー・真の0件・表示対象なしを区別する。
const sectionSource = fs.readFileSync('src/components/HomeReviewsSection.jsx', 'utf8');
const section = compileModule(sectionSource, {
  react: React,
  '../data/siteCopy.js': { NEUTRAL_REVIEW_NOTE: 'QA中立宣言' },
  '../compat/router': { Link: ({ to, children, ...props }) => React.createElement('a', { ...props, href: to }, children) },
  './HomeReviewCard.jsx': ({ r }) => React.createElement('article', { 'data-review-id': r.id }, r.snippet),
  '../utils/analytics': { trackEvent() {} }, '../utils/homeReviews': feedHelpers,
}).default;
const renderSection = (props) => renderToStaticMarkup(React.createElement(section, props));
const errorHtml = renderSection({ reviewLoadFailed: true, reviewStats: null });
assert.ok(errorHtml.includes('公開口コミを読み込めませんでした') && errorHtml.includes('もう一度読み込む'));
assert.ok(!errorHtml.includes('まだ公開口コミがありません'));
const zeroHtml = renderSection({ reviewLoadFailed: false, reviewStats: { total: 0 } });
assert.ok(zeroHtml.includes('まだ公開口コミがありません'));
assert.ok(!zeroHtml.includes('もう一度読み込む'));
const ineligibleHtml = renderSection({ reviewStats: { total: 34 }, latestReviews: [] });
assert.ok(ineligibleHtml.includes('ホームに表示できる口コミがありません'));
assert.ok(!ineligibleHtml.includes('まだ公開口コミがありません'));
const recoveredHtml = renderSection(recoveredSsr.props);
assert.ok(recoveredHtml.includes('最新の実体験口コミ') && recoveredHtml.includes(fixtureReviews[0].id));
assert.ok(!recoveredHtml.includes('公開口コミを読み込めませんでした'));

const home = fs.readFileSync('src/pages/Home.jsx', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
assert.match(home, /function HomePage\([^)]*reviewLoadFailed\s*=\s*false/);
assert.match(home, /<HomeReviewsSection[\s\S]*?reviewLoadFailed=\{reviewLoadFailed\}/, 'Home must forward SSR failure to review section');
assert.match(sectionSource, /const EMPTY_REVIEWS = \[\]/);
assert.match(sectionSource, /reviewsByPref = EMPTY_REVIEWS/);
assert.match(sectionSource, /latestReviews = EMPTY_REVIEWS/);
assert.match(sectionSource, /window\.location\.reload\(\)/, 'retry must request fresh SSR props');
assert.match(sectionSource, /disabled=\{retrying\}/);

console.log('✅ ホーム口コミ: 34件復帰・持続障害503/no-store・真の0件・補助取得失敗・再試行表示を実行検証');
