const shops = require('./public/data/shops.json');
const therapists = require('./public/data/therapists.json');
const allShops = require('./public/data/all_shops.json');

const therapistsByShop = {};
therapists.forEach(t => {
  const sid = t.shop_id || t.shopId;
  therapistsByShop[sid] = (therapistsByShop[sid] || 0) + 1;
});

const zeroShops = shops.filter(s => !therapistsByShop[s.id]);
const uniqueZeroIds = [...new Set(zeroShops.map(s => s.id))];

console.log('=== 172店舗（167ユニークID）の内訳 ===\n');

// 1. all_shops.jsonにtherapist IDsがある（データ喪失）
const withIds = allShops.filter(s => 
  s.therapists && 
  typeof s.therapists[0] === 'string' &&
  uniqueZeroIds.includes(s.id)
);

console.log(`1. データ喪失（IDのみ残存）: ${withIds.length}店舗`);
withIds.forEach(s => console.log(`   - ${s.name} (${s.therapists.length}件のID)`));

// 2. all_shops.jsonにtherapistsプロパティすらない
const withoutAny = uniqueZeroIds.filter(id => {
  const shop = allShops.find(s => s.id === id);
  return !shop || !shop.therapists || shop.therapists.length === 0;
});

console.log(`\n2. 元々セラピストデータなし: ${withoutAny.length}店舗`);
console.log('最初の20件:');
withoutAny.slice(0, 20).forEach(id => {
  const shop = shops.find(s => s.id === id);
  console.log(`   - ${shop.name} (${id})`);
});

console.log(`\n合計: ${withIds.length + withoutAny.length} = ${uniqueZeroIds.length}件`);
