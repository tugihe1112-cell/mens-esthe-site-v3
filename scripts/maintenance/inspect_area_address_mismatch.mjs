/**
 * inspect_area_address_mismatch.mjs — 「エリア」と「住所」が食い違う店を洗い出す（読むだけ）
 *
 * 【読むだけ】本番DBを1行も変更しない。
 *
 * 【なぜ必要か（2026-09-15）】
 * 今日直したデータ不整合（doigt de fee / リオラ / オトナコード4030）は**全部この型**だった＝
 * レコードの `area` が、実際の所在地と違う場所を指している。
 * さらに本番を見ていて Silk (シルク) が「住所=渋谷区笹塚／エリア=代々木・原宿」になっているのを
 * 見つけた。笹塚は渋谷区だが代々木でも原宿でもない。
 *
 * 【これが効く理由】D-014 で店舗ページをブランド1枚に畳んだ今、
 * 支店レコードが存在する理由は**地名だけ**。エリアが間違っていると、
 * その店は**本来の地名で検索しても出てこず、関係ない地名で出てくる**。
 *
 * 【判定】住所があるのに、エリア名（「・」区切りの各語）が**どれも住所に出てこない**とき。
 *  ⚠️ これは「疑わしい」であって「間違い」ではない。
 *     例: 住所が「東京都渋谷区」までしか無い店では、エリア「恵比寿」は正しくても一致しない。
 *     ⇒ **住所の詳しさで段を分けて報告する**（市区の先まである住所ほど疑わしい）。
 *  ⚠️ 直す前に必ず公式サイトで確かめること。この一覧をそのまま修正値にしない。
 *
 *
 * 【②段の実測（2026-09-15）】② に出た121件を1件ずつ見た結果、**ほぼ全部が誤検知**だった。
 *   A 住所が「◯◯エリア」「◯◯周辺」等のぼかし表記 …60件（一致しようがない）
 *   C 住所が市区までちょうど                      …27件（エリアのほうは正しい）
 *   B 住所に括弧の補足がある                      … 9件
 *   D その他                                      …25件（大半は正しい）
 *   本当に間違っていたのは **2件だけ**（THE HALF / Silk）。
 *   ⇒ **②を一括で直してはいけない。** ②は「見に行く候補」であって修正対象一覧ではない。
 *   ⇒ 次に効くのは件数を増やすことではなく、①（住所が詳しいのに一致しない）を
 *      漏らさないことと、公式サイトでの裏取り。
 *
 * 実行: node scripts/maintenance/inspect_area_address_mismatch.mjs
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const norm = (v) => String(v ?? '').normalize('NFKC');

async function allShops() {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('shops').select('id, name, group_id, raw_data').range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const shops = await allShops();
const rows = [];
for (const s of shops) {
  const r = s.raw_data || {};
  const address = norm(r.address).trim();
  if (!address) continue;                      // 住所が無い店は判定できない（614店ある）
  const areas = (Array.isArray(r.area) ? r.area : [r.area])
    .filter(Boolean)
    .flatMap((a) => norm(a).split(/[・/／]/))
    .map((a) => a.trim())
    .filter((a) => a.length >= 2);
  if (areas.length === 0) continue;
  // エリア名のどれかが住所に出てくれば一致とみなす
  if (areas.some((a) => address.includes(a))) continue;

  // 住所の詳しさ: 市区の先まであるか（丁目・番地・駅名など）
  const detailed = /[0-9０-９]|丁目|番地|駅/.test(address.replace(/^[^都道府県]*[都道府県]/, ''));
  rows.push({
    id: s.id, name: s.name, group_id: s.group_id,
    prefecture: r.prefecture || '—', city: r.city || '—',
    area: areas.join('・'), address, detailed,
  });
}

const strong = rows.filter((r) => r.detailed);
const weak = rows.filter((r) => !r.detailed);

console.log(`全 ${shops.length}店 / 住所とエリアの両方を持つ店のうち、食い違いの疑い ${rows.length}件\n`);
console.log(`━━ ① 住所が詳しい（丁目・番地・駅名まである）＝疑わしい … ${strong.length}件 ━━`);
for (const r of strong.slice(0, 60)) {
  console.log(`  ${r.id}`);
  console.log(`     ${r.name}${r.group_id ? ` [${r.group_id}]` : ''}`);
  console.log(`     エリア: ${r.area}   ／   住所: ${r.address}`);
}
if (strong.length > 60) console.log(`  …他 ${strong.length - 60}件`);

console.log(`\n━━ ② 住所が市区までしか無い＝一致しなくても正しいことがある … ${weak.length}件 ━━`);
for (const r of weak.slice(0, 15)) {
  console.log(`  ${r.id} / ${r.name}`);
  console.log(`     エリア: ${r.area}   ／   住所: ${r.address}`);
}
if (weak.length > 15) console.log(`  …他 ${weak.length - 15}件（①を先に片付けてから見る）`);

// 🚩 機械で読める形でも書き出せるようにした（2026-09-21）。
//    判定（どれを候補とみなすか）は**この道具だけが持つ**。比較する側は結果を読むだけにして、
//    規則の写しを作らない（写しを測ると、本物と食い違っても誰も気づけない）。
const jsonArg = process.argv.find((a) => a.startsWith('--json='));
if (jsonArg) {
  const out = jsonArg.slice('--json='.length);
  fs.mkdirSync(out.replace(/\/[^/]+$/, ''), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), total: rows.length, strong, weak }, null, 2));
  console.log(`\n📦 ${out} に書き出しました（① ${strong.length}件 / ② ${weak.length}件）`);
}
