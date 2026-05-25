/**
 * 同一店舗ページに同じ口コミが複数入っていないか確認
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: reviews, error } = await supabase
  .from('reviews')
  .select('id, shop_id, therapist_name, content')
  .limit(1000);

if (error) { console.error(error.message); process.exit(1); }

// shop_id + therapist_name でグループ化して重複チェック
const map = {};
for (const r of reviews) {
  const key = `${r.shop_id}:::${r.therapist_name}`;
  if (!map[key]) map[key] = [];
  map[key].push(r.id);
}

const dups = Object.entries(map).filter(([, ids]) => ids.length > 1);

if (dups.length === 0) {
  console.log('✅ 同一店舗ページへの重複なし');
} else {
  console.log(`❌ 同一店舗・同一セラピストで複数口コミあり: ${dups.length}件\n`);
  for (const [key, ids] of dups.slice(0, 20)) {
    const [shop_id, therapist_name] = key.split(':::');
    console.log(`  店舗: ${shop_id}`);
    console.log(`  セラピスト: ${therapist_name}`);
    console.log(`  ID: ${ids.join(', ')}`);
    console.log();
  }
  if (dups.length > 20) console.log(`  ...他 ${dups.length - 20} 件`);
}

// shop_idがDBのshopsに存在しないレコードも確認
console.log('\n=== 存在しないshop_idの口コミ ===');
const { data: shops } = await supabase.from('shops').select('id');
const shopIds = new Set(shops.map(s => s.id));

const orphans = reviews.filter(r => !shopIds.has(r.shop_id));
console.log(`shop_idがDBに存在しない口コミ: ${orphans.length}件`);
if (orphans.length > 0) {
  const orphanShops = [...new Set(orphans.map(r => r.shop_id))];
  console.log('対象shop_id:', orphanShops.slice(0, 10));
}
