/**
 * THE PREMIUM SPA 店舗画像をロゴ→メインビジュアルに修正
 * 実行: node scripts/maintenance/fix_premium_spa_shop_image.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const NEW_IMAGE = 'https://the-premiumspa.com/data/slid/sld_676fed3650c67.webp';

const { data, error } = await supabase
  .from('shops')
  .update({ image_url: NEW_IMAGE })
  .ilike('name', '%premium spa%')
  .select('id, name');

if (error) { console.error(error); process.exit(1); }
console.log(`更新完了: ${data.length}件`);
data.forEach(d => console.log(`  ✅ ${d.name}`));
