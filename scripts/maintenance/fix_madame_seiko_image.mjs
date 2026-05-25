/**
 * MADAME聖子 shop画像をロゴ画像に更新
 * 実行: node scripts/maintenance/fix_madame_seiko_image.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const IMAGE_URL = 'https://madame-seiko.com/theme/mblme2gradation02/images/header_logo.png';

const { data } = await supabase.from('shops')
  .select('id, name, image_url')
  .ilike('name', '%聖子%')
  .single();

console.log(`shop_id: ${data?.id}`);
console.log(`現在:   ${data?.image_url}`);
console.log(`変更後: ${IMAGE_URL}`);

if (DRY_RUN) {
  console.log('[DRY] 完了');
} else {
  const { error } = await supabase.from('shops').update({ image_url: IMAGE_URL }).eq('id', data.id);
  if (!error) console.log('✅ 更新完了');
  else console.error('❌ エラー:', error.message);
}
