const therapists = require('./public/data/therapists.json');
const shops = require('./public/data/shops.json');

// Cucueの店舗を探す
const cucueShops = shops.filter(s => s.name.includes('Cucue') || s.name.includes('きゅきゅ'));

console.log('=== Cucue店舗 ===');
cucueShops.forEach(s => {
  console.log(`${s.id}: ${s.name}`);
  
  // このshop_idのセラピストを取得
  const shopTherapists = therapists.filter(t => 
    (t.shop_id === s.id || t.shopId === s.id)
  );
  
  console.log(`  セラピスト数: ${shopTherapists.length}人`);
  
  if (shopTherapists.length > 0) {
    console.log('  最初の5人:');
    shopTherapists.slice(0, 5).forEach(t => {
      console.log(`    - name: "${t.name}", id: ${t.id}`);
    });
  }
  console.log('');
});
