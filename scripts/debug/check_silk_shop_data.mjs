import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data } = await supabase
  .from('shops')
  .select('id, name, website_url, schedule_url, business_hours, price_system, phone_number')
  .ilike('name', '%silk%');

for (const s of data || []) {
  console.log(`\n[${s.id}] ${s.name}`);
  console.log(`  website_url:   ${s.website_url || '(なし)'}`);
  console.log(`  schedule_url:  ${s.schedule_url || '(なし)'}`);
  console.log(`  business_hours:${s.business_hours || '(なし)'}`);
  console.log(`  phone_number:  ${s.phone_number || '(なし)'}`);
  console.log(`  price_system:  ${s.price_system ? JSON.stringify(s.price_system).slice(0, 100) + '...' : '(なし)'}`);
}
