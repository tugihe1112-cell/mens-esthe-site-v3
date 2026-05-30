/**
 * http:// 画像URLを持つセラピストを店舗別に集計
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim();
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const { data, error } = await supabase
  .from('therapists')
  .select('shop_id, image_url')
  .ilike('image_url', 'http://%');

if (error) { console.error(error); process.exit(1); }

// 店舗別に集計
const counts = {};
for (const t of data) {
  counts[t.shop_id] = (counts[t.shop_id] || 0) + 1;
}

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
console.log(`http:// 画像を持つ店舗: ${sorted.length}件 / 合計: ${data.length}件\n`);
for (const [shopId, count] of sorted) {
  console.log(`${count}件\t${shopId}`);
}
