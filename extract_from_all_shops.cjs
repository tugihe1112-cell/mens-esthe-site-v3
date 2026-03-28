const fs = require('fs');
const allShops = require('./public/data/all_shops.json');
const currentTherapists = require('./public/data/therapists.json');
const currentShops = require('./public/data/shops.json');

// all_shops.jsonからtherapistsを抽出
const therapistsInAllShops = [];
const shopsWithTherapists = allShops.filter(s => s.therapists && s.therapists.length > 0);

console.log('=== all_shops.json内のセラピスト ===');
console.log(`therapistsがある店舗: ${shopsWithTherapists.length}件`);

shopsWithTherapists.forEach(shop => {
  console.log(`\n${shop.id}: ${shop.name}`);
  console.log(`  セラピスト: ${shop.therapists.length}人`);
  therapistsInAllShops.push(...shop.therapists);
});

console.log(`\n合計: ${therapistsInAllShops.length}人`);

// 現在のtherapists.jsonにあるか確認
const currentIds = new Set(currentTherapists.map(t => t.id));
const missingInCurrent = therapistsInAllShops.filter(t => !currentIds.has(t.id));

console.log(`\n現在のtherapists.jsonに無い: ${missingInCurrent.length}人`);

if (missingInCurrent.length > 0) {
  console.log('サンプル (最初の5人):');
  missingInCurrent.slice(0, 5).forEach(t => {
    console.log(`  - ${t.name} (${t.shop_id || t.shopId})`);
  });
}

// これらのshop_idが0人店舗リストにあるか
const currentTherapistShopIds = new Set();
currentTherapists.forEach(t => currentTherapistShopIds.add(t.shop_id || t.shopId));

const zeroShopIds = new Set(
  currentShops.filter(s => !currentTherapistShopIds.has(s.id)).map(s => s.id)
);

const allShopsWithData = shopsWithTherapists.map(s => s.id);
const matchingZeroShops = allShopsWithData.filter(id => zeroShopIds.has(id));

console.log(`\nall_shops.jsonのデータが0人店舗と一致: ${matchingZeroShops.length}件`);
if (matchingZeroShops.length > 0) {
  console.log('一致する店舗:');
  matchingZeroShops.forEach(id => {
    const shop = allShops.find(s => s.id === id);
    console.log(`  - ${id}: ${shop.therapists.length}人`);
  });
}
