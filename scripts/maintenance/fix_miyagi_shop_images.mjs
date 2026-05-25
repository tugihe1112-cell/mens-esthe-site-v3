/**
 * 宮城県 店舗画像をロゴ画像に更新
 * 実行: node scripts/maintenance/fix_miyagi_shop_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

const UPDATES = [
  {
    id: 'miyagi_sendai_pulunt',
    image_url: 'https://pulunt.net/theme/mblme2gradation01/images/header_logo.png',
  },
  {
    id: 'miyagi_sendai_arena_spa',
    image_url: 'https://arena-spa.com/theme/mblme2whprism/images/header_logo.png',
  },
  {
    id: 'miyagi_sendai_platonic_spa',
    image_url: 'https://platonic-spa.com/theme/mblmewhite01/images/header_logo.png',
  },
  {
    id: 'miyagi_sendai_shizuku_spa',
    image_url: 'https://shizuku-spa.com/theme/mblmewhite02/images/header_logo.png',
  },
  {
    id: 'miyagi_sendai_aroma_rich',
    // ap2hp ページトップ画像（ロゴ画像なし）
    image_url: 'https://ap2hp.com/storage/images/8130/page/b6d62cffd3c4f2cff5f557edb498091d.jpg',
  },
  {
    id: 'miyagi_sendai_onetime',
    // ロゴ画像（back_image）に変更
    image_url: 'https://onetime-sendai.com/upload/back_image/36.png',
  },
  {
    id: 'miyagi_sendai_aroma_no5',
    // Wixロゴ画像
    image_url: 'https://static.wixstatic.com/media/5590ea_c633e6fad89d4d4688b2dc56d82fa307~mv2.png',
  },
];

for (const u of UPDATES) {
  console.log(`${u.id}`);
  console.log(`  → ${u.image_url}`);
  if (DRY_RUN) continue;
  const { error } = await supabase.from('shops').update({ image_url: u.image_url }).eq('id', u.id);
  if (error) console.error(`  ❌ ${error.message}`);
  else       console.log(`  ✅`);
}

console.log('\n完了');
