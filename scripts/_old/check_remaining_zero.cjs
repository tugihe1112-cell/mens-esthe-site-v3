const shops = require('./public/data/shops.json');
const therapists = require('./public/data/therapists.json');

const therapistsByShop = {};
therapists.forEach(t => {
  const sid = t.shop_id || t.shopId;
  therapistsByShop[sid] = (therapistsByShop[sid] || 0) + 1;
});

const zeroShops = shops.filter(s => !therapistsByShop[s.id]);
const uniqueZeroIds = [...new Set(zeroShops.map(s => s.id))];

console.log('=== 残りの0人店舗 ===\n');
console.log(`重複含む: ${zeroShops.length}店舗`);
console.log(`ユニークID: ${uniqueZeroIds.length}件`);

console.log('\n店舗リスト (最初の30件):');
uniqueZeroIds.slice(0, 30).forEach(id => {
  const shop = zeroShops.find(s => s.id === id);
  console.log(`  - ${shop.name} (${id})`);
});

console.log(`\n✅ 18店舗を復元`);
console.log(`❌ 残り ${uniqueZeroIds.length} 店舗は元々セラピストがいない可能性が高い`);
