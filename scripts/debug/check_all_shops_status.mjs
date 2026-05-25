/**
 * 全店舗 セラピスト登録状況チェック（エリア別）
 * 実行: node scripts/debug/check_all_shops_status.mjs
 */
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

// 全店舗取得
const r = await fetch(`${supabaseUrl}/rest/v1/shops?select=id,name,website_url&order=id`, { headers: h });
const shops = await r.json();

// セラピスト数を一括取得（ページネーション対応・1000件上限を回避）
const therapists = [];
let offset = 0;
const PAGE = 1000;
while (true) {
  const tr = await fetch(
    `${supabaseUrl}/rest/v1/therapists?select=shop_id&limit=${PAGE}&offset=${offset}`,
    { headers: { ...h, 'Range-Unit': 'items', 'Range': `${offset}-${offset + PAGE - 1}` } }
  );
  const page = await tr.json();
  if (!Array.isArray(page) || page.length === 0) break;
  therapists.push(...page);
  if (page.length < PAGE) break;
  offset += PAGE;
}
console.log(`セラピスト総数: ${therapists.length}名`);

const countMap = {};
for (const t of therapists) {
  countMap[t.shop_id] = (countMap[t.shop_id] || 0) + 1;
}

// エリア別に集計
const areaMap = {};
for (const shop of shops) {
  const parts = shop.id.split('_');
  const area = parts[0]; // tokyo / osaka / aichi / etc.
  if (!areaMap[area]) areaMap[area] = { total: 0, withData: 0, zero: [] };
  areaMap[area].total++;
  const cnt = countMap[shop.id] || 0;
  if (cnt > 0) {
    areaMap[area].withData++;
  } else {
    areaMap[area].zero.push({ id: shop.id, name: shop.name, url: shop.website_url });
  }
}

// 表示
console.log('=== 全エリア セラピスト登録状況 ===\n');
const areas = Object.keys(areaMap).sort();
let grandTotal = 0, grandWith = 0;

for (const area of areas) {
  const { total, withData, zero } = areaMap[area];
  grandTotal += total;
  grandWith += withData;
  const pct = Math.round(withData / total * 100);
  const status = withData === total ? '✅' : withData === 0 ? '❌' : '⚠️';
  console.log(`${status} ${area.padEnd(12)} ${withData}/${total} (${pct}%)`);
  if (zero.length > 0 && zero.length <= 10) {
    for (const s of zero) {
      console.log(`     ❌ ${s.id}  ${s.url || '(URLなし)'}`);
    }
  } else if (zero.length > 10) {
    console.log(`     (未処理 ${zero.length}店舗 - 詳細は下記)`);
  }
}

console.log(`\n合計: ${grandWith}/${grandTotal} 店舗にデータあり`);
console.log(`未処理: ${grandTotal - grandWith}店舗`);

// 未処理店舗一覧（エリア別、URL付き）
console.log('\n=== 未処理店舗一覧（URLあり）===');
for (const area of areas) {
  const { zero } = areaMap[area];
  const withUrl = zero.filter(s => s.url);
  if (withUrl.length === 0) continue;
  console.log(`\n[${area}] ${withUrl.length}店舗`);
  for (const s of withUrl) {
    console.log(`  ${s.id}`);
    console.log(`    ${s.name || ''}  ${s.url}`);
  }
}
