const { execSync } = require('child_process');
const fs = require('fs');

// 現在のデータ
const currentTherapists = require('./public/data/therapists.json');
const currentShops = require('./public/data/shops.json');

console.log('=== 現在 (HEAD) ===');
console.log(`Therapists: ${currentTherapists.length}人`);
console.log(`Shops: ${currentShops.length}店舗`);

const currentShopIds = new Set();
currentTherapists.forEach(t => currentShopIds.add(t.shop_id || t.shopId));
console.log(`セラピストがいる店舗ID: ${currentShopIds.size}件`);

// HEAD~1のデータを取得
try {
  const prevTherapistsJson = execSync('git show HEAD~1:public/data/therapists.json').toString();
  const prevTherapists = JSON.parse(prevTherapistsJson);
  
  console.log('\n=== HEAD~1 (1つ前のコミット) ===');
  console.log(`Therapists: ${prevTherapists.length}人`);
  
  const prevShopIds = new Set();
  prevTherapists.forEach(t => prevShopIds.add(t.shop_id || t.shopId));
  console.log(`セラピストがいる店舗ID: ${prevShopIds.size}件`);
  
  // HEAD~1にあって現在にないshop_id
  const lostShopIds = Array.from(prevShopIds).filter(id => !currentShopIds.has(id));
  console.log(`\n消えた店舗ID: ${lostShopIds.length}件`);
  
  if (lostShopIds.length > 0) {
    console.log('消えた店舗ID (最初の20件):');
    lostShopIds.slice(0, 20).forEach(id => console.log(`  - ${id}`));
    
    // これらが0人店舗リストと一致するか確認
    const zeroShops = currentShops.filter(s => !currentShopIds.has(s.id));
    const zeroShopIds = new Set(zeroShops.map(s => s.id));
    
    const matchingIds = lostShopIds.filter(id => zeroShopIds.has(id));
    console.log(`\n現在の0人店舗と一致: ${matchingIds.length}件`);
    
    if (matchingIds.length > 0) {
      console.log('\n✅ これらの店舗のデータはHEAD~1から復元可能！');
    }
  }
} catch (e) {
  console.log('HEAD~1のデータ取得に失敗:', e.message);
}
