/** B04: 実SearchPageを動かし、人物検索と口コミ情報の失敗・世代・確定人数を分離する。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as identity from '../../src/utils/reviewIdentity.js';
import * as destinationHelpers from '../../src/utils/unlistedReviewDestination.js';

const original = fs.readFileSync('src/pages/SearchPage.jsx', 'utf8');
const equalDeps = (a, b) => a?.length === b?.length && a?.every((v, i) => Object.is(v, b[i]));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const person = (id = 'qa-a', shopId = 'qa-shop', name = 'QA人物A') => ({ id, shop_id: shopId, name, image_url: '/qa.webp' });
const review = (p = person(), tags = ['美人系'], rating = 4) => ({ id: `review-${p.id}`, therapist_id: p.id, shop_id: p.shop_id, therapist_name: p.name, tags, rating });
const empty = () => null;
const link = ({ to, children, ...props }) => React.createElement('a', { ...props, href: to }, children);

function harness(source = original, tags = '美人系') {
  const slots = [], effects = [], timers = new Map();
  const env = { requests: [], names: [], frames: [], timerId: 0, shops: [{ id: 'qa-shop', name: 'QA店舗' }], params: new URLSearchParams({ cast: 'QA', tags }) };
  let cursor = 0, dirty = true, tree, setterCalls = 0;
  const transition = fn => fn();
  const hooks = {
    ...React,
    useState(initial) { const i = cursor++; slots[i] ||= { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, update => {
      setterCalls++; const next = typeof update === 'function' ? update(slots[i].value) : update;
      if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; }
    }]; },
    useRef(initial) { const i = cursor++; slots[i] ||= { ref: { current: initial } }; return slots[i].ref; },
    useMemo(fn, deps) { const i = cursor++; if (!slots[i] || !equalDeps(slots[i].deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useTransition() { return [false, transition]; },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || !equalDeps(slots[i].deps, deps)) { const cleanup = slots[i]?.cleanup; slots[i] = { deps, cleanup }; effects.push(() => { cleanup?.(); slots[i].cleanup = fn(); }); } },
  };
  const setParams = params => { env.params = new URLSearchParams(params); };
  const client = { from(table) {
    assert.equal(table, 'reviews'); const request = { table, ...deferred() }; let sent = false;
    const query = { select() { return query; }, in(key, ids) { request.ids = ids; return query; }, order() { return query; }, range(from, to) { request.offset = from; request.end = to; return query; },
      then(done, fail) { if (!sent) { sent = true; env.requests.push(request); } return request.promise.then(done, fail); },
    }; return query;
  } };
  const dependencies = {
    react: hooks, '../components/LineIcon.jsx': empty, '../data/constants': { TAG_CATEGORIES: [{ id: 'qa', titleEn: 'タグ', tags: ['美人系', 'スレンダー'] }] },
    '../compat/router': { Link: link, useSearchParams: () => [env.params, setParams] },
    '../contexts/DataContext.jsx': { useShopData: () => ({ shops: env.shops, shopById: Object.fromEntries(env.shops.map(s => [s.id, s])) }) },
    '../lib/supabase': { supabase: client }, '../utils/reviewIdentity.js': identity,
    '../utils/unlistedReviewDestination.js': destinationHelpers,
    '../components/LazyImage.jsx': ({ alt }) => React.createElement('img', { alt }), '../components/ui/Skeleton.jsx': { TherapistCardSkeleton: () => React.createElement('div', null, 'QAスケルトン') },
    '../components/Header.jsx': empty, '../components/SeoHead.jsx': empty, '../components/LocationLabel.jsx': empty,
    '../utils/searchMatch': { rankShops: () => [] }, '../utils/therapistSearch.js': { THERAPIST_NAME_QUERY_MAX_LENGTH: 80, fetchTherapistsByName: (_client, name) => { const r = { name, ...deferred() }; env.names.push(r); return r.promise; } },
    '../utils/analytics': { trackEvent() {} }, '../components/ShopStatusBanner.jsx': { ShopStatusChip: empty },
    '../utils/shopHelpers': { getDisplayName: name => name }, '../utils/brandGroups.js': { buildBrands: rows => rows, brandCanonicalPath: () => '/qa' },
  };
  const loadedModule = { exports: {} };
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const noop = () => {};
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { console: { error: noop },
    window: { matchMedia: () => ({ matches: true, addEventListener: noop, removeEventListener: noop }), scrollTo: noop },
    document: { body: { style: {} }, activeElement: null, addEventListener: noop, removeEventListener: noop },
    setTimeout(fn) { const id = ++env.timerId; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); },
  })(name => { assert.ok(Object.hasOwn(dependencies, name), `Unknown search import ${name}`); return dependencies[name]; }, loadedModule, loadedModule.exports);
  function flush() { for (let i = 0; dirty; i++) { assert.ok(i < 35, 'Search must settle'); dirty = false; cursor = 0; tree = loadedModule.exports.default({}); env.frames.push(renderToStaticMarkup(tree)); effects.splice(0).forEach(fn => fn()); } }
  function walk(node, out = []) { if (!node || typeof node !== 'object') return out; if (node.type) out.push(node); React.Children.forEach(node.props?.children, child => walk(child, out)); return out; }
  function text(node) { return renderToStaticMarkup(React.createElement(React.Fragment, null, node.props.children)); }
  const api = {
    env,
    html() { flush(); return renderToStaticMarkup(tree); },
    update(fn = noop) { fn(); dirty = true; flush(); },
    async settle() { for (let i = 0; i < 4; i++) { await new Promise(resolve => setImmediate(resolve)); flush(); } },
    click(label) { flush(); const button = walk(tree).find(n => n.type === 'button' && text(n).includes(label)); assert.ok(button, `Missing search button ${label}`); button.props.onClick(); flush(); },
    type(name) { flush(); const input = walk(tree).find(n => n.type === 'input' && n.props.placeholder === 'セラピスト名で検索'); assert.ok(input); input.props.onChange({ target: { value: name } }); flush(); },
    debounce() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); flush(); },
    unmount() { slots.forEach(s => s.cleanup?.()); },
    get setterCalls() { return setterCalls; },
  }; flush(); return api;
}
function noFalseZero(h) { assert.ok(!h.html().includes('キャスト 0件'), 'Unknown tag matches cannot become zero'); assert.ok(!h.html().includes('見つかりませんでした'), 'Unknown tags cannot show the empty result invitation'); }
async function people(h, rows = [person()]) { h.env.names.at(-1).resolve({ data: rows, error: null, capped: false }); await h.settle(); }
async function metadata(h, rows = [review()]) { h.env.requests.at(-1).resolve({ data: rows, error: null }); await h.settle(); }

async function verify(source = original) {
  const slow = harness(source); noFalseZero(slow); await people(slow); noFalseZero(slow);
  assert.ok(slow.html().includes('タグ・口コミ件数・評価を確認中')); await metadata(slow);
  assert.ok(slow.html().includes('QA人物A') && slow.html().includes('キャスト 1件'));

  for (const mode of ['503', 'network', 'invalid']) {
    const h = harness(source); await people(h);
    const pending = h.env.requests.at(-1);
    if (mode === 'network') pending.reject(new Error('QA network'));
    else pending.resolve(mode === '503' ? { data: [], error: { code: '503' } } : { data: null, error: null });
    await h.settle(); noFalseZero(h); assert.ok(h.html().includes('口コミ情報を再取得'));
    const nameCount = h.env.names.length; h.click('口コミ情報を再取得'); await h.settle(); await metadata(h);
    assert.equal(h.env.names.length, nameCount, 'Metadata retry must not repeat person search');
    assert.ok(h.html().includes('キャスト 1件'));
  }
  const none = harness(source); await people(none); await metadata(none, []);
  assert.ok(none.html().includes('キャスト 0件') && none.html().includes('見つかりませんでした'));
  const noPeople = harness(source); await people(noPeople, []); assert.ok(noPeople.html().includes('キャスト 0件')); assert.equal(noPeople.env.requests.length, 0);

  const failedPeople = harness(source); failedPeople.env.names[0].resolve({ data: null, error: { code: '503' } }); await failedPeople.settle(); noFalseZero(failedPeople);
  assert.ok(failedPeople.html().includes('人物の検索結果を読み込めませんでした'));
  failedPeople.click('再読み込み'); await people(failedPeople); await metadata(failedPeople); assert.ok(failedPeople.html().includes('キャスト 1件'));

  for (const oldResult of ['success', 'failure']) {
    const h = harness(source); await people(h); const old = h.env.requests[0];
    h.type('QB'); noFalseZero(h); assert.ok(!h.html().includes('QA人物A'), 'Old people disappear during debounce'); h.debounce(); await h.settle();
    const b = person('qa-b', 'qa-shop-b', 'QA人物B'); await people(h, [b]); await metadata(h, [review(b)]);
    const html = h.html(); old.resolve(oldResult === 'success' ? { data: [review()], error: null } : { data: null, error: { code: '503' } }); await h.settle();
    assert.equal(h.html(), html, 'Old metadata success/error cannot replace the current result');
  }
  const firstRender = harness(source); await people(firstRender); await metadata(firstRender);
  firstRender.type('QB'); firstRender.debounce(); await firstRender.settle();
  const framesBefore = firstRender.env.frames.length;
  await people(firstRender, [person('qa-b', 'qa-shop', 'QA人物B')]);
  assert.ok(firstRender.env.frames.slice(framesBefore).every(html => !html.includes('キャスト 0件') && !html.includes('見つかりませんでした')), 'New people cannot use old metadata before effect cleanup');
  await metadata(firstRender, [review(person('qa-b', 'qa-shop', 'QA人物B'))]);
  const catalogChange = harness(source); await people(catalogChange); await metadata(catalogChange);
  const catalogFrames = catalogChange.env.frames.length;
  catalogChange.update(() => { catalogChange.env.shops = catalogChange.env.shops.map(s => ({ ...s, city: 'QA別地域' })); });
  assert.ok(catalogChange.env.frames.slice(catalogFrames).every(html => !html.includes('QA人物A')), 'Changed brand search fields invalidate the old result before effects');
  for (const sort of ['口コミ', '評価']) {
    const h = harness(source, ''); await people(h, [person('a'), person('b', 'qa-shop', 'QA人物B')]); h.click(sort); noFalseZero(h);
    assert.ok(!h.html().includes('QA人物A'), 'Unconfirmed review ordering must wait');
    h.env.requests.at(-1).resolve({ data: null, error: { code: '503' } }); await h.settle(); noFalseZero(h); assert.ok(h.html().includes('口コミ情報を再取得'));
    h.click('口コミ情報を再取得'); await h.settle(); await metadata(h, [review(person('b', 'qa-shop', 'QA人物B'), [], 5), { ...review(person('b', 'qa-shop', 'QA人物B'), [], 5), id: 'second-b' }, review(person('a'), [], 3)]);
    assert.ok(h.html().indexOf('QA人物B') < h.html().indexOf('QA人物A'), 'Confirmed scores/counts drive ordering');
  }
  const pages = harness(source); const many = Array.from({ length: 51 }, (_, i) => person(`qa-${i}`, `shop-${i}`)); await people(pages, many);
  assert.equal(pages.env.requests[0].ids.length, 50);
  await metadata(pages, Array.from({ length: 1000 }, (_, i) => ({ ...review(many[0]), id: `r-${i}` })));
  assert.equal(pages.env.requests[1].offset, 1000); noFalseZero(pages); await metadata(pages, []);
  assert.equal(pages.env.requests[2].ids.length, 1); noFalseZero(pages); await metadata(pages, [review(many[50])]);
  assert.ok(pages.html().includes('キャスト 2件'), 'All shop batches and review pages must be included');
  const unmount = harness(source); await people(unmount); unmount.unmount(); const before = unmount.setterCalls; unmount.env.requests[0].resolve({ data: [review()], error: null }); await unmount.settle();
  assert.equal(unmount.setterCalls, before, 'Unmounted search must not apply responses');
}
await verify();
const mutations = [
  ["const countsReady = Boolean(currentMetadata?.ready);", 'const countsReady = true;'],
  ["if (error) throw error;\n            if (!Array.isArray(data))", "if (error) return;\n            if (!Array.isArray(data))"],
  ["metadataResult?.key === metadataKey ? metadataResult : null", 'metadataResult'],
  ["return () => { cancelled = true; };\n  }, [serverTherapists", "return () => {};\n  }, [serverTherapists"],
  ["batch < shopIds.length", 'batch < Math.min(shopIds.length, 50)'],
];
for (const [before, after] of mutations) { assert.ok(original.includes(before), `Missing mutation anchor: ${before}`); await assert.rejects(verify(original.replace(before, after)), undefined, `Removed search protection must fail: ${before}`); }
console.log('✅ 検索口コミ情報: 遅延/503/通信例外/再試行・真0件・旧応答・評価/件数順・全取得・5妨害検証');
