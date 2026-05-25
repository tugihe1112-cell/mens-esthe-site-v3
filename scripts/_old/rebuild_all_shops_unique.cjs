const fs = require('fs');
const path = require('path');

const DATA_DIR = 'public/data';
const OUTPUT_FILE = 'src/data/all_shops.json';

console.log("🔄 all_shops.json を再構築します（重複排除機能付き）...");

const allShops = [];
const seenIds = new Set(); // 重複チェック用
let duplicates = 0;

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
        
        // IDがない場合はファイル名をIDとする（念のため）
        if (!shop.id) shop.id = path.basename(file, '.json');

        // 重複チェック
        if (seenIds.has(shop.id)) {
          duplicates++;
          // console.log(`   ⚠️ 重複スキップ: ${shop.name} (ID: ${shop.id})`);
        } else {
          seenIds.add(shop.id);
          allShops.push(shop);
        }
      } catch (e) {
        console.error(`読込エラー: ${file}`);
      }
    }
  });
}

scan(DATA_DIR);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allShops, null, 2));
console.log(`\n✅ 再構築完了！`);
console.log(`   - 登録店舗数: ${allShops.length} 件`);
console.log(`   - 除外した重複: ${duplicates} 件`);
