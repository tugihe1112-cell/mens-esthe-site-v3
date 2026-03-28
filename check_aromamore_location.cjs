const fs = require('fs');
const path = 'src/data/all_shops.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// アロマモアのデータを抽出（オブジェクト形式対応）
const shops = Array.isArray(data) ? data : Object.values(data);
const aromamore = shops.find(s => s.name && s.name.includes("アロマモア"));

if (aromamore) {
  console.log("🔍 アロマモアの登録データ:");
  console.log("---------------------------------------------------");
  console.log(`🏠 都道府県 (prefecture): ${aromamore.prefecture}`);
  console.log(`📍 市区町村 (city)      : ${aromamore.city}`);
  console.log(`🏷️ 詳細エリア (area)    : ${aromamore.area}`);
  console.log("---------------------------------------------------");
  
  if (aromamore.city === "港区") {
    console.log("✅ 判定: cityが「港区」なので、");
    console.log("   ・人気エリアの「六本木」ボタン（港区検索）");
    console.log("   ・東京都の「港区」ボタン");
    console.log("   の両方でヒットします。");
  } else {
    console.log(`⚠️ 判定: cityが「${aromamore.city}」なので、ボタンの設定とズレている可能性があります。`);
  }
} else {
  console.log("❌ アロマモアのデータが見つかりません。");
}
