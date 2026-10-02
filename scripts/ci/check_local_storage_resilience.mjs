/** A02: 実helper・履歴hook・お気に入りProviderを保存拒否/破損/ユーザー切替で実行する。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';

const helperSource = fs.readFileSync('src/utils/localStorage.js', 'utf8');
const historySource = fs.readFileSync('src/hooks/useRecentlyViewed.js', 'utf8');
const providerSource = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
const HISTORY = 'mens_esthe_history';
const SHOPS = 'mens_esthe_favorites';
const PEOPLE = 'mens_esthe_fav_therapists';
const plain = (value) => JSON.parse(JSON.stringify(value));

function storageFixture(initial = {}) {
  const values = new Map(Object.entries(initial));
  const operations = [];
  const failures = { read: false, write: false, remove: false, ignoreWrite: false, ignoreRemove: false };
  const storage = {
    getItem(key) {
      operations.push({ method: 'get', key });
      if (failures.read) throw new Error('fixture read denied');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      operations.push({ method: 'set', key, value });
      if (failures.write) throw new DOMException('fixture storage full', 'QuotaExceededError');
      if (!failures.ignoreWrite) values.set(key, String(value));
    },
    removeItem(key) {
      operations.push({ method: 'remove', key });
      if (failures.remove) throw new Error('fixture removal denied');
      if (!failures.ignoreRemove) values.delete(key);
    },
    clear() { assert.fail('never clear unrelated browser storage'); },
  };
  return { values, operations, failures, storage };
}

function compile(source, dependencies = {}, globals = {}) {
  const output = ts.transpileModule(source, {
    fileName: 'fixture.tsx', compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React, esModuleInterop: true,
    },
  }).outputText;
  const compiled = { exports: {} };
  const run = vm.runInNewContext(`(function(require,module,exports){${output}\n})`, globals);
  run((specifier) => {
    assert.ok(specifier in dependencies, `unexpected dependency ${specifier}`);
    return dependencies[specifier];
  }, compiled, compiled.exports);
  return compiled.exports;
}
const helpers = (source, env) => compile(source, {}, { localStorage: env.storage });

function verifyHelpers(source) {
  const env = storageFixture({ old: '["kept"]', invalid: '{bad json', malformed: '{"id":"not-an-array"}' });
  const utils = helpers(source, env);
  assert.deepEqual(plain(utils.readStoredJson('missing', [])), { ok: true, found: false, value: [] });
  assert.deepEqual(plain(utils.readStoredJson('old', [])), { ok: true, found: true, value: ['kept'] });
  assert.deepEqual(plain(utils.readStoredJson('invalid', [])), { ok: false, found: false, value: [] });
  assert.equal(utils.loadFavoriteIds('malformed', SHOPS, 'A').ok, false);
  env.failures.read = true;
  assert.equal(utils.readStoredJson('old', []).ok, false);
  assert.equal(utils.writeStoredJson('new', ['data']).ok, false, 'readback rejection must not report success');
  env.failures.read = false; env.failures.write = true;
  assert.equal(utils.writeStoredJson('old', ['changed']).ok, false, 'quota rejection must remain failure');
  assert.equal(env.values.get('old'), '["kept"]');
  env.failures.write = false; env.failures.ignoreWrite = true;
  assert.equal(utils.writeStoredJson('old', ['changed']).ok, false, 'readback mismatch must remain failure');
  env.failures.ignoreWrite = false;
  assert.equal(utils.writeStoredJson('old', ['changed']).ok, true);
  env.failures.remove = true;
  assert.equal(utils.removeStoredValue('old').ok, false, 'removal rejection must remain failure');
  assert.equal(env.values.get('old'), '["changed"]');
  env.failures.remove = false; env.failures.ignoreRemove = true;
  assert.equal(utils.removeStoredValue('old').ok, false, 'failed removal readback must remain failure');
  env.failures.ignoreRemove = false;
  assert.equal(utils.removeStoredValue('old').ok, true);
  const cyclic = {}; cyclic.self = cyclic;
  assert.equal(utils.writeStoredJson('cycle', cyclic).ok, false);
  const previous = ['person-1'];
  env.failures.write = true;
  assert.equal(utils.toggleStoredId('people:A', previous, 'person-2').ok, false);
  assert.deepEqual(previous, ['person-1'], 'helper must not mutate the previous React state');

  const legacy = storageFixture({ [SHOPS]: '["shop_under_score",2,"shop_under_score"]', unrelated: 'keep' });
  legacy.failures.remove = true;
  const scoped = helpers(source, legacy);
  const ownerA = scoped.loadFavoriteIds(`${SHOPS}:A`, SHOPS, 'A');
  assert.deepEqual(plain(ownerA), { ok: true, value: ['shop_under_score', '2'] });
  assert.equal(legacy.values.has(SHOPS), true, 'fixture deliberately refuses legacy removal');
  const ownerB = scoped.loadFavoriteIds(`${SHOPS}:B`, SHOPS, 'B');
  assert.deepEqual(plain(ownerB), { ok: true, value: [] }, 'legacy removal refusal must not leak A favorites to B');
  assert.equal(legacy.values.get('unrelated'), 'keep');
  assert.deepEqual(plain(scoped.loadFavoriteIds(`${SHOPS}:A`, SHOPS, 'A')), plain(ownerA));

  const denied = storageFixture({ [SHOPS]: '["private-legacy"]' });
  denied.failures.write = true;
  assert.deepEqual(plain(helpers(source, denied).loadFavoriteIds(`${SHOPS}:A`, SHOPS, 'A')), { ok: false, value: [] });
  assert.equal(denied.values.get(SHOPS), '["private-legacy"]', 'migration failure preserves the old saved IDs');

  // 店舗だけ移行でき、人物の保存が拒否された後も、両方の旧キーの所有者はAのまま。
  const partial = storageFixture({ [SHOPS]: '["legacy_A_shop"]', [PEOPLE]: '["legacy_A_person"]' });
  const save = partial.storage.setItem;
  let denyPersonSave = true;
  partial.storage.setItem = (key, value) => {
    if (denyPersonSave && (key === `${PEOPLE}:A` || key === `${PEOPLE}:migration_owner`)) throw new Error('fixture partial quota');
    save(key, value);
  };
  const partialUtils = helpers(source, partial);
  assert.equal(partialUtils.loadFavoriteIds(`${SHOPS}:A`, SHOPS, 'A').ok, true);
  assert.equal(partialUtils.loadFavoriteIds(`${PEOPLE}:A`, PEOPLE, 'A').ok, false);
  denyPersonSave = false;
  assert.deepEqual(plain(partialUtils.loadFavoriteIds(`${PEOPLE}:B`, PEOPLE, 'B')), { ok: true, value: [] }, 'partial legacy migration must share an owner across shops and people');
  assert.equal(partial.values.get(PEOPLE), '["legacy_A_person"]');
}

// effect/cleanup順を保ち、StrictMode同様に更新関数を二度呼ぶ。更新関数内のI/Oも捕捉する。
function reactHost(env) {
  const slots = [];
  let cursor = 0, changed = false, pending = [], renderFunction;
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, (value) => {
        let next = value;
        if (typeof value === 'function') {
          const before = env.operations.length;
          const first = value(slots[index].value);
          next = value(slots[index].value);
          assert.equal(env.operations.length, before, 'React state updater must be pure: no storage I/O');
          assert.deepEqual(plain(first), plain(next), 'double invocation must yield the same next state');
        }
        if (!Object.is(next, slots[index].value)) changed = true;
        slots[index].value = next;
      }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) slots[index] = { value: callback, deps };
      return slots[index].value;
    },
    useMemo(callback, deps) { return hooks.useCallback(callback, deps)(); },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) pending.push(() => {
        slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: effect() };
      });
    },
  };
  const host = {
    hooks, value: null, beforeEffects: null,
    attach(fn) { renderFunction = fn; },
    render(beforeEffects) {
      for (let iteration = 0; iteration < 8; iteration++) {
        cursor = 0; pending = []; changed = false;
        host.value = renderFunction();
        if (iteration === 0) {
          host.beforeEffects = host.value;
          beforeEffects?.(host.value);
        }
        pending.forEach((effect) => effect());
        if (!changed) return host.value;
      }
      assert.fail('storage hook/provider failed to settle');
    },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
  return host;
}

function historyHost(source, env, utilsSource = helperSource) {
  const host = reactHost(env);
  const loaded = compile(source, {
    react: host.hooks, '../utils/localStorage.js': helpers(utilsSource, env),
  });
  host.attach(() => loaded.useRecentlyViewed());
  return host;
}
function verifyHistory(source, utilsSource = helperSource) {
  const original = [{ id: 'shop_a_person_1', therapistId: 'person_1', shopId: 'shop_a', shopName: 'Fixture shop', image: '/image.webp' }];
  const env = storageFixture({ [HISTORY]: JSON.stringify(original) });
  const host = historyHost(source, env, utilsSource);
  host.render((value) => {
    assert.equal(value.history.length, 0);
    assert.equal(env.operations.length, 0, 'initial empty state must not be persisted before storage is read');
  });
  assert.equal(env.operations[0]?.method, 'get', 'read saved history before any initial write');
  assert.equal(host.value.history[0].id, 'shop_a_person_1');
  assert.equal(host.value.history[0].link, '/shops/shop_a/threads/person_1');
  assert.equal(host.value.history[0].image_url, '/image.webp');
  assert.equal(host.value.storageError, false);
  for (let i = 0; i < 12; i++) {
    assert.equal(host.value.addToHistory({ id: `person_${i}`, shopId: 'shop_a', therapistId: `person_${i}` }).ok, true);
    host.render();
  }
  assert.equal(host.value.history.length, 10, 'history must retain a maximum of ten entries');
  host.value.addToHistory({ id: 'person_5', shopId: 'shop_a', therapistId: 'person_5', name: 'newest' });
  host.render();
  assert.equal(host.value.history[0].id, 'person_5');
  assert.equal(host.value.history.filter((row) => row.id === 'person_5').length, 1, 'new viewing replaces the previous entry');
  assert.ok(!Number.isNaN(Date.parse(host.value.history[0].viewedAt)));
  const reloaded = historyHost(source, env, utilsSource); reloaded.render();
  assert.deepEqual(plain(reloaded.value.history), plain(host.value.history));
  env.failures.write = true;
  assert.doesNotThrow(() => host.value.addToHistory({ id: 'unsaved', shopId: 'shop_b' }));
  host.render();
  assert.equal(host.value.history[0].id, 'unsaved', 'history save rejection must not stop the viewed page');
  assert.equal(host.value.storageError, true);
  env.failures.write = false; env.failures.ignoreWrite = true;
  assert.equal(host.value.addToHistory({ id: 'mismatch' }).ok, false);
  host.render(); assert.equal(host.value.storageError, true);
  env.failures.ignoreWrite = false; env.failures.remove = true;
  const previousIds = host.value.history.map((row) => row.id);
  assert.equal(host.value.clearHistory().ok, false);
  host.render();
  assert.deepEqual(plain(host.value.history.map((row) => row.id)), plain(previousIds), 'failed deletion must preserve visible history');
  assert.equal(host.value.storageError, true);
  env.failures.remove = false;
  assert.equal(host.value.clearHistory().ok, true);
  host.render(); assert.equal(host.value.history.length, 0);
  assert.equal(host.value.storageError, false);
  assert.equal(env.values.has(HISTORY), false);
  host.unmount(); reloaded.unmount();

  for (const [initial, denied] of [[{}, false], [{ [HISTORY]: '{bad' }, false], [{ [HISTORY]: '{}' }, false], [{ [HISTORY]: '[{"id":"keep"}]' }, true]]) {
    const bad = storageFixture(initial); bad.failures.read = denied;
    const next = historyHost(source, bad, utilsSource);
    assert.doesNotThrow(() => next.render());
    assert.equal(next.value.history.length, 0);
    assert.equal(next.value.storageError, Boolean(denied || initial[HISTORY]));
    assert.equal(bad.operations.filter((op) => op.method === 'set').length, 0, 'absent/invalid/unreadable initial data must not be overwritten');
    next.unmount();
  }
}

function providerHost(source, env, utilsSource = helperSource) {
  const host = reactHost(env);
  const events = [];
  const MockToaster = () => null;
  let user = { id: 'A' };
  const loaded = compile(source, {
    react: host.hooks,
    '../contexts/AuthContext.jsx': { useAuth: () => ({ user }) },
    'react-hot-toast': {
      Toaster: MockToaster,
      error: (text, options) => events.push({ kind: 'error', text, toasterId: options?.toasterId }),
      success: (text, options) => events.push({ kind: 'success', text, toasterId: options?.toasterId }),
    },
    '../utils/localStorage.js': helpers(utilsSource, env),
  }, { localStorage: env.storage });
  host.attach(() => {
    const tree = loaded.AppProvider({ children: null });
    const toaster = React.Children.toArray(tree.props.children).find(child => child.type === MockToaster);
    assert.ok(toaster, 'favorite failures need a mounted Toaster on every provider page');
    assert.equal(toaster.props.toasterId, 'favorites', 'favorite Toaster must use its dedicated ID');
    host.toasterId = toaster.props.toasterId;
    return tree.props.value;
  });
  host.setUser = (value) => { user = value; };
  host.events = events;
  return host;
}
function verifyProvider(source, utilsSource = helperSource) {
  const knownCounts = (value, shops, people, stage) => {
    assert.equal(value.favoriteShopCountKnown, shops, `${stage}: shop known flag must reflect confirmed data`);
    assert.equal(value.favoriteTherapistCountKnown, people, `${stage}: people known flag must reflect confirmed data`);
  };
  const env = storageFixture({ [`${SHOPS}:A`]: '["shop-a"]', [`${PEOPLE}:A`]: '["person_a"]', [`${SHOPS}:B`]: '["shop-b"]', [`${PEOPLE}:B`]: '["person_b"]', unrelated: 'keep' });
  const host = providerHost(source, env, utilsSource);
  host.render((value) => {
    assert.equal(value.favoritesLoading, true);
    assert.equal(value.favorites.length, 0);
    knownCounts(value, false, false, 'initial render');
    assert.equal(env.operations.length, 0);
  });
  assert.deepEqual(plain(host.value.favorites), ['shop-a']);
  assert.equal(host.value.favoritesLoading, false);
  assert.equal(host.value.favoritesError, false);
  knownCounts(host.value, true, true, 'initial success');
  assert.equal(host.value.toggleFavorite('added_shop').ok, true); host.render();
  assert.deepEqual(plain(host.value.favorites), ['shop-a', 'added_shop']);
  assert.equal(host.value.toggleFavTherapist('added_person').ok, true); host.render();
  assert.deepEqual(plain(host.value.favTherapists), ['person_a', 'added_person']);
  assert.equal(env.operations.filter((op) => op.method === 'set' && op.key === `${SHOPS}:A`).length, 1, 'one toggle must persist once even with double-invoked updaters');

  for (const fault of ['write', 'ignoreWrite', 'read']) {
    const previous = plain(host.value.favorites);
    const beforeEvents = host.events.length;
    env.failures[fault] = true;
    assert.equal(host.value.toggleFavorite('rejected_shop').ok, false);
    host.render();
    assert.deepEqual(plain(host.value.favorites), previous, 'save failure must not display a successfully saved favorite');
    const notifications = host.events.slice(beforeEvents);
    assert.ok(notifications.some((event) => event.kind === 'error'), 'save rejection needs an error notice');
    assert.ok(!notifications.some((event) => event.kind === 'success'), 'save rejection must not show a success notice');
    assert.ok(notifications.every(event => event.toasterId === host.toasterId), 'notices must target the mounted favorite Toaster');
    env.failures[fault] = false;
  }
  env.failures.read = true; host.value.retryFavorites();
  host.render((value) => {
    assert.equal(value.favoritesLoading, true);
    const before = env.operations.length;
    assert.equal(value.toggleFavorite('during_retry').ok, false, 'pending retry must not toggle a stale snapshot');
    assert.equal(env.operations.length, before);
  });
  assert.equal(host.value.favoritesError, true);
  knownCounts(host.value, true, true, 'failed retry retains known counts');
  assert.deepEqual(plain(host.value.favorites), ['shop-a', 'added_shop'], 'read retry rejection retains earlier valid display');
  assert.deepEqual(plain(host.value.favTherapists), ['person_a', 'added_person']);
  assert.equal(host.value.toggleFavorite('blocked').ok, false);
  env.failures.read = false; host.value.retryFavorites(); host.render();
  assert.equal(host.value.favoritesError, false);
  knownCounts(host.value, true, true, 'recovered retry');
  host.setUser({ id: 'B' });
  host.render((value) => {
    assert.equal(value.favorites.length, 0, 'A favorites must disappear in the first render for B');
    assert.equal(value.favTherapists.length, 0, 'A people must disappear in the first render for B');
    assert.equal(value.favoritesLoading, true);
    knownCounts(value, false, false, 'first render for B');
    const before = env.operations.length;
    assert.equal(value.toggleFavorite('during_switch').ok, false, 'switching accounts must not save A IDs into B storage');
    assert.equal(env.operations.length, before);
  });
  assert.deepEqual(plain(host.value.favorites), ['shop-b']);
  assert.deepEqual(plain(host.value.favTherapists), ['person_b']);
  knownCounts(host.value, true, true, 'B success');
  host.setUser(null); host.render();
  assert.equal(host.value.favorites.length, 0);
  assert.equal(host.value.favoritesLoading, false);
  knownCounts(host.value, false, false, 'anonymous');
  assert.equal(host.value.toggleFavorite('anonymous').ok, false);
  assert.ok(host.events.filter(event => event.kind === 'error').every(event => event.toasterId === host.toasterId), 'read and write rejection notices must both target the mounted Toaster');
  assert.equal(env.values.get('unrelated'), 'keep');
  host.unmount();

  const legacy = storageFixture({ [SHOPS]: '["legacy_shop"]', [PEOPLE]: '["legacy_person"]' });
  legacy.failures.remove = true;
  const migrated = providerHost(source, legacy, utilsSource); migrated.render();
  assert.deepEqual(plain(migrated.value.favorites), ['legacy_shop']);
  assert.deepEqual(plain(migrated.value.favTherapists), ['legacy_person']);
  migrated.setUser({ id: 'B' }); migrated.render();
  assert.equal(migrated.value.favorites.length, 0, 'legacy A shops must not leak to B after failed remove');
  assert.equal(migrated.value.favTherapists.length, 0, 'legacy A people must not leak to B after failed remove');
  migrated.unmount();
  const partial = storageFixture({ [SHOPS]: '["legacy_A_shop"]', [PEOPLE]: '["legacy_A_person"]' });
  const save = partial.storage.setItem;
  let deniedPerson = true;
  partial.storage.setItem = (key, value) => {
    if (deniedPerson && (key === `${PEOPLE}:A` || key === `${PEOPLE}:migration_owner`)) throw new Error('fixture partial quota');
    save(key, value);
  };
  const partialHost = providerHost(source, partial, utilsSource); partialHost.render();
  assert.deepEqual(plain(partialHost.value.favorites), ['legacy_A_shop']);
  assert.equal(partialHost.value.favTherapists.length, 0);
  assert.equal(partialHost.value.favoritesError, true);
  knownCounts(partialHost.value, true, false, 'partial migration');
  deniedPerson = false;
  partialHost.setUser({ id: 'B' }); partialHost.render();
  assert.equal(partialHost.value.favorites.length, 0);
  assert.equal(partialHost.value.favTherapists.length, 0, 'partial A migration must not expose old people to B');
  assert.equal(partialHost.value.favoritesError, false);
  partialHost.unmount();
  const malformed = storageFixture({ [`${SHOPS}:A`]: '{}', [`${PEOPLE}:A`]: '{bad' });
  const invalid = providerHost(source, malformed, utilsSource); invalid.render();
  assert.equal(invalid.value.favoritesError, true);
  knownCounts(invalid.value, false, false, 'invalid initial saved JSON');
  assert.equal(invalid.value.toggleFavorite('blocked').ok, false);
  invalid.unmount();

  const initialReadFailure = storageFixture({ [`${SHOPS}:A`]: '["saved_shop"]', [`${PEOPLE}:A`]: '["saved_person"]' });
  initialReadFailure.failures.read = true;
  const unreadable = providerHost(source, initialReadFailure, utilsSource); unreadable.render();
  knownCounts(unreadable.value, false, false, 'initial read rejection');
  assert.equal(unreadable.value.favoritesError, true);
  assert.equal(unreadable.value.favorites.length, 0);
  assert.equal(unreadable.value.favTherapists.length, 0);
  initialReadFailure.failures.read = false;
  unreadable.value.retryFavorites(); unreadable.render();
  knownCounts(unreadable.value, true, true, 'read retry success');
  assert.deepEqual(plain(unreadable.value.favorites), ['saved_shop']);
  assert.deepEqual(plain(unreadable.value.favTherapists), ['saved_person']);
  initialReadFailure.failures.read = true;
  unreadable.value.retryFavorites(); unreadable.render();
  knownCounts(unreadable.value, true, true, 'later read rejection');
  assert.deepEqual(plain(unreadable.value.favorites), ['saved_shop']);
  assert.deepEqual(plain(unreadable.value.favTherapists), ['saved_person']);
  unreadable.setUser({ id: 'B' });
  unreadable.render(value => knownCounts(value, false, false, 'switch while reads rejected'));
  knownCounts(unreadable.value, false, false, 'B initial read rejection');
  assert.equal(unreadable.value.favorites.length, 0);
  assert.equal(unreadable.value.favTherapists.length, 0);
  unreadable.unmount();
}

verifyHelpers(helperSource);
verifyHistory(historySource);
verifyProvider(providerSource);

// 実ファイルは変更せず、ソースをメモリ内で壊して各検査が失敗することを確認する。
assert.throws(() => verifyHelpers(helperSource.replace('target.getItem(key) === raw', 'true')), /readback rejection|mismatch/);
assert.throws(() => verifyHelpers(helperSource.replaceAll('catch { return { ok: false }; }', 'catch { return { ok: true }; }')), /rejection must/);
assert.throws(() => verifyHelpers(helperSource.replace("if (owner.value && owner.value !== userId) return { ok: true, value: [] };", '')), /must not leak/);
assert.throws(() => verifyHelpers(helperSource.replace("const ownerKey = 'mens_esthe_favorites:migration_owner';", 'const ownerKey = `${legacyKey}:migration_owner`;')), /share an owner/);
assert.throws(() => verifyHistory(historySource.replace('const MAX_HISTORY = 10;', 'const MAX_HISTORY = 20;')), /maximum of ten/);
assert.throws(() => verifyHistory(historySource.replace('filter(i => i.id !== item.id)', 'filter(() => true)')), /replaces the previous entry/);
assert.throws(() => verifyHistory(historySource.replace('const saved = readStoredJson(STORAGE_KEY, []);', 'writeStoredJson(STORAGE_KEY, []); const saved = readStoredJson(STORAGE_KEY, []);')), /before any initial write/);
assert.throws(() => verifyHistory(historySource.replace('setHistory(next);', 'setHistory(() => { writeStoredJson(STORAGE_KEY, next); return next; });')), /updater must be pure/);
assert.throws(() => verifyProvider(providerSource.replace('if (!result.ok) {', 'if (false) {')), /must not display/);
assert.throws(() => verifyProvider(providerSource.replace('saved?.userId === userId ? saved : null', 'saved')), /first render for B/);
assert.throws(() => verifyProvider(providerSource.replace('<Toaster toasterId="favorites" position="top-center" />', '')), /mounted Toaster/);
assert.throws(() => verifyProvider(providerSource.replaceAll("{ toasterId: 'favorites' }", '{}')), /target the mounted/);
assert.throws(() => verifyProvider(providerSource.replace('favoriteShopCountKnown: Boolean(visible?.shopCountKnown)', 'favoriteShopCountKnown: true')), /known flag/);
assert.throws(() => verifyProvider(providerSource.replace('shopCountKnown: shops.ok || Boolean(previous?.shopCountKnown)', 'shopCountKnown: shops.ok')), /known flag/);

console.log('✅ 端末保存: quota/read/remove/破損/readback・履歴10件/重複・初期読込・純粋更新・お気に入り会員切替/部分移行/known件数/失敗案内/Toaster・14妨害検証');
