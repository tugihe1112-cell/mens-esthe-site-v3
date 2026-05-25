import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data } = await supabase.from('shops')
  .select('*')
  .eq('id', 'osaka_shinsaibashi_skit')
  .single();

console.log('=== DBの全カラム ===');
console.log('id:', data.id);
console.log('name:', data.name);
console.log('group_id:', data.group_id);
console.log('website_url:', data.website_url);
console.log('schedule_url:', data.schedule_url);
console.log('price_system:', JSON.stringify(data.price_system));
console.log('image_url:', data.image_url);
console.log('\n=== raw_data ===');
console.log(JSON.stringify(data.raw_data, null, 2));
