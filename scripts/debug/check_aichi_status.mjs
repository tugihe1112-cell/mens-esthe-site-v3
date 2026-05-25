import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase.from('shops')
  .select('id,name,website_url,schedule_url,image_url')
  .filter('raw_data->>prefecture', 'eq', '愛知県')
  .order('id');

console.log('店舗名                           | therapists | shop画像 | schedule_url | 画像URL問題');
console.log('─'.repeat(90));

for (const s of (shops || [])) {
  const { count } = await supabase.from('therapists')
    .select('id', { count: 'exact', head: true }).eq('shop_id', s.id);

  const imgOk = s.image_url && !s.image_url.includes('*') && !s.image_url.includes('richaroma.nagoyaassets');
  const imgIssue = !s.image_url ? '❌ なし' : s.image_url.includes('*') ? '⚠️ *含む' : s.image_url.includes('nagoyaassets') ? '⚠️ 不正URL' : '✅';
  const schedOk = s.schedule_url ? '✅' : '❌';

  console.log(`${s.name.slice(0,20).padEnd(22)} | ${String(count).padStart(5)}名 | ${imgIssue.padEnd(10)} | ${schedOk}`);
}
