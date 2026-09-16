/**
 * inspect_raw_therapists.mjs — raw_data.therapists（取り込み元の文字列）の実在を測る【読むだけ】
 *
 * 【読むだけ】本番DBを1行も変更しない。
 *
 * 【なぜ必要か（2026-09-16）】
 * THE HALF 恵比寿の `raw_data.therapists` は50件で、うち**49件が therapists テーブルに存在しない**。
 * 名前は 熱海→伊東→沼津→…→浜松→豊橋→岡崎→豊田 と**静岡〜愛知の市町村を地理順に並べた**もの。
 * 恵比寿の店のデータとしては不自然で、生成された残骸の可能性が高い。
 *
 * 【🚩なぜ危ないか】`src/contexts/DataContext.jsx` の getTherapistsByShopId は
 *   **`return [...fromTable, ...fromRaw];`** ＝ フォールバックではなく**足し算**。
 *   つまりDBの本物の在籍者に、raw_data の文字列から作った行が**足されて**返る。
 *   ShopDetailPage はクライアント取得が0件・失敗のときにこれを使うので、
 *   **実在しない名前が在籍者として画面に出うる**。
 *
 * 【測ること】
 *   A raw_data.therapists がある店は何店か
 *   B そのうち「テーブルに存在しない名前」を含む店と件数
 *   C **raw_data にしか無い店**（テーブルの在籍が0件）＝ここを消すとデータが減る店
 *     ⚠️ Cが多いなら「raw を無視する」だけでは済まない。Cの数で直し方が変わる。
 *
 * 実行: node scripts/maintenance/inspect_raw_therapists.mjs
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { normalizeTherapistName } from '../../src/utils/reviewIdentity.js';

function env(name) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '');
  }
  return process.env[name];
}
const sb = createClient(env('VITE_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

async function fetchAll(table, columns) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const shops = await fetchAll('shops', 'id, name, group_id, raw_data');
const therapists = await fetchAll('therapists', 'id, shop_id, name');

// ⚠️ 名前の突き合わせは reviewIdentity に一本化する（半角/全角・空白のゆれを畳む）。
const tableNames = new Map(); // shop_id → Set(正規化名)
for (const t of therapists) {
  if (!tableNames.has(t.shop_id)) tableNames.set(t.shop_id, new Set());
  const k = normalizeTherapistName(t.name);
  if (k) tableNames.get(t.shop_id).add(k);
}

const strip = (v) => String(v ?? '').replace(/^unknown_/, '').trim();

let withRaw = 0;
const rows = [];
let rawOnly = 0;
for (const s of shops) {
  const listed = Array.isArray(s.raw_data?.therapists) ? s.raw_data.therapists : [];
  if (!listed.length) continue;
  withRaw += 1;
  const own = tableNames.get(s.id) || new Set();
  const missing = listed.filter((v) => {
    const k = normalizeTherapistName(strip(v));
    return k && !own.has(k);
  });
  if (own.size === 0) rawOnly += 1;
  if (!missing.length) continue;
  rows.push({ id: s.id, name: s.name, listed: listed.length, missing: missing.length, table: own.size, sample: missing.slice(0, 4).map(strip) });
}

rows.sort((a, b) => b.missing - a.missing);
const totalMissing = rows.reduce((a, r) => a + r.missing, 0);

console.log(`shops ${shops.length}件`);
console.log(`   A raw_data.therapists がある店 … ${withRaw}件`);
console.log(`   B うち「テーブルに無い名前」を含む店 … ${rows.length}件（該当の名前 合計 ${totalMissing.toLocaleString()}件）`);
console.log(`   C raw はあるがテーブルの在籍が0件の店 … ${rawOnly}件`);
console.log(`     ⚠️ Cが多いと「rawを無視する」だけでは在籍が消える店が出る。Cの数で直し方が変わる。\n`);

console.log('━━ テーブルに無い名前が多い順（上位20件）━━');
for (const r of rows.slice(0, 20)) {
  console.log(`   raw${String(r.listed).padStart(4)} / 不在${String(r.missing).padStart(4)} / テーブル${String(r.table).padStart(4)}  ${r.name} [${r.id}]`);
  console.log(`        例: ${r.sample.join('、')}`);
}
console.log(`\n⚠️ 「テーブルに無い」は「架空」と同義ではない。取り込みの取りこぼしの可能性もある。判断材料であって判決ではない。`);
