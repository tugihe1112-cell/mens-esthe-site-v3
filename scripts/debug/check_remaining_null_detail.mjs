/**
 * 写真なしセラピストの店舗別詳細確認
 * 都道府県・店舗ごとに null 件数と名前リストを表示
 * 実行: node scripts/debug/check_remaining_null_detail.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 全店舗取得
const { data: allShops } = await supabase
  .from('shops')
  .select('id, name, website_url, raw_data')
  .order('id');

if (!allShops) { console.log('店舗取得失敗'); process.exit(1); }

// 全セラピスト（image_url null）取得
const { data: nullTherapists } = await supabase
  .from('therapists')
  .select('id, name, shop_id, image_url')
  .is('image_url', null);

if (!nullTherapists) { console.log('セラピスト取得失敗'); process.exit(1); }

// shop_id でグループ化
const byShop = new Map();
for (const t of nullTherapists) {
  if (!byShop.has(t.shop_id)) byShop.set(t.shop_id, []);
  byShop.get(t.shop_id).push(t.name);
}

// 都道府県別に集計
const byPref = new Map();
for (const shop of allShops) {
  const pref = shop.raw_data?.prefecture || '不明';
  const names = byShop.get(shop.id);
  if (!names || names.length === 0) continue;

  if (!byPref.has(pref)) byPref.set(pref, []);
  byPref.get(pref).push({ id: shop.id, name: shop.name, url: shop.website_url, nullCount: names.length, names });
}

// 都道府県順に出力（件数の多い順）
const sorted = [...byPref.entries()].sort((a, b) => {
  const aTotal = a[1].reduce((s, x) => s + x.nullCount, 0);
  const bTotal = b[1].reduce((s, x) => s + x.nullCount, 0);
  return bTotal - aTotal;
});

let grandTotal = 0;
console.log('='.repeat(70));
console.log('写真なしセラピスト 店舗別詳細');
console.log('='.repeat(70));

for (const [pref, shops] of sorted) {
  const prefTotal = shops.reduce((s, x) => s + x.nullCount, 0);
  grandTotal += prefTotal;

  console.log(`\n【${pref}】 合計 ${prefTotal}件`);
  console.log('-'.repeat(50));

  // 件数の多い順にソート
  shops.sort((a, b) => b.nullCount - a.nullCount);
  for (const shop of shops) {
    console.log(`  ${shop.nullCount}件 | ${shop.name}`);
    console.log(`       URL: ${shop.url || '不明'}`);
    // 名前リスト（最大15名まで）
    const display = shop.names.slice(0, 15);
    console.log(`       名前: ${display.join('・')}${shop.names.length > 15 ? `...他${shop.names.length - 15}名` : ''}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`全体合計: ${grandTotal}件`);
console.log('='.repeat(70));
