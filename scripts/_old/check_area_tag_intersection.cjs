const fs = require('fs');
const shops = JSON.parse(fs.readFileSync('src/data/all_shops.json', 'utf8'));

// 調査したいエリアとタグの組み合わせ
const targetAreas = ["新宿区", "港区", "名古屋市", "大阪市北区"]; // 梅田は大阪市北区
const targetTags = ["完全個室", "深夜営業", "カード払いOK"];

console.log("🔍 エリア × タグ の掛け合わせデータ調査\n");

targetAreas.forEach(area => {
    // 1. まずそのエリアの店舗を抽出
    const areaShops = shops.filter(s => s.city === area || (s.area && s.area.includes(area)));
    console.log(`📍 【${area}】の全店舗数: ${areaShops.length} 件`);

    if (areaShops.length === 0) {
        console.log("   (店舗データがありません)");
    } else {
        // 2. その中で各タグを持っている店が何件あるか
        targetTags.forEach(tag => {
            const hitCount = areaShops.filter(s => s.tags && s.tags.includes(tag)).length;
            const percentage = Math.round((hitCount / areaShops.length) * 100);
            
            // 棒グラフ風表示
            const bar = "■".repeat(Math.floor(percentage / 10));
            console.log(`   └ 🏷️ ${tag}: ${hitCount} 件 (${percentage}%) ${bar}`);
        });
    }
    console.log("");
});
