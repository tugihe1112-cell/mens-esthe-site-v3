const fs = require('fs');
const path = require('path');

// 1. データ収集元のフォルダ
const SOURCE_DIR = 'public/data';
// 2. 出力先のファイル
const OUTPUT_FILE = 'src/data/all_shops.json';
const OUTPUT_INDEX = 'src/data/index.js';

let allShops = [];

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          allShops.push(...data);
        } else {
          allShops.push(data);
        }
      } catch (e) {
        // console.error(`Skipped: ${fullPath}`);
      }
    }
  }
}

console.log(`📦 全国データの統合を開始します...`);
walkDir(SOURCE_DIR);

console.log(`📊 収集された店舗数: ${allShops.length}件`);

// IDの重複排除
const uniqueShops = [];
const seenIds = new Set();
allShops.forEach(shop => {
  if (!shop.id) shop.id = Math.floor(Math.random() * 9999999);
  const idKey = String(shop.id);
  if (!seenIds.has(idKey)) {
    seenIds.add(idKey);
    uniqueShops.push(shop);
  }
});

console.log(`💾 ${OUTPUT_FILE} に保存中...`);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueShops, null, 2));

// アプリが新しいデータを読むように設定
const indexContent = `import allShops from './all_shops.json';
export { allShops };
`;
fs.writeFileSync(OUTPUT_INDEX, indexContent);

console.log("🎉 完了！データが正しく統合されました。");
