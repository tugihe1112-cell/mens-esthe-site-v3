/** 口コミ一覧の実SSR・実コンポーネントを動かし、0件誤表示と古い通信応答を検査する。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { normalizeTherapistName } from '../../src/utils/reviewIdentity.js';
import { isNotListed, NOT_LISTED_SHORT } from '../../src/utils/therapistStatus.js';

const root = process.env.POPULAR_REVIEW_GUARD_ROOT || process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fixture = (prefix, count = 20) => Array.from({ length: count }, (_, i) => ({
  id: `${prefix}-${i}`, shop_id: 'qa-shop', therapist_id: 'qa-person', therapist_name: 'QA人物',
  content: `QA本文${prefix}-${i}`, rating: 4, tags: [], created_at: '2026-10-02T00:00:00Z',
}));
const newest = fixture('newest');
const highest = fixture('highest');
const shop = { id: 'qa-shop', name: 'QA店舗', raw_data: { prefecture: '東京都', area: ['QA地域'] } };
const therapist = { id: 'qa-person', name: 'QA人物', shop_id: 'qa-shop', image_url: null, is_active: false };
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
};
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const depsEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

function compile(source, dependencies, extra = {}) {
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} };
  const requireMock = name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unexpected review QA import ${name}`);
  };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    process: { env: { ...process.env, VITE_SUPABASE_URL: 'https://qa.supabase.invalid' } },
    console: { ...console, error() {}, warn() {} }, setTimeout, clearTimeout, ...extra,
  })(requireMock, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

// 必須口コミ取得と、補助情報取得を独立させた実getServerSidePropsの契約。
function supabaseMock(overrides = {}) {
  const calls = [];
  return { calls, from(table) {
    const query = { table, columns: '', filters: [] };
    const builder = {
      select(columns) { query.columns = columns; return builder; },
      eq(...args) { query.filters.push(args); return builder; },
      order() { return builder; }, limit() { return builder; }, in() { return builder; },
      then(done, fail) {
        calls.push(query);
        return Promise.resolve().then(() => {
          const value = overrides[table];
          if (value instanceof Error) throw value;
          return value || { data: table === 'reviews' ? newest : table === 'shops' ? [shop] : [therapist], error: null };
        }).then(done, fail);
      },
    };
    return builder;
  } };
}
const ssrSource = read('pages/popular-reviews.jsx');
async function ssr(overrides = {}, createError = false) {
  const client = supabaseMock(overrides);
  const page = compile(ssrSource, {
    react: React,
    '../server/supabaseServer': { createServerSupabase: () => { if (createError) throw new Error('QA setup failed'); return client; } },
    '../src/pages/PopularReviewsPage': () => null,
    '../src/utils/reviewIdentity.js': { normalizeTherapistName },
    // 複数ルームのブランドのルーム数（2026-10-10）。最初のHTMLの店舗リンクを /brands/ にするため。
    '../server/roomCounts.js': { loadMultiRoomCounts: async () => ({ qa_group: 2 }) },
  });
  const res = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key.toLowerCase()] = value; } };
  const result = await page.getServerSideProps({ res });
  assert.equal(page.default(result.props).props.initialLoadError, result.props.initialLoadError, 'SSR route must forward failure state');
  return { res, props: result.props, calls: client.calls };
}
for (const failure of [{ data: null, error: { message: 'QA 503' } }, { data: newest, error: { message: 'QA partial error' } }, new Error('QA network'), { data: {}, error: null }]) {
  const result = await ssr({ reviews: failure });
  assert.equal(result.props.initialLoadError, true);
  assert.equal(result.res.statusCode, 503);
  assert.equal(result.res.headers['cache-control'], 'no-store');
  assert.ok(Number(result.res.headers['retry-after']) > 0);
}
assert.equal((await ssr({}, true)).props.initialLoadError, true);
const emptySsr = await ssr({ reviews: { data: [], error: null } });
assert.equal(emptySsr.props.initialLoadError, false);
assert.equal(emptySsr.props.initialReviews.length, 0);
assert.equal(emptySsr.res.statusCode, 200);
for (const table of ['shops', 'therapists']) {
  for (const failure of [{ data: null, error: { message: 'QA optional failure' } }, new Error('QA optional rejected')]) {
    const result = await ssr({ [table]: failure });
    assert.equal(result.props.initialLoadError, false);
    assert.equal(result.props.initialReviews.length, 20, `${table} failure must preserve fetched public reviews`);
    assert.equal(result.res.statusCode, 200);
    if (table === 'therapists') assert.equal(Object.keys(result.props.initialTherapistMap).length, 0, 'failed metadata must not manufacture inactive people');
  }
}
const successSsr = await ssr();
assert.equal(successSsr.props.ssrRoomCounts?.qa_group, 2, 'popular SSR must pass room counts so first-HTML shop links skip the 301');
assert.ok(successSsr.calls.find(call => call.table === 'shops').columns.includes('group_id'), 'popular SSR must read group_id to pick the brand URL');
assert.ok(Object.values(successSsr.props.initialShopMap).every(shop => 'group_id' in shop), 'initialShopMap must carry group_id');
assert.equal(successSsr.props.initialTherapistMap['qa-person'].is_active, false);
assert.ok(successSsr.calls.find(call => call.table === 'therapists').columns.includes('is_active'));
assert.ok(successSsr.calls.find(call => call.table === 'reviews').filters.some(([key, value]) => key === 'is_public' && value === true));

// フックの入出力だけを置換し、画面本体・effect・リクエスト処理は実ソースを実行する。
function clientHarness(props = {}, options = {}) {
  const slots = [];
  const pendingEffects = [];
  const reviewRequests = [];
  const metadataRequests = [];
  let cursor = 0;
  let dirty = true;
  let tree;
  let setterCalls = 0;
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => {
        setterCalls += 1;
        const next = typeof value === 'function' ? value(slots[index].value) : value;
        if (!Object.is(next, slots[index].value)) { slots[index].value = next; dirty = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { ref: { current: initial } };
      return slots[index].ref;
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !depsEqual(slots[index].deps, deps)) slots[index] = { deps, callback };
      return slots[index].callback;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || !depsEqual(slots[index].deps, deps)) {
        const cleanup = slots[index]?.cleanup;
        slots[index] = { deps, cleanup };
        pendingEffects.push(() => { cleanup?.(); slots[index].cleanup = effect(); });
      }
    },
  };
  const noop = () => null;
  const Page = compile(read('src/pages/PopularReviewsPage.jsx'), {
    react: hooks,
    '../utils/shopFields': { shopAreaList: value => value.area ? [value.area] : [] },
    '../components/LineIcon.jsx': noop,
    '../utils/reviewIdentity.js': { normalizeTherapistName },
    '../utils/brandGroups.js': { shopHref: value => `/shops/${value.id}` },
    '../contexts/DataContext.jsx': { useShopData: () => ({ roomCounts: {}, shopById: {} }) },
    '../utils/supabaseRest': { authHeaders: async () => ({ apikey: 'QA' }) },
    '../compat/router': { Link: ({ to, children, ...rest }) => React.createElement('a', { ...rest, href: to }, children) },
    '../components/Header.jsx': noop, '../components/SeoHead.jsx': noop,
    '../components/ReviewLikeButton.jsx': noop,
    '../utils/therapistStatus.js': { isNotListed, NOT_LISTED_SHORT },
    '../components/LazyImage.jsx': noop,
    '../utils/shopHelpers': { getDisplayName: name => name },
  }, { fetch: async requestUrl => {
    const url = new URL(requestUrl);
    const request = { url, ...deferred() };
    if (url.pathname.endsWith('/reviews')) { reviewRequests.push(request); return request.promise; }
    metadataRequests.push(request);
    if (options.delayedMetadata) return request.promise;
    if (options.metadataFailure) return response({ message: 'QA metadata unavailable' }, 503);
    return response(url.pathname.endsWith('/shops') ? [shop] : [therapist]);
  } });
  function flush() {
    for (let loop = 0; dirty; loop += 1) {
      assert.ok(loop < 30, 'component must not loop');
      dirty = false; cursor = 0; tree = Page.default(props);
      pendingEffects.splice(0).forEach(run => run());
    }
  }
  function walk(element, output = []) {
    if (!element || typeof element !== 'object') return output;
    if (element.type) output.push(element);
    React.Children.forEach(element.props?.children, child => walk(child, output));
    return output;
  }
  const api = {
    reviewRequests, metadataRequests,
    async settle() { for (let i = 0; i < 3; i += 1) { await new Promise(resolve => setImmediate(resolve)); flush(); } },
    click(label, times = 1) {
      flush();
      const button = walk(tree).find(node => node.type === 'button' && node.props.children === label);
      assert.ok(button, `missing button ${label}`);
      assert.ok(!button.props.disabled, `${label} must be enabled`);
      for (let i = 0; i < times; i += 1) button.props.onClick();
      flush();
    },
    html() { flush(); return renderToStaticMarkup(tree); },
    ids() { flush(); return walk(tree).filter(node => node.type === 'article').map(node => node.key); },
    busy() { flush(); return walk(tree).some(node => node.props?.['aria-busy'] === true); },
    pressed(label) { flush(); return walk(tree).find(node => node.type === 'button' && node.props.children === label)?.props['aria-pressed']; },
    unmount() { slots.forEach(slot => slot.cleanup?.()); },
    get setterCalls() { return setterCalls; },
  };
  flush();
  return api;
}

const failedClient = clientHarness({ initialReviews: [], initialLoadError: true });
assert.ok(failedClient.html().includes('読み込めませんでした') && failedClient.html().includes('再読み込み'));
assert.ok(!failedClient.html().includes('最初の口コミを書く') && !failedClient.html().includes('口コミがまだありません'));
failedClient.click('再読み込み'); await failedClient.settle();
assert.equal(failedClient.reviewRequests.length, 1);
failedClient.reviewRequests[0].resolve(response(newest)); await failedClient.settle();
assert.equal(failedClient.ids().length, 20);
assert.ok(!failedClient.html().includes('読み込めませんでした'));
const zeroClient = clientHarness({ initialReviews: [], initialLoadError: false });
assert.ok(zeroClient.html().includes('最初の口コミを書く'));

const seedProps = { initialReviews: newest, initialHasMore: true };
const reversed = clientHarness(seedProps);
reversed.click('評価順'); await reversed.settle();
reversed.click('新着順'); await reversed.settle();
assert.equal(reversed.reviewRequests.length, 2);
assert.ok(reversed.reviewRequests[0].url.searchParams.get('order').startsWith('rating.desc'));
reversed.reviewRequests[0].resolve(response(highest)); await reversed.settle();
assert.deepEqual(reversed.ids(), newest.map(row => row.id), 'old rating response cannot overwrite selected new order');
assert.equal(reversed.busy(), true, 'stale finally cannot end the current loading state');
reversed.reviewRequests[1].resolve(response(fixture('fresh'))); await reversed.settle();
assert.deepEqual(reversed.ids(), fixture('fresh').map(row => row.id));
assert.equal(reversed.busy(), false);
assert.equal(reversed.pressed('新着順'), true);

const staleError = clientHarness(seedProps);
staleError.click('評価順'); await staleError.settle();
staleError.click('新着順'); await staleError.settle();
staleError.reviewRequests[1].resolve(response(newest)); await staleError.settle();
staleError.reviewRequests[0].resolve(response({ message: 'old error' }, 503)); await staleError.settle();
assert.ok(!staleError.html().includes('読み込めませんでした'), 'stale errors cannot affect current successful sort');

const sortFailure = clientHarness(seedProps);
sortFailure.click('評価順'); await sortFailure.settle();
sortFailure.reviewRequests[0].resolve(response({}, 503)); await sortFailure.settle();
assert.equal(sortFailure.pressed('評価順'), true);
assert.deepEqual(sortFailure.ids(), newest.map(row => row.id));
assert.ok(sortFailure.html().includes('現在は新着順の口コミを表示しています。'));
assert.ok(sortFailure.html().includes('読み込めませんでした') && sortFailure.html().includes('再読み込み'));
sortFailure.click('再読み込み'); await sortFailure.settle();
assert.ok(sortFailure.reviewRequests[1].url.searchParams.get('order').startsWith('rating.desc'));
sortFailure.reviewRequests[1].resolve(response(highest)); await sortFailure.settle();
assert.deepEqual(sortFailure.ids(), highest.map(row => row.id));
assert.ok(!sortFailure.html().includes('現在は新着順'));

const switchedMore = clientHarness(seedProps);
switchedMore.click('もっと見る'); await switchedMore.settle();
assert.equal(switchedMore.reviewRequests[0].url.searchParams.get('offset'), '20');
switchedMore.click('評価順'); await switchedMore.settle();
switchedMore.reviewRequests[1].resolve(response(highest)); await switchedMore.settle();
switchedMore.reviewRequests[0].resolve(response(fixture('old-more', 1))); await switchedMore.settle();
assert.deepEqual(switchedMore.ids(), highest.map(row => row.id), 'old load-more must not append to a different sort');
switchedMore.click('もっと見る'); await switchedMore.settle();
assert.equal(switchedMore.reviewRequests[2].url.searchParams.get('offset'), '20', 'old more must not alter offset/hasMore');

const moreRetry = clientHarness(seedProps);
moreRetry.click('もっと見る', 2); await moreRetry.settle();
assert.equal(moreRetry.reviewRequests.length, 1, 'double-click must not duplicate requests');
moreRetry.reviewRequests[0].resolve(response({}, 503)); await moreRetry.settle();
assert.ok(moreRetry.html().includes('追加分を読み込めませんでした'));
moreRetry.click('もう一度読み込む'); await moreRetry.settle();
assert.equal(moreRetry.reviewRequests[1].url.searchParams.get('offset'), '20', 'retry must request the same offset');
const duplicates = fixture('more'); duplicates[0] = newest[0]; duplicates[2] = duplicates[1];
moreRetry.reviewRequests[1].resolve(response(duplicates)); await moreRetry.settle();
assert.equal(moreRetry.ids().length, new Set(moreRetry.ids()).size, 'deduplicate existing and within-response review IDs');
moreRetry.click('もっと見る'); await moreRetry.settle();
assert.equal(moreRetry.reviewRequests[2].url.searchParams.get('offset'), '40', 'offset advances only after successful page');

const optionalFailure = clientHarness({ initialReviews: [], initialLoadError: true }, { metadataFailure: true });
optionalFailure.click('再読み込み'); await optionalFailure.settle();
optionalFailure.reviewRequests[0].resolve(response(newest)); await optionalFailure.settle();
assert.equal(optionalFailure.ids().length, 20);
assert.ok(!optionalFailure.html().includes(NOT_LISTED_SHORT), 'metadata failure must not mark active people as archived');

const metadataRace = clientHarness(seedProps, { delayedMetadata: true });
metadataRace.click('評価順'); await metadataRace.settle();
metadataRace.reviewRequests[0].resolve(response(highest)); await metadataRace.settle();
const oldMetadata = [...metadataRace.metadataRequests];
metadataRace.click('新着順'); await metadataRace.settle();
metadataRace.reviewRequests[1].resolve(response(newest)); await metadataRace.settle();
metadataRace.click('評価順'); await metadataRace.settle();
metadataRace.reviewRequests[2].resolve(response(highest)); await metadataRace.settle();
oldMetadata.forEach(request => request.resolve(response(request.url.pathname.endsWith('/shops') ? [{ ...shop, name: 'STALE_METADATA' }] : [])));
await metadataRace.settle();
assert.ok(!metadataRace.html().includes('STALE_METADATA'), 'old metadata must not update the new generation');

const unmounted = clientHarness(); await unmounted.settle();
unmounted.unmount(); const callsBefore = unmounted.setterCalls;
unmounted.reviewRequests[0].resolve(response(newest)); await unmounted.settle();
assert.equal(unmounted.setterCalls, callsBefore, 'unmounted success/finally must not update any state');
const unmountedError = clientHarness(); await unmountedError.settle();
unmountedError.unmount(); const errorCallsBefore = unmountedError.setterCalls;
unmountedError.reviewRequests[0].reject(new Error('QA unmounted failure')); await unmountedError.settle();
assert.equal(unmountedError.setterCalls, errorCallsBefore, 'unmounted catch/finally must not update any state');

console.log('✅ 口コミ一覧: SSR障害/真の0件/補助情報失敗/再試行/ソート応答逆転/追加取得競合/同offset/重複排除/アンマウント');
