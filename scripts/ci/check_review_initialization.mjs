import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as targetHelpers from '../../src/features/reviews/reviewTarget.js';
import * as navigationHelpers from '../../src/features/reviews/reviewNavigation.js';
import * as draftHelpers from '../../src/features/reviews/reviewDraft.js';
import * as storyHelpers from '../../src/features/reviews/reviewStory.mjs';
import * as submissionHelpers from '../../src/features/reviews/reviewSubmission.js';
import { reviewSchema } from '../../src/features/reviews/schema/reviewSchema.js';

const { emptyReviewValues, completeReviewValues, reviewFormSignature, reviewTargetSignature, reviewTargetMatches, resolveReviewTarget } = targetHelpers;
const { trySaveBeforeReviewLeave, restoreReviewHistory } = navigationHelpers;
const copy = (value) => JSON.parse(JSON.stringify(value));
const shopA = { id: 'shop-a', name: '店舗A' }, shopB = { id: 'shop-b', name: '店舗B' };
const personA = { id: 'person-a', shop_id: shopA.id, name: '人物A' }, personB = { id: 'person-b', shop_id: shopB.id, name: '人物B' };
const draftData = completeReviewValues({ shopId: shopB.id, therapistId: personB.id, therapistName: personB.name, story: { entrance: '保存したBの体験談'.repeat(20), exit: '保存したBの総評'.repeat(15) }, ratingNotes: { service: '保存したコメント' }, tags: ['丁寧'] });
const savedDraft = (data = draftData, pendingPublish = false) => ({ data: copy(data), savedAt: Date.now(), step: 3, pendingPublish });

function makeClient() {
  const state = { rows: { shops: [shopA, shopB], therapists: [personA, personB] }, errors: {}, defer: null, calls: [] };
  const client = {
    from(table) {
      let id;
      const query = {
        select() { return query; }, eq(_field, value) { id = value; return query; }, abortSignal() { return query; },
        async maybeSingle() {
          state.calls.push({ table, id });
          if (state.defer) await state.defer;
          return { data: state.errors[table] ? null : state.rows[table].find((row) => row.id === id) || null, error: state.errors[table] || null };
        },
      };
      return query;
    },
    auth: { getSession: async () => ({ data: { session: null } }) },
  };
  return { client, state };
}

const { client, state: db } = makeClient();
const canonical = await resolveReviewTarget(draftData, client);
assert.equal(canonical.ok, true);
assert.equal(reviewTargetMatches(draftData, canonical.target), true);
assert.equal(canonical.signature, reviewTargetSignature(draftData));
assert.equal(reviewTargetMatches({ ...draftData, therapistName: '人物A' }, canonical.target), false);
assert.equal((await resolveReviewTarget({ ...draftData, shopId: shopA.id }, client)).kind, 'mismatch');
db.errors.therapists = { status: 503 };
assert.equal((await resolveReviewTarget(draftData, client)).kind, 'unavailable');
delete db.errors.therapists;
assert.equal((await resolveReviewTarget({ ...draftData, therapistId: 'missing' }, client)).kind, 'mismatch');
assert.equal((await resolveReviewTarget({ shopId: shopA.id, therapistId: null, therapistName: '手入力名' }, client)).target.therapistName, '手入力名');
assert.equal((await resolveReviewTarget({ shopId: shopA.id, therapistId: null, therapistName: '' }, client)).ok, true);

// Last successful save, rather than RHF's initial defaults, determines whether leaving is safe.
let saves = 0;
const pristine = reviewFormSignature(draftData);
const edited = copy(draftData); edited.story.exit += '未保存の追記';
assert.equal(trySaveBeforeReviewLeave({ values: draftData, savedSignature: pristine, save() { ++saves; return { success: false }; } }), true);
assert.equal(saves, 0);
assert.equal(trySaveBeforeReviewLeave({ values: edited, savedSignature: pristine, save() { ++saves; return { success: false }; } }), false);
assert.equal(trySaveBeforeReviewLeave({ values: edited, savedSignature: pristine, save() { ++saves; return { success: true }; } }), true);
assert.equal(trySaveBeforeReviewLeave({ values: edited, savedSignature: pristine, enabled: false, save() { throw new Error('completed form must not save'); } }), true);
assert.equal(reviewFormSignature(copy(draftData)), pristine);
assert.equal(reviewFormSignature({ ...draftData, story: { ...draftData.story, session: '追記' } }) === pristine, false);

