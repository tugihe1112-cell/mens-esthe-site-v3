/**
 * 写真衝突 全店舗一括修正スクリプト
 *
 * ① ノイズ名前レコードを削除（キャンペーン・店舗名・新人☆ 等）
 * ② 同一shop内で複数のセラピストが同じ Storage URL を共有している場合、
 *    全員の image_url を null に戻す（間違った写真よりグレーの方が正直）
 *
 * 実行:
 *   node scripts/maintenance/fix_all_collision_nulls.mjs --dry-run
 *   node scripts/maintenance/fix_all_collision_nulls.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);

if (isDryRun) console.log('=== DRY RUN モード ===\n');

// -------------------------------------------------------------------
// Phase 1: ノイズ名前を検出して削除
// -------------------------------------------------------------------

const NOISE_WORDS = [
  '写メ日記', '雨の日', '朝得割', '全コース対応', 'オープン♪',
  '求人', '今月限定', 'オイル増量', 'RIGHT打', 'イベント',
  'キャンペーン', '割引', '新宿店', '渋谷店', '大阪店', '池袋店',
  '岸和田店', '期間限定', '早割', 'ゲリラ割', '割！',
  'フリー限定', 'WEB予約',
];

// 「新人☆xxx」は同じshopに「xxx」が存在するかどうかに関わらずノイズとして削除
// （新人フラグは名前に含めるべきでない）
const isNoiseByName = (name) => {
  if (!name || name.length === 0) return false;
  if (NOISE_WORDS.some(w => name.includes(w))) return true;
  if (name === 'セラピスト') return true;
  if (name === 'モテ男') return true;
  if (/^新人[☆★♪♡◆■]/.test(name)) return true;  // 新人☆xxx, 新人★xxx など
  if (/身長\d+cm/.test(name) && name.length > 10) return true;  // 身長情報のみ
  if (/^[A-Za-z0-9\s]+$/.test(name) && /店$/.test(name)) return true;  // 英数字のみ+店
  return false;
};

console.log('=== Phase 1: ノイズ名前レコード削除 ===\n');

// therapistsを全件取得（image_urlに関係なくノイズ名前を削除）
let allTherapists = [];
let from = 0;
while (true) {
  const { data, error } = await supabase
    .from('therapists')
    .select('id, name, shop_id, image_url')
    .range(from, from + 999);
  if (error) { console.error('取得エラー:', error.message); break; }
  if (!data?.length) break;
  allTherapists = [...allTherapists, ...data];
  if (data.length < 1000) break;
  from += 1000;
}

console.log(`総セラピスト数: ${allTherapists.length}名`);

const noiseIds = allTherapists
  .filter(t => isNoiseByName(t.name))
  .map(t => t.id);

console.log(`ノイズ判定: ${noiseIds.length}件`);

// ノイズ名前の詳細を表示
const noiseRecords = allTherapists.filter(t => isNoiseByName(t.name));
const byShopNoise = {};
for (const t of noiseRecords) {
  if (!byShopNoise[t.shop_id]) byShopNoise[t.shop_id] = [];
  byShopNoise[t.shop_id].push(t.name);
}
for (const [shopId, names] of Object.entries(byShopNoise).slice(0, 20)) {
  console.log(`  [${shopId}]`);
  names.slice(0, 3).forEach(n => console.log(`    ❌ ${n}`));
  if (names.length > 3) console.log(`    ... 他 ${names.length - 3}件`);
}
if (Object.keys(byShopNoise).length > 20) {
  console.log(`  ... 他 ${Object.keys(byShopNoise).length - 20} 店舗`);
}

let deletedNoise = 0;
if (!isDryRun && noiseIds.length > 0) {
  const BATCH = 50;
  for (let i = 0; i < noiseIds.length; i += BATCH) {
    const batch = noiseIds.slice(i, i + BATCH);
    const { error } = await supabase.from('therapists').delete().in('id', batch);
    if (error) {
      console.error(`削除エラー: ${error.message}`);
    } else {
      deletedNoise += batch.length;
    }
  }
  console.log(`\n✅ ノイズ削除: ${deletedNoise}件`);
} else if (isDryRun) {
  console.log(`\n[DRY RUN] ${noiseIds.length}件を削除予定`);
}

// -------------------------------------------------------------------
// Phase 2: Storage URL 衝突を検出して null 化
// -------------------------------------------------------------------

console.log('\n=== Phase 2: 衝突 Storage URL → null 化 ===\n');

// Storage URL を持つセラピストのみ再取得（削除後の最新状態で）
let storageTherapists = [];
from = 0;
while (true) {
  const { data, error } = await supabase
    .from('therapists')
    .select('id, name, shop_id, image_url')
    .like('image_url', '%supabase.co/storage%')
    .not('image_url', 'is', null)
    .range(from, from + 999);
  if (error) { console.error('取得エラー:', error.message); break; }
  if (!data?.length) break;
  storageTherapists = [...storageTherapists, ...data];
  if (data.length < 1000) break;
  from += 1000;
}

console.log(`Storage URL持ちセラピスト: ${storageTherapists.length}名`);

// shop_id × image_url でグループ化
const groups = {};
for (const t of storageTherapists) {
  const key = `${t.shop_id}:::${t.image_url}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(t);
}

// 衝突グループを抽出
const collisionGroups = Object.entries(groups).filter(([, ts]) => ts.length > 1);
const toNull = collisionGroups.flatMap(([, ts]) => ts);
const toNullIds = toNull.map(t => t.id);

// 店舗別集計
const byShopCollision = {};
for (const [key, ts] of collisionGroups) {
  const shopId = ts[0].shop_id;
  if (!byShopCollision[shopId]) byShopCollision[shopId] = { count: 0, names: [] };
  byShopCollision[shopId].count += ts.length;
  byShopCollision[shopId].names.push(ts.map(t => t.name).join(' = '));
}

const sortedShops = Object.entries(byShopCollision).sort((a, b) => b[1].count - a[1].count);
console.log(`衝突: ${collisionGroups.length}URLグループ / ${sortedShops.length}店舗 / ${toNull.length}名が対象\n`);

for (const [shopId, info] of sortedShops.slice(0, 30)) {
  console.log(`  [${shopId}] ${info.count}名`);
  info.names.slice(0, 2).forEach(n => console.log(`    ⚠️  ${n.slice(0, 80)}`));
  if (info.names.length > 2) console.log(`    ... 他 ${info.names.length - 2}件`);
}
if (sortedShops.length > 30) console.log(`  ... 他 ${sortedShops.length - 30} 店舗`);

if (isDryRun) {
  console.log(`\n[DRY RUN] ${toNullIds.length}件を null 化予定`);
  process.exit(0);
}

// バッチで null 化
const BATCH = 50;
let nulled = 0, failed = 0;
for (let i = 0; i < toNullIds.length; i += BATCH) {
  const batch = toNullIds.slice(i, i + BATCH);
  const { error } = await supabase
    .from('therapists')
    .update({ image_url: null })
    .in('id', batch);
  if (error) {
    console.error(`更新エラー (${i}〜${i + BATCH}): ${error.message}`);
    failed += batch.length;
  } else {
    nulled += batch.length;
    process.stdout.write(`\r  null化: ${nulled}/${toNullIds.length}件...`);
  }
}

console.log('\n');
console.log('=== 完了 ===');
console.log(`✅ ノイズ削除: ${deletedNoise}件`);
console.log(`✅ 衝突 null 化: ${nulled}件`);
if (failed > 0) console.log(`❌ 失敗: ${failed}件（SERVICE_ROLE_KEYが.envに設定されているか確認）`);
console.log(`\n次のステップ:`);
console.log(`  check_photo_collisions.mjs を再実行して衝突0件になったか確認`);
console.log(`  個別店舗の再スクレイピングは別途実施（EREN・BQ-INS・PEPE SPA等）`);
