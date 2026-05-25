const fs = require('fs');
const OUTPUT_LIST = 'src/data/all_shops.json';

console.log("🔍 エリアデータの階層ズレ診断を実行中...\n");

const shops = JSON.parse(fs.readFileSync(OUTPUT_LIST, 'utf8'));

// "板橋" または "itabashi" を含む店舗を探す
const targets = shops.filter(s => 
    (s.address && s.address.includes("板橋")) || 
    (s.name && s.name.includes("板橋")) ||
    (s._fileLocation && JSON.stringify(s._fileLocation).includes("板橋"))
);

if (targets.length === 0) {
    console.log("❌ 「板橋」に関する店舗が見つかりませんでした。");
} else {
    console.log(`⚠️ 「板橋」関連の店舗を ${targets.length} 件発見。データ構造を確認します:`);
    
    targets.slice(0, 3).forEach((shop, i) => {
        console.log(`\n--- [店舗 ${i+1}] ${shop.name} ---`);
        console.log("ID:", shop.id);
        console.log("📍 保存されている場所データ (_fileLocation):");
        console.log(JSON.stringify(shop._fileLocation, null, 2));
        
        console.log("\n💥 判定結果:");
        if (shop._fileLocation) {
            console.log(`   Prefecture (県): "${shop._fileLocation.prefecture}"`);
            console.log(`   City (市):       "${shop._fileLocation.city}"`);
            console.log(`   Area (エリア):   "${shop._fileLocation.area}"`);
            
            if (shop._fileLocation.prefecture !== "東京都") {
                 console.log("   ❌ エラー: 都道府県が「東京都」になっていません！検索でヒットしません。");
            } else {
                 console.log("   ✅ 都道府県は正常です。");
            }
        } else {
            console.log("   ❌ _fileLocation が存在しません。");
        }
    });
}
