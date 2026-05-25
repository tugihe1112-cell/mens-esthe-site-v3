import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// Pure Whiteの全店舗
const { data: shops } = await supabase.from('shops')
  .select('id,name,image_url,price_system,raw_data')
  .ilike('name', '%Pure White%');

console.log(`Pure White 店舗: ${shops?.length}件\n`);
for (const s of (shops || [])) {
  const { data: therapists, count } = await supabase.from('therapists')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', s.id);
  console.log(`ID: ${s.id}`);
  console.log(`  city: ${s.raw_data?.city}, area: ${s.raw_data?.area}`);
  console.log(`  image_url: ${s.image_url ? '✅' : '❌ null'}`);
  console.log(`  price_system: ${s.price_system ? '✅' : '❌ null'}`);
  console.log(`  セラピスト数: ${count}`);
  console.log();
}