// Exercise actual page effects and callbacks in memory. The real RHF/Next/Supabase
// boundaries are replaced; no browser storage, account or database is written.
function hooksRuntime() {
  const slots = [];
  let cursor = 0, dirty = false;
  let effects = [];
  const changed = (left, right) => !left || !right || left.length !== right.length || left.some((item, i) => !Object.is(item, right[i]));
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, (next) => {
        const value = typeof next === 'function' ? next(slots[index].value) : next;
        if (!Object.is(value, slots[index].value)) { slots[index].value = value; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: { current: initial } }; return slots[index].value; },
    useMemo(factory, deps) { const index = cursor++; if (!slots[index] || changed(slots[index].deps, deps)) slots[index] = { value: factory(), deps }; return slots[index].value; },
    useCallback(callback, deps) { return hooks.useMemo(() => callback, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || changed(slots[index].deps, deps)) {
        const old = slots[index];
        slots[index] = { deps, cleanup: old?.cleanup };
        effects.push(() => { old?.cleanup?.(); slots[index].cleanup = effect(); });
      }
    },
  };
  return {
    hooks,
    render(component) { cursor = 0; dirty = false; return component(); },
    effects() { const pending = effects; effects = []; for (const run of pending) run(); },
    get dirty() { return dirty; },
    cleanup() { for (const slot of slots) slot?.cleanup?.(); },
  };
}
function loadSource(file, dependencies, globals = {}, extraSource = '') {
  let source = fs.readFileSync(file, 'utf8') + extraSource;
  // Capture private callbacks only inside this VM, to exercise their own guards
  // even when the reconciliation screen correctly hides their controls.
  if (file === 'src/pages/PostReviewPage.jsx') source = source.replace('  // B-3: 投稿完了画面', '  globalThis.__reviewCallbacks = { saveDraftNow, nextStep, editStep };\n  // B-3: 投稿完了画面');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { module: { exports: {} }, exports: {}, console: { ...console, error() {} }, setTimeout, clearTimeout, AbortController, ...globals };
  context.exports = context.module.exports;
  context.require = (id) => { assert.ok(id in dependencies, `unmocked dependency: ${id} in ${file}`); return dependencies[id]; };
  vm.runInNewContext(output, context, { filename: file });
  context.module.exports.__callbacks = () => context.__reviewCallbacks;
  return context.module.exports;
}
const textOf = (node) => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(textOf).join('') : node ? textOf(node.props?.children) : '';
function findAll(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((item) => findAll(item, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...findAll(node.props?.children, predicate)];
}
const findButton = (tree, label) => findAll(tree, (node) => node.type === 'button' && textOf(node).trim() === label)[0];
const noopComponent = () => null;

function pageHarness({ draft = null, requested = {}, shops = [], failStorage = false, user = null } = {}) {
  const runtime = hooksRuntime();
  const values = { current: emptyReviewValues() };
  const watchers = new Set();
  const storageState = { raw: draft ? JSON.stringify(draft) : null, fail: failStorage, writes: 0 };
  const storage = {
    getItem: () => storageState.raw,
    setItem(_key, serialized) { if (storageState.fail) throw new DOMException('quota', 'QuotaExceededError'); ++storageState.writes; storageState.raw = serialized; },
    removeItem() { storageState.raw = null; },
  };
  const timers = new Map(); let timerId = 0;
  const fakeSetTimeout = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; };
  const fakeClearTimeout = (id) => timers.delete(id);
  const documentEvents = new Map(), windowEvents = new Map(), routerEvents = new Map();
  const historyCalls = [];
  const browser = {
    location: { href: 'https://fixture.test/post-review', search: '' }, localStorage: storage,
    navigation: { currentEntry: { index: 3 } },
    history: { state: { key: 'current', as: '/post-review', url: '/post-review' }, go(delta) { historyCalls.push(delta); }, replaceState(next, _title, url) { this.state = next; browser.location.href = url; } },
    addEventListener(name, callback) { windowEvents.set(name, callback); }, removeEventListener(name) { windowEvents.delete(name); }, scrollTo() {},
  };
  const document = { addEventListener(name, callback) { documentEvents.set(name, callback); }, removeEventListener(name) { documentEvents.delete(name); } };
  let query = { ...requested };
  const pushes = [], replaces = [], inserts = [];
  const router = {
    isReady: true, asPath: '/post-review',
    push(url) { pushes.push(url); }, replace(...args) { replaces.push(args); },
    beforePopState(callback) { router.pop = callback; },
    events: { on(name, callback) { routerEvents.set(name, callback); }, off(name) { routerEvents.delete(name); } },
  };
  let resets = 0;
  const methods = {
    getValues(name) { return name ? values.current[name] : values.current; },
    reset(next) { ++resets; values.current = copy(next); for (const callback of watchers) callback(values.current); },
    watch(callback) { if (typeof callback === 'function') { watchers.add(callback); return { unsubscribe: () => watchers.delete(callback) }; } return callback ? values.current[callback] : values.current; },
    setValue(field, next) { values.current[field] = next; for (const callback of watchers) callback(values.current); },
    handleSubmit(callback) { return callback; }, trigger: async () => true,
  };
  const context = { shops, addReview: async (payload) => { inserts.push(copy(payload)); return 'fixture-review'; } };
  const localDb = makeClient();
  const dependencies = {
    react: runtime.hooks,
    'next/router': { useRouter: () => router },
    'react-hook-form': { useForm: () => methods, useFormContext: () => methods, FormProvider: noopComponent, Controller: noopComponent },
    '@hookform/resolvers/zod': { zodResolver: () => () => {} },
    '../schema/reviewSchema': { reviewSchema },
    '../reviewTarget.js': targetHelpers,
    '../reviewNavigation.js': navigationHelpers,
    '../reviewSubmission.js': submissionHelpers,
    '../../../lib/supabase.js': { supabase: localDb.client },
    '../../../contexts/DataContext': { useShopData: () => context },
    '../../../contexts/AuthContext': { useAuth: () => ({ user }) },
  };
  const globals = {
    window: browser, document, localStorage: storage, sessionStorage: { removeItem() {} },
    navigator: { clipboard: { writeText: async () => { throw new Error('denied'); } } },
    fetch: async () => ({ ok: true, json: async () => [] }),
    setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout,
  };
  const hook = loadSource('src/features/reviews/hooks/useReviewForm.js', dependencies, globals);
  const navigation = loadSource('src/features/reviews/hooks/useReviewNavigation.js', dependencies, globals);
  const toast = Object.assign(() => {}, { success() {}, error() {} });
  const pageDeps = {
    react: runtime.hooks,
    'next/router': dependencies['next/router'],
    'react-hook-form': dependencies['react-hook-form'],
    '../compat/router': {
      useNavigate: () => (to) => pushes.push(to), useParams: () => query,
      useSearchParams: () => [new URLSearchParams(query)],
    },
    'react-hot-toast': { Toaster: noopComponent, toast },
    '../features/reviews/hooks/useReviewForm': hook,
    '../features/reviews/hooks/useReviewNavigation.js': navigation,
    '../features/reviews/reviewTarget.js': targetHelpers,
    '../features/reviews/reviewStory.mjs': storyHelpers,
    '../features/reviews/reviewSubmission.js': submissionHelpers,
    '../features/reviews/reviewDraft.js': draftHelpers,
    '../contexts/DataContext.jsx': { useShopData: () => context },
    '../lib/supabase.js': { supabase: localDb.client },
    '../utils/analytics': { trackEvent() {} },
    '../utils/shopHelpers': { getDisplayName: (name) => name || '' },
    '../components/ui/ProgressBar': { ProgressBar: noopComponent }, '../components/ui/RatingSlider': { RatingSlider: noopComponent },
  };
  for (const name of ['LineIcon', 'Header', 'LazyImage', 'TagSelector', 'ReviewStoryContent', 'SeoHead']) pageDeps[`../components/${name}.jsx`] = noopComponent;
  const page = loadSource('src/pages/PostReviewPage.jsx', pageDeps, globals, '\nexport { Step1_Select as __Step1_Select };');
  let tree;
  const oldWindow = globalThis.window;
  const scope = async (callback) => { globalThis.window = browser; try { return await callback(); } finally { if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow; } };
  const flush = () => scope(async () => {
    for (let i = 0; i < 30; ++i) {
      tree = runtime.render(page.default); runtime.effects();
      await new Promise(setImmediate);
      if (!runtime.dirty) return;
    }
    throw new Error('page effects did not settle');
  });
  return {
    flush, runtime, storageState, storage, values, methods, context, localDb, browser, documentEvents, windowEvents, router, pushes, replaces, inserts, historyCalls,
    get tree() { return tree; }, get resets() { return resets; },
    click(label) { return scope(async () => { const button = findButton(tree, label); assert.ok(button, `button missing: ${label}`); button.props.onClick(); await flush(); }); },
    edit(update) { Object.assign(values.current, update); for (const callback of watchers) callback(values.current); },
    runAutosave() { return scope(async () => { for (const [id, timer] of timers) if (timer.delay === 1000) { timers.delete(id); timer.callback(); } await flush(); }); },
    setRoute(next) { query = next; router.asPath = `/post-review?${new URLSearchParams(next)}`; browser.location.href = `https://fixture.test${router.asPath}`; },
    callEvent(type, event) { return scope(async () => { (documentEvents.get(type) || windowEvents.get(type))?.(event); await flush(); }); },
    submit() { return scope(async () => { const form = findAll(tree, (node) => node.type === 'form')[0]; assert.ok(form); await form.props.onSubmit(reviewSchema.parse(values.current)); await flush(); }); },
    callPrivate(name, ...args) { return scope(async () => { await page.__callbacks()[name](...args); await flush(); }); },
    pop(state) { return scope(async () => { const accepted = router.pop(state); await flush(); return accepted; }); },
    step1Harness() {
      const stepRuntime = hooksRuntime();
      const stepDeps = { ...pageDeps, react: stepRuntime.hooks };
      const loaded = loadSource('src/pages/PostReviewPage.jsx', stepDeps, globals, '\nexport { Step1_Select as __Step1_Select };');
      let selected = values.current.shopId || null;
      let stepTree;
      const render = () => {
        for (let i = 0; i < 10; ++i) {
          stepTree = stepRuntime.render(() => loaded.__Step1_Select({ shops: context.shops, shopTherapists: [personA, personB].filter((item) => item.shop_id === selected), selectedShopId: selected, setSelectedShopId: (next) => { selected = next; }, initCustomMode: false }));
          stepRuntime.effects();
          if (!stepRuntime.dirty) return;
        }
        throw new Error('store selector did not settle');
      };
      render();
      return { render, get tree() { return stepTree; }, cleanup: () => stepRuntime.cleanup() };
    },
    async dispose() { runtime.cleanup(); await new Promise(setImmediate); },
  };
}

