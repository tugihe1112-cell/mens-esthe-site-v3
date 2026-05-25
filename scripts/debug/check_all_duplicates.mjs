/**
 * 全店舗の重複セラピストを調査するスクリプト
 * 実行: node scripts/debug/check_all_duplicates.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY'));

console.log('全セラピストを取得中...');

// 全件取得（ページネーション）
let all = [];
let from = 0;
const BATCH = 1000;
while (true) {
  const { data, error } = await supabase
    .from('therapists')
    .select('id, shop_id, name')
    .range(from, from + BATCH - 1);
  if (error) { console.error(error); break; }
  if (!data || data.length === 0) break;
  all = all.concat(data);
  if (data.length < BATCH) break;
  from += BATCH;
}
console.log(`総セラピスト数: ${all.length}件\n`);

// shop_id × name でグループ化
const map = {}; // { shop_id: { name: [records] } }
for (const t of all) {
  const sid = t.shop_id;
  const name = (t.name || '').trim();
  if (!map[sid]) map[sid] = {};
  if (!map[sid][name]) map[sid][name] = [];
  map[sid][name].push(t);
}

// 重複を集計
let totalDupShops = 0;
let totalDupRecords = 0;
const results = [];

for (const [shopId, nameMap] of Object.entries(map)) {
  const dups = Object.entries(nameMap).filter(([_, list]) => list.length > 1);
  if (dups.length === 0) continue;

  totalDupShops++;
  let shopDupCount = 0;
  for (const [name, list] of dups) {
    shopDupCount += list.length - 1; // 余分なレコード数
    totalDupRecords += list.length - 1;
  }
  results.push({ shopId, dups, shopDupCount });
}

// 重複数の多い順にソート
results.sort((a, b) => b.shopDupCount - a.shopDupCount);

console.log(`=== 重複が見つかった店舗: ${totalDupShops}件 / 余分なレコード合計: ${totalDupRecords}件 ===\n`);

for (const { shopId, dups, shopDupCount } of results) {
  console.log(`\n📍 ${shopId} (+${shopDupCount}件の重複)`);
  for (const [name, list] of dups) {
    console.log(`  ⚠️  "${name}" × ${list.length}件`);
    // IDパターンを表示（原因の特定に役立つ）
    list.forEach(t => {
      const idHint = t.id.length > 60 ? t.id.slice(0, 60) + '…' : t.id;
      console.log(`    - ${idHint}`);
    });
  }
}

console.log(`\n\n=== サマリー ===`);
console.log(`重複のある店舗数: ${totalDupShops}`);
console.log(`余分なレコード合計: ${totalDupRecords}件`);
console.log(`（修正すれば ${totalDupRecords} 件削除できる）`);
