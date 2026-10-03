/** Execute the actual post page, selector and grid with delayed read-only fixtures. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import ts from 'typescript';
import * as targetHelpers from '../../src/features/reviews/reviewTarget.js';
import * as draftHelpers from '../../src/features/reviews/reviewDraft.js';
import * as storyHelpers from '../../src/features/reviews/reviewStory.mjs';
import * as submissionHelpers from '../../src/features/reviews/reviewSubmission.js';
import { reviewSchema } from '../../src/features/reviews/schema/reviewSchema.js';

const mutation = process.env.POST_CANDIDATE_GUARD_MUTATION;
const mutations = {
  failureEmpty: ["status: 'error', items: []", "status: 'success', items: []"],
  retryMissing: ['setTherapistRetry((attempt) => attempt + 1);', ''],
  retryHandlerMissing: ['onClick={retryTherapists}', 'onClick={() => {}}'],
  oldShopStatus: ['therapistLoad.shopId === selectedShopId ? therapistLoad.status : \'loading\'', 'therapistLoad.status'],
  oldShopItems: ["therapistLoad.shopId === selectedShopId && therapistLoadStatus === 'success'\n    ? therapistLoad.items : []", 'therapistLoad.items'],
  staleRequest: ['isMounted && request === therapistRequestRef.current && candidateShopRef.current === selectedShopId', 'true'],
  foreignRows: ['data.filter((item) => item.shop_id === selectedShopId)', 'data'],
  manualOnError: ["if (therapistLoadStatus !== 'success') return null;", ''],
  errorClearsTarget: ["if (isCurrent()) setTherapistLoad({ shopId: selectedShopId, status: 'error', items: [] });", "if (isCurrent()) { methods.setValue('therapistId', null); methods.setValue('therapistName', ''); setTherapistLoad({ shopId: selectedShopId, status: 'error', items: [] }); }"],
  selectedNameMissing: ['{selectedTherapistId && therapistName && <p className="mb-3 text-sm text-pink-200">選択済み: {therapistName}</p>}', ''],
  loadingNoticeMissing: ["therapistLoadStatus === 'loading' && <p", "false && <p"],
  errorNoticeMissing: ["therapistLoadStatus === 'error' && (", 'false && ('],
  filteredMissingNotice: ['filtered.length === 0 && filter && (', 'false && ('],
};
let source = fs.readFileSync('src/pages/PostReviewPage.jsx', 'utf8');
if (mutation) {
  assert.ok(mutations[mutation], `Unknown sabotage ${mutation}`);
  const [before, after] = mutations[mutation];
  assert.ok(source.includes(before), `Missing sabotage target ${mutation}`);
  source = source.replace(before, after);
}
source = source.replace('  // B-3: 投稿完了画面', '  globalThis.__callbacks = { editStep };\n  // B-3: 投稿完了画面');
source += '\nexport { Step1_Select as __Step1_Select, TherapistGrid as __TherapistGrid };';
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;

const copy = (value) => JSON.parse(JSON.stringify(value));
const shopA = { id: 'shop-a', name: '店舗A' }, shopB = { id: 'shop-b', name: '店舗B' };
const personA = { id: 'person-a', shop_id: shopA.id, name: '人物A' }, personB = { id: 'person-b', shop_id: shopB.id, name: '人物B' };
const draftData = targetHelpers.completeReviewValues({ shopId: shopA.id, therapistId: personA.id, therapistName: personA.name, story: { entrance: '書きかけの体験談'.repeat(20), exit: '保存した総評'.repeat(20) }, tags: ['丁寧'] });
const savedDraft = (data = draftData, pendingPublish = true) => ({ data: copy(data), savedAt: Date.now(), step: 1, pendingPublish });
const response = (data = [], status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const noop = () => null;
const textOf = (node) => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(textOf).join('') : node ? textOf(node.props?.children) : '';
function findAll(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((item) => findAll(item, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...findAll(node.props?.children, predicate)];
}
const button = (tree, label) => findAll(tree, (node) => node.type === 'button' && textOf(node).trim() === label)[0];

function hooksRuntime() {
  const slots = [];
  let cursor = 0, dirty = false, effects = [];
  const changed = (left, right) => !left || !right || left.length !== right.length || left.some((item, index) => !Object.is(item, right[index]));
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
        const old = slots[index]; slots[index] = { deps, cleanup: old?.cleanup };
        effects.push(() => { old?.cleanup?.(); slots[index].cleanup = effect(); });
      }
    },
  };
  return {
    hooks, render(component) { cursor = 0; dirty = false; return component(); },
    effects() { const pending = effects; effects = []; for (const run of pending) run(); },
    get dirty() { return dirty; }, cleanup() { for (const slot of slots) slot?.cleanup?.(); },
  };
}

function harness({ draft = null, requested = {}, missingConfig = false } = {}) {
  const runtime = hooksRuntime(), selectorRuntime = hooksRuntime(), gridRuntime = hooksRuntime();
  let activeRuntime = runtime;
  const hooks = { ...React };
  for (const name of ['useState', 'useRef', 'useMemo', 'useCallback', 'useEffect']) hooks[name] = (...args) => activeRuntime.hooks[name](...args);
  const values = { current: targetHelpers.emptyReviewValues() }, watchers = new Set();
  const methods = {
    getValues: (name) => name ? values.current[name] : values.current,
    reset(next) { values.current = copy(next); for (const callback of watchers) callback(values.current); },
    watch(name) { if (typeof name === 'function') { watchers.add(name); return { unsubscribe: () => watchers.delete(name) }; } return name ? values.current[name] : values.current; },
    setValue(name, next) { values.current[name] = next; for (const callback of watchers) callback(values.current); },
    handleSubmit: (callback) => callback, trigger: async () => true,
  };
  let rawDraft = draft ? JSON.stringify(draft) : null;
  const storage = { getItem: () => rawDraft, setItem(_key, value) { rawDraft = value; }, removeItem() { rawDraft = null; } };
  const browser = { localStorage: storage, scrollTo() {} };
  const pushes = [], calls = [], timers = new Map(); let timerId = 0;
  const fakeSetTimeout = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; };
  const fakeClearTimeout = (id) => timers.delete(id);
  const client = {
    from(table) {
      let id;
      const query = {
        select() { return query; }, eq(_field, value) { id = value; return query; }, abortSignal() { return query; },
        maybeSingle: async () => ({ data: (table === 'shops' ? [shopA, shopB] : [personA, personB]).find((row) => row.id === id) || null, error: null }),
      };
      return query;
    },
  };
  const deps = {
    react: hooks, 'next/router': { useRouter: () => ({ isReady: true }) },
    'react-hook-form': { useFormContext: () => methods, FormProvider: noop, Controller: noop },
    '../compat/router': { useNavigate: () => (url) => pushes.push(url), useParams: () => requested, useSearchParams: () => [new URLSearchParams(requested)] },
    'react-hot-toast': { Toaster: noop, toast: Object.assign(() => {}, { success() {}, error() {} }) },
    '../features/reviews/hooks/useReviewForm': { useReviewForm: () => ({ methods, isSubmitting: false, user: null, submitReview() { assert.fail('fixture must never publish'); } }) },
    '../features/reviews/hooks/useReviewNavigation.js': { useReviewNavigation: () => ({ leaveRequested: false, requestNavigation: (action) => action(), stay() {}, discardAndLeave() {} }) },
    '../features/reviews/reviewTarget.js': targetHelpers,
    '../features/reviews/reviewDraft.js': draftHelpers,
    '../features/reviews/reviewStory.mjs': storyHelpers,
    '../features/reviews/reviewSubmission.js': submissionHelpers,
    '../contexts/DataContext.jsx': { useShopData: () => ({ shops: [shopA, shopB] }) },
    '../lib/supabase.js': { supabase: client },
    '../utils/analytics': { trackEvent() {} }, '../utils/shopHelpers': { getDisplayName: (name) => name || '' },
    '../components/ui/ProgressBar': { ProgressBar: noop }, '../components/ui/RatingSlider': { RatingSlider: noop },
  };
  for (const name of ['LineIcon', 'Header', 'LazyImage', 'TagSelector', 'ReviewStoryContent', 'SeoHead']) deps[`../components/${name}.jsx`] = noop;
  const context = {
    module: { exports: {} }, exports: {}, React: hooks, console, AbortController,
    window: browser, document: { addEventListener() {}, removeEventListener() {} }, localStorage: storage, sessionStorage: { removeItem() {} },
    process: { env: missingConfig ? {} : { VITE_SUPABASE_URL: 'https://fixture.test', VITE_SUPABASE_ANON_KEY: 'fixture-public-key' } },
    fetch: (url, options) => new Promise((resolve, reject) => {
      calls.push({ shopId: new URL(url).searchParams.get('shop_id').slice(3), options, resolve, reject });
      // Deliberately ignore abort to verify stale-result suppression independently.
    }),
    setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout,
    require(id) { assert.ok(id in deps, `unmocked dependency: ${id}`); return deps[id]; },
  };
  context.exports = context.module.exports;
  vm.runInNewContext(compiled, context, { filename: 'src/pages/PostReviewPage.jsx' });
  const page = context.module.exports;
  let tree, stepTree, gridTree;
  const scope = async (callback) => {
    const previous = globalThis.window; globalThis.window = browser;
    try { return await callback(); } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; }
  };
  const renderPage = () => { activeRuntime = runtime; tree = runtime.render(page.default); return tree; };
  const settlePage = () => scope(async () => {
    for (let i = 0; i < 30; ++i) {
      renderPage(); runtime.effects(); await new Promise(setImmediate);
      if (!runtime.dirty) return;
    }
    assert.fail('post page effects did not settle');
  });
  const stepElement = () => findAll(tree, (node) => node.type === page.__Step1_Select)[0];
  const renderSelector = () => {
    const element = stepElement(); assert.ok(element, 'step 1 must be visible');
    for (let i = 0; i < 10; ++i) {
      activeRuntime = selectorRuntime; stepTree = selectorRuntime.render(() => page.__Step1_Select(element.props)); selectorRuntime.effects();
      if (!selectorRuntime.dirty) break;
    }
    const grid = findAll(stepTree, (node) => node.type === page.__TherapistGrid)[0];
    gridTree = null;
    if (grid) { activeRuntime = gridRuntime; gridTree = gridRuntime.render(() => page.__TherapistGrid(grid.props)); gridRuntime.effects(); }
    return [stepTree, gridTree];
  };
  return {
    values, calls, pushes, methods, settlePage, renderPage, renderSelector,
    get tree() { return tree; }, get stepProps() { return stepElement()?.props; }, get view() { return [stepTree, gridTree]; }, get rawDraft() { return rawDraft; },
    async editStep(step) { await scope(async () => { context.__callbacks.editStep(step); await settlePage(); }); },
    async chooseShop(shop) {
      renderSelector();
      button(stepTree, '店舗の候補を表示').props.onClick(); renderSelector();
      const input = findAll(stepTree, (node) => node.type === 'input' && node.props.id === 'review-shop-search')[0];
      input.props.onChange({ target: { value: shop.name } }); renderSelector();
      button(stepTree, shop.name).props.onClick();
    },
    async clickPage(label) { await scope(async () => { const selected = button(tree, label); assert.ok(selected, `button missing: ${label}`); selected.props.onClick(); await settlePage(); }); },
    async retry() { renderSelector(); const retry = button(stepTree, '同じ店舗を再試行'); assert.ok(retry); retry.props.onClick(); await settlePage(); renderSelector(); },
    filterPeople(value) {
      renderSelector();
      const input = findAll(gridTree, (node) => node.type === 'input')[0]; assert.ok(input);
      input.props.onChange({ target: { value } }); renderSelector();
    },
    async submitForLogin() {
      await scope(async () => { const form = findAll(tree, (node) => node.type === 'form')[0]; assert.ok(form); await form.props.onSubmit(reviewSchema.parse(values.current)); await settlePage(); });
    },
    dispose() { runtime.cleanup(); selectorRuntime.cleanup(); gridRuntime.cleanup(); },
  };
}

const assertNoMissing = (h) => {
  h.renderSelector();
  assert.equal(textOf(h.view).includes('見つかりません'), false);
  assert.equal(textOf(h.view).includes('まだリストに登録されていません'), false);
  assert.equal(findAll(h.view, (node) => node.type === 'button' && textOf(node).includes('リストに')).length, 0, 'unavailable candidates must not invite manual entry');
};

for (const failure of ['503', 'network', 'malformed']) {
  const h = harness({ draft: savedDraft() });
  await h.settlePage(); await h.editStep(1);
  assert.equal(h.stepProps.therapistLoadStatus, 'loading'); assertNoMissing(h);
  assert.ok(textOf(h.view).includes('この店舗のセラピストを読み込んでいます'));
  assert.ok(textOf(h.view).includes(`選択済み: ${personA.name}`));
  const before = copy(h.values.current);
  if (failure === 'network') h.calls[0].reject(new Error('fixture network detail must stay private'));
  else h.calls[0].resolve(response(failure === 'malformed' ? { invalid: true } : null, failure === '503' ? 503 : 200));
  await h.settlePage();
  assert.equal(h.stepProps.therapistLoadStatus, 'error'); assertNoMissing(h);
  assert.ok(textOf(h.view).includes('この店舗のセラピストを読み込めませんでした'));
  assert.equal(textOf(h.view).includes('fixture network detail'), false);
  assert.deepEqual(h.values.current, before);
  await h.retry();
  assert.equal(h.calls.length, 2); assert.equal(h.calls[1].shopId, shopA.id);
  assert.equal(h.stepProps.therapistLoadStatus, 'loading'); assert.deepEqual(h.values.current, before);
  h.calls[1].resolve(response([personA, personB])); await h.settlePage(); h.renderSelector();
  assert.equal(h.stepProps.therapistLoadStatus, 'success');
  assert.deepEqual(copy(h.stepProps.shopTherapists), [personA]);
  const selected = button(h.view, personA.name); assert.ok(selected, 'retry must recover the real person card');
  selected.props.onClick(); assert.equal(h.values.current.therapistId, personA.id); assert.equal(h.values.current.therapistName, personA.name);
  assert.equal(h.values.current.story.entrance, before.story.entrance);
  h.dispose();
}

const empty = harness({ requested: { shopId: shopA.id } });
await empty.settlePage(); empty.calls[0].resolve(response([])); await empty.settlePage(); empty.renderSelector();
assert.equal(empty.stepProps.therapistLoadStatus, 'success');
assert.ok(textOf(empty.view).includes('まだリストに登録されていません'));
assert.ok(textOf(empty.view).includes('手入力の口コミは非公開です'));
assert.equal(textOf(empty.view).includes('読み込めませんでした'), false);
const manual = findAll(empty.view, (node) => node.type === 'button' && textOf(node).includes('リストに'))[0]; assert.ok(manual);
manual.props.onClick(); empty.renderSelector();
const customInput = findAll(empty.view, (node) => node.type === 'input' && node.props.id === 'review-custom-therapist')[0];
customInput.props.onChange({ target: { value: '新しい人物' } }); assert.equal(empty.values.current.therapistId, null); assert.equal(empty.values.current.therapistName, '新しい人物');
empty.dispose();

for (const staleResult of ['success', '503', 'network']) {
  const h = harness({ requested: { shopId: shopA.id } }); await h.settlePage();
  const pendingA = h.calls[0];
  await h.chooseShop(shopB); h.renderPage();
  assert.equal(h.stepProps.therapistLoadStatus, 'loading', 'the first B render must hide A state');
  assert.deepEqual(copy(h.stepProps.shopTherapists), []);
  await h.settlePage(); assert.equal(h.calls[1].shopId, shopB.id);
  h.calls[1].resolve(response([personB])); await h.settlePage();
  if (staleResult === 'network') pendingA.reject(new Error('late A network failure'));
  else pendingA.resolve(response(staleResult === 'success' ? [personA] : null, staleResult === '503' ? 503 : 200));
  await h.settlePage(); h.renderSelector();
  assert.equal(h.stepProps.therapistLoadStatus, 'success', 'late A results cannot replace B success');
  assert.deepEqual(copy(h.stepProps.shopTherapists), [personB]); assert.ok(button(h.view, personB.name)); assert.equal(button(h.view, personA.name), undefined);
  h.dispose();
}

// Also inspect the first B render when A already succeeded, before any effects.
const switched = harness({ requested: { shopId: shopA.id } }); await switched.settlePage();
switched.calls[0].resolve(response([personA])); await switched.settlePage(); await switched.chooseShop(shopB); switched.renderPage();
assert.equal(switched.stepProps.therapistLoadStatus, 'loading'); assert.deepEqual(copy(switched.stepProps.shopTherapists), []); assertNoMissing(switched);
await switched.settlePage(); switched.calls[1].resolve(response(null, 503)); await switched.settlePage(); await switched.retry();
assert.equal(switched.calls[2].shopId, shopB.id); switched.calls[2].resolve(response([personB])); await switched.settlePage(); assert.equal(switched.stepProps.therapistLoadStatus, 'success'); switched.dispose();

const filtering = harness({ requested: { shopId: shopA.id } }); await filtering.settlePage();
filtering.calls[0].resolve(response([personA])); await filtering.settlePage(); filtering.filterPeople('該当しない人物');
assert.ok(textOf(filtering.view).includes('「該当しない人物」に一致するセラピストが見つかりません'));
await filtering.chooseShop(shopB); filtering.renderPage(); assertNoMissing(filtering);
await filtering.settlePage(); filtering.calls[1].resolve(response(null, 503)); await filtering.settlePage(); assertNoMissing(filtering); filtering.dispose();

const generic = harness(); await generic.settlePage(); await generic.chooseShop(shopA); await generic.settlePage();
assert.equal(generic.calls.length, 1, 'no shop must not start a candidate request'); generic.dispose();
const unconfigured = harness({ requested: { shopId: shopA.id }, missingConfig: true }); await unconfigured.settlePage();
assert.equal(unconfigured.stepProps.therapistLoadStatus, 'error'); assertNoMissing(unconfigured); unconfigured.dispose();

// A restored manual draft retains its name and body through a failed candidate read.
const manualData = { ...draftData, therapistId: null, therapistName: '保存した手入力人物' };
const restoredManual = harness({ draft: savedDraft(manualData) }); await restoredManual.settlePage(); await restoredManual.editStep(1);
restoredManual.calls[0].reject(new Error('fixture offline')); await restoredManual.settlePage(); restoredManual.renderSelector();
assert.equal(findAll(restoredManual.view, (node) => node.type === 'input' && node.props.id === 'review-custom-therapist')[0].props.value, manualData.therapistName);
assert.ok(button(restoredManual.view, '同じ店舗を再試行')); assert.equal(restoredManual.values.current.story.entrance, manualData.story.entrance);
await restoredManual.retry(); restoredManual.calls[1].resolve(response([])); await restoredManual.settlePage(); assert.equal(restoredManual.values.current.therapistName, manualData.therapistName); restoredManual.dispose();

// Candidate availability never changes A01's URL/draft choice or the real target
// saved before leaving for login. The anonymous branch writes only fixture storage.
const conflicting = harness({ draft: savedDraft(), requested: { shopId: shopB.id, threadId: personB.id } }); await conflicting.settlePage();
assert.ok(button(conflicting.tree, '保存した下書きを再開')); assert.equal(conflicting.calls.length, 0);
await conflicting.clickPage('保存した下書きを再開'); await conflicting.editStep(1);
conflicting.calls[0].resolve(response(null, 503)); await conflicting.settlePage();
assert.deepEqual(conflicting.values.current, draftData);
await conflicting.submitForLogin();
assert.deepEqual(conflicting.pushes, ['/login?redirect=%2Fpost-review']);
const forLogin = JSON.parse(conflicting.rawDraft); assert.equal(forLogin.pendingPublish, true); assert.equal(forLogin.step, 4);
assert.equal(forLogin.data.shopId, shopA.id); assert.equal(forLogin.data.therapistId, personA.id); assert.equal(forLogin.data.therapistName, personA.name); assert.deepEqual(forLogin.data.story, reviewSchema.parse(draftData).story);
conflicting.dispose();

console.log('✅ 投稿人物候補: 読込/失敗/0件、同店再試行、旧店舗応答排除、本文・正式人物・登録前下書き保持 OK');
