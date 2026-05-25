import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data } = await supabase
  .from('reviews')
  .select('shop_id')
  .eq('user_id', 'menesthe_rewritten');

// shop_id別に件数カウント
const counts = {};
for (const r of data) {
  counts[r.shop_id] = (counts[r.shop_id] || 0) + 1;
}

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log('口コミ件数の多い店舗TOP10:');
for (const [shopId, count] of sorted) {
  console.log(`  ${count}件 - ${shopId}`);
}
