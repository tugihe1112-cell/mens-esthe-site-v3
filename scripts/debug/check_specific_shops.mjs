import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 新宿エリアのshopを確認（スクショに映っていたエリア）
const { data: shops } = await supabase
  .from('shops')
  .select('id, name, image_url, website_url')
  .or("raw_data->>area.eq.新宿,raw_data->>prefecture.eq.東京都")
  .order('id')
  .limit(50);

console.log(`取得件数: ${shops?.length ?? 0}`);
let nullCount = 0;
let brokenCount = 0;
shops?.forEach(s => {
  const img = s.image_url;
  if (!img) {
    nullCount++;
    console.log(`  NULL: ${s.name}`);
  } else if (img.includes('supabase.co/storage')) {
    // Storage URL - might be broken
  } else {
    // external URL
  }
});
console.log(`\nnull: ${nullCount}件`);

// image_url が空文字列のケース
const { data: emptyShops } = await supabase
  .from('shops')
  .select('id, name, image_url')
  .eq('image_url', '')
  .limit(20);
console.log(`\nimage_url=空文字: ${emptyShops?.length ?? 0}件`);
emptyShops?.forEach(s => console.log(`  ${s.name}`));

// image_url が 'null' 文字列のケース
const { data: nullStrShops } = await supabase
  .from('shops')
  .select('id, name, image_url')
  .eq('image_url', 'null')
  .limit(20);
console.log(`\nimage_url='null'文字列: ${nullStrShops?.length ?? 0}件`);
nullStrShops?.forEach(s => console.log(`  ${s.name}`));
