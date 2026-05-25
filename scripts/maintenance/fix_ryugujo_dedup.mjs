/**
 * 竜宮城 重複セラピスト削除
 * 全5店舗で同じキャストを登録してしまったため、
 * 人形町店のみ残して他4店舗のセラピストを全削除
 * 実行: node scripts/maintenance/fix_ryugujo_dedup.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

// 人形町店にだけ残す。他4店舗は削除
const DELETE_SHOPS = [
  'tokyo_chuo_ginza_ryugujo',
  'shizuoka_numazu_ryugujo',
  'tokyo_koto_monzennakacho_ryugujo',
  'tokyo_ota_kamata_ryugujo',
];

for (const shopId of DELETE_SHOPS) {
  const { count } = await supabase
    .from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', shopId);
  console.log(`${shopId}: ${count}名`);
  if (DRY_RUN) continue;
  const { error } = await supabase.from('therapists').delete().eq('shop_id', shopId);
  if (error) console.error(`  ❌ ${error.message}`);
  else       console.log(`  ✅ 全削除`);
}

console.log('\n完了');
