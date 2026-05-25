import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase.from('shops').select('id, name, website_url').filter('raw_data->>prefecture', 'eq', '東京都');

// ページネーションで全件取得
const total = {};   // shop_id → 総人数
const noImg = {};   // shop_id → 写真なし人数
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

// 東京都の店舗で「全員写真なし」のものを抽出
const allNull = shops.filter(s => total[s.id] && noImg[s.id] === total[s.id]);
console.log(`東京都 全員写真なしの店舗: ${allNull.length}件\n`);
allNull.forEach(s => console.log(`${s.id} | ${s.name} | ${total[s.id]}名全員null | ${s.website_url || '(URLなし)'}`));

console.log('\n--- 写真なしが半数以上の店舗 ---');
const halfNull = shops.filter(s => total[s.id] && noImg[s.id] && noImg[s.id] / total[s.id] >= 0.5 && noImg[s.id] !== total[s.id]);
halfNull.forEach(s => console.log(`${s.id} | ${s.name} | ${noImg[s.id]}/${total[s.id]}名null`));
