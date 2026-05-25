/**
 * 都道府県別 セラピスト写真なし状況確認
 * 実行: node scripts/debug/check_null_images_by_pref.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 大都市圏の都道府県
const PREFS = ['東京都','神奈川県','大阪府','愛知県','福岡県','北海道','埼玉県','千葉県','兵庫県','京都府','宮城県','広島県','静岡県','新潟県'];

// therapists を全件ページネーション取得
console.log('therapists 全件取得中...');
const total = {};   // shop_id → 総数
const noImg = {};   // shop_id → 写真なし数
let from = 0;
const PAGE = 1000;
while (true) {
  const { data: page } = await supabase.from('therapists').select('shop_id, image_url').range(from, from + PAGE - 1);
  if (!page || page.length === 0) break;
  page.forEach(t => {
    total[t.shop_id] = (total[t.shop_id] || 0) + 1;
    if (!t.image_url) noImg[t.shop_id] = (noImg[t.shop_id] || 0) + 1;
  });
  if (page.length < PAGE) break;
  from += PAGE;
}

// shops 取得
const { data: allShops } = await supabase.from('shops').select('id, name, website_url, raw_data');

for (const pref of PREFS) {
  const shops = allShops.filter(s => s.raw_data?.prefecture === pref);
  if (shops.length === 0) continue;

  // 写真なしが1件以上ある店舗
  const withNull = shops.filter(s => noImg[s.id] > 0).map(s => ({
    id: s.id,
    name: s.name,
    total: total[s.id] || 0,
    null: noImg[s.id] || 0,
    pct: Math.round((noImg[s.id] / (total[s.id] || 1)) * 100),
    url: s.website_url || '',
  })).sort((a, b) => b.null - a.null);

  if (withNull.length === 0) continue;

  const totalNull = withNull.reduce((s, x) => s + x.null, 0);
  console.log(`\n━━━ ${pref} ━━━ (写真なし${totalNull}件 / ${withNull.length}店舗)`);
  withNull.forEach(s => {
    const bar = s.pct === 100 ? '【全員】' : s.pct >= 50 ? '【半数↑】' : '';
    console.log(`  ${bar} ${s.null}/${s.total}名null  ${s.name}`);
    if (s.url) console.log(`         ${s.url}`);
  });
}
