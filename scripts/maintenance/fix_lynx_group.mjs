/**
 * Lynx 全店舗の group_id を g_brand_lynx に統合
 * 実行: node scripts/maintenance/fix_lynx_group.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

const { data: shops, error } = await supabase
  .from('shops')
  .select('id, name, group_id, raw_data')
  .ilike('name', '%Lynx%');

if (error) { console.log('エラー:', error.message); process.exit(1); }

const TARGET_GROUP = 'g_brand_lynx';
const toUpdate = shops.filter(s => s.group_id !== TARGET_GROUP);
const alreadyCorrect = shops.filter(s => s.group_id === TARGET_GROUP);

console.log(`=== Lynx 全店舗 ${shops.length}件 ===`);
console.log(`✅ 既に g_brand_lynx: ${alreadyCorrect.length}件`);
console.log(`🔄 更新対象: ${toUpdate.length}件`);
toUpdate.forEach(s => console.log(`  ${s.name} (${s.group_id} → ${TARGET_GROUP})`));

if (DRY_RUN || toUpdate.length === 0) process.exit(0);

const ids = toUpdate.map(s => s.id);
const { error: updateError } = await supabase
  .from('shops')
  .update({ group_id: TARGET_GROUP })
  .in('id', ids);

if (updateError) { console.log('❌ 更新失敗:', updateError.message); process.exit(1); }
console.log(`\n✅ ${ids.length}件を ${TARGET_GROUP} に更新完了`);
