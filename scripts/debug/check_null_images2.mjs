import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// image_url が null の店舗（website_url なしも含む）
const { data: allNull } = await supabase
  .from('shops')
  .select('id, name, website_url, image_url')
  .is('image_url', null)
  .order('id');

console.log(`image_url=null 合計: ${allNull?.length ?? 0}件`);
const withUrl = allNull?.filter(s => s.website_url) || [];
const noUrl = allNull?.filter(s => !s.website_url) || [];
console.log(`  うち website_urlあり: ${withUrl.length}件`);
console.log(`  うち website_urlなし: ${noUrl.length}件`);

withUrl.forEach(s => console.log(`  [有URL] ${s.id} | ${s.name} | ${s.website_url}`));
noUrl.slice(0, 20).forEach(s => console.log(`  [無URL] ${s.id} | ${s.name}`));
if (noUrl.length > 20) console.log(`  ... 他${noUrl.length - 20}件`);
