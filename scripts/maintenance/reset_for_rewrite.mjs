/**
 * menesthe_rewritten → menesthe_import に戻して再書き直し対象にする
 * 手動修正済みのIDは除外する
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// 手動修正済みのIDは除外
const EXCLUDE_IDS = [
  'menesthe_9416_0_1779065215297', // 永井 さつき（手動修正済み）
];

const { data, error: fetchErr } = await supabase
  .from('reviews')
  .select('id')
  .eq('user_id', 'menesthe_rewritten')
  .not('id', 'in', `(${EXCLUDE_IDS.map(id => `"${id}"`).join(',')})`);

if (fetchErr) { console.error(fetchErr.message); process.exit(1); }

console.log(`リセット対象: ${data.length}件`);

const ids = data.map(r => r.id);

// バッチで更新（100件ずつ）
let updated = 0;
for (let i = 0; i < ids.length; i += 100) {
  const batch = ids.slice(i, i + 100);
  const { error } = await supabase
    .from('reviews')
    .update({ user_id: 'menesthe_import' })
    .in('id', batch);
  if (error) { console.error(error.message); process.exit(1); }
  updated += batch.length;
  console.log(`  ${updated}/${ids.length} 件リセット完了`);
}

console.log(`\n✅ ${updated}件を menesthe_import に戻しました`);
console.log('次に: node scripts/maintenance/auto_rewrite_reviews.mjs');
