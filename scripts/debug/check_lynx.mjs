import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data, error } = await supabase.from('shops')
  .select('id, name, group_id, raw_data, website_url')
  .ilike('name', '%Lynx%');

if (error) { console.log('エラー:', error.message); process.exit(1); }

data?.forEach(s => console.log(
  `${s.name} | group_id=${s.group_id} | pref=${s.raw_data?.prefecture} city=${s.raw_data?.city} area=${s.raw_data?.area}`
));
console.log(`\n合計: ${data?.length}件`);
