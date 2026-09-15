/**
 * delete_shop.mjs — 店舗レコードを消す（重複レコード・掲載をやめる店）
 *
 * 使い方:
 *   node scripts/maintenance/delete_shop.mjs <shop_id> [...]          （下見）
 *   node scripts/maintenance/delete_shop.mjs <shop_id> [...] --apply  （実行）
 *
 * 【2026-09-15 に作り直した理由】
 * 元の版は **下見もバックアップも口コミの確認も無く、引数1つで即削除**していた。
 * 他の保守スクリプト（update_shop_url / update_shop_location / merge_duplicate_therapists）は
 * すべて「下見が既定・バックアップ・1件でも問題があれば1件も実行しない」で揃っているのに、
 * **一番取り返しがつかない削除だけが一番危ない作り**だった。
 * さらに匿名キー(ANON)で接続しており、RLSで黙って失敗しても「✅完了」と表示していた。
 *
 * 【安全装置】
 *  1. 既定は**下見**。`--apply` が要る。
 *  2. 消す前に店舗行とセラピスト行を **JSONへ書き出す**。
 *  3. 🚩**口コミが1件でも付いていたら中止する。**
 *     口コミは利用者が書いた一次情報で、店を消すと読めなくなる。
 *     掲載をやめたいだけなら `mark_shop_status.mjs --reason=...`（閉店の帯）を使うこと。
 *  4. サービスロールキーで接続する（失敗を成功と表示しない）。
 *  5. 1件でも問題があれば1件も消さない。
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
const ids = args.filter((a) => !a.startsWith('--'));
if (ids.length === 0) {
  console.log('使い方: node scripts/maintenance/delete_shop.mjs <shop_id> [...] [--apply]');
  process.exit(1);
}

const planned = [];
let failed = 0;

for (const shopId of ids) {
  const { data: shop, error } = await supabase.from('shops').select('*').eq('id', shopId).maybeSingle();
  if (error) throw error;
  if (!shop) { console.error(`❌ 見つかりません: ${shopId}`); failed += 1; continue; }

  const [rev, ther] = await Promise.all([
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('shop_id', shopId),
    supabase.from('therapists').select('*').eq('shop_id', shopId),
  ]);
  if (rev.error) throw rev.error;
  if (ther.error) throw ther.error;

  console.log(`\n■ ${shop.name} [${shop.id}]`);
  console.log(`   口コミ: ${rev.count || 0}件 / セラピスト: ${(ther.data || []).length}人`);

  // 🚩 口コミが付いている店は消さない。閉店なら帯を出す（mark_shop_status.mjs）。
  if ((rev.count || 0) > 0) {
    console.error('   ❌ 口コミが付いているので消しません。掲載をやめるなら閉店の帯（mark_shop_status.mjs）を使ってください。');
    failed += 1;
    continue;
  }
  planned.push({ shop, therapists: ther.data || [] });
}

console.log(`\n--- 対象 ${planned.length}件 ---`);
if (failed > 0) {
  console.error(`❌ ${failed}件で問題がありました。1件でも問題があれば1件も消しません。`);
  process.exit(1);
}
if (planned.length === 0) { console.log('消すものがありません。'); process.exit(0); }
if (!APPLY) {
  console.log('これは下見です。実行するには --apply を付けてください。');
  console.log('⚠️ 削除は元に戻せません（バックアップJSONからの手作業の復元になります）。');
  process.exit(0);
}

const BACKUP_DIR = 'outputs/deleted-shops';
fs.mkdirSync(BACKUP_DIR, { recursive: true });
const backup = path.join(BACKUP_DIR, `delete-shop-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(backup, JSON.stringify(planned, null, 2), 'utf8');
console.log(`📦 バックアップ: ${backup}`);

for (const { shop, therapists } of planned) {
  const { error: e1, count: c1 } = await supabase
    .from('therapists').delete({ count: 'exact' }).eq('shop_id', shop.id);
  if (e1) { console.error(`❌ セラピスト削除に失敗: ${shop.id} ${e1.message}`); process.exit(1); }
  const { error: e2 } = await supabase.from('shops').delete().eq('id', shop.id);
  if (e2) { console.error(`❌ 店舗削除に失敗: ${shop.id} ${e2.message}`); process.exit(1); }
  console.log(`✅ 削除: ${shop.name} [${shop.id}]（セラピスト ${c1 ?? therapists.length}人）`);
}
console.log('\n※ 削除後: ブランドページとエリア一覧に、消した店が残っていないか確認してください。');
