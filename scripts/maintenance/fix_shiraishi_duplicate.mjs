/**
 * 白石せいな 重複口コミ確認・削除（新しい方を削除）
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const { data } = await supabase
  .from('reviews')
  .select('id, user_id, created_at')
  .eq('shop_id', 'tokyo_shibuya_silk')
  .eq('therapist_name', '白石せいな')
  .order('created_at', { ascending: true });

console.log('白石せいなの口コミ一覧:');
data.forEach((r, i) => console.log(`  ${i+1}. ${r.id} (${r.user_id}) - ${r.created_at}`));

// 新しい方（最後）を削除
const toDelete = data[data.length - 1];
console.log(`\n削除対象: ${toDelete.id}`);

const { error } = await supabase.from('reviews').delete().eq('id', toDelete.id);
if (error) {
  console.error(`❌ ${error.message}`);
} else {
  console.log(`✅ 削除完了`);
}
