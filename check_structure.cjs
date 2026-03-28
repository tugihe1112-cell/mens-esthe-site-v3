const allShops = require('./public/data/all_shops.json');

const shop = allShops.find(s => s.id === 'tokyo_shinjuku_higashishinjuku_gyokurou');

if (shop && shop.therapists && shop.therapists.length > 0) {
  console.log('玉楼のtherapists配列の最初の要素:');
  console.log(JSON.stringify(shop.therapists[0], null, 2));
  
  console.log('\n全てのプロパティ:');
  console.log(Object.keys(shop.therapists[0]));
}
