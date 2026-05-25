const fs = require('fs');

// データファイルを探す
const paths = ['src/data/all_shops.json', 'src/data/shops.json', 'public/data/shops.json'];
let shops = [];
for (const p of paths) {
  if (fs.existsSync(p)) {
    try {
      shops = JSON.parse(fs.readFileSync(p, 'utf8'));
      console.log(`📂 データ読み込み成功: ${p}`);
      break;
    } catch(e) {}
  }
}

if (!shops.length) {
  console.log("❌ データが見つかりませんでした。");
  process.exit(1);
}

// 1. 都道府県データの揺れをチェック
const prefCounts = {};
shops.forEach(s => {
  const p = s.prefecture || "不明";
  prefCounts[p] = (prefCounts[p] || 0) + 1;
});

console.log("\n====== 都道府県データの内訳 ======");
Object.keys(prefCounts).forEach(p => {
  console.log(`・${p}: ${prefCounts[p]}件`);
});

// 2. 大阪と神奈川の市町村(city)データをチェック
["大阪府", "神奈川県"].forEach(targetPref => {
  console.log(`\n====== ${targetPref} の詳細エリアデータ ======`);
  
  // その県のデータを抽出
  const targets = shops.filter(s => s.prefecture === targetPref);
  
  if (targets.length === 0) {
    console.log("  (データなし - 都道府県名が一致していない可能性があります)");
  } else {
    // cityのバリエーションを見る
    const cities = new Set();
    targets.forEach(s => {
      if (s.city) cities.add(s.city);
      if (s.area && !Array.isArray(s.area)) cities.add(s.area); // areaも参考にする
    });
    
    const cityList = Array.from(cities).filter(Boolean);
    if (cityList.length === 0) {
      console.log("  ⚠️ データ件数はありますが、'city' や 'area' が空です。");
    } else {
      console.log("  検出されたエリア名:", cityList.join(", "));
    }
  }
});
console.log("\n==================================");
