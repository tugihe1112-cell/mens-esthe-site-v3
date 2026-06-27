import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const FIX = process.argv.includes('--fix');

// dev中にprod DBへ入ったテスト投稿（gibberish）を特定
const { data, error } = await supabase
  .from('reviews')
  .select('id, shop_id, therapist_name, user_id, content, created_at')
  .ilike('content', '%dashboardseijocall%');

if (error) { console.error(error); process.exit(1); }
console.log(`■ 該当（テスト投稿の疑い）: ${data?.length || 0}件`);
console.table((data || []).map(r => ({ id: r.id, therapist: r.therapist_name, user_id: r.user_id, head: (r.content || '').slice(0, 30) })));

if (!data?.length) { console.log('該当なし。'); process.exit(0); }
if (!FIX) { console.log('\n--fix を付けて再実行すると削除します。'); process.exit(0); }

for (const r of data) {
  const { error: delErr } = await supabase.from('reviews').delete().eq('id', r.id);
  console.log(delErr ? `❌ ${r.id}: ${delErr.message}` : `🗑️ 削除: ${r.id}`);
}
console.log('✅ 完了。');
