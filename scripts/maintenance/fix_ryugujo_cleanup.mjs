/**
 * 竜宮城 ノイズレコード削除
 * 実行: node scripts/maintenance/fix_ryugujo_cleanup.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

// 全竜宮城店舗
const ALL_SHOPS = [
  'tokyo_chuo_ningyocho_ryugujo',
  'tokyo_chuo_ginza_ryugujo',
  'shizuoka_numazu_ryugujo',
  'tokyo_koto_monzennakacho_ryugujo',
  'tokyo_ota_kamata_ryugujo',
];

// ノイズ名前リスト（コース名・割引バナー・店名）
const NOISE_NAMES = [
  'トリプルセラピスト①',
  'ダブルセラピスト①',
  'ダブルセラピスト➁',
  'ダブルセラピスト③',
  'ダブルセラピスト➃',
  '新規割',
  'スタート割',
  '竜宮城',
  '桃原むち',  // 人形町店で別途アップした重複（桃原 むち と表記ゆれ）
];

for (const shopId of ALL_SHOPS) {
  for (const name of NOISE_NAMES) {
    const id = `${shopId}_${name}`;
    if (DRY_RUN) { console.log(`削除予定: ${id}`); continue; }
    const { error } = await supabase.from('therapists').delete().eq('id', id);
    if (error && !error.message.includes('0 rows')) console.error(`  ❌ ${id}: ${error.message}`);
    else console.log(`  ✅ ${id}`);
  }
}

console.log('\n完了');
