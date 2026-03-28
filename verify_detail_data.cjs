const fs = require('fs');
const shops = JSON.parse(fs.readFileSync('src/data/all_shops.json', 'utf8'));

console.log("🔍 店舗詳細ページ構築のためのデータ充実度調査\n");

let hasUrl = 0;
let hasPhone = 0; // 電話番号データがあるか？
let hasImage = 0;
let hasTherapists = 0;
let therapistCountTotal = 0;

shops.forEach(s => {
    if (s.url && s.url.startsWith('http')) hasUrl++;
    // 電話番号フィールドの有無を確認（データ構造によるが一般的に tel or telephone）
    if (s.tel || s.telephone || s.phone) hasPhone++; 
    if (s.mainImage) hasImage++;
    
    if (s.therapists && Array.isArray(s.therapists) && s.therapists.length > 0) {
        hasTherapists++;
        therapistCountTotal += s.therapists.length;
    }
});

const total = shops.length;

console.log(`📊 全店舗数: ${total}件`);
console.log("---------------------------------------------------");
console.log(`🌐 公式サイトURLあり: ${hasUrl}件 (${Math.round(hasUrl/total*100)}%)`);
console.log(`📞 電話番号データあり: ${hasPhone}件 (${Math.round(hasPhone/total*100)}%)`);
console.log(`🖼  メイン画像あり:     ${hasImage}件 (${Math.round(hasImage/total*100)}%)`);
console.log(`👩 セラピスト情報あり: ${hasTherapists}件 (${Math.round(hasTherapists/total*100)}%)`);
console.log(`   (総セラピスト数: ${therapistCountTotal}名)`);
console.log("---------------------------------------------------");

if (hasPhone === 0) {
    console.log("💡 結論: 電話番号データがないため、「電話予約ボタン」の実装は時期尚早です。");
}
if (hasUrl > 0) {
    console.log("💡 結論: 公式サイトへのリンクは実装可能です。");
}
