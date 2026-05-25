import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// ノイズ名リスト
const noiseNames = ['ノーイメージ', 'ゆりかごからメッセージ'];

for (const name of noiseNames) {
  const { data, error } = await supabase.from('therapists').delete().eq('name', name).select('id,shop_id');
  if (error) console.log(`❌ ${name}: ${error.message}`);
  else console.log(`✅ 削除: "${name}" ${data?.length || 0}件 (${data?.map(d=>d.shop_id).join(', ')})`);
}

// チャンスのセラピスト名確認（❤️入り等）
const { data: chance } = await supabase.from('therapists').select('id,name').eq('shop_id','aichi_takaoka_chance').order('name');
console.log(`\nチャンス セラピスト一覧 (${chance?.length}名):`);
chance?.forEach(t => console.log(`  ${t.name}`));
