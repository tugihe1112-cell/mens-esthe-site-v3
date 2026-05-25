const fs = require('fs');

const paths = ['src/data/all_shops.json', 'src/data/shops.json', 'public/data/shops.json'];
let shops = [];
for (const p of paths) {
  if (fs.existsSync(p)) {
    try {
      shops = JSON.parse(fs.readFileSync(p, 'utf8'));
      break;
    } catch(e) {}
  }
}

console.log("🔍 大阪エリアのデータ登録状況を調査します...\n");

// 大阪、または「梅田」「北区」に関連する店舗を抽出
const targets = shops.filter(s => 
  (s.prefecture && s.prefecture.includes("大阪")) ||
  (s.city && (s.city.includes("大阪") || s.city.includes("梅田") || s.city.includes("北区"))) ||
  (s.area && Array.isArray(s.area) && s.area.some(a => a.includes("梅田")))
);

if (targets.length === 0) {
  console.log("❌ 大阪関連のデータが1件も見つかりません。データ自体が存在しない可能性があります。");
} else {
  console.log(`ヒットした店舗数: ${targets.length}件\n`);
  
  // 市区町村ごとの件数を集計
  const counts = {};
  targets.forEach(s => {
    const key = `[県:${s.prefecture || "なし"}] [市:${s.city || "なし"}]`;
    counts[key] = (counts[key] || 0) + 1;
  });

  Object.keys(counts).forEach(key => {
    console.log(`${key}: ${counts[key]}件`);
    // サンプル店舗を表示
    const example = targets.find(s => `[県:${s.prefecture || "なし"}] [市:${s.city || "なし"}]` === key);
    console.log(`   例: ${example.name} (area: ${Array.isArray(example.area) ? example.area.join(',') : example.area})`);
  });
}
