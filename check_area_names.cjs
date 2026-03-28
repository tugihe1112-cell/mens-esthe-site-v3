const fs = require('fs');

// データファイルの場所候補
const paths = [
  'public/data/shops.json',
  'src/data/shops.json',
  'src/data/all_shops.json'
];

let shops = [];
let foundPath = '';

for (const p of paths) {
  if (fs.existsSync(p)) {
    try {
      shops = JSON.parse(fs.readFileSync(p, 'utf8'));
      foundPath = p;
      break;
    } catch (e) {
      console.log(`Error reading ${p}: ${e.message}`);
    }
  }
}

if (!shops.length) {
  console.log("❌ データファイル(shops.json等)が見つかりませんでした。");
  process.exit(1);
}

console.log(`\n📂 読み込んだファイル: ${foundPath} (全${shops.length}店舗)`);

// 分析する都道府県
const targets = ["神奈川県", "大阪府"];

targets.forEach(pref => {
  console.log(`\n====== ${pref} のエリアデータ実態 ======`);
  
  // その都道府県の店舗を抽出
  const prefShops = shops.filter(s => s.prefecture === pref);
  
  // cityごとの件数を集計
  const cityCounts = {};
  prefShops.forEach(s => {
    // cityがない場合は area を見る、それもなければ "不明"
    const key = s.city || s.area || "不明";
    cityCounts[key] = (cityCounts[key] || 0) + 1;
  });

  // 多い順にソートして表示
  const sorted = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
  
  if (sorted.length === 0) {
    console.log("  (データなし)");
  } else {
    sorted.forEach(([name, count]) => {
      // 見やすく整形
      console.log(`  - ${name.padEnd(10, ' ')} : ${count}件`);
    });
  }
});
console.log("\n==========================================");
