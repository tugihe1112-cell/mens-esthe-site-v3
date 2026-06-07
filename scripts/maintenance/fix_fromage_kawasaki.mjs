/**
 * fix_fromage_kawasaki.mjs
 * Fromage 川崎 33名登録（Chrome取得データ、名前のみ）
 * 実行: node scripts/maintenance/fix_fromage_kawasaki.mjs [--dry-run]
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);
const DRY = process.argv.includes('--dry-run');

// 33名（「あすか」が2名いるため2人目は「あすか2」）
const THERAPISTS = [
  'えむ', 'はる', 'まお', 'りこ', 'もえ', 'あず', 'みれい', 'みはな',
  'もも', 'あおい', 'みく', 'ひびき', 'ななせ', 'はるの', 'るな', 'みゆ',
  'しな', 'あすか', 'ゆり', 'るり', 'みき', 'りあ', 'みい', 'すい',
  'なな', 'りり', 'ゆうり', 'ゆあ', 'さくら', 'なみ', 'あすか2', 'ももか', 'さら',
];

async function main() {
  const shopId = 'kanagawa_kawasaki_fromage';
  console.log(DRY ? '=== DRY RUN ===' : '=== LIVE RUN ===');
  console.log(`\n=== Fromage 川崎 (${THERAPISTS.length}名) ===`);

  if (DRY) {
    THERAPISTS.slice(0, 5).forEach(n => console.log(`  DRY: ${n}`));
    return;
  }

  const batch = THERAPISTS.map(name => ({
    id: `${shopId}_${name}`,
    shop_id: shopId,
    name,
    image_url: null,
  }));
  const { error } = await supabase.from('therapists').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
  if (error) console.error(`  ERROR: ${error.message}`);
  else console.log(`  batch OK: ${batch.length}件`);

  console.log('\n=== 完了 ===');
}

main().catch(console.error);
