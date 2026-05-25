const fs = require('fs');
const currentShops = require('./public/data/shops.json');
const currentTherapists = require('./public/data/therapists.json');

// バックアップから店舗IDを収集
const backupShopIds = new Set();
const backupDir = './src/data_backup_final/public_data';

function scanDirectory(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(item => {
    const fullPath = `${dir}/${item.name}`;
    if (item.isDirectory()) {
      scanDirectory(fullPath);
    } else if (item.name.endsWith('.json') && item.name !== 'shops_backup.json') {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (Array.isArray(data.therapists) && data.therapists.length > 0) {
          const shopId = data.therapists[0].shop_id || data.therapists[0].shopId;
          if (shopId) backupShopIds.add(shopId);
        }
      } catch (e) {}
    }
  });
}

scanDirectory(backupDir);

// 現在のtherapistsから店舗IDを収集
const currentTherapistShopIds = new Set();
currentTherapists.forEach(t => {
  const sid = t.shop_id || t.shopId;
  if (sid) currentTherapistShopIds.add(sid);
});

// 現在のshopsから店舗IDを収集
const currentShopIds = new Set(currentShops.map(s => s.id));

console.log('=== SUMMARY ===');
console.log('Backup therapist shop IDs:', backupShopIds.size);
console.log('Current therapist shop IDs:', currentTherapistShopIds.size);
console.log('Current total shops:', currentShopIds.size);

// バックアップにあって現在のtherapistsに無いID
const missingInCurrent = Array.from(backupShopIds).filter(id => !currentTherapistShopIds.has(id));
console.log('\n=== Missing in current therapists (but in backup) ===');
console.log('Count:', missingInCurrent.length);
console.log('First 30:', missingInCurrent.slice(0, 30));

// shops.jsonにあってtherapistsに無いID（0人の店舗）
const shopsWithoutTherapists = Array.from(currentShopIds).filter(id => !currentTherapistShopIds.has(id));
console.log('\n=== Shops without therapists ===');
console.log('Count:', shopsWithoutTherapists.length);
console.log('First 20:', shopsWithoutTherapists.slice(0, 20));
