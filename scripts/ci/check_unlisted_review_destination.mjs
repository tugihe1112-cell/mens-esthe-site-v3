/** C01: real brand assembly -> SearchPage's actual Link -> actual post initialization. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { buildBrands } from '../../src/utils/brandGroups.js';
import * as targetHelpers from '../../src/features/reviews/reviewTarget.js';
import * as navigationHelpers from '../../src/features/reviews/reviewNavigation.js';
import * as draftHelpers from '../../src/features/reviews/reviewDraft.js';
import * as storyHelpers from '../../src/features/reviews/reviewStory.mjs';
import * as submissionHelpers from '../../src/features/reviews/reviewSubmission.js';
import { reviewSchema } from '../../src/features/reviews/schema/reviewSchema.js';

const searchSource = fs.readFileSync('src/pages/SearchPage.jsx', 'utf8');
const destinationSource = fs.readFileSync('src/utils/unlistedReviewDestination.js', 'utf8');
const compile = source => ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React,
  esModuleInterop: true, target: ts.ScriptTarget.ES2022,
} }).outputText;
function loadDestination(source) {
  const loadedModule = { exports: {} };
  vm.runInNewContext(compile(source), { module: loadedModule, exports: loadedModule.exports, URLSearchParams });
  assert.equal(typeof loadedModule.exports.unlistedReviewDestination, 'function');
  return loadedModule.exports.unlistedReviewDestination;
}
function nodesIn(source) {
  const file = ts.createSourceFile('SearchPage.jsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  const nodes = [];
  const visit = node => { nodes.push(node); ts.forEachChild(node, visit); };
  visit(file);
  return nodes;
}
function linkExpression(source) {
  const links = nodesIn(source).filter(node => ts.isJsxElement(node)
    && node.openingElement.tagName.getText() === 'Link'
    && node.getText().includes('リストに<br />いない'));
  assert.equal(links.length, 1, 'The visible unlisted-review Link must have one definition');
  const to = links[0].openingElement.attributes.properties.find(property => property.name?.getText() === 'to');
  assert.ok(to && ts.isJsxExpression(to.initializer) && to.initializer.expression, 'Link needs an executable destination');
  return to.initializer.expression.getText();
}
function effectCallback(source, marker) {
  const effects = nodesIn(source).filter(node => ts.isCallExpression(node)
    && node.expression.getText() === 'useEffect' && node.arguments[0]?.getText().includes(marker));
  assert.equal(effects.length, 1, `One real effect must own ${marker}`);
  return effects[0].arguments[0].getText();
}
function syncUrl(source, fields) {
  let result;
  vm.runInNewContext(`(${effectCallback(source, 'setSearchParams(params')})()`, {
    castInput: '', selectedTags: [], startTransition: callback => callback(),
    ...fields, setSearchParams: params => { result = params; },
  });
  assert.ok(result, 'Actual URL synchronization must run');
  return result;
}
function resolveShopInput(source, fields) {
  let value = fields.shopInput;
  vm.runInNewContext(`(${effectCallback(source, 'setShopInput(shopById')})()`, {
    ...fields, setShopInput: next => { value = next; },
  });
  return value;
}

// Reuse only existing harness definitions, stopping before its test cases. The harness
// compiles the actual page and form/navigation hooks; it writes only memory fixtures.
const initializationGuard = fs.readFileSync('scripts/ci/check_review_initialization.mjs', 'utf8');
const harnessEnd = initializationGuard.indexOf('\nfor (const pending of [false, true])');
const fixtureEnd = initializationGuard.indexOf('\nconst { client, state: db } = makeClient();');
const harnessStart = initializationGuard.indexOf('\nfunction hooksRuntime()');
assert.ok(fixtureEnd > 0 && harnessStart > fixtureEnd && harnessEnd > harnessStart,
  'Post initialization harness boundaries must remain identifiable');
const harnessModule = { exports: {} };
const dependencies = {
  'node:assert/strict': assert, 'node:fs': fs, 'node:vm': vm, typescript: ts, react: React,
  '../../src/features/reviews/reviewTarget.js': targetHelpers,
  '../../src/features/reviews/reviewNavigation.js': navigationHelpers,
  '../../src/features/reviews/reviewDraft.js': draftHelpers,
  '../../src/features/reviews/reviewStory.mjs': storyHelpers,
  '../../src/features/reviews/reviewSubmission.js': submissionHelpers,
  '../../src/features/reviews/schema/reviewSchema.js': { reviewSchema },
};
vm.runInNewContext(compile(initializationGuard.slice(0, fixtureEnd) + initializationGuard.slice(harnessStart, harnessEnd)
  + '\nexport { pageHarness, findAll, textOf, savedDraft, draftData, shopB, personB };'), {
  module: harnessModule, exports: harnessModule.exports, console: { ...console, error() {} },
  setTimeout, clearTimeout, setImmediate, URLSearchParams, AbortController, DOMException,
  require: id => { assert.ok(id in dependencies, `Unexpected harness import: ${id}`); return dependencies[id]; },
}, { filename: 'unlisted-review-post-harness.cjs' });
const { pageHarness, findAll, textOf, savedDraft, draftData, shopB, personB } = harnessModule.exports;

const tigerRooms = [
  { id: 'tokyo_minato_shinbashi_tiger_gate', group_id: 'g_brand_tiger_gate', name: 'TIGER GATE 新橋店', area: '新橋' },
  { id: 'tokyo_minato_toranomon_tiger_gate', group_id: 'g_brand_tiger_gate', name: 'TIGER GATE 虎ノ門店', area: '虎ノ門' },
];
const solo = { id: 'qa_actual_solo', group_id: 'g_brand_solo', name: 'SOLO' };
const encoded = { id: 'qa_空白 &?/#', group_id: 'g_brand_encoded', name: 'URL確認店舗' };
const foreign = { id: 'qa_other_shop', group_id: 'g_brand_other', name: '別ブランド' };
const allShops = [...tigerRooms, solo, encoded, foreign];
const shopById = Object.fromEntries(allShops.map(shop => [shop.id, shop]));
const tiger = buildBrands(tigerRooms);
assert.equal(tiger.length, 1);
assert.equal(tiger[0].id, 'g_brand_tiger_gate');
assert.deepEqual(tiger[0].shopIds.sort(), tigerRooms.map(room => room.id).sort());

async function postFor(url, { draft = null } = {}) {
  const requested = Object.fromEntries(new URL(url, 'https://fixture.test').searchParams);
  const h = pageHarness({ requested, shops: [...allShops, shopB], draft });
  h.localDb.state.rows.shops = [...allShops, shopB];
  h.localDb.state.rows.therapists = [personB];
  await h.flush();
  return h;
}
async function verify(source = searchSource, helperSource = destinationSource) {
  const unlistedReviewDestination = loadDestination(helperSource);
  const expression = linkExpression(source);
  const destination = fields => vm.runInNewContext(`(${expression})`, {
    matchingShops: tiger, initShopId: '', shopById, shopInput: 'TIGER GATE', shopQuery: 'TIGER GATE',
    unlistedReviewDestination, ...fields,
  });
  const cases = [
    ['two actual rooms in one brand', {}, ''],
    ['single real shop under a distinct brand ID', { matchingShops: buildBrands([solo]), shopInput: solo.name, shopQuery: solo.name }, solo.id],
    ['several matching brands', { matchingShops: buildBrands([...tigerRooms, solo]), shopInput: '東京', shopQuery: '東京' }, ''],
    ['explicit actual room of the current brand', { initShopId: tigerRooms[1].id, shopInput: tigerRooms[1].name, shopQuery: tigerRooms[1].name }, tigerRooms[1].id],
    ['old explicit room after another query', { initShopId: tigerRooms[1].id }, ''],
    ['old explicit room during debounce', { initShopId: tigerRooms[1].id, shopInput: '別ブランド', shopQuery: tigerRooms[1].name }, ''],
    ['single old result during debounce', { matchingShops: buildBrands([solo]), shopInput: '別ブランド', shopQuery: solo.name }, ''],
    ['selected actual room outside matching brand', { initShopId: foreign.id, shopInput: foreign.name, shopQuery: foreign.name }, ''],
    ['brand ID is never a valid selected shop', { initShopId: tiger[0].id }, ''],
    ['nonexistent selected ID is not preserved', { initShopId: 'missing' }, ''],
    ['unknown second room must not narrow to the remaining room', { shopById: { [tigerRooms[0].id]: tigerRooms[0] } }, ''],
    ['single unknown shop cannot initialize a target', { matchingShops: buildBrands([solo]), shopById: {}, shopInput: solo.name, shopQuery: solo.name }, ''],
    ['repeated room IDs remain one actual shop', { matchingShops: buildBrands([solo, solo]), shopInput: solo.name, shopQuery: solo.name }, solo.id],
    ['actual shop ID receives URL encoding', { matchingShops: buildBrands([encoded]), shopInput: encoded.name, shopQuery: encoded.name }, encoded.id],
    ['changed query cannot retain the former explicit shop', { matchingShops: buildBrands([solo]), initShopId: tigerRooms[1].id, shopInput: solo.name, shopQuery: solo.name }, solo.id],
    ['a corrupt catalogue key cannot count as a real shop', { matchingShops: buildBrands([solo]), shopById: { [solo.id]: foreign }, shopInput: solo.name, shopQuery: solo.name }, ''],
  ];
  for (const [label, fields, expectedShopId] of cases) {
    const url = destination(fields);
    const parsed = new URL(url, 'https://fixture.test');
    assert.equal(parsed.pathname, '/post-review', label);
    assert.equal(parsed.hash, '', label);
    assert.equal(parsed.searchParams.get('customMode'), 'true', label);
    assert.equal(parsed.searchParams.get('shopId') || '', expectedShopId, label);
    assert.equal(parsed.searchParams.size, expectedShopId ? 2 : 1, label);
    const post = await postFor(url);
    try {
      assert.equal(post.values.current.shopId, expectedShopId, `${label}: actual post initialization`);
      assert.equal(post.values.current.therapistId, null, label);
      assert.equal(post.values.current.story.entrance, '', label);
      assert.ok(textOf(post.tree).includes('1 / 4'), label);
      assert.ok(!textOf(post.tree).includes('開いた店舗・セラピストの組み合わせを確認できませんでした'), label);
      const selector = findAll(post.tree, node => node.type?.name === 'Step1_Select')[0];
      assert.ok(selector, `${label}: Step 1 must be reachable`);
      assert.equal(selector.props.initCustomMode, true, label);
      assert.equal(selector.props.selectedShopId || '', expectedShopId, label);
      assert.equal(post.inserts.length, 0, 'Destination verification must never publish');
    } finally { await post.dispose(); }
  }

  // Initial catalogue arrival must resolve the actual explicit shop and keep its ID.
  const selected = { initShopId: tigerRooms[1].id, shopInput: '', shopById: {} };
  assert.equal(syncUrl(source, selected).shopId, selected.initShopId);
  const resolvedInput = resolveShopInput(source, { ...selected, shopById });
  assert.equal(resolvedInput, tigerRooms[1].name);
  assert.equal(syncUrl(source, { ...selected, shopById, shopInput: resolvedInput }).shopId, selected.initShopId);
  assert.equal(syncUrl(source, { ...selected, shopById, shopInput: solo.name }).shopId, undefined,
    'Editing an explicit shop query must drop the old URL ID');

  // The same fixed link must preserve the existing URL/draft reconciliation.
  const singleUrl = destination({ matchingShops: buildBrands([solo]), shopInput: solo.name, shopQuery: solo.name });
  const pending = await postFor(singleUrl, { draft: savedDraft(draftData, true) });
  try {
    const originalRaw = pending.storageState.raw;
    assert.ok(textOf(pending.tree).includes('保存した下書きを再開'));
    assert.equal(findAll(pending.tree, node => node.type === 'form').length, 0);
    assert.equal(pending.storageState.writes, 0);
    assert.equal(pending.storageState.raw, originalRaw);
    await pending.click('開いた人物・店舗へ新しく書く');
    assert.equal(pending.values.current.shopId, solo.id);
    assert.equal(pending.values.current.therapistId, null);
    assert.equal(pending.values.current.story.entrance, '');
    assert.equal(pending.storageState.raw, null, 'Choosing a new shop cannot carry the old body into it');
  } finally { await pending.dispose(); }
  const multiDraft = await postFor(destination({}), { draft: savedDraft(draftData, false) });
  try {
    assert.ok(textOf(multiDraft.tree).includes('保存した下書きを再開'));
    assert.equal(multiDraft.storageState.writes, 0);
    await multiDraft.click('保存した下書きを再開');
    assert.equal(multiDraft.values.current.shopId, draftData.shopId);
    assert.equal(multiDraft.values.current.therapistId, draftData.therapistId);
    assert.equal(multiDraft.values.current.story.entrance, draftData.story.entrance);
  } finally { await multiDraft.dispose(); }
}
await verify();

// Sabotage only memory strings. Restoring the original visible Link or removing a
// helper definition's actual checks must fail, without touching working source/DB.
const expression = linkExpression(searchSource);
const mutations = [
  ['old brand-ID Link restored', searchSource.replace(expression,
    "matchingShops.length === 1 || initShopId ? `/post-review?shopId=${initShopId || matchingShops[0].id}&customMode=true` : '/post-review?customMode=true'"), destinationSource],
  ['representative room automatically chosen', searchSource.replace(expression,
    "`/post-review?shopId=${initShopId || matchingShops[0].primaryShopId}&customMode=true`"), destinationSource],
  ['old URL shop ID kept after query editing', searchSource.replace("if (shopById?.[initShopId]?.name === shopInput) params.shopId = initShopId;", 'if (initShopId) params.shopId = initShopId;'), destinationSource],
  ['debounce guard removed', searchSource, destinationSource.replace('shopInput === shopQuery && shopQuery.trim()', 'shopQuery.trim()')],
  ['current input membership removed', searchSource, destinationSource.replace('selectedShop.name === shopInput && ', '')],
  ['matching-brand membership removed', searchSource, destinationSource.replace(' && shopIds.includes(selectedShopId)', '')],
  ['arbitrary first actual shop chosen', searchSource, destinationSource.replace('shopIds.length === 1', 'shopIds.length >= 1')],
  ['shop-ID URL encoding removed', searchSource, destinationSource.replace('params.toString()', "`shopId=${params.get('shopId') || ''}&customMode=true`")],
  ['catalogue identity validation removed', searchSource, destinationSource.replace('shopById?.[shopIds[0]]?.id === shopIds[0]', 'true')],
];
for (const [label, source, helperSource] of mutations) {
  assert.ok(source !== searchSource || helperSource !== destinationSource, `Missing sabotage anchor: ${label}`);
  await assert.rejects(verify(source, helperSource), undefined, `Protection removed without detection: ${label}`);
}
console.log('✅ 未登録人物の投稿先: 実ブランド生成→実検索Link→実投稿初期化・1店舗/複数ルーム/複数ブランド・明示店舗/旧ID・URL符号化・下書き保護・9妨害検証');
