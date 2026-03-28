const fs = require('fs');

if (fs.existsSync('./public/data/all_shops.json')) {
  const allShops = require('./public/data/all_shops.json');
  console.log('=== all_shops.json ===');
  console.log(`店舗数: ${allShops.length}`);
  
  // 最初の1件の構造を確認
  if (allShops.length > 0) {
    console.log('\n最初の店舗の構造:');
    console.log(JSON.stringify(allShops[0], null, 2).substring(0, 500));
    
    // therapistsプロパティがあるか
    const withTherapists = allShops.filter(s => s.therapists && s.therapists.length > 0);
    console.log(`\ntherapistsプロパティがある店舗: ${withTherapists.length}件`);
    
    if (withTherapists.length > 0) {
      let totalTherapists = 0;
      withTherapists.forEach(s => totalTherapists += s.therapists.length);
      console.log(`合計セラピスト数: ${totalTherapists}人`);
    }
  }
} else {
  console.log('all_shops.json は存在しません');
}

// src/data/all_shops.jsonも確認
if (fs.existsSync('./src/data/all_shops.json')) {
  console.log('\n=== src/data/all_shops.json も存在します ===');
}
