/**
 * update_shop_name.mjs — 店名を直す（改名に追従できていないレコード）
 *
 * 使い方:
 *   node scripts/maintenance/update_shop_name.mjs --file=names.tsv          （下見）
 *   node scripts/maintenance/update_shop_name.mjs --file=names.tsv --apply  （実行）
 *
 * 【TSVの形式】1行1店。`#` で始まる行はコメント。
 *   <shop_id>\t<今の名前>\t<新しい名前>
 *   ⚠️ 「今の名前」は**照合用**。DBの現在値と違えば**1件も書き換えずに中止**する。
 *      idと新名だけで書くと、取り違えても誰も気づけない。
 *
 * 【なぜ必要か（2026-09-16）】
 * ブランドは改名しているのに、レコードの名前が古いまま残っている型が見つかった。
 *   Jesse (ジェシー 調布店) … 公式 tigger-esthe.com に**調布ルーム**があり、
 *     ポータルにも「ティガー 旧登戸ジェシー」。同じブランドの他4件は既に Tigger に直っていた。
 *   美・セラ極～KIWAMI～ … 公式 esthe-hanaspa.com は「大井町｜大森｜蒲田 メンズエステHANA SPA」。
 *     大森も HANA SPA で、同じグループの他2件は既に HANASPA に直っていた。
 * どちらも**ブランドを分ける話ではなく、名前が古いだけ**だった。
 *
 * 【安全装置】update_shop_url / update_shop_location と同じ
 *  1. 既定は**下見**。`--apply` が要る。
 *  2. 書き換え前に店舗行を **JSONへ書き出す**。
 *  3. shop_id は完全一致のみ。現在値の照合に失敗したら**1件も書き換えない**。
 *  4. サービスロールキーで接続する（RLSで黙って失敗したのを成功と表示しない）。
 *  5. 変更が無い行は何もしない。
 *
 * 【この道具が保証しないこと】
 *  その名前が正しいかは機械には分からない。**必ず公式サイトで確かめてから --apply すること。**
 *  ⚠️ `raw_data.name` は取り込み当時の名前なので**触らない**（いつ何だったかの記録として残す）。
 *     画面に出るのは `name` 列のほう。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !key) { console.error('❌ .env に VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY がありません'); process.exit(1); }
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const fileArg = args.find((a) => a.startsWith('--file='));
if (!fileArg) {
  console.error('使い方: node scripts/maintenance/update_shop_name.mjs --file=<names.tsv> [--apply]');
  console.error('  形式: shop_id <TAB> 今の名前 <TAB> 新しい名前');
  process.exit(1);
}

const rows = [];
for (const line of fs.readFileSync(fileArg.slice('--file='.length), 'utf8').split('\n')) {
  const t = line.replace(/\r$/, '');
  if (!t.trim() || t.trim().startsWith('#')) continue;
  const [id, cur, next] = t.split('\t');
  if (!id || !cur || !next) { console.error(`❌ 形式が不正な行: ${t}`); process.exit(1); }
  rows.push({ id: id.trim(), cur: cur.trim(), next: next.trim() });
}
if (!rows.length) { console.error('❌ 対象が0件です'); process.exit(1); }

const ids = rows.map((r) => r.id);
const { data: found, error } = await supabase.from('shops').select('id, name, group_id, website_url').in('id', ids);
if (error) { console.error('❌ 取得に失敗:', error.message); process.exit(1); }
const byId = new Map((found || []).map((s) => [s.id, s]));

const problems = [];
const todo = [];
for (const r of rows) {
  const shop = byId.get(r.id);
  if (!shop) { problems.push(`見つからない: ${r.id}`); continue; }
  if (String(shop.name ?? '').trim() !== r.cur) {
    problems.push(`今の名前が違う: ${r.id} … DBは「${shop.name}」／一覧は「${r.cur}」`);
    continue;
  }
  if (r.cur === r.next) { console.log(`⏭️  変更なし: ${r.id}`); continue; }
  todo.push({ ...r, shop });
  console.log(`■ ${r.id}`);
  console.log(`   name: ${r.cur} → ${r.next}`);
  console.log(`   group_id: ${shop.group_id ?? '（無し）'} ／ 公式: ${shop.website_url || '（無し）'}`);
}

console.log(`\n--- 対象 ${todo.length}件 ---`);
if (problems.length) {
  console.error('\n❌ 問題があるので1件も書き換えません:');
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
if (!todo.length) { console.log('変更するものはありません。'); process.exit(0); }

if (!APPLY) {
  console.log('\nこれは下見です。実行するには --apply を付けてください。');
  console.log('⚠️ その前に、その名前が正しいことを**公式サイト**で確かめてください。');
  process.exit(0);
}

const dir = 'outputs/shop-names';
fs.mkdirSync(dir, { recursive: true });
const backup = path.join(dir, `shop-names-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(backup, JSON.stringify(found, null, 2), 'utf8');
console.log(`\n📦 バックアップ: ${backup}`);

for (const t of todo) {
  const { error: e } = await supabase.from('shops').update({ name: t.next }).eq('id', t.id);
  if (e) { console.error(`❌ 失敗 ${t.id}: ${e.message}`); process.exit(1); }
  console.log(`✅ ${t.id} → ${t.next}`);
}
