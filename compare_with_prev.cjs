const fs = require('fs');

const currentTherapists = require('./public/data/therapists.json');
const currentShops = require('./public/data/shops.json');

console.log('=== 現在 (HEAD) ===');
console.log(`Therapists: ${currentTherapists.length}人`);

const currentShopIds = new Set();
currentTherapists.forEach(t => currentShopIds.add(t.shop_id || t.shopId));
console.log(`セラピストがいる店舗ID: ${currentShopIds.size}件`);

// HEAD~1のデータ
try {
  const prevTherapists = JSON.parse(fs.readFileSync('/tmp/prev_therapists.json', 'utf8'));
  
  console.log('\n=== HEAD~1 (1つ前のコミット) ===');
  console.log(`Therapists: ${prevTherapists.length}人`);
  
  const prevShopIds = new Set();
  prevTherapists.forEach(t => prevShopIds.add(t.shop_id || t.shopId));
  console.log(`セラピストがいる店舗ID: ${prevShopIds.size}件`);
  
  // 消えた店舗ID
  const lostShopIds = Array.from(prevShopIds).filter(id => !currentShopIds.has(id));
  console.log(`\n消えた店舗ID: ${lostShopIds.length}件`);
  
  if (lostShopIds.length > 0) {
    console.log('消えた店舗ID (最初の30件):');
    lostShopIds.slice(0, 30).forEach(id => console.log(`  - ${id}`));
    
    // 0人店舗と一致確認
    const zeroShops = currentShops.filter(s => !currentShopIds.has(s.id));
    const zeroShopIds = new Set(zeroShops.map(s => s.id));
    
    const matchingIds = lostShopIds.filter(id => zeroShopIds.has(id));
    console.log(`\n現在の0人店舗と一致: ${matchingIds.length}件`);
    
    if (matchingIds.length > 0) {
      console.log('✅ HEAD~1から復元可能！');
      console.log('\n一致する店舗 (最初の20件):');
      matchingIds.slice(0, 20).forEach(id => {
        const shop = currentShops.find(s => s.id === id);
        console.log(`  - ${id} (${shop?.name})`);
      });
    }
  }
  
  // 新たに追加された店舗ID
  const newShopIds = Array.from(currentShopIds).filter(id => !prevShopIds.has(id));
  console.log(`\n新規追加された店舗ID: ${newShopIds.length}件`);
  
} catch (e) {
  console.log('エラー:', e.message);
}
