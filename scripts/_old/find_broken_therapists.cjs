const therapists = require('./public/data/therapists.json');

const broken = therapists.filter(t => t.name === 'セラピスト');

console.log(`名前が「セラピスト」: ${broken.length}人\n`);

// shop_id別に集計
const byShop = {};
broken.forEach(t => {
  const sid = t.shop_id || t.shopId;
  byShop[sid] = (byShop[sid] || 0) + 1;
});

console.log('店舗別:');
Object.entries(byShop).sort((a, b) => b[1] - a[1]).forEach(([shop, count]) => {
  console.log(`  ${shop}: ${count}人`);
});

console.log('\nサンプル（最初の1人の全データ）:');
console.log(JSON.stringify(broken[0], null, 2));
