const fs = require('fs');
const OUTPUT_LIST = 'src/data/all_shops.json';

const shops = JSON.parse(fs.readFileSync(OUTPUT_LIST, 'utf8'));
const tagCounts = {};

shops.forEach(shop => {
    if (shop.tags && Array.isArray(shop.tags)) {
        shop.tags.forEach(tag => {
            if (tag) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        });
    }
});

// 多い順に並べ替え
const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15); // トップ15を表示

console.log("\n🏆 実際にデータに含まれる人気タグ（これを使えば動きます）:");
sortedTags.forEach((item, index) => {
    console.log(`${index + 1}. "${item[0]}" (${item[1]}店舗)`);
});
