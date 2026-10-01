import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { fetchTherapistsByName, THERAPIST_NAME_QUERY_MAX_LENGTH } from '../../src/utils/therapistSearch.js';

const calls = [];
const profile = { id: 'amane', shop_id: 'relax', name: '天音　しおり' };
const client = {
  rpc: async (name, args) => {
    calls.push({ name, args });
    return { data: [profile], error: null };
  },
};
for (const query of ['天音しおり', '天音 しおり', '天音シオリ', '天音 ｼｵﾘ']) {
  const result = await fetchTherapistsByName(client, query);
  assert.deepEqual(result.data, [profile], 'DB matches must not be dropped by raw-name client filtering');
  assert.equal(result.capped, false);
  assert.deepEqual(calls.at(-1), {
    name: 'search_therapists_by_normalized_name',
    args: { p_name_query: query, p_shop_ids: null, p_limit: 501 },
  }, 'Retrieval must use the normalizing RPC, not raw name ilike/prefix filtering');
}
await fetchTherapistsByName(client, '天音しおり', { shopIds: ['relax', 'relax'], limit: 1000 });
assert.deepEqual(calls.at(-1).args.p_shop_ids, ['relax']);
assert.equal(calls.at(-1).args.p_limit, 1001);
const priorCalls = calls.length;
assert.deepEqual((await fetchTherapistsByName(client, '天音しおり', { shopIds: [] })).data, []);
assert.deepEqual((await fetchTherapistsByName(client, '　 ')).data, []);
assert.equal(calls.length, priorCalls, 'Empty shop selection/blank name must not query all profiles');

const failure = { code: '08006', message: 'connection failed' };
const failed = await fetchTherapistsByName({ rpc: async () => ({ data: null, error: failure }) }, 'しおり');
assert.equal(failed.error, failure);
assert.equal(failed.data, null, 'Failure must remain distinct from no matches');
await assert.rejects(fetchTherapistsByName({ rpc: async () => { throw new Error('network'); } }, 'しおり'), /network/);
await assert.rejects(fetchTherapistsByName({ rpc: async () => ({ data: null, error: null }) }, 'しおり'), /Invalid/);
await assert.rejects(fetchTherapistsByName(client, 'a'.repeat(THERAPIST_NAME_QUERY_MAX_LENGTH + 1)), /too long/);
const exactLimit = await fetchTherapistsByName({ rpc: async () => ({ data: [profile, profile], error: null }) }, 'しおり', { limit: 2 });
assert.equal(exactLimit.capped, false, 'Exactly limit rows are not a capped result');
const capped = await fetchTherapistsByName({ rpc: async () => ({ data: [profile, profile, profile], error: null }) }, 'しおり', { limit: 2 });
assert.equal(capped.data.length, 2);
assert.equal(capped.capped, true);
const apiCapped = await fetchTherapistsByName({ rpc: async () => ({ data: Array(1000).fill(profile), error: null }) }, 'しおり', { limit: 1000 });
assert.equal(apiCapped.capped, true, 'PostgREST can truncate 1001 requested rows to 1000; retain 件以上');

// JSXの親要素まで辿り、lg:hiddenだけ付けてもsm:hiddenの内側なら落とす。
function verifyFilterBoundary(source) {
  const tree = ts.createSourceFile('SearchPage.jsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  let opener;
  function visit(node) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(tree) === 'button'
      && node.attributes.properties.some(attribute => ts.isJsxAttribute(attribute)
        && attribute.name.getText(tree) === 'ref' && attribute.initializer?.getText(tree) === '{filterOpenerRef}')) opener = node;
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.ok(opener, 'Filter opener must exist');
  function classes(node) {
    if (!ts.isJsxOpeningElement(node)) return '';
    const attr = node.attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(tree) === 'className');
    return attr?.initializer?.getText(tree) || '';
  }
  assert.match(classes(opener), /\blg:hidden\b/, 'Opener must remain visible below 1024px');
  let ancestor = opener.parent?.parent;
  while (ancestor) {
    if (ts.isJsxElement(ancestor)) {
      assert.doesNotMatch(classes(ancestor.openingElement), /\b(?:sm|md):hidden\b/, 'A parent hides the opener at tablet widths');
    }
    ancestor = ancestor.parent;
  }
  assert.match(source, /window\.matchMedia\('\(min-width: 1024px\)'\)/, 'Crossing desktop boundary must release modal body scroll lock');
  assert.match(source, /await fetchTherapistsByName\(supabase, cq,/, 'Page must actually use normalized retrieval');
}
const page = fs.readFileSync('src/pages/SearchPage.jsx', 'utf8');
verifyFilterBoundary(page);
const hiddenAtTablet = page.replace('className="lg:hidden min-h-10 w-full', 'className="sm:hidden min-h-10 w-full');
assert.throws(() => verifyFilterBoundary(hiddenAtTablet), /Opener must remain visible/);
const parentHides = page.replace('className="max-w-7xl mx-auto px-4 py-3 sm:py-4 space-y-3"', 'className="sm:hidden max-w-7xl mx-auto px-4 py-3 sm:py-4 space-y-3"');
assert.throws(() => verifyFilterBoundary(parentHides), /parent hides/);
console.log('PASS: therapist search RPC, combined search, limits, errors, tablet filter ancestry, mutation verification');