for (const pending of [false, true]) {
  for (const firstShops of [[], [shopA, shopB]]) {
    for (const same of [false, true]) {
      const requested = same ? { shopId: shopB.id, threadId: personB.id } : { shopId: shopA.id, threadId: personA.id };
      const h = pageHarness({ draft: savedDraft(draftData, pending), requested, shops: firstShops });
      await h.flush();
      if (!pending || !same) {
        assert.equal(h.resets, 0, 'choosing must not reset form');
        assert.equal(h.storageState.writes, 0);
        assert.equal(findAll(h.tree, (node) => node.type === 'form').length, 0);
        assert.equal(findButton(h.tree, '下書き保存'), undefined);
        assert.equal(findButton(h.tree, '次へ進む →'), undefined);
        assert.equal(JSON.parse(h.storageState.raw).data.story.entrance, draftData.story.entrance);
        await h.callPrivate('saveDraftNow'); await h.callPrivate('nextStep');
        assert.equal(h.storageState.writes, 0);
        assert.equal(h.resets, 0);
        assert.ok(textOf(h.tree).includes('1 / 4'));
        await h.click('保存した下書きを再開');
      }
      assert.deepEqual(h.values.current, draftData);
      const resetCount = h.resets;
      h.context.shops = [shopA, shopB]; await h.flush();
      assert.equal(h.resets, resetCount, 'late shop data must not reapply URL target');
      assert.deepEqual(h.values.current, draftData);
      assert.ok(textOf(h.tree).includes(`${pending ? 4 : 3} / 4`));
      await h.dispose();
    }
  }
}

