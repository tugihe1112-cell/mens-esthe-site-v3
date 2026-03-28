const fs = require('fs');

// データファイルを探す
const paths = ['src/data/all_shops.json', 'src/data/shops.json', 'public/data/shops.json'];
let targetPath = '';
let shops = [];

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

console.log(`📂 検査対象ファイル: ${targetPath}`);
console.log(`📊 全店舗数: ${shops.length}件\n`);

// 英字が含まれるデータを検出する正規表現
const pattern = /[a-zA-Z]/;

const dirtyAreas = new Set();
const dirtyCities = new Set();

shops.forEach(shop => {
  // areaのチェック
  if (shop.area) {
    if (Array.isArray(shop.area)) {
      shop.area.forEach(a => {
        if (a && pattern.test(a)) dirtyAreas.add(a);
      });
    } else {
      if (pattern.test(shop.area)) dirtyAreas.add(shop.area);
    }
  }

  // cityのチェック
  if (shop.city && pattern.test(shop.city)) {
    dirtyCities.add(shop.city);
  }
});

console.log("====== ⚠️ 修正が必要なエリア名 (英字が含まれるもの) ======");
if (dirtyAreas.size === 0) {
  console.log("  (なし - 全て日本語です)");
} else {
  Array.from(dirtyAreas).sort().forEach(val => {
    console.log(`  - "${val}"`);
  });
}

console.log("\n====== ⚠️ 修正が必要な都市名 (city) ======");
if (dirtyCities.size === 0) {
  console.log("  (なし - 全て日本語です)");
} else {
  Array.from(dirtyCities).sort().forEach(val => {
    console.log(`  - "${val}"`);
  });
}
console.log("\n========================================================");
