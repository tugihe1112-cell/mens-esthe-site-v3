/**
 * restore_shop_images.mjs — 誤って null 化した shops.image_url をバックアップから戻す
 *
 * 【なぜ必要か（2026-08-20 の事故）】
 * `audit_shop_images.mjs` の初版に**判定バグ**があり、112店舗の image_url を消した。
 * そのうち大半（Silk・Rise・QUEEN'S COLLECTION・B-QINS・Sweet Mist 等）は
 * **正常なロゴ画像**だった。
 *
 * 【バグの内容】
 * sharp の `greyscale().stats()` は**アルファチャンネルを無視する**。
 * 「透明背景に単色のロゴ」というPNGは RGB が全ピクセル一定になるため
 * `stdev = 0` となり、「単色＝中身が無い」と誤判定された。
 *   実測: Silk のロゴ(800x400 透過PNG)
 *     アルファ無視 → mean=0,  sd=0    ← これで消された
 *     白背景に合成 → mean=240, sd=51   ← 実際は中身がある
 *     （真に無地の「ひまわり」は合成しても mean=248, sd=11 で変わらない）
 *
 * 【教訓・恒久対策】
 *   1. 判定の前に必ず `flatten({ background:'#ffffff' })` で背景に合成する
 *   2. **破壊的更新の前に必ずバックアップを取る**（初版はこれが無かった＝今回の被害を拡大させた）
 *   3. dry-run の出力件数が想定と大きくずれたら実行しない
 *      （ブラウザ実測48枚に対しsharpは90枚。この時点で止まるべきだった）
 *
 * 【使い方】
 *   node scripts/maintenance/restore_shop_images.mjs                    # dry-run
 *   node scripts/maintenance/restore_shop_images.mjs --live             # 復元実行
 *   node scripts/maintenance/restore_shop_images.mjs --file=xxx.json    # バックアップ指定
 *
 * バックアップJSONの形式: [{ id, name, image_url }, ...]
 * ※ 現在 image_url が null の店舗にだけ書き戻す（既に値がある店舗は触らない＝冪等）
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const args = process.argv.slice(2);
const LIVE = args.includes('--live');
const FILE = (args.find((a) => a.startsWith('--file=')) || '').split('=')[1]
  || 'shop_image_url_backup_2026-08-20.json';

if (!fs.existsSync(FILE)) {
  console.error(`❌ バックアップが見つかりません: ${FILE}`);
  console.error('   ~/Downloads にある場合は次で移動してください:');
  console.error(`   mv ~/Downloads/${FILE} ./`);
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
const byId = new Map(backup.map((r) => [String(r.id), r]));
console.log(`バックアップ ${backup.length}件を読み込みました（${FILE}）`);

// 現在の状態を取得（PostgREST の max-rows=1000 に当たるのでページング）
const shops = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from('shops').select('id, name, image_url').order('id').range(from, from + 999);
  if (error) { console.error('❌', error.message); process.exit(1); }
  if (!data || data.length === 0) break;
  shops.push(...data);
  if (data.length < 1000) break;
}

const nulls = shops.filter((s) => !s.image_url);
const restorable = nulls.filter((s) => byId.has(String(s.id)));
const notInBackup = nulls.length - restorable.length;

console.log(`\n現在 image_url が null: ${nulls.length}件`);
console.log(`  うちバックアップに存在（＝復元可能）: ${restorable.length}件`);
console.log(`  バックアップに無い（元から無かった）: ${notInBackup}件 … 触りません`);

console.log(`\n=== 復元対象 ===`);
for (const s of restorable) {
  console.log(`  ${String(s.id).padEnd(46)} ${(s.name || '').slice(0, 22).padEnd(24)} ${byId.get(String(s.id)).image_url.split('/').pop()}`);
}

if (!LIVE) { console.log(`\n（dry-run）実行するには --live を付けてください`); process.exit(0); }

let ok = 0, ng = 0;
for (const s of restorable) {
  const { error } = await supabase.from('shops').update({ image_url: byId.get(String(s.id)).image_url }).eq('id', s.id);
  if (error) { console.error(`  ❌ ${s.id}: ${error.message}`); ng++; } else ok++;
}
console.log(`\n✅ 復元 ${ok}件${ng ? ` / ❌ 失敗 ${ng}件` : ''}`);
console.log('⚠️ この後、修正版の audit_shop_images.mjs を dry-run して、');
console.log('   本当に無地の画像だけが対象になっていることを確認してから --live すること。');
