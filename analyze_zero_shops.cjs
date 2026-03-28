const shops = require('./public/data/shops.json');
const therapists = require('./public/data/therapists.json');

const therapistsByShop = {};
therapists.forEach(t => {
  const sid = t.shop_id || t.shopId;
  therapistsByShop[sid] = (therapistsByShop[sid] || 0) + 1;
});

const zeroShops = shops.filter(s => !therapistsByShop[s.id]);

console.log('=== 0人の店舗の詳細 ===\n');
console.log(`Total: ${zeroShops.length} shops\n`);

// 重複IDの店舗を特定
const duplicateIds = ['kanagawa_kawasaki_doigt_de_fee', 'kanagawa_sagamihara_luxury_romance', 
                      'tokyo_minato_aroma_blossom', 'chiba_funabashi_limited_spa', 'chiba_funabashi_lynx'];

const duplicateZeroShops = zeroShops.filter(s => duplicateIds.includes(s.id));
const nonDuplicateZeroShops = zeroShops.filter(s => !duplicateIds.includes(s.id));

console.log(`Duplicate ID shops (0 therapists): ${duplicateZeroShops.length}`);
duplicateZeroShops.forEach(s => console.log(`  - ${s.name} (${s.id})`));

console.log(`\nNon-duplicate shops (0 therapists): ${nonDuplicateZeroShops.length}`);
console.log('First 20:');
nonDuplicateZeroShops.slice(0, 20).forEach(s => console.log(`  - ${s.name} (${s.id})`));

// 実際にセラピストがいる重複IDの店舗を確認
console.log('\n=== 重複IDでセラピストがいる店舗 ===');
duplicateIds.forEach(id => {
  const count = therapistsByShop[id] || 0;
  const shopsWithId = shops.filter(s => s.id === id);
  console.log(`\n${id}: ${count} therapists, ${shopsWithId.length} shops`);
  shopsWithId.forEach((s, i) => console.log(`  ${i+1}. ${s.name} (${s.prefecture})`));
});
