import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase.from('shops').select('id, name, raw_data, group_id').ilike('id', '%ryugujo%');
for (const s of (shops || [])) {
  console.log(`\n=== ${s.id} ===`);
  console.log(`group_id: ${s.group_id}`);
  console.log(`raw_data: ${JSON.stringify(s.raw_data, null, 2)}`);
}
