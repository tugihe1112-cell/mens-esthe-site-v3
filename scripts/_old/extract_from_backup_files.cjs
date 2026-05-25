const fs = require('fs');
const path = require('path');

// all_shops.jsonから0人の店舗を取得
const allShops = require('./public/data/all_shops.json');
const currentTherapists = require('./public/data/therapists.json');

const currentShopIds = new Set();
currentTherapists.forEach(t => currentShopIds.add(t.shop_id || t.shopId));

const shopsWithTherapistIds = allShops.filter(s => 
  s.therapists && 
  Array.isArray(s.therapists) && 
  s.therapists.length > 0 &&
  typeof s.therapists[0] === 'string' && // IDの配列
  !currentShopIds.has(s.id) // 現在0人
);

console.log(`therapist IDsがある0人店舗: ${shopsWithTherapistIds.length}件\n`);

// _fileLocationを確認
shopsWithTherapistIds.slice(0, 5).forEach(shop => {
  console.log(`${shop.name}:`);
  console.log(`  ID: ${shop.id}`);
  console.log(`  therapist IDs: ${shop.therapists.length}件`);
  console.log(`  _fileLocation: ${shop._fileLocation}`);
  console.log(`  _rawLocation: ${shop._rawLocation}`);
  console.log('');
});

// _rawLocationのファイルを読んでみる
const sampleShop = shopsWithTherapistIds[0];
if (sampleShop._rawLocation) {
  const filePath = sampleShop._rawLocation.replace('public/', 'src/data_backup_final/public_data/');
  console.log(`サンプルファイル: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.therapists && data.therapists[0]) {
      console.log('\nセラピストデータの構造:');
      console.log(JSON.stringify(data.therapists[0], null, 2).substring(0, 500));
    }
  } else {
    console.log('❌ ファイルが見つかりません');
  }
}
