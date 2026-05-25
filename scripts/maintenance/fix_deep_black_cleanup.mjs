/**
 * Deep Black クリーンアップ
 * - 「さんの写真」付きの旧名前レコードを削除（対応する正常名レコードが存在する場合）
 * - 対応する正常名レコードがない場合は名前修正
 *
 * 実行: node scripts/maintenance/fix_deep_black_cleanup.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'tokyo_arakawa_nippori_deep_black';

const { data: all } = await supabase
  .from('therapists')
  .select('id, name, image_url')
  .eq('shop_id', SHOP_ID);

console.log(`全レコード: ${all?.length}件\n`);

const normName = s => (s || '').replace(/さんの写真$/, '').replace(/\s/g, '').replace(/　/g, '').trim();

// さんの写真付きレコードを抽出
const withSuffix = (all || []).filter(t => t.name?.endsWith('さんの写真'));
const without = (all || []).filter(t => !t.name?.endsWith('さんの写真'));

console.log(`「さんの写真」付き: ${withSuffix.length}件`);
console.log(`通常名: ${without.length}件\n`);

for (const t of withSuffix) {
  const cleanName = t.name.replace(/さんの写真$/, '').trim();
  // 対応する通常名レコードが存在するか確認
  const duplicate = without.find(u => normName(u.name) === normName(cleanName));

  if (duplicate) {
    // 重複あり → 旧レコードを削除
    console.log(`${isDryRun ? '[DRY]' : '🗑'} 削除: "${t.name}" (重複: "${duplicate.name}" が存在)`);
    if (!isDryRun) {
      const { error } = await supabase.from('therapists').delete().eq('id', t.id);
      if (error) console.error(`  ERROR: ${error.message}`);
    }
  } else {
    // 重複なし → 名前修正（さんの写真除去）
    console.log(`${isDryRun ? '[DRY]' : '✅'} 名前修正: "${t.name}" → "${cleanName}"`);
    if (!isDryRun) {
      const { error } = await supabase.from('therapists')
        .update({ name: cleanName })
        .eq('id', t.id);
      if (error) console.error(`  ERROR: ${error.message}`);
    }
  }
}

console.log('\n完了');
