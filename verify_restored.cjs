const therapists = require('./public/data/therapists.json');

console.log(`Total therapists: ${therapists.length}`);

// 復元したはずの店舗を確認
const testShopId = 'tokyo_shinjuku_higashishinjuku_gyokurou';
const gyokurou = therapists.filter(t => 
  (t.shop_id === testShopId || t.shopId === testShopId)
);

console.log(`\n玉楼のセラピスト: ${gyokurou.length}人`);

if (gyokurou.length > 0) {
  console.log('サンプル:');
  gyokurou.slice(0, 3).forEach(t => {
    console.log(`  - ${t.name || 'no name'} (id: ${t.id})`);
  });
} else {
  console.log('❌ データが見つかりません');
  
  // all_shops.jsonにまだあるか確認
  const allShops = require('./public/data/all_shops.json');
  const shop = allShops.find(s => s.id === testShopId);
  if (shop && shop.therapists) {
    console.log(`\nall_shops.jsonには ${shop.therapists.length}人 います`);
    console.log('サンプル:');
    shop.therapists.slice(0, 3).forEach(t => {
      console.log(`  - name: ${t.name || 'undefined'}, id: ${t.id || 'undefined'}, shop_id: ${t.shop_id || 'undefined'}`);
    });
  }
}
