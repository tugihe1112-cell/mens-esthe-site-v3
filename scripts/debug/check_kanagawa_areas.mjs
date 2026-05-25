/**
 * 神奈川の店舗が使っているエリア値を確認
 * 実行: node scripts/debug/check_kanagawa_areas.mjs
 */
import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  const res = await fetch(
    `${supabaseUrl}/rest/v1/shops?id=like.kanagawa_%25&select=id,name,raw_data`,
    { headers }
  );
  const data = await res.json();
  if (!Array.isArray(data)) {
    console.error('❌ APIエラー:', JSON.stringify(data));
    process.exit(1);
  }
  const shops = data;

  // エリア別にまとめる（raw_data.area を使用）
  const areaMap = {};
  for (const s of shops) {
    const a = (s.raw_data && s.raw_data.area) || '(未設定)';
    if (!areaMap[a]) areaMap[a] = [];
    areaMap[a].push(s.name);
  }

  console.log('=== 神奈川 使用中エリア一覧 ===\n');
  for (const [area, names] of Object.entries(areaMap).sort()) {
    console.log(`${area}: ${names.length}店舗`);
    names.forEach(n => console.log(`  - ${n}`));
  }

  console.log('\n=== locations.js 神奈川県エリアリスト ===');
  const allAreas = ["厚木","海老名","藤沢","本厚木","稲田堤","伊勢佐木","伊勢佐木町","上大岡","関内","川崎","溝の口","向ヶ丘遊園","武蔵小杉","登戸","野毛町","相模原","桜木町","新横浜","新百合ヶ丘","戸塚","綱島","横浜","川崎市","相模原市"];
  const usedAreas = new Set(Object.keys(areaMap));

  console.log('\n✅ 店舗あり:');
  allAreas.filter(a => usedAreas.has(a)).forEach(a => console.log(`  ${a}`));
  console.log('\n❌ 店舗なし（削除対象）:');
  allAreas.filter(a => !usedAreas.has(a)).forEach(a => console.log(`  ${a}`));
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
