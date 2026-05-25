const fs = require('fs');

// データファイルを探す
const paths = ['src/data/all_shops.json', 'src/data/shops.json', 'public/data/shops.json'];
let shops = [];
let targetPath = '';

for (const p of paths) {
  if (fs.existsSync(p)) {
    try {
      shops = JSON.parse(fs.readFileSync(p, 'utf8'));
      targetPath = p;
      break;
    } catch(e) {}
  }
}

if (!shops.length) {
  console.log("❌ データが見つかりませんでした。");
  process.exit(1);
}

console.log(`📂 検査ファイル: ${targetPath}\n`);

// 検査対象の県
const TARGET_PREFS = ["大阪府", "千葉県", "京都府", "兵庫県"];

TARGET_PREFS.forEach(pref => {
  console.log(`=== ${pref} のエリアデータ実態 ===`);
  const prefShops = shops.filter(s => s.prefecture === pref);
  
  const values = new Set();
  const dirtyValues = new Set();
  const regex = /[a-zA-Z]/; // 英字が含まれるか

  prefShops.forEach(s => {
    // cityのチェック
    if (s.city) {
      values.add(s.city);
      if (regex.test(s.city)) dirtyValues.add(s.city);
    }
    // areaのチェック
    if (s.area) {
      if (Array.isArray(s.area)) {
        s.area.forEach(a => {
          values.add(a);
          if (regex.test(a)) dirtyValues.add(a);
        });
      } else {
        values.add(s.area);
        if (regex.test(s.area)) dirtyValues.add(s.area);
      }
    }
  });

  if (dirtyValues.size > 0) {
    console.log(`⚠️ 横文字(英字)データ検出: ${dirtyValues.size}件`);
    Array.from(dirtyValues).sort().forEach(v => console.log(`  - "${v}"`));
  } else {
    console.log("✅ きれいな状態です（英字なし）");
  }
  console.log("");
});
