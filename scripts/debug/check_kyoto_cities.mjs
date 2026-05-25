import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 京都府の全店舗のcity/area確認
const { data } = await supabase.from('shops')
  .select('id,name,raw_data')
  .filter('raw_data->>prefecture', 'eq', '京都府');

console.log(`京都府の店舗: ${data?.length}件`);
for (const s of (data || [])) {
  console.log(`  ${s.name}`);
  console.log(`    city: ${s.raw_data?.city}, area: ${s.raw_data?.area}`);
}

// Pure Whiteのセラピスト画像URLが外部URLかStorageかチェック
const { data: therapists } = await supabase.from('therapists')
  .select('id,name,image_url')
  .eq('shop_id', 'kyoto_senbon_sanjo_pure_white')
  .limit(3);

console.log('\nPure White セラピスト画像URL例:');
for (const t of (therapists || [])) {
  const isStorage = t.image_url?.includes('supabase.co');
  console.log(`  ${t.name}: ${isStorage ? '[Storage]' : '[外部URL]'} ${t.image_url?.slice(0, 70)}`);
}
