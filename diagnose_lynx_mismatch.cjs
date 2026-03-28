const shops = require('./public/data/shops.json');
const therapists = require('./public/data/therapists.json');

// Lynx関連のデータを抽出
const lynxShops = shops.filter(s => s.name.includes('Lynx'));
const lynxTherapists = therapists.filter(t => t.shop_id && t.shop_id.includes('lynx'));

console.log('\n=== Lynx店舗のIDリスト（shops.json） ===');
lynxShops.forEach(s => {
  console.log(`${s.id} - ${s.name}`);
});

console.log('\n=== Lynxセラピストが指しているshop_id（重複なし） ===');
const therapistShopIds = [...new Set(lynxTherapists.map(t => t.shop_id))];
therapistShopIds.forEach(id => {
  const count = lynxTherapists.filter(t => t.shop_id === id).length;
  console.log(`${id}: ${count}人`);
});

console.log('\n=== ミスマッチ分析 ===');
console.log('【shops.jsonに存在するが、セラピストがいない店舗ID】');
lynxShops.forEach(shop => {
  const hasTherapists = lynxTherapists.some(t => t.shop_id === shop.id);
  if (!hasTherapists) {
    console.log(`❌ ${shop.id} - ${shop.name}`);
  }
});

console.log('\n【therapists.jsonに存在するが、shops.jsonにない店舗ID】');
therapistShopIds.forEach(id => {
  const shopExists = lynxShops.some(s => s.id === id);
  if (!shopExists) {
    const count = lynxTherapists.filter(t => t.shop_id === id).length;
    console.log(`⚠️  ${id}: ${count}人（店舗データなし）`);
  }
});
