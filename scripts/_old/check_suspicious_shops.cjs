const fs = require('fs');
const shops = require('./src/data/all_shops.json');

console.log(`🔍 全 ${shops.length} 店舗のデータを検査します...\n`);

// 1. ID重複チェック
const idMap = new Map();
const duplicateIds = [];
shops.forEach(s => {
  if (idMap.has(s.id)) duplicateIds.push(s.id);
  idMap.set(s.id, true);
});

if (duplicateIds.length > 0) {
  console.log(`❌ [CRITICAL] ID重複が見つかりました (${duplicateIds.length}件):`);
  console.log(duplicateIds.slice(0, 5)); 
} else {
  console.log(`✅ ID重複なし: 全てユニークです。`);
}

// 2. コピペ店舗（住所重複）チェック
const brandMap = new Map();
shops.forEach(s => {
  if (!brandMap.has(s.brandId)) brandMap.set(s.brandId, []);
  brandMap.get(s.brandId).push(s);
});

console.log(`\n📋 ブランドごとの住所チェック (複数店舗あるブランドのみ):`);
let suspiciousCount = 0;

brandMap.forEach((list, brandId) => {
  if (list.length < 2) return; // 単独店舗はスキップ

  const addresses = list.map(s => s.address || "不明");
  const uniqueAddresses = new Set(addresses);
  const brandName = list[0].name;

  // 店舗数が複数あるのに、住所が1種類しかない（＝全部同じ住所）場合は警告
  if (uniqueAddresses.size === 1) {
    suspiciousCount++;
    console.log(`\n⚠️  [要確認] ${brandName} (${list.length}店舗)`);
    console.log(`    → 全店舗の住所が同じです: "${addresses[0]}"`);
    console.log(`    → エリア: ${list.map(s => s.area).join(', ')}`);
  }
});

console.log(`\n---------------------------------------------------`);
if (suspiciousCount === 0) {
  console.log(`✅ 住所の完全重複は見つかりませんでした。優秀です！`);
} else {
  console.log(`⚠️  合計 ${suspiciousCount} ブランドで「住所コピペ」の疑いがあります。`);
  console.log(`    (エリア名は前回のスクリプトで自動補正されていますが、詳細住所は元のままです)`);
}
