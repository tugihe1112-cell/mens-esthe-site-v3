const fs = require('fs');
const OUTPUT_LIST = 'src/data/all_shops.json';

console.log("🔍 タグ検索の機能性診断（データ検証）...\n");

if (!fs.existsSync(OUTPUT_LIST)) {
    console.error("❌ データファイルが見つかりません。");
    process.exit(1);
}

const shops = JSON.parse(fs.readFileSync(OUTPUT_LIST, 'utf8'));
const checkTags = ["完全個室", "深夜営業", "カード払いOK", "高級店"];

console.log(`�� 全店舗数: ${shops.length}件`);
console.log("---------------------------------------------------");

checkTags.forEach(tag => {
    // 部分一致ではなく「完全一致」で持っているか確認
    const hits = shops.filter(shop => 
        shop.tags && Array.isArray(shop.tags) && shop.tags.includes(tag)
    );
    
    console.log(`🏷️  タグ "${tag}":`);
    console.log(`    ヒット数: ${hits.length} 件`);
    if (hits.length > 0) {
        console.log(`    例: ${hits[0].name} (ID: ${hits[0].id})`);
    } else {
        console.log(`    ❌ データ内に存在しません（検索してもヒットしません）`);
    }
    console.log("---------------------------------------------------");
});
