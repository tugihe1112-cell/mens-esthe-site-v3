/**
 * Mirajour セラピスト名末尾の "2" 重複エントリを削除
 * "北条れいか(姉)2" のような末尾2付きは2枚目の写真レコードのため削除
 * 実行: node scripts/maintenance/fix_mirajour_names.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

// 60026 の全セラピストを取得
const { data: all } = await supabase.from('therapists')
  .select('id, name').eq('shop_id', '60026');

console.log(`総数: ${all?.length ?? 0}名`);

// 末尾が数字で終わるもの（"2", "3" など）を抽出
// ただし元から数字で終わる名前（例: "ギャル" など）と区別するため
// 同じ名前から末尾数字を除いたものが存在するか確認
const nameSet = new Set((all || []).map(t => t.name));
const toDelete = [];

for (const t of (all || [])) {
  // 末尾が数字のみ（スペースなし）かチェック
  const match = t.name.match(/^(.+?)(\d+)$/);
  if (!match) continue;
  const baseName = match[1];
  // ベース名（数字なし）が存在すれば、これは重複エントリ
  if (nameSet.has(baseName)) {
    toDelete.push(t);
  }
}

console.log(`削除対象: ${toDelete.length}件`);
if (DRY_RUN) {
  toDelete.slice(0, 20).forEach(t => console.log(`  削除: "${t.name}" (id=${t.id})`));
  if (toDelete.length > 20) console.log(`  ... 他 ${toDelete.length - 20}件`);
  process.exit(0);
}

// 削除実行
let deleted = 0, failed = 0;
for (const t of toDelete) {
  const { error } = await supabase.from('therapists').delete().eq('id', t.id);
  if (error) { console.log(`❌ ${t.name}: ${error.message}`); failed++; }
  else { process.stdout.write('-'); deleted++; }
}

console.log(`\n\n完了: 削除 ${deleted}件 / 失敗 ${failed}件`);
console.log(`残り: ${(all?.length ?? 0) - deleted}名`);
