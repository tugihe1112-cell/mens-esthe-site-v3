/**
 * 竜宮城 shops テーブルのデータ修正
 * - 銀座店: shops.name が「人形町店」になっているのを修正
 * - 沼津店: group_id を g_brand_ryugujo に統一、店舗名に「(沼津店)」追加
 * 実行: node scripts/maintenance/fix_ryugujo_shop_data.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

const fixes = [
  {
    id: 'tokyo_chuo_ginza_ryugujo',
    desc: '銀座店: name を「人形町店」→「銀座店」に修正',
    update: {
      name: '竜宮城 旧百万石 (銀座店)',
    },
    rawDataPatch: { name: '竜宮城 旧百万石 (銀座店)' },
  },
  {
    id: 'shizuoka_numazu_ryugujo',
    desc: '沼津店: name に「(沼津店)」追加、group_id を g_brand_ryugujo に修正',
    update: {
      name: '竜宮城 旧百万石 (沼津店)',
      group_id: 'g_brand_ryugujo',
    },
    rawDataPatch: { name: '竜宮城 旧百万石 (沼津店)' },
  },
];

for (const fix of fixes) {
  console.log(`\n--- ${fix.id} ---`);
  console.log(`  ${fix.desc}`);

  if (DRY_RUN) {
    console.log(`  更新予定: ${JSON.stringify(fix.update)}`);
    if (fix.rawDataPatch) console.log(`  raw_data patch: ${JSON.stringify(fix.rawDataPatch)}`);
    continue;
  }

  // 現在の raw_data を取得
  const { data: current } = await supabase.from('shops').select('raw_data').eq('id', fix.id).single();

  // raw_data をマージ
  const newRawData = fix.rawDataPatch
    ? { ...(current?.raw_data || {}), ...fix.rawDataPatch }
    : current?.raw_data;

  const { error } = await supabase.from('shops').update({
    ...fix.update,
    raw_data: newRawData,
  }).eq('id', fix.id);

  if (error) {
    console.log(`  ❌ ${error.message}`);
  } else {
    console.log(`  ✅ 完了`);
  }
}

console.log('\n完了');
