const fs = require('fs');
const path = require('path');

const DATA_DIR = 'public/data';
const OUTPUT_FILE = 'src/data/all_shops.json';

console.log("🔄 all_shops.json を正規化済みデータで再構築します...");

const allShops = [];

function scan(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(content);
        const shop = Array.isArray(data) ? data[0] : data;
        allShops.push(shop);
      } catch (e) {}
    }
  });
}

scan(DATA_DIR);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allShops, null, 2));
console.log(`✅ 再構築完了: ${allShops.length} 件のデータを保存しました。`);
