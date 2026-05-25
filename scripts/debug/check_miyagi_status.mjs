/**
 * 宮城県 店舗・セラピスト状況確認
 * 実行: node scripts/debug/check_miyagi_status.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase
  .from('shops')
  .select('id, name, website_url, image_url, schedule_url')
  .filter('raw_data->>prefecture', 'eq', '宮城県')
  .order('id');

if (!shops?.length) {
  console.log('宮城県の店舗がDBに見つかりません');
  process.exit(0);
}

console.log(`=== 宮城県 店舗一覧 (${shops.length}店舗) ===\n`);

for (const s of shops) {
  const { count } = await supabase
    .from('therapists')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', s.id);

  const imgStatus = s.image_url ? '✅' : '❌';
  const urlStatus = s.website_url ? '✅' : '❌';
  const therapistStatus = count > 0 ? `✅ ${count}名` : '  0名';

  console.log(`${therapistStatus.padEnd(8)} | ${imgStatus}画像 | ${urlStatus}URL | ${s.name}`);
  console.log(`         | id: ${s.id}`);
  if (s.website_url) console.log(`         | url: ${s.website_url}`);
  console.log('');
}
