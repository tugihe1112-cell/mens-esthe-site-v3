import fs from 'fs';

const shops = JSON.parse(fs.readFileSync('public/data/shops.json', 'utf8'));

// IDごとにグループ化
const idGroups = {};
shops.forEach(shop => {
  if (!idGroups[shop.id]) {
    idGroups[shop.id] = [];
  }
  idGroups[shop.id].push(shop);
});

// 重複しているIDのみを抽出
const duplicates = Object.entries(idGroups)
  .filter(([id, shops]) => shops.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`\n重複ID: ${duplicates.length}個\n`);
console.log('='.repeat(80));

duplicates.forEach(([id, shops]) => {
  console.log(`\nID: ${id} (${shops.length}店舗)`);
  shops.forEach((shop, i) => {
    console.log(`  ${i+1}. ${shop.name}`);
    console.log(`     エリア: ${shop.prefecture} ${shop.city || ''} ${shop.area || ''}`);
    console.log(`     セラピスト: ${shop.threads?.length || 0}人`);
  });
  console.log('-'.repeat(80));
});

console.log(`\n合計店舗数: ${shops.length}`);
console.log(`ユニークID数: ${Object.keys(idGroups).length}`);
