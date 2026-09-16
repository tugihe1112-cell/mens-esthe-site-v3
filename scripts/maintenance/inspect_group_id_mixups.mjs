/**
 * inspect_group_id_mixups.mjs — 無関係な店が1つのブランドに混ざっていないか調べる【読むだけ】
 *
 * 【読むだけ】本番DBを1行も変更しない。
 *
 * 【なぜ必要か（2026-09-16）】
 * THE HALF 五反田の group_id が **`other`** という文字列だった。
 * 同じ `other` を持つ「キャンディスパ」と**同じブランド**として束ねられ、本番の
 * `/brands/other` が「THE HALF ／ 2ルーム ／ **セラピスト229名**」になっていた。
 * 229名 = THE HALF 113名 + キャンディスパ 116名。**別の店の在籍者が混ざって表示されていた。**
 * さらに D-014 により `/shops/tokyo_candy_spa` は**この THE HALF のページへ301**していた
 * （キャンディスパを探した人が別の店に飛ばされる）。
 *
 * 【なぜ静かに壊れるか】
 *  group_id は「意味の単位」であると同時に **口コミの共有キー**でもある。
 *  壊れた形でも画面は正常に描画されるので、ページを見ても気づけない。
 *  気づけるのは「同じ group_id の店どうしが似ていない」ことを**数えたとき**だけ。
 *
 * 【判定の中身】`scripts/lib/brandNameMatch.mjs` にある（監視も同じものを使う）。
 *  ⚠️ これは「疑わしい」であって「間違い」ではない。
 *     直す前に必ず人が公式サイトで確かめること。この一覧をそのまま修正値にしない。
 *
 * 【直すとき】`fix_brand_group_ids.mjs --file=<対応表.tsv>`（下見が既定）。
 *
 * 実行: node scripts/maintenance/inspect_group_id_mixups.mjs
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { classifyGroup, selfTestMatching } from '../lib/brandNameMatch.mjs';

// 🚩 突き合わせ方の自己診断は**ネットワークより前**。
//    後ろに置くと、DBに繋がらない場所では自己診断まで到達できず、
//    妨害テストで壊れたことを確かめられない（2026-09-16、実際に確かめられなかった）。
{
  const problems = selfTestMatching();
  if (problems.length) {
    console.error('❌ 突き合わせ方が壊れています。この一覧は信用できないので出しません:');
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
}

function env(name) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '');
  }
  return process.env[name];
}
const sb = createClient(env('VITE_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

// ⚠️ PostgREST は1回に最大1000行しか返さない。range で最後まで繰る。
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

const shops = await fetchAll('shops', 'id, group_id, name, raw_data');
const therapists = await fetchAll('therapists', 'id, shop_id');

const tCount = new Map();
for (const t of therapists) tCount.set(t.shop_id, (tCount.get(t.shop_id) || 0) + 1);

const groups = new Map();
for (const s of shops) {
  if (!s.group_id) continue;
  if (!groups.has(s.group_id)) groups.set(s.group_id, []);
  groups.get(s.group_id).push(s);
}

const mixed = [];
const renamed = [];
for (const [gid, rooms] of groups) {
  const { verdict, nameCore, idCore, isPlaceholder } = classifyGroup({ gid, rooms });
  if (verdict === 'ok') continue;
  const people = rooms.reduce((sum, r) => sum + (tCount.get(r.id) || 0), 0);
  (verdict === 'mixed' ? mixed : renamed).push({ gid, rooms, nameCore, idCore, isPlaceholder, people });
}
const bySeverity = (a, b) => (b.isPlaceholder - a.isPlaceholder) || (b.people - a.people);
mixed.sort(bySeverity);
renamed.sort(bySeverity);

const multi = [...groups.values()].filter((r) => r.length >= 2).length;
console.log(`shops ${shops.length}件 ／ group_id ${groups.size}種 ／ 2ルーム以上 ${multi}件`);

const report = (title, list, note) => {
  console.log(`\n━━ ${title} ${list.length}件 ━━`);
  if (note) console.log(`   ${note}`);
  if (!list.length) { console.log('   （該当なし）'); return; }
  for (const s of list) {
    console.log(`\n■ group_id=${s.gid}${s.isPlaceholder ? '  🚩置き場所の無い値' : ''}`);
    console.log(`   ${s.rooms.length}ルーム ／ セラピスト合計 ${s.people}名 ／ 名前の共通部分「${s.nameCore || 'なし'}」／ idの共通部分「${s.idCore || 'なし'}」`);
    console.log(`   → /brands/${s.gid} が1枚のブランドページになり、各ルームの店舗URLはそこへ301します。`);
    for (const r of s.rooms) {
      const raw = r.raw_data || {};
      const area = Array.isArray(raw.area) ? raw.area.join('・') : (raw.area || '—');
      console.log(`     - ${r.name} [${r.id}] エリア:${area} セラピスト:${tCount.get(r.id) || 0}名`);
    }
  }
};

report('① 無関係な店の混入（名前もidも共通部分が無い）', mixed,
  'これは直す対象。別の店の在籍者が混ざり、店舗URLが別の店へ301します。');
report('② idは揃っているが名前が違う（改名・2ブランド運営の疑い）', renamed,
  '取り込みは同じブランドだと判断している。畳むか分けるかは人が公式サイトで決めること。');
