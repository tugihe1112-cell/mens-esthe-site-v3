import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

async function main() {
  // 全reviewsを取得してshop_idごとに集計
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('shop_id')
    .not('shop_id', 'is', null);

  if (error) { console.error(error); process.exit(1); }

  // shop_idごとの件数を集計
  const counts = {};
  for (const r of reviews) {
    counts[r.shop_id] = (counts[r.shop_id] || 0) + 1;
  }

  // 降順ソートしてTOP10表示
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('=== 口コミ数 TOP10 店舗 ===');
  for (const [shopId, count] of sorted) {
    console.log(`  ${count}件  ${shopId}`);
  }

  // TOP5のshop情報も取得
  const top5Ids = sorted.slice(0, 5).map(([id]) => id);
  const { data: shops } = await supabase
    .from('shops')
    .select('id, name, image_url')
    .in('id', top5Ids);

  console.log('\n=== TOP5 店舗詳細 ===');
  for (const [shopId, count] of sorted.slice(0, 5)) {
    const shop = shops?.find(s => s.id === shopId);
    const hasImage = shop?.image_url ? '✅画像あり' : '❌画像なし';
    console.log(`  ${count}件  ${shopId}  (${shop?.name || '不明'})  ${hasImage}`);
  }
}

main();
