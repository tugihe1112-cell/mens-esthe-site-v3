/**
 * スペーサー画像のセラピストがいる店舗の website_url を取得
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: therapists } = await supabase
  .from('therapists')
  .select('shop_id')
  .ilike('image_url', '%spacer%');

const shopIds = [...new Set(therapists.map(t => t.shop_id))];
console.log(`影響店舗: ${shopIds.length}件\n`);

const { data: shops } = await supabase
  .from('shops')
  .select('id, name, website_url, group_id')
  .in('id', shopIds);

// 件数も一緒に表示
const countByShop = {};
for (const t of therapists) {
  countByShop[t.shop_id] = (countByShop[t.shop_id] || 0) + 1;
}

// group_idでまとめて表示
const byGroup = {};
for (const s of shops) {
  const g = s.group_id || 'solo';
  if (!byGroup[g]) byGroup[g] = [];
  byGroup[g].push(s);
}

for (const [g, stores] of Object.entries(byGroup)) {
  console.log(`\n【${g}】`);
  for (const s of stores) {
    console.log(`  ${s.id} (${countByShop[s.id]}名)`);
    console.log(`    ${s.name}`);
    console.log(`    ${s.website_url || '(URLなし)'}`);
  }
}
