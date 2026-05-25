/**
 * image_url が null のセラピストがいる店舗を一覧表示
 * 実行: node scripts/debug/check_null_images.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// image_url が null のセラピストを shop_id ごとに集計
const { data: nullTherapists, error } = await supabase
  .from('therapists')
  .select('shop_id, name, image_url')
  .is('image_url', null)
  .order('shop_id');

if (error) { console.error(error); process.exit(1); }

// shop_id ごとに集計
const byShop = {};
for (const t of nullTherapists) {
  if (!byShop[t.shop_id]) byShop[t.shop_id] = [];
  byShop[t.shop_id].push(t.name);
}

// 全セラピスト数も取得して「全員null」かどうか判定
const { data: allCounts } = await supabase
  .from('therapists')
  .select('shop_id')
  .in('shop_id', Object.keys(byShop));

const totalByShop = {};
for (const t of allCounts) {
  totalByShop[t.shop_id] = (totalByShop[t.shop_id] || 0) + 1;
}

// 店舗名も取得
const { data: shops } = await supabase
  .from('shops')
  .select('id, name, raw_data')
  .in('id', Object.keys(byShop));

const shopMap = {};
for (const s of shops) {
  shopMap[s.id] = { name: s.name, pref: s.raw_data?.prefecture || '?' };
}

// 全員null vs 一部nullで分けて表示
const allNull = [];
const partialNull = [];

for (const [shopId, names] of Object.entries(byShop)) {
  const total = totalByShop[shopId] || names.length;
  const shop = shopMap[shopId] || { name: shopId, pref: '?' };
  const entry = { shopId, shopName: shop.name, pref: shop.pref, nullCount: names.length, total, names };
  if (names.length === total) allNull.push(entry);
  else partialNull.push(entry);
}

// 都道府県順にソート
allNull.sort((a, b) => a.pref.localeCompare(b.pref) || a.shopName.localeCompare(b.shopName));
partialNull.sort((a, b) => a.pref.localeCompare(b.pref) || a.shopName.localeCompare(b.shopName));

console.log(`\n${'='.repeat(60)}`);
console.log(`【全員 image_url=null の店舗】 ${allNull.length}店舗`);
console.log('='.repeat(60));
for (const e of allNull) {
  console.log(`${e.pref} | ${e.shopName} | ${e.nullCount}名全員null`);
}

console.log(`\n${'='.repeat(60)}`);
console.log(`【一部 image_url=null の店舗】 ${partialNull.length}店舗`);
console.log('='.repeat(60));
for (const e of partialNull) {
  console.log(`${e.pref} | ${e.shopName} | ${e.nullCount}/${e.total}名がnull`);
  if (e.nullCount <= 10) {
    for (const n of e.names) console.log(`    - ${n}`);
  }
}

console.log(`\n合計: 写真なしセラピスト ${nullTherapists.length}名 / ${allNull.length + partialNull.length}店舗`);
