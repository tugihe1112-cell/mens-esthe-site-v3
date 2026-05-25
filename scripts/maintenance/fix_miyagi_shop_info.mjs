/**
 * 宮城県 店舗情報設定
 * - AROMA No5, Aroma Rich の website_url を設定（DBに未登録）
 * - 全店舗の image_url を men-esthe.jp 画像で設定
 * 実行: node scripts/maintenance/fix_miyagi_shop_info.mjs [--dry-run]
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
    id: 'miyagi_sendai_aroma_no5',
    website_url: 'https://www.aroma-no5.com/',
    image_url: 'https://men-esthe.jp/contents/salon/d4b046c245c177ce11072bea4191cfbd.jpg',
  },
  {
    id: 'miyagi_sendai_aroma_rich',
    website_url: 'https://rich-sendai.com/',
    image_url: 'https://men-esthe.jp/contents/salon/bfebde26c731e1e356b1f6190a38b8d3.jpg',
  },
  {
    id: 'miyagi_sendai_pulunt',
    image_url: 'https://men-esthe.jp/contents/salon/3595b122905ff09250fd849b13f1275a.jpg',
  },
  {
    id: 'miyagi_sendai_arena_spa',
    image_url: 'https://men-esthe.jp/contents/salon/c17430573f8d66aac277c10412d614c1.jpg',
  },
  {
    id: 'miyagi_sendai_shizuku_spa',
    image_url: 'https://men-esthe.jp/contents/salon/479a7cc2931e04744243ffbc63875d96.jpg',
  },
  {
    id: 'miyagi_sendai_platonic_spa',
    image_url: 'https://men-esthe.jp/contents/salon/6d786447e152922924383b76f7139a59.jpg',
  },
  // miyagi_sendai_cuaura, miyagi_sendai_onetime は men-esthe.jp に画像なし → スキップ
];

for (const u of UPDATES) {
  const updates = {};
  if (u.website_url) updates.website_url = u.website_url;
  if (u.image_url)   updates.image_url   = u.image_url;

  console.log(`${u.id}:`, JSON.stringify(updates));
  if (DRY_RUN) continue;

  const { error } = await supabase.from('shops').update(updates).eq('id', u.id);
  if (error) console.error(`  ❌ ${error.message}`);
  else       console.log(`  ✅`);
}

console.log('\n完了');
