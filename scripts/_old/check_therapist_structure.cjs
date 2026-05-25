const therapists = require('./public/data/therapists.json');

// データ構造のパターンを分類
const withShopId = therapists.filter(t => t.shop_id);
const withShopName = therapists.filter(t => t.shopName && !t.shop_id);
const withTherapistName = therapists.filter(t => t.therapistName);
const withName = therapists.filter(t => t.name && !t.therapistName);

console.log('\n=== therapists.jsonの構造分析 ===');
console.log(`総数: ${therapists.length}件`);
console.log(`\n【紐付け方法】`);
console.log(`shop_id あり: ${withShopId.length}件`);
console.log(`shopName のみ: ${withShopName.length}件`);
console.log(`\n【名前フィールド】`);
console.log(`therapistName: ${withTherapistName.length}件`);
console.log(`name: ${withName.length}件`);

// Lynx関連のデータを探す
const lynxData = therapists.filter(t => 
  (t.shopName && t.shopName.includes('Lynx')) || 
  (t.shop_id && t.shop_id.includes('lynx'))
);

console.log(`\n【Lynx関連】`);
console.log(`Lynx関連データ: ${lynxData.length}件`);

if (lynxData.length > 0) {
  console.log('\nLynxのデータ構造例:');
  console.log(JSON.stringify(lynxData[0], null, 2));
}

// shopNameベースのデータがある場合、どんな店舗名があるか
if (withShopName.length > 0) {
  const shopNames = [...new Set(withShopName.map(t => t.shopName))];
  console.log(`\n【shopNameで紐付けされている店舗】`);
  console.log(`店舗数: ${shopNames.length}店`);
  shopNames.slice(0, 10).forEach(name => {
    const count = withShopName.filter(t => t.shopName === name).length;
    console.log(`- ${name}: ${count}人`);
  });
}
