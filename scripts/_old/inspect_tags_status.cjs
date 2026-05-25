const fs = require('fs');
const OUTPUT_LIST = 'src/data/all_shops.json';

console.log("🔍 タグデータの格納状況を検査します...\n");

if (!fs.existsSync(OUTPUT_LIST)) {
    console.error("❌ src/data/all_shops.json が見つかりません。先にビルドしてください。");
    process.exit(1);
}

const shops = JSON.parse(fs.readFileSync(OUTPUT_LIST, 'utf8'));
console.log(`📦 全店舗数: ${shops.length} 件`);

// 1. タグを持っている店舗の数をカウント
let hasTagsCount = 0;
let noTagsCount = 0;
let totalTags = 0;
const tagFrequency = {};

shops.forEach(shop => {
    if (shop.tags && Array.isArray(shop.tags) && shop.tags.length > 0) {
        hasTagsCount++;
        totalTags += shop.tags.length;
        
        // どんなタグがあるか集計
        shop.tags.forEach(tag => {
            tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
    } else {
        noTagsCount++;
    }
});

console.log(`\n📊 集計結果:`);
console.log(`   ✅ タグあり店舗: ${hasTagsCount} 件`);
console.log(`   ❌ タグなし店舗: ${noTagsCount} 件`);

// 2. 実際のデータの中身を確認（最初の3件）
console.log(`\n🧐 データの中身確認 (最初の3件):`);
shops.slice(0, 3).forEach(shop => {
    console.log(`   [${shop.name}]`);
    console.log(`   Tags: ${JSON.stringify(shop.tags)}`);
    console.log("-------------------");
});

// 3. 画面に出ていた「新人」「美人」などがデータに含まれているか確認
const targetTags = ["新人", "美人", "巨乳", "落ち着く", "手つきが柔らかい"];
console.log(`\n🎯 画面に表示されているタグのデータ存在確認:`);
targetTags.forEach(t => {
    const count = tagFrequency[t] || 0;
    console.log(`   "${t}": ${count} 店舗が保持`);
});

