/**
 * 福岡県 店舗・セラピスト状況確認
 * 実行: node scripts/debug/check_fukuoka_status.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase.from('shops')
  .select('id, name, website_url, schedule_url, image_url')
  .filter('raw_data->>prefecture', 'eq', '福岡県')
  .order('id');

console.log(`福岡県 店舗数: ${shops?.length ?? 0}件\n`);
console.log('店舗名                        | therapists | shop画像 | schedule_url | website_url');
console.log('─'.repeat(100));

for (const s of (shops || [])) {
  const { count } = await supabase.from('therapists')
    .select('id', { count: 'exact', head: true }).eq('shop_id', s.id);
  const img = s.image_url ? '✅' : '❌ なし';
  const sch = s.schedule_url ? '✅' : '❌';
  const web = s.website_url ?? '（なし）';
  const name = s.name?.slice(0, 25).padEnd(25);
  console.log(`${name} | ${String(count ?? 0).padStart(4)}名 | ${img.padEnd(10)} | ${sch}  | ${web}`);
}
