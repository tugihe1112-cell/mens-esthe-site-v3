import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data } = await supabase
  .from('therapists')
  .select('id, name, shop_id, image_url')
  .ilike('image_url', '%spacer%');

console.log(`スペーサー画像のセラピスト: ${data?.length}件\n`);

// 店舗別に集計
const byShop = {};
for (const t of data || []) {
  if (!byShop[t.shop_id]) byShop[t.shop_id] = [];
  byShop[t.shop_id].push(t.name);
}

for (const [shopId, names] of Object.entries(byShop)) {
  console.log(`${shopId}: ${names.length}名`);
  names.forEach(n => console.log(`  - ${n}`));
}
