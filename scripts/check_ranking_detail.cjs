const fs = require('fs');

try {
  const shops = JSON.parse(fs.readFileSync('src/data/shops.json', 'utf8'));
  console.log("\n📊 【新・人気エリアランキング TOP10】(詳細エリア優先)");
  console.log("===================================");

  const counts = {};
  let noAreaCount = 0;

  shops.forEach(s => {
    // 修正後のロジックと同じ: areaがあればarea、なければcity
    const key = s.area || s.city;
    
    if (key && key !== "エリア指定なし" && key !== "指定なし") {
      counts[key] = (counts[key] || 0) + 1;
    } else {
      noAreaCount++;
    }
  });

  // 多い順にソート
  const ranking = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  ranking.forEach(([name, count], i) => {
    // トップページで使われる画像キーの候補も表示
    console.log(`   ${i+1}位: ${name.padEnd(10, '　')} (${count}店舗)`);
  });
  
  console.log("\n   (エリア情報なしでスキップされた店舗: " + noAreaCount + "件)");
  console.log("===================================");

} catch (e) {
  console.log("エラー: " + e.message);
}
