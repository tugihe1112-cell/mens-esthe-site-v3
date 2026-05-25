/**
 * AI書き直し済み口コミを全削除
 * user_id = 'menesthe_rewritten' のレコードを削除する
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) console.log('=== DRY RUN ===\n');

// 対象件数確認
const { data, error: fetchErr } = await supabase
  .from('reviews')
  .select('id')
  .eq('user_id', 'menesthe_rewritten');

if (fetchErr) { console.error(fetchErr.message); process.exit(1); }

console.log(`削除対象: ${data.length}件`);

if (isDryRun) {
  console.log('\n(dry-run) 実際には削除しません');
  console.log('本実行: node scripts/maintenance/delete_rewritten_reviews.mjs');
  process.exit(0);
}

// バッチで削除（100件ずつ）
const ids = data.map(r => r.id);
let deleted = 0;

for (let i = 0; i < ids.length; i += 100) {
  const batch = ids.slice(i, i + 100);
  const { error } = await supabase
    .from('reviews')
    .delete()
    .in('id', batch);

  if (error) { console.error(error.message); process.exit(1); }
  deleted += batch.length;
  console.log(`  ${deleted}/${ids.length} 件削除完了`);
}

console.log(`\n✅ ${deleted}件を削除しました`);
