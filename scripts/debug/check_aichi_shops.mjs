import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase.from('shops')
  .select('id,name,website_url,image_url,price_system,raw_data')
  .filter('raw_data->>prefecture', 'eq', '愛知県')
  .order('id');

console.log(`愛知県の店舗: ${shops?.length}件\n`);
for (const s of (shops || [])) {
  const { count } = await supabase.from('therapists')
    .select('id', { count: 'exact', head: true }).eq('shop_id', s.id);
  const { count: imgCount } = await supabase.from('therapists')
    .select('id', { count: 'exact', head: true }).eq('shop_id', s.id).not('image_url', 'is', null);
  console.log(`[${s.id}]`);
  console.log(`  名前: ${s.name}`);
  console.log(`  city: ${s.raw_data?.city}, area: ${s.raw_data?.area}`);
  console.log(`  URL: ${s.website_url || '❌ なし'}`);
  console.log(`  shop画像: ${s.image_url ? '✅' : '❌ なし'}`);
  console.log(`  price: ${s.price_system ? '✅' : '❌ なし'}`);
  console.log(`  セラピスト: ${count}名 (画像${imgCount}名)`);
  console.log();
}
