const shops = require('./public/data/shops.json');
const therapists = require('./public/data/therapists.json');

const therapistsByShop = {};
therapists.forEach(t => {
  const sid = t.shop_id || t.shopId;
  therapistsByShop[sid] = (therapistsByShop[sid] || 0) + 1;
});

const zeroShops = shops.filter(s => !therapistsByShop[s.id]);
console.log('Total shops:', shops.length);
console.log('Shops with 0 therapists:', zeroShops.length);
console.log('\nFirst 20 zero shops:');
zeroShops.slice(0, 20).forEach(s => console.log(s.id));

console.log('\n--- Shop IDs in therapists data (first 20) ---');
const shopIds = new Set();
therapists.forEach(t => shopIds.add(t.shop_id || t.shopId));
console.log('Unique shop IDs in therapists:', shopIds.size);
Array.from(shopIds).slice(0, 20).forEach(id => console.log(id));
