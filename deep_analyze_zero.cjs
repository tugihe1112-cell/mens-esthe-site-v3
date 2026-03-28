const shops = require('./public/data/shops.json');
const therapists = require('./public/data/therapists.json');

const therapistsByShop = {};
therapists.forEach(t => {
  const sid = t.shop_id || t.shopId;
  therapistsByShop[sid] = (therapistsByShop[sid] || 0) + 1;
});

const zeroShops = shops.filter(s => !therapistsByShop[s.id]);

// ユニークなIDでグループ化
const uniqueIds = [...new Set(zeroShops.map(s => s.id))];

console.log('=== セラピスト0人の分析 ===\n');
console.log(`重複含む店舗数: ${zeroShops.length}`);
console.log(`ユニークなID数: ${uniqueIds.length}`);

console.log('\n=== ブランド別 ===');
const byBrand = {};
uniqueIds.forEach(id => {
  const shopsWithId = zeroShops.filter(s => s.id === id);
  const brandName = shopsWithId[0].name;
  byBrand[brandName] = (byBrand[brandName] || 0) + 1;
});

const sortedBrands = Object.entries(byBrand).sort((a, b) => b[1] - a[1]);
console.log('多い順:');
sortedBrands.slice(0, 20).forEach(([name, count]) => {
  console.log(`  ${count}店舗: ${name}`);
});

console.log('\n=== これらの店舗は ===');
console.log('1. 閉店した？');
console.log('2. セラピストデータがまだ登録されていない？');
console.log('3. バックアップから復元が必要？');

// 実際にバックアップにあるか再確認
console.log('\n=== バックアップに該当データがあるか ===');
const fs = require('fs');
const sampleId = uniqueIds[0];
console.log(`サンプルID: ${sampleId}`);

// バックアップを検索
const found = [];
function searchBackup(dir, targetId) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach(item => {
      const fullPath = `${dir}/${item.name}`;
      if (item.isDirectory()) {
        searchBackup(fullPath, targetId);
      } else if (item.name.endsWith('.json')) {
        try {
          const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          if (data.therapists && data.therapists[0]) {
            const shopId = data.therapists[0].shop_id || data.therapists[0].shopId;
            if (shopId === targetId) {
              found.push({ file: fullPath, count: data.therapists.length });
            }
          }
        } catch (e) {}
      }
    });
  } catch (e) {}
}

searchBackup('./src/data_backup_final/public_data', sampleId);
if (found.length > 0) {
  console.log(`✅ バックアップに存在: ${found[0].file} (${found[0].count}人)`);
} else {
  console.log(`❌ バックアップに存在しない`);
}
