const fs = require('fs');
const allShops = require('./public/data/all_shops.json');
const currentTherapists = require('./public/data/therapists.json');

// all_shops.jsonからtherapistsを抽出
const extractedTherapists = [];
const shopsWithTherapists = allShops.filter(s => s.therapists && s.therapists.length > 0);

console.log('=== 復元プレビュー ===\n');

shopsWithTherapists.forEach(shop => {
  if (shop.therapists && Array.isArray(shop.therapists)) {
    // therapistsにshop_idを追加
    shop.therapists.forEach(t => {
      if (!t.shop_id && !t.shopId) {
        t.shop_id = shop.id;
      }
      extractedTherapists.push(t);
    });
    console.log(`✓ ${shop.name}: ${shop.therapists.length}人`);
  }
});

console.log(`\n抽出: ${extractedTherapists.length}人`);
console.log(`現在: ${currentTherapists.length}人`);
console.log(`復元後: ${currentTherapists.length + extractedTherapists.length}人`);

console.log('\n復元後のtherapists.jsonを作成しますか？');
console.log('実行: node restore_from_all_shops.cjs save');

if (process.argv[2] === 'save') {
  const merged = [...currentTherapists, ...extractedTherapists];
  
  // public/data/therapists.json に保存
  fs.writeFileSync(
    './public/data/therapists.json',
    JSON.stringify(merged, null, 2)
  );
  
  // src/data/therapists.json にもコピー
  fs.writeFileSync(
    './src/data/therapists.json',
    JSON.stringify(merged, null, 2)
  );
  
  console.log('\n✅ 復元完了！');
  console.log(`  - public/data/therapists.json: ${merged.length}人`);
  console.log(`  - src/data/therapists.json: ${merged.length}人`);
  
  // 検証
  const shopIds = new Set();
  merged.forEach(t => shopIds.add(t.shop_id || t.shopId));
  console.log(`  - セラピストがいる店舗: ${shopIds.size}件`);
}
