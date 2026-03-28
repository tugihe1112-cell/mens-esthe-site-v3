const fs = require('fs');

// データファイルを探して読み込む
const paths = ['src/data/all_shops.json', 'src/data/shops.json', 'public/data/shops.json'];
let shops = [];
let loadedPath = "";

for (const p of paths) {
  if (fs.existsSync(p)) {
    try {
      shops = JSON.parse(fs.readFileSync(p, 'utf8'));
      loadedPath = p;
      break;
    } catch(e) {}
  }
}

if (!shops.length) {
  console.log("❌ データが見つかりませんでした。");
  process.exit(1);
}

console.log(`📂 調査対象: ${loadedPath}\n`);

// 「六本木」タグを持つ、またはcityが六本木の店舗を抽出
const roppongiShops = shops.filter(s => {
  const area = Array.isArray(s.area) ? s.area.join(",") : (s.area || "");
  return area.includes("六本木") || s.city === "六本木" || s.city.includes("六本木");
});

console.log(`🔍 「六本木」のデータを持つ店舗: ${roppongiShops.length}件`);

// 市区町村ごとの分布を集計
const cityDistribution = {};
roppongiShops.forEach(s => {
  const key = `${s.prefecture} ${s.city}`;
  if (!cityDistribution[key]) cityDistribution[key] = [];
  cityDistribution[key].push(s.name);
});

console.log("\n📊 六本木データの所属場所（city）:");
Object.keys(cityDistribution).forEach(key => {
  console.log(`\n📍 [${key}] に所属: ${cityDistribution[key].length}件`);
  console.log(`   店舗例: ${cityDistribution[key].slice(0, 3).join(", ")}...`);
});

// 異常チェック
const suspicious = roppongiShops.filter(s => s.city !== "港区");
if (suspicious.length > 0) {
  console.log(`\n⚠️ 【原因判明】港区以外（${suspicious.map(s=>s.city).join(', ')}）に「六本木」のデータが混ざっています！`);
  console.log("これが原因で、他のエリアを選択しても六本木が出てきてしまっています。");
} else {
  console.log(`\n✅ データ上の所属は全て「港区」で正しいようです。`);
  console.log("画面の表示設定（グループ分け）の方を確認する必要があります。");
}
