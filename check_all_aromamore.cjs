const fs = require('fs');
const path = 'src/data/all_shops.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// オブジェクト形式に対応して全データを配列化
const shops = Array.isArray(data) ? data : Object.values(data);

// 「アロマモア」を含む全ての店舗を抽出
const targets = shops.filter(s => s.name && s.name.includes("アロマモア"));

console.log(`🔍 アロマモアの検索結果: ${targets.length} 件見つかりました\n`);

if (targets.length > 0) {
  targets.forEach((shop, index) => {
    console.log(`[${index + 1}] 店舗名: ${shop.name}`);
    console.log(`    ID    : ${shop.id}`);
    console.log(`    住所  : ${shop.prefecture} ${shop.city} ${shop.area || ""}`);
    console.log("---------------------------------------------------");
  });
} else {
  console.log("❌ データ上に1件も見つかりません。");
}
