/**
 * PEPE SPA セラピスト重複削除
 * 6店舗全員に同じセラピストが登録されているため、1店舗にまとめる
 * 残す店舗: kanagawa_fujisawa_pepe_spa（代表店）
 * 削除する店舗: 残り5店舗のセラピスト
 *
 * 実行: node scripts/maintenance/fix_pepespa_dedup.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const KEEP_SHOP = 'kanagawa_fujisawa_pepe_spa'; // セラピストを残す代表店
const DELETE_SHOPS = [
  'tokyo_chofu_chofu_pepe_spa',
  'tokyo_hachioji_hachioji_pepe_spa',
  'tokyo_machida_machida_pepe_spa',
  'tokyo_ota_kamata_pepe_spa',
  'tokyo_setagaya_shimokitazawa_pepe_spa',
];

if (isDryRun) console.log('=== DRY RUN ===\n');

// 代表店のセラピスト数を確認
const { data: kept } = await supabase
  .from('therapists')
  .select('id, name')
  .eq('shop_id', KEEP_SHOP);
console.log(`残す店舗 [${KEEP_SHOP}]: ${kept?.length}名`);

// 削除対象店舗の処理
for (const shopId of DELETE_SHOPS) {
  const { data: targets } = await supabase
    .from('therapists')
    .select('id, name')
    .eq('shop_id', shopId);

  console.log(`\n削除対象 [${shopId}]: ${targets?.length}名`);

  if (!isDryRun && targets?.length > 0) {
    const { error } = await supabase
      .from('therapists')
      .delete()
      .eq('shop_id', shopId);

    if (error) console.error(`  ERROR: ${error.message}`);
    else console.log(`  ✅ ${targets.length}件削除完了`);
  } else if (isDryRun) {
    console.log(`  [DRY] ${targets?.length}件を削除予定`);
  }
}

console.log(`\n完了。PEPE SPAのセラピストは [${KEEP_SHOP}] にのみ登録されます。`);
