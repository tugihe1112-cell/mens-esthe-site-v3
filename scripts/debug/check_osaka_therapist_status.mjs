/**
 * 大阪全店舗 セラピスト登録状況チェック
 * 実行: node scripts/debug/check_osaka_therapist_status.mjs
 */
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

// 大阪の全店舗を取得
const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=like.osaka_*&select=id,name,website_url&order=id`, { headers: h });
const shops = await r.json();
console.log(`大阪 全店舗: ${shops.length}件\n`);

const zero = [];
const withData = [];

for (const shop of shops) {
  const tr = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id&limit=1`, { headers: h });
  const therapists = await tr.json();
  const hasData = therapists.length > 0;
  if (hasData) withData.push(shop);
  else zero.push(shop);
}

console.log(`✅ データあり: ${withData.length}店舗`);
withData.forEach(s => console.log(`  ${s.id}`));

console.log(`\n❌ セラピスト0: ${zero.length}店舗`);
zero.forEach(s => console.log(`  ${s.id}  ${s.name || ''}  ${s.website_url || '(URLなし)'}`));

console.log('\n完了');
