const fs = require('fs');
const path = require('path');

const backupDir = './src/data_backup_final/public_data';
const currentTherapists = require('./public/data/therapists.json');
const allShops = require('./public/data/all_shops.json');

// 現在セラピストがいる店舗ID
const currentShopIds = new Set();
currentTherapists.forEach(t => currentShopIds.add(t.shop_id || t.shopId));

// all_shops.jsonでtherapist IDsがあるが、実際のデータがない店舗
const targetShops = allShops.filter(s => 
  s.therapists && 
  Array.isArray(s.therapists) && 
  s.therapists.length > 0 &&
  typeof s.therapists[0] === 'string' &&
  !currentShopIds.has(s.id)
);

console.log(`復元対象: ${targetShops.length}店舗\n`);

const restoredTherapists = [];
let successCount = 0;

// バックアップから検索
function findAndExtract(shopId) {
  function searchDir(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        const result = searchDir(fullPath);
        if (result) return result;
      } else if (item.name.endsWith('.json')) {
        try {
          const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          if (data.id === shopId && data.therapists && Array.isArray(data.therapists)) {
            // therapistsが実際のオブジェクト配列か確認
            if (data.therapists[0] && typeof data.therapists[0] === 'object') {
              return data.therapists;
            }
          }
        } catch (e) {}
      }
    }
    return null;
  }
  
  return searchDir(backupDir);
}

targetShops.forEach(shop => {
  const therapists = findAndExtract(shop.id);
  if (therapists) {
    console.log(`✓ ${shop.name}: ${therapists.length}人`);
    restoredTherapists.push(...therapists);
    successCount++;
  } else {
    console.log(`✗ ${shop.name}: バックアップ未発見`);
  }
});

console.log(`\n成功: ${successCount}/${targetShops.length}店舗`);
console.log(`復元セラピスト: ${restoredTherapists.length}人`);

if (restoredTherapists.length > 0) {
  console.log('\n保存しますか？ (node restore_from_backup_properly.cjs save)');
}

if (process.argv[2] === 'save') {
  const merged = [...currentTherapists, ...restoredTherapists];
  fs.writeFileSync('./public/data/therapists.json', JSON.stringify(merged, null, 2));
  fs.writeFileSync('./src/data/therapists.json', JSON.stringify(merged, null, 2));
  console.log(`\n✅ 保存完了: ${merged.length}人`);
}
