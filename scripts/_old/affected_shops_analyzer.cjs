const fs = require('fs');
const path = require('path');

// データファイルのパスを探す
let shopsPath = './shops.json';
let therapistsPath = './therapists.json';

if (!fs.existsSync(shopsPath)) {
  shopsPath = './data/shops.json';
  therapistsPath = './data/therapists.json';
}

if (!fs.existsSync(shopsPath)) {
  shopsPath = './public/data/shops.json';
  therapistsPath = './public/data/therapists.json';
}

if (!fs.existsSync(shopsPath)) {
  console.error('❌ shops.json が見つかりません');
  console.log('\n以下のコマンドでファイルを探してください:');
  console.log('find . -name "shops.json"');
  process.exit(1);
}

const shops = require(shopsPath);
const therapists = require(therapistsPath);

console.log(`✅ データ読み込み成功`);
console.log(`   shops.json: ${shopsPath} (${shops.length}件)`);
console.log(`   therapists.json: ${therapistsPath} (${therapists.length}件)`);

const therapistsByShop = therapists.reduce((acc, t) => {
  acc[t.shop_id] = (acc[t.shop_id] || 0) + 1;
  return acc;
}, {});

const emptyShops = shops.filter(s => !therapistsByShop[s.id]);

console.log(`\n=== 0人店舗: ${emptyShops.length}件 ===\n`);

emptyShops.slice(0, 10).forEach(s => {
  console.log(`- ${s.name} (ID: ${s.id})`);
});

const csv = emptyShops.map(s => `${s.id},${s.name},${s.group_id || ''}`).join('\n');
fs.writeFileSync('./empty_shops_list.csv', 'shop_id,shop_name,group_id\n' + csv);

console.log(`\n✅ empty_shops_list.csv に保存`);
