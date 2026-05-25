const fs = require('fs');

const path = 'src/data/all_shops.json';
if (!fs.existsSync(path)) {
  console.log("❌ ファイルが見つかりません");
  process.exit(1);
}

const shops = JSON.parse(fs.readFileSync(path, 'utf8'));

// 大阪のデータを抽出
const osakaShops = shops.filter(s => 
  (s.prefecture && s.prefecture.includes("大阪")) || 
  (s.city && s.city.includes("大阪"))
);

console.log(`🔍 大阪関連のデータ: ${osakaShops.length} 件`);
console.log("\n📊 住所(city) の内訳:");
console.log("---------------------------------------------------");

const cityCounts = {};
osakaShops.forEach(s => {
  const city = s.city || "（未設定）";
  cityCounts[city] = (cityCounts[city] || 0) + 1;
});

// 多い順に表示
Object.entries(cityCounts)
  .sort(([,a], [,b]) => b - a)
  .forEach(([city, count]) => {
    console.log(`   📍 "${city}": ${count} 件`);
  });

console.log("---------------------------------------------------");
console.log("💡 梅田ボタンの設定: 「北区」を探しています");
console.log("👉 もし上のリストに「北区」がなく、「梅田」や「大阪市北区」しかなければ、ボタンの設定を変える必要があります。");
