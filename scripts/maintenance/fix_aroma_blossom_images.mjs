/**
 * Aroma Blossom 全店舗の店舗画像を修正
 * og:imageがデフォルトアイコンになっていたためスライダー画像に差し替え
 *
 * 実行: node scripts/maintenance/fix_aroma_blossom_images.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const NEW_IMAGE = 'https://aroma-blossom.com/wp-content/themes/nakameguro-aqua/image/img_slider18.jpg';

const { data, error } = await supabase
  .from('shops')
  .update({ image_url: NEW_IMAGE })
  .ilike('name', '%blossom%')
  .select('id, name');

if (error) { console.error(error); process.exit(1); }

console.log(`更新完了: ${data.length}件`);
data.forEach(d => console.log(`  ✅ ${d.name}`));
