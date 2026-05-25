/**
 * 重複口コミの内容が同じか違うか確認
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: reviews } = await supabase
  .from('reviews')
  .select('id, shop_id, therapist_name, content')
  .limit(1000);

// 重複グループを特定
const map = {};
for (const r of reviews) {
  const key = `${r.shop_id}:::${r.therapist_name}`;
  if (!map[key]) map[key] = [];
  map[key].push(r);
}
const dups = Object.values(map).filter(g => g.length > 1);

let sameContent = 0;
let diffContent = 0;

for (const group of dups) {
  const contents = group.map(r => r.content?.trim() || '');
  const allSame = contents.every(c => c === contents[0]);

  console.log('='.repeat(60));
  console.log(`店舗: ${group[0].shop_id}`);
  console.log(`セラピスト: ${group[0].therapist_name}`);
  console.log(`件数: ${group.length}件`);
  console.log(`内容: ${allSame ? '❌ 全て同じ（削除対象）' : '✅ それぞれ違う（複数口コミ）'}`);

  if (allSame) {
    sameContent++;
    console.log(`→ 削除すべきID: ${group.slice(1).map(r => r.id).join(', ')}`);
  } else {
    diffContent++;
    group.forEach((r, i) => {
      console.log(`\n[${i + 1}] ID: ${r.id}`);
      console.log(`内容(先頭50字): ${r.content?.slice(0, 50)}...`);
    });
  }
  console.log();
}

console.log('='.repeat(60));
console.log(`同じ内容（削除すべき重複）: ${sameContent}グループ`);
console.log(`内容が違う（複数口コミとしてOK）: ${diffContent}グループ`);
