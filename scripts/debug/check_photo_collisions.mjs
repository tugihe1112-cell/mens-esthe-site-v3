/**
 * セラピスト写真衝突チェッカー
 *
 * 同一shop内で複数のセラピストが同じ Supabase Storage image_url を共有している
 * 「写真衝突」を全店舗から検出する。
 *
 * 実行: node scripts/debug/check_photo_collisions.mjs
 *       node scripts/debug/check_photo_collisions.mjs --top 20  # 上位N件のみ表示
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);

const topArg = process.argv.find(a => a.startsWith('--top='))?.split('=')[1];
const TOP_N = topArg ? parseInt(topArg) : Infinity;

console.log('\n=== セラピスト写真衝突チェッカー ===\n');

// Supabase Storage URLを持つ全セラピストを取得
// RLS対応のため1000件ずつページネーション
let allTherapists = [];
let from = 0;
const PAGE = 1000;

while (true) {
  const { data, error } = await supabase
    .from('therapists')
    .select('id, name, shop_id, image_url')
    .like('image_url', '%supabase.co/storage%')
    .not('image_url', 'is', null)
    .range(from, from + PAGE - 1);

  if (error) { console.error('DB取得エラー:', error.message); process.exit(1); }
  if (!data?.length) break;
  allTherapists = allTherapists.concat(data);
  if (data.length < PAGE) break;
  from += PAGE;
}

console.log(`Storage URL持ちセラピスト総数: ${allTherapists.length}名`);

// shop_id × image_url でグループ化
const groups = {};
for (const t of allTherapists) {
  const key = `${t.shop_id}:::${t.image_url}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(t);
}

// 衝突（同一URL複数人）を抽出
const collisions = Object.entries(groups)
  .filter(([, ts]) => ts.length > 1);

if (collisions.length === 0) {
  console.log('\n✅ 写真衝突は見つかりませんでした。');
  process.exit(0);
}

// shop別に集計
const byShop = {};
for (const [key, therapists] of collisions) {
  const shopId = therapists[0].shop_id;
  if (!byShop[shopId]) byShop[shopId] = { collisionCount: 0, affectedTherapists: 0, details: [] };
  byShop[shopId].collisionCount++;
  byShop[shopId].affectedTherapists += therapists.length;
  byShop[shopId].details.push(therapists.map(t => t.name).join(' = '));
}

// 影響人数でソート
const sorted = Object.entries(byShop)
  .sort((a, b) => b[1].affectedTherapists - a[1].affectedTherapists);

const totalShops = sorted.length;
const totalCollisions = collisions.length;
const totalAffected = collisions.reduce((s, [, ts]) => s + ts.length, 0);

console.log(`\n⚠️  衝突発見: ${totalCollisions}件（${totalShops}店舗・${totalAffected}名が影響）\n`);
console.log('─'.repeat(60));

let shown = 0;
for (const [shopId, info] of sorted) {
  if (shown >= TOP_N) break;
  console.log(`\n[${shopId}]`);
  console.log(`  衝突URL数: ${info.collisionCount}件 / 影響セラピスト: ${info.affectedTherapists}名`);
  for (const detail of info.details.slice(0, 5)) {
    console.log(`  ❌ ${detail}`);
  }
  if (info.details.length > 5) {
    console.log(`  ... 他 ${info.details.length - 5} 件`);
  }
  shown++;
}

console.log('\n' + '─'.repeat(60));
console.log(`\n合計: ${totalShops}店舗 / ${totalCollisions}URLが衝突 / ${totalAffected}名が影響`);
console.log('\n修正対象店舗リスト（shop_idのみ）:');
sorted.forEach(([id]) => console.log(`  ${id}`));
