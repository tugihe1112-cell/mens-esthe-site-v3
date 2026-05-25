import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// スーパーハッピーガールズ関連の全shop
const { data: shops } = await supabase.from('shops')
  .select('id, name, group_id, raw_data')
  .ilike('name', '%スーパーハッピー%');

console.log('=== スーパーハッピーガールズ 全shop ===');
for (const s of shops || []) {
  const { data: therapists } = await supabase.from('therapists')
    .select('id').eq('shop_id', s.id);
  console.log(`${s.id} | group=${s.group_id} | ${s.raw_data?.prefecture} ${s.raw_data?.city} ${s.raw_data?.area} | セラピスト:${therapists?.length || 0}名`);
}
