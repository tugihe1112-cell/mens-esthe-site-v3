import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
// 削除も行うので service role
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const FIX = process.argv.includes('--fix');

const SHOP_ID = 'hiroshima_hiroshima_hitozuma_san';

// 大谷夫人の口コミを全部拾う（id一致 or shop+therapist_name一致）
const { data, error } = await supabase
  .from('reviews')
  .select('id, therapist_name, user_id, created_at')
  .eq('shop_id', SHOP_ID)
  .ilike('therapist_name', '%大谷%')
  .order('created_at', { ascending: true });

if (error) { console.error(error); process.exit(1); }

console.log(`■ 大谷夫人の口コミ: ${data.length}件`);
console.table(data);

if (data.length <= 1) {
  console.log('✅ 重複なし。二重実行でも1件のまま（reviews.idがユニーク制約で弾いた）。問題なし。');
  process.exit(0);
}

console.log(`⚠️ ${data.length}件＝重複あり。最古1件を残して他を削除する。`);
const keep = data[0];
const removeIds = data.slice(1).map(r => r.id);
console.log('残す:', keep.id, '(', keep.created_at, ')');
console.log('削除対象:', removeIds);

if (!FIX) { console.log('\n--fix を付けて再実行すると削除します。'); process.exit(0); }

// 同一idが複数ある場合はidでのdeleteが全部消すので、created_atで最古以外を消す
for (const r of data.slice(1)) {
  const { error: delErr } = await supabase.from('reviews').delete().eq('id', r.id).eq('created_at', r.created_at);
  if (delErr) { console.error('削除失敗:', r, delErr); continue; }
  console.log('🗑️ 削除:', r.id, r.created_at);
}
console.log('✅ 重複除去完了。');
