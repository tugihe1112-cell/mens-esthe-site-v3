const fs = require('fs');
const path = require('path');

const currentTherapists = require('./public/data/therapists.json');

// 壊れたセラピスト（name: "セラピスト"）を特定
const brokenTherapists = currentTherapists.filter(t => t.name === 'セラピスト');
const goodTherapists = currentTherapists.filter(t => t.name !== 'セラピスト');

console.log(`壊れたデータ: ${brokenTherapists.length}人`);
console.log(`正常なデータ: ${goodTherapists.length}人`);

// 壊れたデータのshop_idリスト
const brokenShopIds = new Set(brokenTherapists.map(t => t.shop_id || t.shopId));
console.log(`影響を受けた店舗: ${brokenShopIds.size}件\n`);

// バックアップから復元
const backupDir = './src/data_backup_final/public_data';
const restoredTherapists = [];
let successCount = 0;
let failCount = 0;

function findBackupData(shopId) {
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
          if (data.id === shopId || (data.id && typeof data.id === 'string' && data.id.includes(shopId))) {
            return data.therapists;
          }
        } catch (e) {}
      }
    }
    return null;
  }
  return searchDir(backupDir);
}

console.log('復元中...\n');

Array.from(brokenShopIds).forEach((shopId, index) => {
  const therapists = findBackupData(shopId);
  if (therapists && Array.isArray(therapists) && therapists.length > 0 && therapists[0].name) {
    // shop_idを追加
    therapists.forEach(t => {
      if (!t.shop_id && !t.shopId) {
        t.shop_id = shopId;
      }
    });
    restoredTherapists.push(...therapists);
    successCount++;
    if (index < 10) console.log(`✓ ${shopId}: ${therapists.length}人`);
  } else {
    failCount++;
    if (index < 10) console.log(`✗ ${shopId}: 復元失敗`);
  }
});

console.log(`\n... (${brokenShopIds.size}店舗処理中)`);
console.log(`\n成功: ${successCount}店舗`);
console.log(`失敗: ${failCount}店舗`);
console.log(`復元セラピスト: ${restoredTherapists.length}人`);
console.log(`\n最終合計: ${goodTherapists.length} + ${restoredTherapists.length} = ${goodTherapists.length + restoredTherapists.length}人`);

if (restoredTherapists.length > 0) {
  console.log('\n保存しますか？ (node restore_broken_therapists.cjs save)');
}

if (process.argv[2] === 'save') {
  const merged = [...goodTherapists, ...restoredTherapists];
  fs.writeFileSync('./public/data/therapists.json', JSON.stringify(merged, null, 2));
  fs.writeFileSync('./src/data/therapists.json', JSON.stringify(merged, null, 2));
  console.log(`\n✅ 保存完了: ${merged.length}人`);
  
  // 検証
  const broken = merged.filter(t => t.name === 'セラピスト');
  console.log(`残りの壊れたデータ: ${broken.length}人`);
}
