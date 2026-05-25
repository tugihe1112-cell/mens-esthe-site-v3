const fs = require('fs');
const path = require('path');

const backupDir = './src/data_backup_final/public_data';
const currentTherapists = require('./public/data/therapists.json');
const currentShops = require('./public/data/shops.json');

// 現在のtherapistsのshop_idセット
const currentShopIds = new Set();
currentTherapists.forEach(t => {
  const sid = t.shop_id || t.shopId;
  if (sid) currentShopIds.add(sid);
});

// shops.jsonの全IDセット
const allShopIds = new Set(currentShops.map(s => s.id));

const restoredTherapists = [];
let filesProcessed = 0;

function processFile(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.therapists && Array.isArray(data.therapists) && data.therapists.length > 0) {
      filesProcessed++;
      const shopId = data.therapists[0].shop_id || data.therapists[0].shopId;
      
      // このshop_idが現在のtherapistsに無く、かつshops.jsonに存在する場合のみ追加
      if (shopId && !currentShopIds.has(shopId) && allShopIds.has(shopId)) {
        console.log(`Found missing: ${shopId} (${data.therapists.length} therapists)`);
        restoredTherapists.push(...data.therapists);
      }
    }
  } catch (e) {
    // JSONパースエラーは無視
  }
}

function scanDirectory(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(item => {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      scanDirectory(fullPath);
    } else if (item.name.endsWith('.json') && item.name !== 'shops_backup.json') {
      processFile(fullPath);
    }
  });
}

scanDirectory(backupDir);

console.log(`\n=== RESTORE SUMMARY ===`);
console.log(`Files processed: ${filesProcessed}`);
console.log(`Therapists to restore: ${restoredTherapists.length}`);
console.log(`Current therapists: ${currentTherapists.length}`);
console.log(`Total after restore: ${currentTherapists.length + restoredTherapists.length}`);

if (restoredTherapists.length > 0) {
  console.log('\nShould we merge? (This will update public/data/therapists.json)');
  console.log('First 5 restored therapists:');
  restoredTherapists.slice(0, 5).forEach(t => {
    console.log(`  - ${t.name} (${t.shop_id || t.shopId})`);
  });
}
