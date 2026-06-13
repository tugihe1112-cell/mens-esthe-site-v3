import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('/sessions/lucid-dreamy-gauss/mnt/mens-esthe-site/.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// image_url が null の店舗
const { data: nullShops } = await supabase
  .from('shops')
  .select('id, name, website_url, image_url')
  .is('image_url', null)
  .not('website_url', 'is', null)
  .order('id');

console.log(`image_url=null かつ website_urlあり: ${nullShops?.length ?? 0}件`);
if (nullShops?.length) {
  nullShops.forEach(s => console.log(`  ${s.id} | ${s.name} | ${s.website_url}`));
}

// Supabase Storage URL が image_url になっている店舗
const { data: storageShops } = await supabase
  .from('shops')
  .select('id, name, website_url, image_url')
  .like('image_url', '%supabase.co/storage%')
  .not('website_url', 'is', null);

console.log(`\nStorage URL が image_url: ${storageShops?.length ?? 0}件`);
if (storageShops?.length) {
  storageShops.forEach(s => console.log(`  ${s.id} | ${s.name}`));
}
