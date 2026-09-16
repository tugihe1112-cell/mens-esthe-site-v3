/**
 * inspect_therapist_count_rules.mjs — 「在籍N人」の数え方が画面ごとに違う件を測る【読むだけ】
 *
 * 【読むだけ】本番DBを1行も変更しない。
 *
 * 【なぜ必要か（2026-09-16）】
 * Cannele の店舗ページに **「在籍 39 人」と「在籍セラピスト 全36人」が同時に出ていた**。
 * 同じラベルの数字が同じ画面に2つあって、合っていない。
 *
 * 【3つの数え方が並存している】
 *   ① 店舗情報の「在籍N人」… SSRの count。**その店の全行**（写真なしも含む／系列は含まない）
 *      pages/shops/[shopId]/index.jsx の therapistCountRes
 *   ② 一覧の「全N人」… クライアント取得。**写真がある行だけ**／**系列店ぜんぶ**
 *      src/pages/ShopDetailPage.jsx の therapists.length（`image_url=not.is.null`）
 *   ③ ブランドページの「セラピストN名」… **人単位で重複排除**（写真の有無は問わない）／系列ぜんぶ
 *      src/utils/brandGroups.js の buildBrandRoster の personCount
 *
 * 🚩【最初の版はD-014の301を考えていなかった（2026-09-16）】
 *  複数ルームのブランドは**店舗ページが301でブランドページへ飛ぶ**（D-014）ので、
 *  そのページの①②は**誰にも表示されない**。最初の版はそれを数に入れており、
 *  「Lynx が 194 対 2181」のような**到達できないページの食い違い**を上位に並べていた。
 *  （2181は12ルームぶんの行を足した数＝同じ人を最大12回数えている。実際の人数は381。）
 *  ⇒ **①と②が本当に同じ画面に並ぶのは、ルームが1つの店だけ。** そこだけを数える。
 *
 * 【測ること】①と②が**実際に同じ画面に出る店**で、どれだけ食い違うか。
 *  ⚠️ これは「どれが正しいか」を決める道具ではない。**どれだけ食い違っているか**を出すだけ。
 *     どの数字を見せるかは利用者に何を伝えたいかの判断で、機械には決められない。
 *
 * 実行: node scripts/maintenance/inspect_therapist_count_rules.mjs
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

const shops = await fetchAll('shops', 'id, name, group_id');
const therapists = await fetchAll('therapists', 'id, shop_id, name, image_url, is_active, last_seen_at');

const groupOf = new Map(shops.map((s) => [s.id, s.group_id]));
const shopsInGroup = new Map();
for (const s of shops) {
  const g = s.group_id || `__solo__${s.id}`;
  if (!shopsInGroup.has(g)) shopsInGroup.set(g, []);
  shopsInGroup.get(g).push(s.id);
}

const byShop = new Map();
for (const t of therapists) {
  if (!byShop.has(t.shop_id)) byShop.set(t.shop_id, []);
  byShop.get(t.shop_id).push(t);
}

const rows = [];
let redirected = 0;
for (const s of shops) {
  const own = byShop.get(s.id) || [];
  const rule1 = own.length; // 店舗情報「在籍N人」
  const groupIds = shopsInGroup.get(s.group_id || `__solo__${s.id}`) || [s.id];
  // 🚩 D-014: ルームが2つ以上なら店舗ページは301でブランドページへ飛ぶ＝この画面は出ない。
  if (groupIds.length > 1) { redirected += 1; continue; }
  const groupRows = groupIds.flatMap((id) => byShop.get(id) || []);
  const rule2 = groupRows.filter((t) => String(t.image_url ?? '').trim() !== '').length; // 一覧「全N人」
  const names = new Set();
  for (const t of groupRows) {
    const k = normalizeTherapistName(t.name);
    if (k) names.add(k);
  }
  const rule3 = names.size; // ブランド「セラピストN名」
  if (rule1 === rule2) continue;
  // その「在籍N人」の中身がどれだけ確かめられているか。
  // ⚠️ 名乗っている数が現在の在籍なのか、古い行が溜まったものなのかで直し方が変わる。
  const inactive = own.filter((t) => t.is_active === false).length;
  const noLastSeen = own.filter((t) => !t.last_seen_at).length;
  const stale180 = own.filter((t) => t.last_seen_at && Date.parse(t.last_seen_at) < Date.now() - 180 * 86400000).length;
  rows.push({ id: s.id, name: s.name, rule1, rule2, rule3, diff: rule1 - rule2, inactive, noLastSeen, stale180 });
}

rows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
const over = rows.filter((r) => r.diff > 0).length;
const under = rows.filter((r) => r.diff < 0).length;

// 🚩 いちばん重いのは「人数を名乗っているのに一覧が空」。
//    ②が0なら画面には「在籍セラピスト情報はありません」しか出ない。
//    ①は出続けるので、**N人と書いてあるのに誰も出ない**ページになる。
const empty = rows.filter((r) => r.rule2 === 0);

const reachable = shops.length - redirected;
console.log(`shops ${shops.length}件`);
console.log(`   うち店舗ページが301で飛ぶ（この画面は出ない）… ${redirected}件`);
console.log(`   店舗ページが実際に出る（ルーム1つ）… ${reachable}件`);
console.log(`\n①と②が食い違う店 ${rows.length}件（出るページの ${(rows.length / reachable * 100).toFixed(0)}%）`);
console.log(`   ①のほうが多い（写真なしの人がいる）… ${over}件`);
console.log(`   ②のほうが多い… ${under}件\n`);
console.log(`🚩 人数を名乗っているのに一覧が空（②=0）… ${empty.length}件`);
console.log(`   ＝「在籍N人」と書いてあるのに「在籍セラピスト情報はありません」しか出ないページ。`);
console.log(`   名乗っている合計 ${empty.reduce((a, r) => a + r.rule1, 0).toLocaleString()}人ぶん。`);
const sum = (k) => empty.reduce((a, r) => a + r[k], 0);
console.log(`   その中身: 非表示 ${sum('inactive').toLocaleString()}行 ／ 最終確認日なし ${sum('noLastSeen').toLocaleString()}行 ／ 180日超未確認 ${sum('stale180').toLocaleString()}行`);
console.log(`   ⚠️ 「最終確認日なし」や「180日超未確認」が大半なら、直すのは見せ方ではなく**数字そのもの**。\n`);

console.log('━━ ずれの大きい順（上位20件）━━');
console.log('   ①店舗情報「在籍」 ／ ②一覧「全N人」 ／ ③ブランド「N名」');
for (const r of rows.slice(0, 20)) {
  console.log(`   ${String(r.rule1).padStart(4)} ／ ${String(r.rule2).padStart(4)} ／ ${String(r.rule3).padStart(4)}  ${r.name} [${r.id}]`);
  console.log(`        └ 非表示${r.inactive} ／ 最終確認日なし${r.noLastSeen} ／ 180日超未確認${r.stale180}`);
}
console.log(`\n⚠️ どの数字を見せるかは機械には決められない。ここでは食い違いの量だけ出している。`);
