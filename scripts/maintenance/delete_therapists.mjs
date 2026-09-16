/**
 * delete_therapists.mjs — 人ではないセラピスト行を消す（部屋名・店名が人として入っているもの）
 *
 * 使い方:
 *   node scripts/maintenance/delete_therapists.mjs --file=<一覧.tsv>          （下見）
 *   node scripts/maintenance/delete_therapists.mjs --file=<一覧.tsv> --apply  （実行）
 *
 * 【TSVの形式】1行1件。`#` で始まる行はコメント。
 *   <therapist_id>\t<確認した名前>
 *   ⚠️ 名前は**照合用**。DBの現在の名前と違えばその行だけでなく**全体を中止**する。
 *      idだけで消すと、取り違えたときに誰も気づけない。
 *
 * 【なぜ必要か（2026-09-16）】
 * `/shops/tokyo_nerima_nerima_cannele` の「在籍セラピスト 全41人」の1枚目が
 * **ソファとランプの写真**で、名前が「練馬Cルーム」だった。女性の写真と並んで、
 * 同じお気に入りボタン付きで、人として並んでいた。
 * 洗い出しでは19行（全部表示中）＝ Cannele・a laise・ルレーヴ・THE HALF。
 * 既存の `delete_noise_therapists.mjs` は対象を直書きした古い作りで、
 * 匿名キー接続・下見なし・バックアップなし・口コミ確認なしだったため、こちらを作った。
 *
 * 【安全装置】`delete_shop.mjs` と同じ考え方
 *  1. 既定は**下見**。`--apply` が要る。
 *  2. 消す前に対象行を **JSONへ書き出す**。
 *  3. 🚩**口コミが1件でも付いていたら中止する。** 口コミは利用者が書いた一次情報。
 *  4. サービスロールキーで接続する（RLSで黙って失敗したのを成功と表示しない）。
 *  5. idが見つからない／名前が食い違う／口コミがある → **1件でも問題があれば1件も消さない。**
 *
 * 【この道具が保証しないこと】
 *  その行が本当に「人ではない」かは機械には分からない。
 *  **必ず店のページで実物（写真と並び）を見てから --apply すること。**
 *  2026-09-16、洗い出しの最初の版は「店名と一致する183行」を本命と判定したが、
 *  実際は「瑠香 -るか- Marvelous -マーベラス-」のような**実在の人**で、
 *  消していたら本物のセラピストが消えていた。一覧は判断材料であって判決ではない。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !key) {
  console.error('❌ .env に VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY がありません');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const fileArg = args.find((a) => a.startsWith('--file='));
if (!fileArg) {
  console.error('使い方: node scripts/maintenance/delete_therapists.mjs --file=<一覧.tsv> [--apply]');
  console.error('  一覧の形式: therapist_id <TAB> 確認した名前（# で始まる行はコメント）');
  process.exit(1);
}

const rows = [];
for (const line of fs.readFileSync(fileArg.slice('--file='.length), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const [id, name] = t.split('\t');
  if (!id || !name) {
    console.error(`❌ 形式が不正な行: ${t}`);
    process.exit(1);
  }
  rows.push({ id: id.trim(), name: name.trim() });
}
if (!rows.length) { console.error('❌ 対象が0件です'); process.exit(1); }

const ids = rows.map((r) => r.id);
const { data: found, error: e1 } = await supabase
  .from('therapists').select('id, shop_id, name, image_url, is_active').in('id', ids);
if (e1) { console.error('❌ 取得に失敗:', e1.message); process.exit(1); }

const byId = new Map((found || []).map((t) => [t.id, t]));
const problems = [];
for (const r of rows) {
  const t = byId.get(r.id);
  if (!t) { problems.push(`見つからない: ${r.id}（${r.name}）`); continue; }
  // 🚩 名前の照合。idだけで消すと取り違えに誰も気づけない。
  if (String(t.name ?? '').trim() !== r.name) {
    problems.push(`名前が違う: ${r.id} … DBは「${t.name}」／一覧は「${r.name}」`);
  }
}

// 🚩 口コミが付いていたら中止。人ではない行に口コミが付いているなら、
//    それは「人ではない」という判断のほうが疑わしい。
const { data: revs, error: e2 } = await supabase
  .from('reviews').select('id, therapist_id').in('therapist_id', ids);
if (e2) { console.error('❌ 口コミの確認に失敗:', e2.message); process.exit(1); }
const revCount = new Map();
for (const r of revs || []) revCount.set(r.therapist_id, (revCount.get(r.therapist_id) || 0) + 1);
for (const [tid, n] of revCount) {
  problems.push(`口コミが ${n}件 付いている: ${tid}（${byId.get(tid)?.name ?? '?'}）… 人ではないという判断のほうを疑うこと`);
}

console.log(`--- 対象 ${rows.length}件 ---\n`);
for (const r of rows) {
  const t = byId.get(r.id);
  if (!t) { console.log(`❓ ${r.id}（${r.name}）… 見つからない`); continue; }
  const shownNow = t.is_active !== false && String(t.image_url ?? '').trim() !== '';
  console.log(`${shownNow ? '👁 表示中' : '  非表示'} 「${t.name}」 [${t.id}] ← ${t.shop_id}`);
}

if (problems.length) {
  console.error('\n❌ 問題があるので1件も消しません:');
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}

if (!APPLY) {
  console.log('\nこれは下見です。実行するには --apply を付けてください。');
  console.log('⚠️ その前に、店のページで**実物（写真と並び）**を見て、人でないことを確かめてください。');
  process.exit(0);
}

const dir = 'outputs/deleted-therapists';
fs.mkdirSync(dir, { recursive: true });
const backup = path.join(dir, `deleted-therapists-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(backup, JSON.stringify(found, null, 2), 'utf8');
console.log(`\n📦 バックアップ: ${backup}`);

const { error: e3 } = await supabase.from('therapists').delete().in('id', ids);
if (e3) { console.error('❌ 削除に失敗:', e3.message); process.exit(1); }

const { data: left, error: e4 } = await supabase.from('therapists').select('id').in('id', ids);
if (e4) { console.error('❌ 確認に失敗:', e4.message); process.exit(1); }
if (left && left.length) {
  console.error(`❌ ${left.length}件が残っています: ${left.map((t) => t.id).join(', ')}`);
  process.exit(1);
}
console.log(`✅ ${ids.length}件を削除しました（残り0件を確認）`);