const fresh = pageHarness({ draft: savedDraft(draftData, true), requested: { shopId: shopA.id, threadId: personA.id } });
await fresh.flush();
await fresh.click('開いた人物・店舗へ新しく書く');
assert.equal(fresh.values.current.shopId, shopA.id);
assert.equal(fresh.values.current.therapistId, personA.id);
assert.equal(fresh.values.current.therapistName, personA.name);
assert.equal(fresh.values.current.story.entrance, '');
assert.equal(fresh.storageState.raw, null);
fresh.context.shops = [shopA, shopB]; await fresh.flush();
assert.equal(fresh.values.current.therapistName, personA.name);
fresh.edit({ story: { ...fresh.values.current.story, entrance: 'Aへの入力'.repeat(30), exit: 'Aの総評'.repeat(30) } });
await fresh.runAutosave();
// The same mounted page handles a new URL instead of permanently ignoring it.
fresh.setRoute({ shopId: shopB.id, threadId: personB.id }); await fresh.flush();
assert.ok(findButton(fresh.tree, '保存した下書きを再開'));
assert.equal(fresh.values.current.therapistId, personA.id);
const writesBeforeChoice = fresh.storageState.writes;
await fresh.callPrivate('saveDraftNow'); await fresh.callPrivate('nextStep');
assert.equal(fresh.storageState.writes, writesBeforeChoice, 'unresolved new URL must not save the preceding form');
await fresh.click('開いた人物・店舗へ新しく書く');
assert.equal(fresh.values.current.therapistId, personB.id);
assert.equal(fresh.values.current.therapistName, personB.name);
assert.equal(fresh.values.current.story.entrance, '');
await fresh.dispose();

