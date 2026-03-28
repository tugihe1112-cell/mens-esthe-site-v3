const fs = require('fs');
const shops = JSON.parse(fs.readFileSync('src/data/all_shops.json', 'utf8'));

console.log("🔍 Home画面改修のためのデータ実態調査\n");

// 1. 口コミ数 (NaN+) の原因調査
let validReviews = 0;
let stringReviews = 0;
let nanReviews = 0;
let nullReviews = 0;
let sampleInvalid = null;

shops.forEach(s => {
    if (typeof s.reviewCount === 'number') {
        validReviews++;
    } else if (typeof s.reviewCount === 'string') {
        const parsed = parseInt(s.reviewCount, 10);
        if (!isNaN(parsed)) {
            stringReviews++;
        } else {
            nanReviews++;
            if (!sampleInvalid) sampleInvalid = s;
        }
    } else {
        nullReviews++; // undefined or null
    }
});

console.log("📊 1. 口コミ数データ (reviewCount) の状態");
console.log(`   ✅ 数値型 (Number): ${validReviews} 件`);
console.log(`   ⚠️ 文字列型 (String -> Number可): ${stringReviews} 件`);
console.log(`   ❌ 文字列型 (変換不可/NaN): ${nanReviews} 件`);
console.log(`   ❌ 未定義/Null: ${nullReviews} 件`);
if (sampleInvalid) {
    console.log(`   📝 不正データの例 (ID: ${sampleInvalid.id}): reviewCount = "${sampleInvalid.reviewCount}"`);
}
console.log("");

// 2. ショートカット用：店舗数が多い都道府県トップ5
const prefCounts = {};
shops.forEach(s => {
    // 憲法に基づき、表示用データ _fileLocation を参照
    const pref = s._fileLocation?.prefecture || "不明";
    // "不明" や "data" が混入していないかもチェック
    prefCounts[pref] = (prefCounts[pref] || 0) + 1;
});

const topPrefs = Object.entries(prefCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6); // 上位6つを表示

console.log("📊 2. 店舗数が多い都道府県 (ショートカット候補)");
topPrefs.forEach(([pref, count], idx) => {
    console.log(`   ${idx + 1}. ${pref}: ${count} 店舗`);
});

