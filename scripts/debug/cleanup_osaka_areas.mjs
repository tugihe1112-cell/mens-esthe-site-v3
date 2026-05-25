/**
 * 大阪エリアのクリーンアップ: 店舗のない小エリア・中エリアを特定
 * 実行: node scripts/debug/cleanup_osaka_areas.mjs
 */
import fs from 'fs';

const OSAKA_AREAS = [
  "京橋", "出張", "北新地", "北浜", "十三", "南森町", "南船場",
  "吹田", "堂山", "堺東", "堺筋本町", "天満橋", "天王寺", "心斎橋",
  "新大阪", "日本橋", "東三国", "松屋町", "桜川", "梅田",
  "江坂", "肥後橋", "西中島", "谷町九丁目", "長堀橋", "阿波座", "難波", "高槻"
];

async function run() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // 大阪の全店舗を取得
  const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=like.osaka_*&select=id,name,raw_data,area_id`, { headers: h });
  const shops = await r.json();
  console.log(`大阪店舗総数: ${shops.length}件\n`);

  // 各店舗の city/area フィールドを収集
  const citySet = new Set();
  shops.forEach(s => {
    const city = s.raw_data?.city || s.raw_data?.area || '';
    if (city) citySet.add(city);
    // area_id からも推測 (osaka_umeda_xxx → 梅田)
  });
  console.log('DB上の大阪エリア:', [...citySet].sort().join(', '));

  // 各エリアの店舗数を確認
  console.log('\n=== エリア別店舗数 ===');
  const hasShops = new Set();
  const noShops = [];

  for (const area of OSAKA_AREAS) {
    const count = shops.filter(s => {
      const city = s.raw_data?.city || s.raw_data?.area || '';
      return city === area;
    }).length;

    if (count > 0) {
      hasShops.add(area);
      console.log(`  ✅ ${area}: ${count}店`);
    } else {
      noShops.push(area);
      console.log(`  ❌ ${area}: 0店 → 削除対象`);
    }
  }

  console.log(`\n削除対象エリア (${noShops.length}件):`);
  console.log(noShops.join(', '));
  console.log(`\n残すエリア (${hasShops.size}件):`);
  console.log([...hasShops].join(', '));
}
run().catch(e => console.error('❌', e.message));
