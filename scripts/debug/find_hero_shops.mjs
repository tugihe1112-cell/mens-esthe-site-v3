import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// Search for top 5 men-esthe.jp shops: LINDA SPA, AROMA MAISON, AROMA TIAMO, OrderSpa, THE★GIN/ザギン
const keywords = ['linda', 'maison', 'tiamo', 'order', 'ザギン', 'THE GIN', 'ギン'];

for (const kw of keywords) {
  const { data } = await supabase.from('shops')
    .select('id, name, image_url, website_url')
    .ilike('name', `%${kw}%`);
  if (data?.length) {
    console.log(`\n=== ${kw} ===`);
    data.forEach(s => console.log(`  ${s.id} | ${s.name} | img:${!!s.image_url} | ${s.website_url}`));
  }
}
