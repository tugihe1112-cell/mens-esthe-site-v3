const fs = require('fs');
const path = require('path');

const currentTherapists = require('./public/data/therapists.json');
const backupDir = './src/data_backup_final/public_data';

// 壊れたセラピストと正常なセラピストを分離
const brokenTherapists = currentTherapists.filter(t => t.name === 'セラピスト');
const goodTherapists = currentTherapists.filter(t => t.name !== 'セラピスト');

console.log(`壊れたデータ: ${brokenTherapists.length}人`);
console.log(`正常なデータ: ${goodTherapists.length}人\n`);

// バックアップをスキャンしてマップを作成
const backupMap = {};

function scanBackups(dir, prefix = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(item => {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      scanBackups(fullPath, [...prefix, item.name]);
    } else if (item.name.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (data.therapists && Array.isArray(data.therapists) && data.therapists.length > 0) {
          // shop_idを構築: aichi/chikusa/cucue.json -> aichi_chikusa_cucue
          const shopName = item.name.replace('.json', '');
          const shopId = [...prefix, shopName].join('_');
          backupMap[shopId] = data.therapists;
        }
      } catch (e) {}
    }
  });
}

console.log('バックアップをスキャン中...');
scanBackups(backupDir);

console.log(`バックアップマップ: ${Object.keys(backupMap).length}店舗\n`);

// Cucue確認
const cucueKeys = Object.keys(backupMap).filter(k => k.includes('cucue'));
console.log(`Cucue: ${cucueKeys.length}件`);
cucueKeys.forEach(k => console.log(`  ${k}`));

// 復元
const restoredTherapists = [];
const brokenShopIds = [...new Set(brokenTherapists.map(t => t.shop_id || t.shopId))];
let successCount = 0;

console.log(`\n復元対象: ${brokenShopIds.length}店舗\n`);

brokenShopIds.forEach((shopId, i) => {
  if (backupMap[shopId]) {
    const therapists = backupMap[shopId];
    // shop_idを追加
    therapists.forEach(t => {
      if (!t.shop_id && !t.shopId) {
        t.shop_id = shopId;
      }
    });
    restoredTherapists.push(...therapists);
    successCount++;
    if (i < 20) console.log(`✓ ${shopId}: ${therapists.length}人`);
  } else {
    if (i < 20) console.log(`✗ ${shopId}: 未発見`);
  }
});

console.log(`\n... (${brokenShopIds.length}店舗処理)`);
console.log(`\n成功: ${successCount}/${brokenShopIds.length}店舗`);
console.log(`復元: ${restoredTherapists.length}人`);
console.log(`最終: ${goodTherapists.length} + ${restoredTherapists.length} = ${goodTherapists.length + restoredTherapists.length}人`);

if (restoredTherapists.length > 0) {
  console.log('\n保存: node restore_with_correct_matching.cjs save');
}

if (process.argv[2] === 'save') {
  const merged = [...goodTherapists, ...restoredTherapists];
  fs.writeFileSync('./public/data/therapists.json', JSON.stringify(merged, null, 2));
  fs.writeFileSync('./src/data/therapists.json', JSON.stringify(merged, null, 2));
  console.log(`\n✅ 保存完了: ${merged.length}人`);
  
  const remaining = merged.filter(t => t.name === 'セラピスト');
  console.log(`残りの壊れたデータ: ${remaining.length}人`);
}