// The one-second window, quota failure, copy fallback and each exit use the real hook.
const leave = pageHarness({ draft: savedDraft(draftData, true), shops: [shopA, shopB] });
await leave.flush();
leave.edit({ story: { ...draftData.story, exit: draftData.story.exit + '未保存追記' } });
leave.storageState.fail = true;
let prevented = 0, stopped = 0;
const linkEvent = () => ({ button: 0, target: { closest: () => ({ href: 'https://fixture.test/search', hasAttribute: () => false, target: '' }) }, preventDefault() { ++prevented; }, stopImmediatePropagation() { ++stopped; } });
await leave.callEvent('click', linkEvent());
assert.equal(prevented, 1); assert.equal(stopped, 1); assert.equal(leave.pushes.length, 0);
assert.ok(textOf(leave.tree).includes('まだ保存されていない入力'));
assert.equal(leave.values.current.story.exit, draftData.story.exit + '未保存追記');
await leave.click('本文をコピー');
const backup = findAll(leave.tree, (node) => node.type === 'textarea' && node.props.id === 'draft-backup')[0];
assert.ok(backup.props.value.includes('未保存追記')); assert.equal(backup.props.readOnly, true);
await leave.click('画面に残る');
assert.equal(leave.pushes.length, 0);
await leave.callEvent('beforeunload', { preventDefault() { ++prevented; } });
assert.equal(prevented, 2);
await leave.callEvent('click', linkEvent());
await leave.click('保存せず移動');
assert.deepEqual(leave.pushes, ['/search']);
await leave.dispose();

const leaveSuccess = pageHarness({ draft: savedDraft(draftData, true) });
await leaveSuccess.flush();
leaveSuccess.edit({ story: { ...draftData.story, exit: draftData.story.exit + '保存直前の追記' } });
await leaveSuccess.callEvent('click', linkEvent());
assert.equal(JSON.parse(leaveSuccess.storageState.raw).data.story.exit, draftData.story.exit + '保存直前の追記');
assert.equal(JSON.parse(leaveSuccess.storageState.raw).pendingPublish, true);
assert.equal(prevented, 3, 'successful internal exit must not block the click');
leaveSuccess.storageState.fail = true;
await leaveSuccess.callEvent('beforeunload', { preventDefault() { throw new Error('last saved form must not prompt'); } });
await leaveSuccess.dispose();


const unchanged = pageHarness({ draft: savedDraft(draftData, true), failStorage: true });
await unchanged.flush();
await unchanged.callEvent('beforeunload', { preventDefault() { throw new Error('unchanged restored draft is already saved'); } });
await unchanged.dispose();

