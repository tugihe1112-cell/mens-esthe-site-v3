/**
 * raw_data.area が配列の店舗を文字列に修正（最初の要素を使用）
 * 実行: node scripts/maintenance/fix_area_array.mjs --dry-run
 *       node scripts/maintenance/fix_area_array.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');

const { data, error } = await supabase.from('shops').select('id, name, raw_data');
if (error) { console.error(error); process.exit(1); }

const bad = data.filter(d => Array.isArray(d.raw_data?.area));

console.log(`修正対象: ${bad.length}件 (DRY_RUN=${DRY_RUN})\n`);

for (const d of bad) {
  const oldArea = d.raw_data.area;
  const newArea = oldArea[0] || '';
  console.log(`  ${d.name}: ${JSON.stringify(oldArea)} → "${newArea}"`);

  if (!DRY_RUN) {
    const newRawData = { ...d.raw_data, area: newArea };
    const { error: updErr } = await supabase.from('shops').update({ raw_data: newRawData }).eq('id', d.id);
    if (updErr) console.error(`    ✗ ${updErr.message}`);
    else console.log(`    ✅ 更新完了`);
  }
}

console.log('\n=== 完了 ===');
