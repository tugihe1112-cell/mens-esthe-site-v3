const fs = require('fs');

// データファイルを探す
const paths = ['src/data/all_shops.json', 'src/data/shops.json', 'public/data/shops.json', 'src/data/index.js'];
let shops = [];

// JSONファイルを優先して読み込む
for (const p of paths) {
  if (fs.existsSync(p) && p.endsWith('.json')) {
    try {
      shops = JSON.parse(fs.readFileSync(p, 'utf8'));
      console.log(`📂 データソース: ${p}`);
      break;
    } catch(e) {}
  }
}

// データが見つからない場合、index.jsは構造が違うので簡易解析はスキップ
if (!shops.length) {
  console.log("⚠️ JSONデータが見つかりませんでした。調査を続行できません。");
  process.exit(1);
}

// 渋谷区のデータを抽出
const targets = shops.filter(s => 
  s.prefecture === "東京都" && 
  (s.city === "渋谷区" || (s.area && s.area.includes("渋谷")))
);

console.log(`\n📊 東京都 渋谷区の店舗数: ${targets.length}件`);

if (targets.length === 0) {
  console.log("  (データが見つかりませんでした)");
} else {
  // areaの内訳を集計
  const areaCounts = {};
  targets.forEach(s => {
    let areas = [];
    if (Array.isArray(s.area)) {
      areas = s.area;
    } else if (s.area) {
      areas = [s.area];
    }

    areas.forEach(a => {
      areaCounts[a] = (areaCounts[a] || 0) + 1;
    });
  });

  console.log("\n====== 詳細エリア(area)の内訳 ======");
  const sortedAreas = Object.keys(areaCounts).sort((a, b) => areaCounts[b] - areaCounts[a]);
  
  if (sortedAreas.length === 0) {
    console.log("  ⚠️ 'area' データが空です。これでは絞り込みができません。");
  } else {
    sortedAreas.forEach(a => {
      console.log(`  - ${a}: ${areaCounts[a]}件`);
    });
    console.log("\n✅ 結論:");
    if (sortedAreas.length > 1) {
      console.log("  データには詳細エリア（恵比寿、道玄坂など）が含まれています。");
      console.log("  → 原因は「トップページの検索機能がこれを表示していないこと」です。");
    } else {
      console.log("  データが「渋谷区」一色になっています。データの細分化が必要です。");
    }
  }
}
