const shops = require('./public/data/shops.json');
const therapists = require('./public/data/therapists.json');

const therapistsByShop = {};
therapists.forEach(t => {
  const sid = t.shop_id || t.shopId;
  therapistsByShop[sid] = (therapistsByShop[sid] || 0) + 1;
});

const zeroShops = shops.filter(s => !therapistsByShop[s.id]);

// ID重複チェック
const idCounts = {};
shops.forEach(s => {
  idCounts[s.id] = (idCounts[s.id] || 0) + 1;
});

const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
console.log('Duplicate shop IDs:', duplicates.length);
if (duplicates.length > 0) {
  console.log('First 10 duplicates:');
  duplicates.slice(0, 10).forEach(([id, count]) => console.log(`${id}: ${count} times`));
}

// バックアップと比較
console.log('\n--- Checking backup ---');
const fs = require('fs');
if (fs.existsSync('./src/data_backup_final/src_data/therapists.json')) {
  const backupTherapists = require('./src/data_backup_final/src_data/therapists.json');
  const backupShopIds = new Set();
  backupTherapists.forEach(t => backupShopIds.add(t.shop_id || t.shopId));
  console.log('Backup therapists shop IDs:', backupShopIds.size);
  
  // 現在のデータに無くてバックアップにあるshop_id
  const currentShopIds = new Set();
  therapists.forEach(t => currentShopIds.add(t.shop_id || t.shopId));
  
  const missingInCurrent = Array.from(backupShopIds).filter(id => !currentShopIds.has(id));
  console.log('Shop IDs in backup but missing in current:', missingInCurrent.length);
  if (missingInCurrent.length > 0) {
    console.log('First 20:', missingInCurrent.slice(0, 20));
  }
}
