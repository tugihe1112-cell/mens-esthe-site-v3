/**
 * 小悪魔スパ全店舗の shops.image_url を設定
 * node scripts/maintenance/fix_koakuma_shop_images.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const IMAGE_URL = 'https://mens-esthe-aroma.site/assets/img/bgCombined.jpg';

const { data: shops, error } = await supabase
  .from('shops').select('id, name, image_url').ilike('id', '%koakuma%');

if (error) { console.error(error); process.exit(1); }

console.log(`対象: ${shops.length}店舗`);
shops.forEach(s => console.log(`  ${s.id}  現在: ${s.image_url ? '設定あり' : 'null'}`));

const { error: e } = await supabase
  .from('shops').update({ image_url: IMAGE_URL }).in('id', shops.map(s => s.id));

if (e) console.error('ERROR:', e);
else   console.log(`\n✅ ${shops.length}店舗を更新しました\n  → ${IMAGE_URL}`);
