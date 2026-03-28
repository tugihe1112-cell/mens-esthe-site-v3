const fs = require('fs');

console.log("\n🔍 現状確認スタート");
console.log("===================================");

// 1. 店舗数ランキングTOP5 (注目のエリアに表示されるはずのやつ)
try {
  const shops = JSON.parse(fs.readFileSync('src/data/shops.json', 'utf8'));
  const counts = {};
  shops.forEach(s => {
    const key = s.city || s.area; // city優先、なければarea
    if(key) counts[key] = (counts[key] || 0) + 1;
  });

  const ranking = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  console.log("\n📊 【データ上の人気エリア TOP5】");
  console.log("   (これがトップページの画像エリアに出るはず)");
  ranking.forEach(([name, count], i) => {
    console.log(`   ${i+1}位: ${name} (${count}店舗)`);
  });

} catch (e) {
  console.log("   ❌ shops.json 読み込みエラー");
}

// 2. エリア階層構造 (東京都の下がどうなっているか)
try {
  const locationsContent = fs.readFileSync('src/data/locations.js', 'utf8');
  
  console.log("\n🗺️ 【エリア階層データの確認 (src/data/locations.js)】");
  
  // WARDS = { ... } の中身を簡易チェック
  if (locationsContent.includes('"新宿区": [')) {
    console.log("   ✅ '新宿区' の定義が見つかりました (配列形式)");
    // 新宿区の中身を少し抽出して表示
    const match = locationsContent.match(/"新宿区":\s*\[(.*?)\]/s);
    if (match) {
      console.log(`      中身: [${match[1].replace(/\s/g, '').slice(0, 40)}...]`);
    }
  } else {
    console.log("   ⚠️ '新宿区' の定義が見つかりません或是いは形式が違います");
  }

  // PREF_CITY_MAP["東京都"] の確認
  if (locationsContent.includes('PREF_CITY_MAP["東京都"] = [')) {
    console.log("   ✅ '東京都' の市区町村リスト定義が見つかりました");
  } else {
    console.log("   ⚠️ '東京都' の定義が見つかりません (ここが原因でごちゃ混ぜになる可能性あり)");
  }

} catch (e) {
  console.log("   ❌ locations.js 読み込みエラー");
}

// 3. ルーティング確認
try {
  const appContent = fs.readFileSync('src/App.jsx', 'utf8');
  console.log("\n🔗 【リンク先の確認 (src/App.jsx)】");
  if (appContent.includes('path="/shops"')) {
    console.log("   ✅ path=\"/shops\" (店舗一覧ページ) のルートが存在します");
  } else {
    console.log("   ❌ path=\"/shops\" が見つかりません (404の原因)");
  }
} catch (e) {
  console.log("   ❌ App.jsx 読み込みエラー");
}

console.log("\n===================================");
