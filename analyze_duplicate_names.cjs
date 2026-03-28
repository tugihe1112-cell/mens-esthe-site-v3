const fs = require('fs');
const path = require('path');

const DATA_DIR = 'public/data';
const nameMap = {}; // { "店舗名": [file_path1, file_path2, ...] }

console.log("🔍 全店舗の重複状況（同名店舗）を調査中...\n");

function scan(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(content);
        const shop = Array.isArray(data) ? data[0] : data;

        if (shop.name) {
          // 名前でグルーピング
          if (!nameMap[shop.name]) {
            nameMap[shop.name] = [];
          }
          nameMap[shop.name].push({
            path: fullPath,
            id: shop.id,
            area: `${shop.prefecture || ''} ${shop.city || ''}`
          });
        }
      } catch (e) {
        // ignore error
      }
    }
  });
}

scan(DATA_DIR);

// 結果の集計と表示
const duplicates = Object.keys(nameMap).filter(name => nameMap[name].length > 1);

console.log(`📊 調査結果: 全 ${Object.keys(nameMap).length} ブランド中`);
console.log(`⚠️  複数箇所にファイルがあるブランド: ${duplicates.length} 件\n`);

console.log("--- [重複内訳] ---");
duplicates.forEach(name => {
  console.log(`\n🏢 ${name} (${nameMap[name].length}ファイル)`);
  nameMap[name].forEach(item => {
    console.log(`    - 場所: ${item.area.padEnd(10)} | ID: ${item.id} | Path: ${item.path}`);
  });
});

console.log("\n---------------------------------------------------");
console.log("これらの店舗を『1つの代表ファイル』に統合して良いか判断してください。");
