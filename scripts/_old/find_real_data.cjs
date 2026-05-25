const allShops = require('./public/data/all_shops.json');

const shop = allShops.find(s => s.id === 'tokyo_shinjuku_higashishinjuku_gyokurou');

console.log('=== 玉楼の構造 ===\n');
console.log('全てのプロパティ:');
console.log(Object.keys(shop));

console.log('\ntherapistsの型:', typeof shop.therapists);
console.log('therapistsの長さ:', shop.therapists.length);
console.log('\n最初の3要素:');
shop.therapists.slice(0, 3).forEach((item, i) => {
  console.log(`[${i}]:`, typeof item, '->', item);
});

// therapistDataやtherapistDetailsなどのプロパティがあるか
console.log('\n他のセラピスト関連プロパティ:');
Object.keys(shop).filter(k => k.toLowerCase().includes('therap')).forEach(k => {
  console.log(`  - ${k}:`, typeof shop[k]);
});
