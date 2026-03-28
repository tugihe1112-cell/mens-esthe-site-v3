const fs = require('fs');
const path = require('path');

const DATA_DIR = 'public/data';
let emptyShops = [];
let totalShops = 0;

console.log("🔍 全店舗データの健全性チェックを開始します...\n");

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
        // 配列なら先頭要素、オブジェクトならそのまま
        const shop = Array.isArray(data) ? data[0] : data;
        
        if (shop.name) {
            totalShops++;
            // 判定: セラピスト配列もスレッド配列も空っぽか？
            const hasTherapists = shop.therapists && Array.isArray(shop.therapists) && shop.therapists.length > 0;
            const hasThreads = shop.threads && Array.isArray(shop.threads) && shop.threads.length > 0;
            const hasSingleThread = shop.thread && typeof shop.thread === 'object' && Object.keys(shop.thread).length > 0;

            if (!hasTherapists && !hasThreads && !hasSingleThread) {
                emptyShops.push({
                    name: shop.name,
                    path: fullPath
                });
            }
        }
      } catch (e) {
        // JSONエラー等は無視
      }
    }
  });
}

// 実行
if (fs.existsSync(DATA_DIR)) {
    scan(DATA_DIR);
} else {
    console.error(`❌ ディレクトリが見つかりません: ${DATA_DIR}`);
    process.exit(1);
}

// 結果出力
console.log(`📊 調査結果`);
console.log(`================================================`);
console.log(`📦 全店舗数: ${totalShops} 店舗`);
console.log(`⚠️ データ欠損(0人): ${emptyShops.length} 店舗`);
if (totalShops > 0) {
    console.log(`   (欠損率: ${Math.round((emptyShops.length / totalShops) * 100)}%)`);
}
console.log(`================================================`);

if (emptyShops.length > 0) {
    console.log(`\n📋 0人の店舗リスト (抜粋20件):`);
    emptyShops.slice(0, 20).forEach(s => console.log(` - ${s.name}`));
    
    if (emptyShops.length > 20) {
        console.log(`\n ... 他 ${emptyShops.length - 20} 店舗`);
    }
} else {
    console.log("\n✨ おめでとうございます！データ欠損店舗は0です！");
}