const cancel = pageHarness({ draft: savedDraft(draftData, true), shops: [shopA, shopB], failStorage: true });
await cancel.flush(); await cancel.callPrivate('editStep', 1);
cancel.edit({ story: { ...draftData.story, exit: draftData.story.exit + 'キャンセル前の追記' } });
await cancel.click('← キャンセル');
assert.equal(cancel.pushes.length, 0);
await cancel.click('画面に残る'); assert.equal(cancel.pushes.length, 0);
await cancel.click('← キャンセル'); await cancel.click('保存せず移動');
assert.deepEqual(cancel.pushes, [-1]);
await cancel.dispose();

// Confirm actual publish payload identity, and reject stale/mismatched identity before any insert.
for (const mismatch of ['name', 'parent', 'unavailable', null]) {
  const h = pageHarness({ draft: savedDraft(draftData, true), shops: [shopA, shopB], user: { id: 'fixture-user', user_metadata: { display_name: '確認名' } } });
  await h.flush();
  if (mismatch === 'name') h.values.current.therapistName = '人物A';
  if (mismatch === 'parent') h.values.current.shopId = shopA.id;
  if (mismatch === 'unavailable') h.localDb.state.errors.therapists = { status: 503 };
  await h.submit();
  if (mismatch) {
    assert.equal(h.inserts.length, 0); assert.equal(h.values.current.story.entrance, draftData.story.entrance);
    assert.ok(textOf(h.tree).includes('店舗・セラピストを選び直す'));
  } else {
    assert.equal(h.inserts.length, 1);
    const payload = h.inserts[0];
    assert.equal(payload.shop_id, shopB.id); assert.equal(payload.therapist_id, personB.id); assert.equal(payload.therapist_name, personB.name);
    assert.equal(payload.content, submissionHelpers.prepareReviewContent(reviewSchema.parse(draftData)).content);
    assert.equal(payload.user_name, '確認名');
    assert.equal(h.storageState.raw, null);
    await h.callEvent('beforeunload', { preventDefault() { throw new Error('completed review must not prompt'); } });
    h.setRoute({ shopId: shopA.id, threadId: personA.id }); await h.flush();
    assert.equal(textOf(h.tree).includes('投稿ありがとうございます'), false, 'a new URL must leave the completed form');
    assert.equal(h.values.current.therapistId, personA.id);
  }
  await h.dispose();
}


// The actual candidate definition responds to native click events generated by
// mouse/touch and Enter/Space; it has no pointer-only dependency or submit type.
for (const activation of ['mouse', 'touch', 'Enter', 'Space']) {
  const h = pageHarness({ shops: [shopA, shopB] });
  await h.flush();
  const selector = h.step1Harness();
  let input = findAll(selector.tree, (node) => node.type === 'input' && node.props.id === 'review-shop-search')[0];
  assert.ok(findAll(selector.tree, (node) => node.type === 'label' && node.props.htmlFor === input.props.id).length);
  input.props.onChange({ target: { value: '店舗B' } });
  input.props.onFocus(); selector.render();
  const candidate = findAll(selector.tree, (node) => node.type === 'button' && textOf(node).includes('店舗B'))[0];
  assert.equal(candidate.props.type, 'button'); assert.equal(candidate.props.onMouseDown, undefined);
  assert.equal(candidate.props['aria-pressed'], false);
  assert.ok(findButton(selector.tree, '店舗の候補を閉じる').props['aria-expanded']);
  input = findAll(selector.tree, (node) => node.type === 'input' && node.props.id === 'review-shop-search')[0];
  let focusCount = 0;
  input.props.ref.current = { focus() { ++focusCount; input.props.onFocus(); } };
  candidate.props.onClick({ detail: ['Enter', 'Space'].includes(activation) ? 0 : 1 });
  selector.render();
  assert.equal(h.values.current.shopId, shopB.id);
  assert.equal(h.values.current.therapistId, null); assert.equal(h.values.current.therapistName, '');
  assert.equal(focusCount, 1);
  assert.ok(findButton(selector.tree, '店舗の候補を表示'));
  findButton(selector.tree, '店舗の候補を表示').props.onClick(); selector.render();
  const selectedCandidate = findAll(selector.tree, (node) => node.type === 'button' && textOf(node).includes('店舗B'))[0];
  assert.equal(selectedCandidate.props['aria-pressed'], true);
  selector.cleanup(); await h.dispose();
}

