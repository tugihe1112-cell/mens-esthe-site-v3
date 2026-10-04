/** B01/B05: 実ページ・実hookを動かす。妨害はメモリ内のソースだけに適用する。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const sources = new Map();
const source = file => {
  if (!sources.has(file)) sources.set(file, fs.readFileSync(file, 'utf8'));
  return sources.get(file);
};
function compile(file, dependencies = {}, globals = {}, mutation) {
  let input = source(file);
  if (mutation?.file === file) {
    assert.ok(input.includes(mutation.before), `Missing mutation target ${mutation.name}`);
    input = input.replace(mutation.before, mutation.after);
  }
  const code = ts.transpileModule(input, { fileName: file, compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    process: { env: { VITE_SUPABASE_URL: 'https://fixture.invalid' } }, console,
    ...globals,
  })(id => { assert.ok(id in dependencies, `Unexpected dependency ${id} in ${file}`); return dependencies[id]; }, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const noop = () => null;
const Link = ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children);
const html = output => renderToStaticMarkup(output);
const equalDeps = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
function host(build) {
  const slots = [], effects = [];
  let cursor = 0, dirty = true, output, calls = 0;
  const hooks = {
    ...React,
    useState(initial) {
      const i = cursor++;
      slots[i] ||= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => {
        calls += 1;
        const next = typeof value === 'function' ? value(slots[i].value) : value;
        if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; }
      }];
    },
    useRef(initial) { return (slots[cursor++] ||= { ref: { current: initial } }).ref; },
    useMemo(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !equalDeps(slots[i].deps, deps)) slots[i] = { deps, value: fn() };
      return slots[i].value;
    },
    useCallback(fn, deps) { return hooks.useMemo(() => fn, deps); },
    useEffect(effect, deps) {
      const i = cursor++;
      if (!slots[i] || !equalDeps(slots[i].deps, deps)) {
        const cleanup = slots[i]?.cleanup;
        slots[i] = { deps, cleanup };
        effects.push(() => { cleanup?.(); slots[i].cleanup = effect(); });
      }
    },
  };
  const render = build(hooks);
  function flush(firstRender) {
    for (let loop = 0; dirty; loop += 1) {
      assert.ok(loop < 30, 'Component must settle');
      cursor = 0; dirty = false; output = render();
      if (loop === 0) firstRender?.(output);
      effects.splice(0).forEach(effect => effect());
    }
  }
  function walk(node, nodes = []) {
    if (!node || typeof node !== 'object') return nodes;
    if (node.type) nodes.push(node);
    if (typeof node.type === 'function') walk(node.type(node.props), nodes);
    else React.Children.forEach(node.props?.children, child => walk(child, nodes));
    return nodes;
  }
  const api = {
    update(fn = () => {}, firstRender) { fn(); dirty = true; flush(firstRender); },
    async settle() { for (let i = 0; i < 3; i += 1) { await new Promise(resolve => setImmediate(resolve)); flush(); } },
    value() { flush(); return output; },
    html() { return html(api.value()); },
    find(predicate) { return walk(api.value()).find(predicate); },
    click(label) {
      const button = api.find(node => node.type === 'button' && html(React.createElement(React.Fragment, null, node.props.children)).includes(label));
      assert.ok(button, `Missing button ${label}`);
      button.props.onClick(); flush();
    },
    unmount() { slots.forEach(slot => slot.cleanup?.()); },
    get calls() { return calls; },
  };
  flush(); return api;
}
function deferredRequest(url, options) {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  const request = { url: new URL(url), options, done: false, promise };
  request.resolve = (data, status = 200) => { request.done = true; resolve({ ok: status < 400, json: async () => data }); };
  request.reject = () => { request.done = true; reject(new Error('Fixture network failure')); };
  return request;
}
const identity = compile('src/utils/reviewIdentity.js');
const groups = compile('src/utils/brandGroups.js', {
  './shopHelpers.js': compile('src/utils/shopHelpers.js'), './reviewIdentity.js': identity,
});
const constants = { TAG_CATEGORIES: [{ id: 'style', title: '体型', titleEn: '体型', tags: ['スレンダー'] }] };
const person = (brand, i, shop = `${brand}-shop-1`) => ({ id: `${brand}-id-${i}`, name: `${brand}人物${i}`, shop_id: shop, image_url: '/fixture.webp' });
function brandProps(brand, size = 1, shopIds = [`${brand}-shop-1`, `${brand}-shop-2`]) {
  return {
    ssrBrand: { id: brand, name: `${brand}ブランド`, shopIds, rooms: shopIds.map(id => ({ id })), primaryShopId: shopIds[0] },
    ssrRoster: Array.from({ length: size }, (_, i) => ({ ...person(brand, i, shopIds[0]), shopId: shopIds[0] })),
    ssrRosterTruncated: size === 24,
  };
}
function brandHost(mutation) {
  const env = { brandId: 'A', props: brandProps('A', 24), requests: [], contextRows: [] };
  env.props.ssrRoster.push(person('B', 999));
  const fetchFixture = (url, options) => { const request = deferredRequest(url, options); env.requests.push(request); return request.promise; };
  const h = host(hooks => {
    const Page = compile('src/pages/BrandPage.jsx', {
      react: hooks, '../compat/router': { useParams: () => ({ brandId: env.brandId }), Link },
      '../contexts/DataContext.jsx': { useShopData: () => ({ shops: [], loading: false, getTherapistsByShopId: id => env.contextRows.filter(t => t.shop_id === id) }) },
      '../components/Header.jsx': noop, '../components/LazyImage.jsx': noop, '../components/SeoHead.jsx': noop,
      '../components/LocationLabel.jsx': noop, '../utils/brandGroups.js': groups,
      '../utils/shopHelpers.js': { getTherapistDisplayName: name => name }, '../utils/reviewIdentity.js': identity,
      '../data/constants': constants,
      '../components/TagFilterSidebar.jsx': compile('src/components/TagFilterSidebar.jsx', { react: React, '../data/constants': constants }),
      '../hooks/useResponsiveFilterSheet.js': { useResponsiveFilterSheet: () => ({ isOpen: false, open: noop, close: noop }) },
      '../utils/supabaseRest': { authHeaders: async () => ({}) }, '../components/ShopStatusBanner.jsx': { ShopStatusChip: noop },
      '../components/NeutralReviewNote.jsx': noop, '../components/OfficialLinks.jsx': noop, '../components/RatingFingerprint.jsx': { __esModule: true, default: noop, averageFingerprint: () => null },
      '../utils/nameReading.js': compile('src/utils/nameReading.js'),
      '../utils/brandRosterLoading.js': compile('src/utils/brandRosterLoading.js', {}, { fetch: fetchFixture }, mutation),
    }, { fetch: fetchFixture }, mutation);
    return () => Page.default(env.props);
  });
  return { ...h, env, get calls() { return h.calls; } };
}
const pending = (h, table) => h.env.requests.filter(request => !request.done && request.url.pathname.endsWith(`/${table}`));
const changeBrand = async (h, brand, size = 1, shopIds) => {
  h.update(() => { h.env.brandId = brand; h.env.props = brandProps(brand, size, shopIds); }, output => {
    const rendered = html(output);
    assert.ok(!rendered.includes(`${brand === 'A' ? 'B' : 'A'}人物`), 'First render must exclude previous-brand people');
    assert.ok(rendered.includes('在籍一覧を読み込み中'), 'First render must exclude previous-brand completed status');
    const input = output && h.find(node => node.type === 'input');
    assert.equal(input?.props.value, '', 'Brand change resets name filter before effects');
  });
  await h.settle();
};
async function complete(h, people, reviews = [], reviewStatus = 200) {
  pending(h, 'therapists').at(-1).resolve(people);
  pending(h, 'reviews').at(-1).resolve(reviews, reviewStatus);
  await h.settle();
}
async function verifyBrand(mutation) {
  const h = brandHost(mutation); await h.settle();
  assert.equal((h.html().match(/A人物/g) || []).length, 24, 'Keep the SSR first 24');
  assert.ok(!h.html().includes('B人物999'), 'SSR candidates must belong to current shop IDs');
  assert.ok(!h.html().includes('もっと見る'), 'Out-of-scope SSR rows cannot inflate current roster');
  const fullA = Array.from({ length: 30 }, (_, i) => person('A', i));
  await complete(h, [...fullA, { ...person('A', 0, 'A-shop-2'), id: 'A-copy' }, person('B', 999)], [{ therapist_id: fullA[0].id, shop_id: 'A-shop-1', tags: ['スレンダー'] }]);
  assert.ok(!h.html().includes('B人物999'), 'Reject out-of-scope rows');
  h.click('もっと見る');
  assert.equal((h.html().match(/A人物/g) || []).length, 30, 'Fetch remaining people and deduplicate within current brand');
  h.find(node => node.type === 'input').props.onChange({ target: { value: 'A人物0' } }); h.update();
  h.click('スレンダー'); h.click('口コミ順');
  await changeBrand(h, 'B');
  assert.ok(h.html().includes('B人物0') && h.html().includes('読み込み中'));
  assert.ok(!h.html().includes('A人物') && !h.html().includes('口コミ 1'));
  pending(h, 'therapists').at(-1).resolve(null, 503); pending(h, 'reviews').at(-1).resolve([], 503); await h.settle();
  assert.ok(h.html().includes('追加取得に失敗') && h.html().includes('B人物0'), 'Failed B request retains B SSR');
  assert.ok(!h.html().includes('A人物') && !h.html().includes('在籍セラピストはいません'));
  h.click('在籍一覧を再試行'); await h.settle(); await complete(h, []);
  assert.ok(h.html().includes('B人物0') && !h.html().includes('追加取得に失敗'), 'Successful empty fetch retains current SSR');
  await changeBrand(h, 'A', 24); await complete(h, fullA);
  assert.equal((h.html().match(/A人物/g) || []).length, 24, 'Returning brand resets display count');
  await changeBrand(h, 'B', 0); await complete(h, []);
  assert.ok(h.html().includes('在籍セラピストはいません'), 'Verified empty roster has its own state');
  await changeBrand(h, 'A', 24);
  const stalePeople = pending(h, 'therapists').at(-1), staleReviews = pending(h, 'reviews').at(-1);
  await changeBrand(h, 'B');
  const bPeople = pending(h, 'therapists').at(-1), bReviews = pending(h, 'reviews').at(-1);
  const calls = h.calls;
  stalePeople.resolve(fullA); staleReviews.reject(); await h.settle();
  assert.equal(h.calls, calls, 'Obsolete success/error must not call state setters or finish current loading');
  assert.ok(h.html().includes('読み込み中') && !h.html().includes('A人物') && !h.html().includes('追加取得に失敗'));
  bPeople.resolve([person('B', 0), person('B', 1)]); bReviews.resolve([]); await h.settle();
  assert.ok(h.html().includes('B人物1'));
  await changeBrand(h, 'A', 24);
  const staleFailure = pending(h, 'therapists').at(-1), staleMetadata = pending(h, 'reviews').at(-1);
  await changeBrand(h, 'B');
  const callsBeforeFailure = h.calls;
  staleFailure.reject(); staleMetadata.resolve([{ therapist_id: fullA[0].id, shop_id: 'A-shop-1', tags: ['スレンダー'] }]); await h.settle();
  assert.equal(h.calls, callsBeforeFailure, 'Obsolete roster error and metadata success must be ignored');
  assert.ok(h.html().includes('読み込み中') && !h.html().includes('追加取得に失敗'));
  await complete(h, [person('B', 0), person('B', 1)]);
  // 店舗集合だけが更新されたときも、名簿・条件は別の対象として扱う。
  await changeBrand(h, 'B', 0, ['B-shop-3']);
  assert.ok(!h.html().includes('B人物1'), 'Changed shop ID set invalidates old results');
  await complete(h, [person('B', 3, 'B-shop-3')]);
  assert.ok(h.html().includes('B人物3'));
  h.unmount();

  const partial = brandHost(mutation); await partial.settle();
  const page = Array.from({ length: 1000 }, (_, i) => person('A', i + 100));
  pending(partial, 'therapists')[0].resolve(page); await partial.settle();
  assert.equal(pending(partial, 'therapists')[0].options.headers.Range, '1000-1999');
  pending(partial, 'therapists')[0].resolve([], 503); pending(partial, 'reviews')[0].resolve([]); await partial.settle();
  assert.ok(partial.html().includes('追加取得に失敗'), 'Partial pagination must remain a failure');
  assert.equal((partial.html().match(/A人物/g) || []).length, 24, 'Partial failure preserves SSR24 without claiming completeness');
  partial.click('在籍一覧を再試行'); await partial.settle(); await complete(partial, fullA);
  assert.ok(partial.html().includes('もっと見る') && !partial.html().includes('追加取得に失敗'));
  partial.click('もっと見る');
  partial.click('口コミ順');
  // 同じブランドの失敗した再取得でも、正常取得済みの全員は残す。
  partial.update(() => { partial.env.props = { ...partial.env.props, ssrRoster: [...partial.env.props.ssrRoster] }; }); await partial.settle();
  pending(partial, 'therapists').at(-1).reject(); pending(partial, 'reviews').at(-1).resolve([], 503); await partial.settle();
  assert.equal((partial.html().match(/A人物/g) || []).length, 30, 'Same-scope refresh failure keeps known roster');
  assert.ok(partial.html().includes('>30</span>人'), 'Same-scope refresh preserves the confirmed total');
  partial.unmount();

  const metadata = brandHost(mutation); await metadata.settle();
  await complete(metadata, fullA, null, 503);
  assert.ok(metadata.html().includes('口コミ件数とタグを読み込めませんでした') && metadata.html().includes('もっと見る'), 'Metadata failure keeps the complete roster and offers its own retry');
  metadata.click('口コミ情報を再試行'); await metadata.settle();
  await complete(metadata, fullA, [{ therapist_id: fullA[0].id, shop_id: 'A-shop-1', tags: ['スレンダー'] }]);
  assert.ok(metadata.html().includes('口コミ 1') && !metadata.html().includes('読み込めませんでした'), 'Metadata retry restores current counts and tags');
  metadata.unmount();

  const dependent = brandHost(mutation); await dependent.settle();
  dependent.find(node => typeof node.props?.onToggle === 'function').props.onToggle('スレンダー'); dependent.update();
  dependent.click('口コミ順');
  assert.equal((dependent.html().match(/A人物/g) || []).length, 24, 'Pending tag metadata must retain the current SSR cards');
  assert.ok(dependent.html().includes('確認中') && !dependent.html().includes('条件に一致するセラピストはいません'));
  pending(dependent, 'therapists').at(-1).resolve(fullA); await dependent.settle();
  assert.equal((dependent.html().match(/A人物/g) || []).length, 24, 'Successful roster alone cannot finalize tag filtering');
  pending(dependent, 'reviews').at(-1).resolve(null, 503); await dependent.settle();
  assert.equal((dependent.html().match(/A人物/g) || []).length, 24, 'Failed metadata must not turn existing cards into zero tag matches');
  assert.ok(dependent.html().includes('確認中') && dependent.html().includes('口コミ件数とタグを読み込めませんでした'));
  dependent.click('口コミ情報を再試行'); await dependent.settle();
  await complete(dependent, fullA, [0, 1].map(i => ({ therapist_id: fullA[i].id, shop_id: 'A-shop-1', tags: ['スレンダー'] })));
  assert.equal((dependent.html().match(/A人物/g) || []).length, 2, 'Apply tag filtering only after metadata is confirmed');
  dependent.find(node => typeof node.props?.onClear === 'function').props.onClear(); dependent.update();
  dependent.click('もっと見る');
  assert.equal((dependent.html().match(/A人物/g) || []).length, 30);
  dependent.update(() => { dependent.env.props = { ...dependent.env.props, ssrRoster: [...dependent.env.props.ssrRoster] }; }); await dependent.settle();
  assert.equal((dependent.html().match(/A人物/g) || []).length, 30, 'Current-scope confirmed review order survives reload');
  pending(dependent, 'therapists').at(-1).resolve([...fullA, person('A', 31)]); await dependent.settle();
  assert.ok(!dependent.html().includes('A人物31'), 'Pending metadata keeps only the current-scope confirmed review-order roster');
  pending(dependent, 'reviews').at(-1).resolve(null, 503); await dependent.settle();
  assert.equal((dependent.html().match(/A人物/g) || []).length, 30, 'Failed metadata retains known ordered results');
  assert.ok(dependent.html().includes('前回の確認結果'));
  await changeBrand(dependent, 'B');
  assert.ok(dependent.html().includes('B人物0') && !dependent.html().includes('A人物'));
  await complete(dependent, [person('B', 0)]);
  dependent.unmount();
}

const HISTORY = 'mens_esthe_history';
function historyHost(view, initial = null, mode = {}, mutation) {
  const values = new Map(initial === null ? [] : [[HISTORY, initial]]);
  const env = { mode: { ...mode }, values, operations: [], state: null, initialHtml: null };
  const storage = {
    getItem(key) { env.operations.push('read'); if (env.mode.read) throw new Error('Read denied'); return values.get(key) ?? null; },
    setItem(key, value) { env.operations.push('write'); if (env.mode.write) throw new Error('Quota exceeded'); values.set(key, value); },
    removeItem(key) {
      env.operations.push('remove');
      if (env.mode.remove) throw new Error('Delete denied');
      if (!env.mode.ignoreRemove) values.delete(key);
      if (env.mode.readbackAfterRemove) env.mode.read = true;
    },
  };
  const h = host(hooks => {
    const hook = compile('src/hooks/useRecentlyViewed.js', {
      react: hooks, '../utils/localStorage.js': compile('src/utils/localStorage.js', {}, { localStorage: storage }),
    }, {}, mutation);
    const historyHook = { ...hook, useRecentlyViewed: () => { env.state = hook.useRecentlyViewed(); return env.state; } };
    const status = compile('src/components/HistoryStorageStatus.jsx', { react: React }, {}, mutation);
    const deps = {
      react: hooks, '../compat/router': { Link }, '../hooks/useRecentlyViewed': historyHook,
      '../components/HistoryStorageStatus.jsx': status, './HistoryStorageStatus.jsx': status,
      '../components/LineIcon.jsx': noop, '../components/LazyImage.jsx': noop, '../components/Header.jsx': noop, '../components/SeoHead.jsx': noop,
    };
    const page = compile(view === 'home' ? 'src/components/RecentlyViewed.jsx' : 'src/pages/HistoryPage.jsx', deps, { window: { confirm: () => true } }, mutation);
    return () => {
      const output = page.default();
      if (env.initialHtml === null) env.initialHtml = html(output);
      return output;
    };
  });
  return { ...h, env };
}
const savedHistory = JSON.stringify([{ id: 'saved-person', name: '保存済みの人物', shopId: 'saved-shop', therapistId: 'saved-person', image_url: '/fixture.webp' }]);
async function verifyHistory(mutation) {
  for (const view of ['page', 'home']) {
    const zero = historyHost(view, null, {}, mutation);
    assert.ok(zero.env.initialHtml.includes('閲覧履歴を読み込み中') && !zero.env.initialHtml.includes('閲覧履歴はありません'), 'Initial read is not a confirmed empty history');
    assert.equal(zero.env.state.storageError, false);
    if (view === 'page') assert.ok(zero.html().includes('閲覧履歴はありません'));
    else assert.equal(zero.html(), '', 'Home hides only a successfully read empty history');
    zero.unmount();
    for (const [raw, denied] of [[savedHistory, true], ['{broken', false], ['{}', false]]) {
      const unread = historyHost(view, raw, { read: denied }, mutation);
      assert.ok(unread.env.state.readError && unread.html().includes('閲覧履歴を読み込めませんでした'));
      assert.ok(!unread.html().includes('閲覧履歴はありません'), 'Unread history cannot claim zero');
      assert.ok(!unread.env.operations.includes('write') && !unread.env.operations.includes('remove'), 'Corrupt or unreadable data stays untouched');
      unread.env.mode.read = false; unread.env.values.set(HISTORY, savedHistory);
      unread.click('履歴を再読込');
      assert.equal(unread.env.state.readError, false);
      assert.ok(unread.html().includes('保存済みの人物'));
      assert.equal(unread.env.state.addToHistory({ id: 'recovered', name: '復旧後の人物', shopId: 'saved-shop' }).ok, true, 'Successful read retry restores writable storageReady');
      unread.update();
      assert.ok(unread.html().includes('復旧後の人物'));
      unread.env.mode.read = true; unread.env.state.retryHistory(); unread.update();
      assert.ok(unread.html().includes('復旧後の人物') && unread.html().includes('読み込めませんでした'), 'Failed reread keeps current cards');
      unread.unmount();
    }
    const saved = historyHost(view, savedHistory, { write: true }, mutation);
    assert.ok(saved.env.state.saveError && saved.html().includes('閲覧履歴を保存できませんでした'));
    assert.ok(saved.html().includes('保存済みの人物'));
    assert.doesNotThrow(() => saved.env.state.addToHistory({ id: 'unsaved', name: '未保存の人物', shopId: 'saved-shop' }));
    saved.update();
    assert.ok(saved.html().includes('未保存の人物'), 'Failed write retains in-memory current card');
    saved.env.mode.write = false; saved.click('履歴を再読込');
    assert.ok(saved.html().includes('未保存の人物') && saved.html().includes('保存済みの人物'));
    assert.equal(saved.env.state.saveError, false);
    assert.ok(saved.env.values.get(HISTORY).includes('未保存の人物'), 'Read recovery saves pending in-memory history');
    for (const failure of ['remove', 'ignoreRemove']) {
      saved.env.mode[failure] = true;
      saved.click(view === 'home' ? '履歴を消す' : '全削除');
      assert.ok(saved.env.state.deleteError && saved.html().includes('閲覧履歴を削除できませんでした'));
      assert.ok(saved.html().includes('未保存の人物'), 'Deletion failure keeps the cards');
      saved.env.mode[failure] = false;
    }
    saved.click('削除を再試行');
    assert.equal(saved.env.state.history.length, 0);
    assert.equal(saved.env.state.storageError, false);
    assert.equal(saved.env.values.has(HISTORY), false);
    if (view === 'home') assert.equal(saved.html(), '');
    else assert.ok(saved.html().includes('閲覧履歴はありません'));
    saved.unmount();
    const unconfirmedDelete = historyHost(view, savedHistory, {}, mutation);
    unconfirmedDelete.env.mode.readbackAfterRemove = true;
    unconfirmedDelete.click(view === 'home' ? '履歴を消す' : '全削除');
    assert.equal(unconfirmedDelete.env.values.has(HISTORY), false, 'Removal succeeded before its readback was denied');
    assert.ok(unconfirmedDelete.env.state.deleteError && unconfirmedDelete.html().includes('保存済みの人物'), 'Unconfirmed removal retains visible cards');
    unconfirmedDelete.env.state.retryHistory(); unconfirmedDelete.update();
    assert.ok(unconfirmedDelete.env.state.readError && unconfirmedDelete.env.state.deleteError, 'Failed retry cannot finalize deletion');
    unconfirmedDelete.env.mode.read = false;
    unconfirmedDelete.click('履歴を再読込');
    assert.equal(unconfirmedDelete.env.state.deleteError, false, 'Successful missing-key read confirms completed deletion');
    assert.equal(unconfirmedDelete.env.state.history.length, 0, 'Confirmed storage and visible cards agree');
    assert.ok(!unconfirmedDelete.html().includes('履歴はそのまま残っています'));
    if (view === 'home') assert.equal(unconfirmedDelete.html(), '');
    else assert.ok(unconfirmedDelete.html().includes('閲覧履歴はありません'));
    unconfirmedDelete.unmount();
  }
}

// A02の人物ページも、実履歴hookを組み込んで保存障害下で最後まで描画する。
async function verifyThreadStorage() {
  for (const mode of ['read', 'write']) {
    const browser = { addEventListener() {}, removeEventListener() {}, scrollY: 0 };
    const storage = {
      getItem() { if (mode === 'read') throw new Error('Fixture read denied'); return null; },
      setItem() { throw new Error('Fixture quota'); }, removeItem() {},
    };
    const shop = { id: 'thread-shop', name: '保存障害の店舗' };
    const therapist = { id: 'thread-person', name: '保存障害でも表示する人物', shop_id: shop.id };
    const h = host(hooks => {
      const history = compile('src/hooks/useRecentlyViewed.js', { react: hooks, '../utils/localStorage.js': compile('src/utils/localStorage.js', {}, { localStorage: storage }) });
      const page = compile('src/pages/ThreadDetailPage.jsx', {
        react: hooks, '../utils/supabaseRest': { authHeaders: async () => ({}) }, '../lib/supabase': { supabase: { auth: { getSession: async () => ({ data: { session: null } }) } } },
        '../compat/router': { Link, useParams: () => ({ shopId: shop.id, threadId: therapist.id }), useNavigate: () => noop },
        '../contexts/DataContext.jsx': { useShopData: () => ({ shopById: {}, therapistById: {}, reviews: [], roomCounts: {} }) },
        '../context/AppContext.tsx': { useAppContext: () => ({ favTherapists: [], toggleFavTherapist: noop }) },
        '../hooks/useRecentlyViewed.js': history, '../contexts/AuthContext.jsx': { useAuth: () => ({ user: null }) },
        '../components/LazyImage.jsx': noop, '../components/ModernReviewCard.jsx': noop, '../components/ReviewListWithRestriction.jsx': noop,
        '../components/SeoHead.jsx': noop, '../components/Header.jsx': noop, '../utils/shopHelpers': { getDisplayName: name => name },
        '../utils/brandGroups.js': groups, '../utils/analytics': { trackEvent: noop }, '../utils/useReturnTo': { useReturnTo: () => '/search' },
        '../utils/authRedirect.js': { withReturnTo: path => path }, '../utils/registerAnalytics': { trackRegisterCtaClick: noop },
        '../utils/reviewIdentity.js': identity, '../utils/therapistStatus.js': { isNotListed: () => false },
        '../components/NeutralReviewNote.jsx': noop, '../components/OfficialLinks.jsx': noop, '../components/RatingFingerprint.jsx': { __esModule: true, default: noop, averageFingerprint: () => null },
      }, { window: browser, document: { querySelector: () => null } });
      return () => page.default({ ssrShop: shop, ssrTherapist: therapist });
    });
    await h.settle();
    assert.ok(h.html().includes(therapist.name), 'Actual person page remains rendered when history cannot save');
    h.unmount();
  }
}

await verifyBrand();
await verifyHistory();
await verifyThreadStorage();
const mutations = [
  { name: 'brand-unscoped-state', file: 'src/pages/BrandPage.jsx', before: 'cloudRosterResult?.scope === rosterScope ? cloudRosterResult : null', after: 'cloudRosterResult', verify: verifyBrand },
  { name: 'brand-unscoped-rows', file: 'src/pages/BrandPage.jsx', before: 'const scopedRows = [...ssrRoster, ...fromContext].filter(t => shopIdSet.has(t.shop_id || t.shopId));', after: 'const scopedRows = [...ssrRoster, ...fromContext];', verify: verifyBrand },
  { name: 'brand-stale-response', file: 'src/pages/BrandPage.jsx', before: 'const isCurrent = () => alive && currentScopeRef.current === rosterScope;', after: 'const isCurrent = () => true;', verify: verifyBrand },
  { name: 'brand-carried-filters', file: 'src/pages/BrandPage.jsx', before: 'rosterFilters?.scope === rosterScope ? rosterFilters : {}', after: 'rosterFilters || {}', verify: verifyBrand },
  { name: 'brand-partial-complete', file: 'src/utils/brandRosterLoading.js', before: "if (!response.ok) throw new Error('Brand data unavailable');", after: 'if (!response.ok) return rows;', verify: verifyBrand },
  { name: 'brand-refresh-data-lost', file: 'src/pages/BrandPage.jsx', before: "scope: rosterScope, rosterStatus: 'error', reviewStatus: 'error'", after: "scope: rosterScope, rows: null, rosterStatus: 'error', reviewStatus: 'error'", verify: verifyBrand },
  { name: 'brand-pending-tag-zero', file: 'src/pages/BrandPage.jsx', before: 'selectedTags.length > 0 && canApplyMetadata', after: 'selectedTags.length > 0', verify: verifyBrand },
  { name: 'brand-unconfirmed-order', file: 'src/pages/BrandPage.jsx', before: 'waitingForMetadata && confirmedRoster ? confirmedRoster : roster', after: 'roster', verify: verifyBrand },
  { name: 'history-read-zero', file: 'src/pages/HistoryPage.jsx', before: '!historyLoading && !storageError', after: '!historyLoading', verify: verifyHistory },
  { name: 'history-hidden-error', file: 'src/components/RecentlyViewed.jsx', before: 'history.length === 0 && !historyLoading && !storageError', after: 'history.length === 0', verify: verifyHistory },
  { name: 'history-retry-unwritable', file: 'src/hooks/useRecentlyViewed.js', before: 'storageReady.current = true;', after: 'storageReady.current = false;', verify: verifyHistory },
  { name: 'history-read-data-lost', file: 'src/hooks/useRecentlyViewed.js', before: 'setReadError(true);', after: 'setHistory([]); setReadError(true);', verify: verifyHistory },
  { name: 'history-delete-data-lost', file: 'src/hooks/useRecentlyViewed.js', before: 'if (result.ok) {', after: 'if (true) {', verify: verifyHistory },
  { name: 'history-delete-error-hidden', file: 'src/components/HistoryStorageStatus.jsx', before: '{deleteError &&', after: '{false &&', verify: verifyHistory },
  { name: 'history-delete-readback-unrecovered', file: 'src/hooks/useRecentlyViewed.js', before: 'if (!saved.found && unsaved.current.length === 0) setDeleteError(false);', after: '', verify: verifyHistory },
];
for (const mutation of mutations) {
  await assert.rejects(() => mutation.verify(mutation), undefined, `Protection removal must be detected: ${mutation.name}`);
}
console.log(`✅ ブランド/履歴: 実page/hookの対象切替・旧応答・SSR24/追加取得/重複・途中失敗・保存/削除/再読込・人物表示・${mutations.length}メモリ内妨害検証`);
