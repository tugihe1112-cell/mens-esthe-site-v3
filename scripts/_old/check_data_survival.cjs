const fs = require('fs');

const LIST_FILE = 'src/data/all_shops.json';
const DETAILS_FILE = 'src/data/brand_details.json';

console.log("🔍 データの生存確認を実行中...\n");

// 1. 検索用リスト (all_shops.json) の確認
if (fs.existsSync(LIST_FILE)) {
    const list = JSON.parse(fs.readFileSync(LIST_FILE, 'utf8'));
    // Lynx (データが多い店) をサンプルとして探す
    const target = list.find(s => s.name && (s.name.includes("Lynx") || s.name.includes("リンクス")));
    
    if (target) {
        console.log(`✅ [検索リスト] ${target.name}`);
        console.log(`   ID: ${target.id}`);
        console.log(`   BrandID: ${target.brandId}`);
        console.log(`   直下のセラピスト数: ${target.therapists ? target.therapists.length : "無し"}`);
    } else {
        console.log("❌ 検索リストにサンプル店舗が見つかりません。");
    }
} else {
    console.log(`❌ ファイルが見つかりません: ${LIST_FILE}`);
}

// 2. 詳細用データ (brand_details.json) の確認
if (fs.existsSync(DETAILS_FILE)) {
    const details = JSON.parse(fs.readFileSync(DETAILS_FILE, 'utf8'));
    // Lynx のブランドデータを探す
    const brandKey = Object.keys(details).find(k => details[k].name && (details[k].name.includes("Lynx") || details[k].name.includes("リンクス")));
    
    if (brandKey) {
        const brand = details[brandKey];
        console.log(`\n✅ [詳細データ] ${brand.name}`);
        console.log(`   ID: ${brand.id}`);
        console.log(`   統合されたセラピスト数: ${brand.therapists ? brand.therapists.length : "無し"}`);
    } else {
        console.log("\n❌ 詳細データにサンプル店舗が見つかりません。");
    }
} else {
    console.log(`❌ ファイルが見つかりません: ${DETAILS_FILE}`);
}
