import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 天界のスパの全セラピストを取得して image_url を確認
const { data, error } = await supabase
  .from('therapists')
  .select('id, name, image_url')
  .eq('shop_id', 'tokyo_meguro_nakameguro_tenkai_no_spa');

console.log(`件数: ${data?.length}, エラー: ${error?.message || 'なし'}`);

const groups = { spacer: [], null_url: [], other: [] };
for (const t of data || []) {
  if (!t.image_url) groups.null_url.push(t);
  else if (t.image_url.toLowerCase().includes('spacer')) groups.spacer.push(t);
  else groups.other.push(t);
}

console.log(`spacer含む: ${groups.spacer.length}件`);
console.log(`null: ${groups.null_url.length}件`);
console.log(`その他: ${groups.other.length}件`);

// サンプル表示
console.log('\n--- spacerサンプル (最初の3件) ---');
groups.spacer.slice(0, 3).forEach(t => console.log(`  ${t.name}: ${t.image_url}`));

console.log('\n--- nullサンプル (最初の3件) ---');
groups.null_url.slice(0, 3).forEach(t => console.log(`  ${t.name}: null`));

console.log('\n--- その他サンプル (最初の3件) ---');
groups.other.slice(0, 3).forEach(t => console.log(`  ${t.name}: ${t.image_url}`));
