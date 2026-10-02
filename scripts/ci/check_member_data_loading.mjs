/** マイページ・お気に入りの実hook/page/providerを模擬通信で動かし、取得失敗を0件へ変換しない。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { shapeShopRow, shopAreaList, joinFields } from '../../src/utils/shopFields.js';

const mutation = process.env.MEMBER_DATA_GUARD_MUTATION;
const mutations = {
  countFailureZero: ['src/utils/postedReviewCount.js', "if (!response.ok) throw new Error('Review count unavailable');", 'if (!response.ok) return 0;'],
  countOldUser: ['src/hooks/usePostedReviewCount.js', ' || result?.requestKey !== requestKey', ''],
  countCancelled: ['src/hooks/usePostedReviewCount.js', 'return () => { active = false; };', 'return () => {};'],
  viewingExpiry: ['src/hooks/useViewingCredits.js', 'expiryTimer = setTimeout(retry, delay);', ''],
  favoriteFailureZero: ['src/utils/favoriteProfiles.js', "if (error || !Array.isArray(data)) throw new Error('Favorite profiles unavailable');", 'if (error || !Array.isArray(data)) return {};'],
  favoriteOldUser: ['src/pages/FavoritesPage.jsx', 'return () => { active = false; };', 'return () => {};'],
  favoriteLostData: ['src/pages/FavoritesPage.jsx', "status: 'error', data: previous?.userId === userId ? previous.data : {}", "status: 'error', data: {}"],
  favoriteMissingZero: ['src/pages/FavoritesPage.jsx', "!loadingItems && !loadError && selectedCount === 0 ? <EmptyState type=\"therapist\"", "!loadingItems && !loadError && favTherapistList.length === 0 ? <EmptyState type=\"therapist\""],
  favoriteUnknownShop: ['src/pages/FavoritesPage.jsx', "favoriteShopCountKnown ? favorites.length : '—'", 'favorites.length'],
  favoriteUnknownPerson: ['src/pages/FavoritesPage.jsx', "favoriteTherapistCountKnown ? favTherapists.length : '—'", 'favTherapists.length'],
  storedShopCountLost: ['src/context/AppContext.tsx', 'shopCountKnown: shops.ok || Boolean(previous?.shopCountKnown)', 'shopCountKnown: shops.ok'],
  storedPersonCountLost: ['src/context/AppContext.tsx', 'peopleCountKnown: people.ok || Boolean(previous?.peopleCountKnown)', 'peopleCountKnown: people.ok'],
  providerLostData: ['src/contexts/DataContext.jsx', 'if (active) setShopsError(true);', 'if (active) { setShops([]); setShopsError(true); }'],
  providerStale: ['src/contexts/DataContext.jsx', 'return () => { active = false; };', 'return () => {};'],
};
const read = file => {
  const source = fs.readFileSync(file, 'utf8');
  if (!mutation || mutations[mutation]?.[0] !== file) return source;
  const [, before, after] = mutations[mutation];
  assert.ok(source.includes(before), `Missing sabotage target ${mutation}`);
  return source.replace(before, after);
};
if (mutation) assert.ok(mutations[mutation], `Unknown sabotage ${mutation}`);
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { resolve, reject, promise };
};
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const depsEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const noop = () => null;
const Link = ({ to, children, ...props }) => React.createElement('a', { ...props, href: to }, children);

function compile(file, dependencies, extra = {}) {
  const code = ts.transpileModule(read(file), { compilerOptions: {
    jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} };
  const requireMock = key => {
    if (Object.hasOwn(dependencies, key)) return dependencies[key];
    throw new Error(`Unexpected member QA dependency ${key}`);
  };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    process: { env: { ...process.env, VITE_SUPABASE_URL: 'https://qa.supabase.invalid' } },
    console: { ...console, warn() {}, error() {} }, setTimeout, clearTimeout, ...extra,
  })(requireMock, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

function harness(build) {
  const slots = [];
  const effects = [];
  let cursor = 0;
  let dirty = true;
  let output;
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
    useMemo(fn, deps) {
      const index = cursor++;
      if (!slots[index] || !depsEqual(slots[index].deps, deps)) slots[index] = { deps, value: fn() };
      return slots[index].value;
    },
    useCallback(fn, deps) { return hooks.useMemo(() => fn, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || !depsEqual(slots[index].deps, deps)) {
        const cleanup = slots[index]?.cleanup;
        slots[index] = { deps, cleanup };
        effects.push(() => { cleanup?.(); slots[index].cleanup = effect(); });
      }
    },
  };
  const render = build(hooks);
  function flush() {
    for (let loop = 0; dirty; loop += 1) {
      assert.ok(loop < 30, 'member component must not loop');
      dirty = false; cursor = 0; output = render();
      effects.splice(0).forEach(effect => effect());
    }
  }
  function walk(element, list = []) {
    if (!element || typeof element !== 'object') return list;
    if (element.type) list.push(element);
    React.Children.forEach(element.props?.children, child => walk(child, list));
    return list;
  }
  const api = {
    update(fn = () => {}) { fn(); dirty = true; flush(); },
    async settle() { for (let i = 0; i < 3; i += 1) { await new Promise(resolve => setImmediate(resolve)); flush(); } },
    output() { flush(); return output; },
    html() { flush(); return renderToStaticMarkup(output); },
    click(label) {
      flush();
      const button = walk(output).find(node => node.type === 'button' && (node.props.children === label || renderToStaticMarkup(React.createElement(React.Fragment, null, node.props.children)).includes(label)));
      assert.ok(button, `Missing member button ${label}`);
      button.props.onClick(); flush();
    },
    unmount() { slots.forEach(slot => slot.cleanup?.()); },
    get setterCalls() { return setterCalls; },
  };
  flush();
  return api;
}

const countUtils = compile('src/utils/postedReviewCount.js', {});
for (const data of [{}, null, [{ total_reviews_posted: true }], [{ total_reviews_posted: '' }], [{ total_reviews_posted: -1 }], [{ total_reviews_posted: 1.5 }], [{ total_reviews_posted: 1 }, { total_reviews_posted: 2 }]]) {
  await assert.rejects(countUtils.fetchPostedReviewCount('/qa', {}, async () => response(data)));
}
await assert.rejects(countUtils.fetchPostedReviewCount('/qa', {}, async () => response([], 503)));
await assert.rejects(countUtils.fetchPostedReviewCount('/qa', {}, async () => { throw new Error('QA network'); }));
assert.equal(await countUtils.fetchPostedReviewCount('/qa', {}, async () => response([])), 0);
assert.equal(await countUtils.fetchPostedReviewCount('/qa', {}, async () => response([{ total_reviews_posted: '7' }])), 7);

const BASE = Date.parse('2026-10-02T00:00:00Z');
const userA = { id: 'qa-user-a', email: 'qa-a@example.invalid', user_metadata: { display_name: 'QA会員A' } };
const userB = { id: 'qa-user-b', email: 'qa-b@example.invalid', user_metadata: { display_name: 'QA会員B' } };
function myPageHarness() {
  const env = { auth: { user: userA, userPlan: 'free', loading: false, signOut: async () => {} }, now: BASE, requests: [], timers: new Map(), timerId: 0, viewing: null, posted: null };
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [env.now])); }
    static now() { return env.now; }
  }
  const clock = {
    Date: ClockDate,
    setTimeout(fn, delay) { const id = ++env.timerId; env.timers.set(id, { fn, due: env.now + delay }); return id; },
    clearTimeout(id) { env.timers.delete(id); },
  };
  const fetcher = async url => {
    const request = { url: new URL(url), ...deferred() };
    request.kind = request.url.searchParams.get('select').includes('total_reviews_posted') ? 'count' : 'viewing';
    env.requests.push(request);
    return request.promise;
  };
  const viewingUtils = compile('src/utils/viewingCredits.js', {}, clock);
  const h = harness(hooks => {
    const shared = { react: hooks, '../contexts/AuthContext': { useAuth: () => env.auth }, '../utils/supabaseRest': { authHeaders: async () => ({ Authorization: 'Bearer QA' }) } };
    const count = compile('src/hooks/usePostedReviewCount.js', { ...shared, '../utils/postedReviewCount.js': { fetchPostedReviewCount: (url, headers) => countUtils.fetchPostedReviewCount(url, headers, fetcher) } });
    const viewing = compile('src/hooks/useViewingCredits.js', { ...shared, '../utils/viewingCredits.js': { fetchViewingCredits: (url, headers) => viewingUtils.fetchViewingCredits(url, headers, fetcher) } }, clock);
    const page = compile('src/pages/MyPage.jsx', {
      react: hooks, '../components/LineIcon.jsx': noop, '../compat/router': { Link, useNavigate: () => () => {} },
      '../contexts/AuthContext': { useAuth: () => env.auth },
      '../hooks/useViewingCredits.js': { useViewingCredits: () => { env.viewing = viewing.useViewingCredits(); return env.viewing; } },
      '../hooks/usePostedReviewCount.js': { usePostedReviewCount: () => { env.posted = count.usePostedReviewCount(); return env.posted; } },
      'lucide-react': { LogOut: noop, PenLine: noop, Heart: noop, History: noop, Shield: noop },
      '../components/Header': noop, '../components/SeoHead.jsx': noop,
    }, clock);
    return () => page.default();
  });
  return { ...h, env, advance(time) {
    env.now = time;
    for (const [id, timer] of [...env.timers]) if (timer.due <= time) { env.timers.delete(id); timer.fn(); }
    h.update();
  } };
}
const my = myPageHarness(); await my.settle();
assert.equal(my.env.viewing.status, 'loading');
assert.equal(my.env.posted.status, 'loading');
assert.ok(my.html().includes('確認中…') && !my.html().includes('閲覧権の期限切れ') && !my.html().includes('0件'));
my.env.requests.find(request => request.kind === 'count').resolve(response([], 503));
my.env.requests.find(request => request.kind === 'viewing').resolve(response([], 503)); await my.settle();
assert.equal(my.env.posted.status, 'error');
assert.equal(my.env.viewing.status, 'error');
assert.ok(my.html().includes('投稿件数を再取得') && my.html().includes('閲覧権を再確認'));
assert.ok(!my.html().includes('0件') && !my.html().includes('閲覧権の期限切れ'));
my.click('投稿件数を再取得'); my.click('閲覧権を再確認'); await my.settle();
assert.equal(my.env.posted.status, 'loading');
const expiresAt = new Date(BASE + 1000).toISOString();
my.env.requests.filter(request => request.kind === 'count').at(-1).resolve(response([{ total_reviews_posted: 5 }]));
my.env.requests.filter(request => request.kind === 'viewing').at(-1).resolve(response([{ credits_days: 0, expires_at: expiresAt }])); await my.settle();
assert.equal(my.env.posted.count, 5);
assert.equal(my.env.viewing.status, 'active');
assert.equal(my.env.viewing.expiresAt, expiresAt, 'hook must expose the confirmed expiry');
assert.ok(my.html().includes('5件') && my.html().includes('まで'));
const viewingRequestsBefore = my.env.requests.filter(request => request.kind === 'viewing').length;
my.advance(BASE + 1001); await my.settle();
assert.equal(my.env.requests.filter(request => request.kind === 'viewing').length, viewingRequestsBefore + 1, 'expiry timer must automatically recheck');
my.env.requests.filter(request => request.kind === 'viewing').at(-1).resolve(response([{ credits_days: 9, expires_at: expiresAt }])); await my.settle();
assert.equal(my.env.viewing.status, 'expired');
assert.ok(my.html().includes('閲覧権の期限切れ'));
my.update(() => { my.env.auth = { ...my.env.auth, userPlan: 'premium' }; }); await my.settle();
assert.equal(my.env.viewing.status, 'active');
assert.ok(my.html().includes('読み放題プラン'));
my.update(() => { my.env.auth = { ...my.env.auth, user: null, userPlan: 'free' }; });
assert.equal(my.env.viewing.status, 'anonymous');
assert.ok(my.html().includes('ログインが必要です'));

const memberSwitch = myPageHarness(); await memberSwitch.settle();
const oldMemberRequests = [...memberSwitch.env.requests];
oldMemberRequests.forEach(request => request.resolve(response(request.kind === 'count' ? [{ total_reviews_posted: 13 }] : [{ credits_days: 3, expires_at: new Date(BASE + 60000).toISOString() }])));
await memberSwitch.settle();
assert.equal(memberSwitch.env.posted.count, 13);
memberSwitch.env.posted.retry(); memberSwitch.env.viewing.retry(); memberSwitch.update(); await memberSwitch.settle();
const pendingOldCount = memberSwitch.env.requests.filter(request => request.kind === 'count').at(-1);
const pendingOldViewing = memberSwitch.env.requests.filter(request => request.kind === 'viewing').at(-1);
memberSwitch.update(() => { memberSwitch.env.auth = { ...memberSwitch.env.auth, user: userB }; });
assert.equal(memberSwitch.env.posted.status, 'loading', 'old user count must disappear immediately');
assert.equal(memberSwitch.env.viewing.status, 'loading', 'old user entitlement must disappear immediately');
assert.ok(!memberSwitch.html().includes('13件'));
await memberSwitch.settle();
memberSwitch.env.requests.filter(request => request.url.searchParams.get('user_id') === 'eq.qa-user-b').forEach(request => request.resolve(response(request.kind === 'count' ? [{ total_reviews_posted: 2 }] : [])));
await memberSwitch.settle();
pendingOldCount.resolve(response([{ total_reviews_posted: 99 }])); await memberSwitch.settle();
pendingOldViewing.resolve(response([{ credits_days: 99, expires_at: new Date(BASE + 60000).toISOString() }])); await memberSwitch.settle();
assert.equal(memberSwitch.env.posted.status, 'ready');
assert.equal(memberSwitch.env.posted.count, 2, 'late previous-user response cannot replace current count');
assert.equal(memberSwitch.env.viewing.status, 'expired', 'late previous-user entitlement cannot replace current access');
memberSwitch.unmount();

const favoriteUtils = compile('src/utils/favoriteProfiles.js', {});
const shopA = { id: 'qa_shop_with_under', name: 'QA店舗A', raw_data: {} };
const shopB = { id: 'qa_shop_b', name: 'QA店舗B', raw_data: {} };
const personA = { id: 'qa_person_with_under', shop_id: shopA.id, name: 'QA推しA', image_url: null };
const personB = { id: 'qa_person_b', shop_id: shopB.id, name: 'QA推しB', image_url: null };
const favoriteKeyA = `${shopA.id}_${personA.id}`;
const favoriteKeyB = `${shopB.id}_${personB.id}`;
function profileClient() {
  const requests = [];
  return { requests, from(table) {
    const request = { table, ...deferred() };
    const builder = { select() { return builder; }, in(_key, ids) { request.ids = ids; return builder; }, then(done, fail) { requests.push(request); return request.promise.then(done, fail); } };
    return builder;
  } };
}
const parsed = favoriteUtils.resolveFavoriteTargets([favoriteKeyA, 'unknown_key'], { qa_shop: {}, [shopA.id]: shopA });
assert.equal(parsed[0].shopId, shopA.id);
assert.equal(parsed[0].therapistId, personA.id);
assert.equal(parsed[1].therapistId, null);
const batchClient = profileClient();
const batchedProfiles = favoriteUtils.fetchFavoriteProfiles(batchClient, Array.from({ length: 205 }, (_, i) => ({ therapistId: `qa-${i}` })));
for (let i = 0; i < 3; i += 1) { await new Promise(resolve => setImmediate(resolve)); assert.ok(batchClient.requests[i].ids.length <= 100); batchClient.requests[i].resolve({ data: batchClient.requests[i].ids.map(id => ({ id })), error: null }); }
assert.equal(Object.keys(await batchedProfiles).length, 205);

function favoritesHarness(overrides = {}) {
  const client = profileClient();
  const env = {
    auth: { user: userA, loading: false },
    app: { favorites: [], favTherapists: [favoriteKeyA], favoritesLoading: false, favoritesError: false, retryFavorites() { env.favoriteRetries += 1; } },
    shops: { shopById: { [shopA.id]: shopA, [shopB.id]: shopB }, therapistById: {}, roomCounts: {}, loading: false, shopsError: false, retryShops() { env.shopRetries += 1; } },
    favoriteRetries: 0, shopRetries: 0,
  };
  Object.assign(env.app, overrides.app || {}); Object.assign(env.shops, overrides.shops || {});
  const h = harness(hooks => {
    const page = compile('src/pages/FavoritesPage.jsx', {
      react: hooks, '../utils/brandGroups.js': { shopHref: value => `/shops/${value.id}` },
      '../components/LineIcon.jsx': noop, '../context/AppContext.tsx': { useAppContext: () => env.app },
      '../contexts/DataContext.jsx': { useShopData: () => env.shops }, '../compat/router': { Link },
      '../components/LazyImage.jsx': noop, '../components/Header.jsx': noop,
      '../utils/shopHelpers': { getDisplayName: name => name }, '../components/SeoHead.jsx': noop,
      '../components/LocationLabel.jsx': noop, '../utils/shopFields': { joinFields, shopAreaList },
      '../lib/supabase.js': { supabase: client }, '../contexts/AuthContext.jsx': { useAuth: () => env.auth },
      '../components/ShopStatusBanner.jsx': { ShopStatusChip: noop }, '../utils/favoriteProfiles.js': favoriteUtils,
    });
    return () => page.default();
  });
  return { ...h, env, requests: client.requests };
}

// 保存の実providerと実localStorage処理を使う。初回失敗の未確認件数と、再読込失敗後の既知件数を区別する。
function storedFavoritesHarness(failure) {
  const env = { auth: { user: userA }, mode: failure };
  const values = new Map([
    [`mens_esthe_favorites:${userA.id}`, JSON.stringify([shopA.id])],
    [`mens_esthe_fav_therapists:${userA.id}`, JSON.stringify([favoriteKeyA])],
  ]);
  const storage = {
    getItem(key) {
      if (key.startsWith('mens_esthe_favorites:') || key.startsWith('mens_esthe_fav_therapists:')) {
        if (env.mode === 'denied') throw new Error('QA storage read denied');
        if (env.mode === 'malformed') return '{';
      }
      return values.get(key) ?? null;
    },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
  const storageUtils = compile('src/utils/localStorage.js', {}, { localStorage: storage });
  const h = harness(hooks => {
    const provider = compile('src/context/AppContext.tsx', {
      react: hooks, '../contexts/AuthContext.jsx': { useAuth: () => env.auth },
      'react-hot-toast': { __esModule: true, default: { error() {} }, Toaster: noop },
      '../utils/localStorage.js': storageUtils,
    });
    return () => provider.AppProvider({ children: null });
  });
  return { ...h, env, value: () => h.output().props.value };
}
const favoriteCounter = (html, label) => {
  const match = html.match(new RegExp(`${label}\\s*<span[^>]*>([^<]*)<\\/span>`));
  assert.ok(match, `Missing saved count for ${label}`);
  return match[1];
};
for (const storageFailure of ['denied', 'malformed']) {
  const saved = storedFavoritesHarness(storageFailure); await saved.settle();
  assert.equal(saved.value().favoritesError, true);
  assert.equal(saved.value().favoriteShopCountKnown, false);
  assert.equal(saved.value().favoriteTherapistCountKnown, false);
  const page = favoritesHarness({ app: saved.value() }); await page.settle();
  assert.equal(favoriteCounter(page.html(), '店舗'), '—', 'unread shop storage cannot claim zero saved items');
  assert.equal(favoriteCounter(page.html(), 'セラピスト'), '—', 'unread person storage cannot claim zero saved items');
  assert.ok(page.html().includes('お気に入りを読み込めませんでした') && !page.html().includes('推しメンがまだいません'));

  saved.env.mode = 'ready'; saved.value().retryFavorites(); await saved.settle();
  assert.equal(saved.value().favoriteShopCountKnown, true);
  assert.equal(saved.value().favoriteTherapistCountKnown, true);
  page.update(() => { page.env.app = { ...page.env.app, ...saved.value() }; }); await page.settle();
  page.requests.at(-1).resolve({ data: [personA], error: null }); await page.settle();
  assert.equal(favoriteCounter(page.html(), '店舗'), '1');
  assert.equal(favoriteCounter(page.html(), 'セラピスト'), '1');
  assert.ok(page.html().includes(personA.name));

  saved.env.mode = storageFailure; saved.value().retryFavorites(); await saved.settle();
  assert.equal(saved.value().favoritesError, true);
  assert.equal(saved.value().favoriteShopCountKnown, true, 'failed reread retains the confirmed shop count');
  assert.equal(saved.value().favoriteTherapistCountKnown, true, 'failed reread retains the confirmed person count');
  assert.equal(saved.value().favorites[0], shopA.id);
  assert.equal(saved.value().favTherapists[0], favoriteKeyA);
  page.update(() => { page.env.app = { ...page.env.app, ...saved.value() }; }); await page.settle();
  assert.equal(favoriteCounter(page.html(), '店舗'), '1');
  assert.equal(favoriteCounter(page.html(), 'セラピスト'), '1');
  assert.ok(page.html().includes(personA.name) && page.html().includes('お気に入りを読み込めませんでした'), 'storage failure preserves previously displayed saved profile');

  saved.update(() => { saved.env.auth = { user: userB }; }); await saved.settle();
  assert.equal(saved.value().favoriteShopCountKnown, false, 'previous user known count cannot survive a failed new-user storage read');
  assert.equal(saved.value().favoriteTherapistCountKnown, false);
  assert.equal(saved.value().favorites.length, 0);
  assert.equal(saved.value().favTherapists.length, 0);
  page.update(() => { page.env.auth = { user: userB, loading: false }; page.env.app = { ...page.env.app, ...saved.value() }; }); await page.settle();
  assert.equal(favoriteCounter(page.html(), '店舗'), '—');
  assert.equal(favoriteCounter(page.html(), 'セラピスト'), '—');
  assert.ok(!page.html().includes(personA.name) && !page.html().includes('推しメンがまだいません'));
  saved.unmount(); page.unmount();
}
const favorite = favoritesHarness(); await favorite.settle();
assert.ok(favorite.html().includes('お気に入りを読み込み中') && !favorite.html().includes('推しメンがまだいません'));
assert.equal(favorite.requests[0].ids[0], personA.id);
favorite.requests[0].resolve({ data: null, error: { message: 'QA 503' } }); await favorite.settle();
assert.ok(favorite.html().includes('お気に入りを読み込めませんでした') && !favorite.html().includes('推しメンがまだいません'));
assert.equal(favorite.env.app.favTherapists.length, 1);
assert.ok(/セラピスト[\s\S]*?>1<\/span>/.test(favorite.html()), 'tab count follows saved IDs despite failed profile fetch');
favorite.click('再試行'); await favorite.settle();
assert.equal(favorite.env.favoriteRetries, 1); assert.equal(favorite.env.shopRetries, 1);
favorite.requests.at(-1).resolve({ data: [personA], error: null }); await favorite.settle();
assert.ok(favorite.html().includes(personA.name));
favorite.update(() => { favorite.env.app = { ...favorite.env.app, favTherapists: [favoriteKeyA] }; }); await favorite.settle();
assert.ok(favorite.html().includes(personA.name), 'keep existing profile while retrying');
favorite.requests.at(-1).resolve({ data: null, error: { message: 'QA repeat failure' } }); await favorite.settle();
assert.ok(favorite.html().includes(personA.name) && favorite.html().includes('お気に入りを読み込めませんでした'), 'failure retains already displayed profile');

const missing = favoritesHarness(); await missing.settle();
missing.requests[0].resolve({ data: [], error: null }); await missing.settle();
assert.ok(missing.html().includes('保存済みの1件は現在情報を表示できません'));
assert.ok(!missing.html().includes('推しメンがまだいません'));
assert.equal(missing.env.app.favTherapists.length, 1, 'missing profile must not delete the stored favorite');
const unresolved = favoritesHarness({ app: { favTherapists: ['unknown_key'] } }); await unresolved.settle();
assert.equal(unresolved.requests.length, 0);
assert.ok(unresolved.html().includes('保存済みの1件は現在情報を表示できません') && !unresolved.html().includes('推しメンがまだいません'), 'unresolved saved IDs remain saved items');
const zero = favoritesHarness({ app: { favTherapists: [], favorites: [] } }); await zero.settle();
assert.ok(zero.html().includes('推しメンがまだいません'));
const shopsFailure = favoritesHarness({ shops: { loading: false, shopsError: true, shopById: {} } }); await shopsFailure.settle();
assert.ok(shopsFailure.html().includes('お気に入りを読み込めませんでした'));
assert.ok(!shopsFailure.html().includes('お気に入りを読み込み中'), 'blocked failed lookup must not also claim loading');
assert.ok(!shopsFailure.html().includes('推しメンがまだいません'));
assert.equal(shopsFailure.requests.length, 0, 'wait for a successful shop index before resolving composite favorite IDs');
const shopsDelayed = favoritesHarness({ shops: { loading: true, shopById: {} } }); await shopsDelayed.settle();
assert.equal(shopsDelayed.requests.length, 0);
assert.ok(shopsDelayed.html().includes('お気に入りを読み込み中'));
shopsDelayed.update(() => { shopsDelayed.env.shops = { ...shopsDelayed.env.shops, loading: false, shopById: { [shopA.id]: shopA } }; }); await shopsDelayed.settle();
shopsDelayed.requests[0].resolve({ data: [personA], error: null }); await shopsDelayed.settle();
assert.ok(shopsDelayed.html().includes(personA.name));
const savedShops = favoritesHarness({ app: { favorites: [shopA.id, 'qa-missing-shop'], favTherapists: [] }, shops: { loading: true } }); await savedShops.settle();
assert.ok(savedShops.html().includes(shopA.name) && savedShops.html().includes('お気に入りを読み込み中'));
savedShops.update(() => { savedShops.env.shops = { ...savedShops.env.shops, loading: false, shopsError: true }; });
assert.ok(savedShops.html().includes(shopA.name) && savedShops.html().includes('お気に入りを読み込めませんでした'));
savedShops.click('再試行');
savedShops.update(() => { savedShops.env.shops = { ...savedShops.env.shops, shopsError: false }; });
assert.ok(savedShops.html().includes('保存済みの1件は現在情報を表示できません'));
assert.equal(savedShops.env.app.favorites.length, 2);

for (const lateFailure of [false, true]) {
  const switchFavorite = favoritesHarness(); await switchFavorite.settle();
  const oldRequest = switchFavorite.requests[0];
  switchFavorite.update(() => { switchFavorite.env.auth = { user: userB, loading: false }; switchFavorite.env.app = { ...switchFavorite.env.app, favTherapists: [favoriteKeyB] }; }); await switchFavorite.settle();
  assert.ok(!switchFavorite.html().includes(personA.name), 'previous user profile must not appear during switch');
  switchFavorite.requests[1].resolve({ data: [personB], error: null }); await switchFavorite.settle();
  if (lateFailure) oldRequest.reject(new Error('QA old user failed'));
  else oldRequest.resolve({ data: [personA], error: null });
  await switchFavorite.settle();
  assert.ok(switchFavorite.html().includes(personB.name) && !switchFavorite.html().includes(personA.name));
  assert.ok(!switchFavorite.html().includes('お気に入りを読み込めませんでした'));
}

// 店舗索引の実provider: Lite失敗→DB失敗はerror、再試行成功・既存データ保持・古いfinallyの排除。
function providerHarness() {
  const liteRequests = [];
  const directRequests = [];
  const supabase = { from() {
    const request = deferred();
    const builder = { select() { return builder; }, order() { return builder; }, range() { return builder; }, then(done, fail) { directRequests.push(request); return request.promise.then(done, fail); } };
    return builder;
  } };
  const h = harness(hooks => {
    const provider = compile('src/contexts/DataContext.jsx', {
      react: hooks, '../lib/supabase': { supabase }, '../utils/shopFields': { shapeShopRow },
      '../utils/brandGroups.js': { countRoomsByBrand: () => ({}) },
      '../utils/reviewIdentity.js': { normalizeTherapistName: name => String(name || '') },
    }, { fetch: async () => { const request = deferred(); liteRequests.push(request); return request.promise; } });
    return () => provider.DataProvider({ children: null });
  });
  return { ...h, liteRequests, directRequests, value: () => h.output().props.value };
}
const provider = providerHarness(); await provider.settle();
provider.liteRequests[0].resolve(response({}, 503)); await provider.settle();
provider.directRequests[0].resolve({ data: null, error: { message: 'QA shops failure' } }); await provider.settle();
assert.equal(provider.value().shopsError, true);
assert.equal(provider.value().loading, false);
provider.value().retryShops(); await provider.settle();
assert.equal(provider.value().loading, true);
provider.liteRequests[1].resolve(response([shopA])); await provider.settle();
assert.equal(provider.value().shopsError, false);
assert.equal(provider.value().shopById[shopA.id].name, shopA.name);
provider.value().retryShops(); await provider.settle();
provider.liteRequests[2].resolve(response({}, 503)); await provider.settle();
provider.directRequests[1].resolve({ data: null, error: { message: 'QA refresh failure' } }); await provider.settle();
assert.equal(provider.value().shopsError, true);
assert.equal(provider.value().shopById[shopA.id].name, shopA.name, 'failed refresh must retain previous shop index');
provider.value().retryShops(); await provider.settle();
const oldProviderRequest = provider.liteRequests[3];
provider.value().retryShops(); await provider.settle();
provider.liteRequests[4].resolve(response([shopB])); await provider.settle();
oldProviderRequest.resolve(response([shopA])); await provider.settle();
assert.ok(provider.value().shopById[shopB.id] && !provider.value().shopById[shopA.id], 'stale provider response must not replace successful retry');
provider.unmount();

console.log('✅ 会員データ: 実hook/page/providerの障害→再試行・0件分離・権利期限更新・保存件数の未確認/既知・既存情報保持・ユーザー切替を検証');