// Real beforePopState callback stops the route, restores Back, and needs an
// explicit discard before replay. A second Back after staying is protected again.
const back = pageHarness({ draft: savedDraft(draftData, true), failStorage: true });
await back.flush(); back.edit({ story: { ...draftData.story, exit: draftData.story.exit + '戻る前の未保存追記' } });
back.browser.navigation.currentEntry.index = 2;
assert.equal(await back.pop({ key: 'prior', url: '/search', as: '/search', options: {} }), false);
assert.deepEqual(back.historyCalls, [1]); assert.equal(back.pushes.length, 0);
back.browser.navigation.currentEntry.index = 3;
assert.equal(await back.pop(back.browser.history.state), false);
await back.click('画面に残る');
back.browser.navigation.currentEntry.index = 2;
assert.equal(await back.pop({ key: 'prior', url: '/search', as: '/search', options: {} }), false);
assert.deepEqual(back.historyCalls, [1, 1]);
back.browser.navigation.currentEntry.index = 3;
assert.equal(await back.pop(back.browser.history.state), false);
await back.click('保存せず移動');
assert.deepEqual(back.historyCalls, [1, 1, -1]);
assert.equal(await back.pop({ key: 'prior', url: '/search', as: '/search', options: {} }), true);
await back.dispose();

// URL resolutions arriving out of order cannot apply an obsolete person/name.
const delayed = pageHarness({ requested: { shopId: shopA.id, threadId: personA.id } });
let resolveInitial;
delayed.localDb.state.defer = new Promise((resolve) => { resolveInitial = resolve; });
await delayed.flush();
delayed.setRoute({ shopId: shopB.id, threadId: personB.id }); await delayed.flush();
resolveInitial(); await delayed.flush();
assert.equal(delayed.values.current.shopId, shopB.id);
assert.equal(delayed.values.current.therapistId, personB.id);
assert.equal(delayed.values.current.therapistName, personB.name);
assert.equal(delayed.resets, 1);
await delayed.dispose();

const changing = pageHarness({ draft: savedDraft(draftData, true), user: { id: 'fixture-user' } });
await changing.flush();
let resolveCheck;
changing.localDb.state.defer = new Promise((resolve) => { resolveCheck = resolve; });
const inFlightSubmit = changing.submit(); await new Promise(setImmediate);
changing.edit({ therapistId: personA.id, therapistName: personA.name });
resolveCheck(); await inFlightSubmit;
assert.equal(changing.inserts.length, 0, 'changing a target during its preflight must not insert the old payload');
await changing.dispose();

// History is restored before a failed Back/Forward is replayed. Fallback must also
// finish so a later pop isn't treated as the old restoration.
for (const destinationIndex of [2, 4]) {
  const calls = [], replacements = [];
  const browser = { navigation: { currentEntry: { index: destinationIndex } }, history: { go: (delta) => calls.push(delta), replaceState: (...args) => replacements.push(args) } };
  let restoredCount = 0, replayed = 0;
  const pending = restoreReviewHistory(browser, { index: 3, state: { key: 'original' }, url: 'https://fixture.test/post-review' }, () => ++restoredCount);
  pending.restore({ key: 'original' });
  await pending.replay(() => ++replayed, () => assert.fail('known history should replay'));
  assert.deepEqual(calls, [3 - destinationIndex, destinationIndex - 3]);
  assert.equal(restoredCount, 1); assert.equal(pending.restored, true); assert.equal(replayed, 1); assert.equal(replacements.length, 0);
}
const fallbackCalls = [];
let fallbackDone = 0, fallbackReplayed = 0;
const fallback = restoreReviewHistory({ history: { go: (delta) => fallbackCalls.push(delta), replaceState() {} } }, { state: { key: 'original' }, url: 'https://fixture.test/post-review' }, () => ++fallbackDone);
await new Promise((resolve) => setTimeout(resolve, 280));
assert.equal(fallback.restored, true); assert.equal(fallbackDone, 1);
await fallback.replay(() => assert.fail('unknown history fallback should not blind-replay'), () => ++fallbackReplayed);
assert.equal(fallbackReplayed, 1);

console.log('✅ 投稿先・下書きの統合初期化、保存前離脱保護、送信ID/name整合性チェック OK');
