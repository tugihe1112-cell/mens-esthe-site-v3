const fs = require('fs');

console.log('=== データファイルの場所を確認 ===\n');

// 1. src/data/therapists.json
if (fs.existsSync('./src/data/therapists.json')) {
  const srcData = require('./src/data/therapists.json');
  console.log(`src/data/therapists.json: ${srcData.length}人`);
  
  const srcShopIds = new Set();
  srcData.forEach(t => srcShopIds.add(t.shop_id || t.shopId));
  console.log(`  → ユニークshop_id: ${srcShopIds.size}件`);
} else {
  console.log('src/data/therapists.json: 存在しない');
}

// 2. public/data/therapists.json
const publicData = require('./public/data/therapists.json');
console.log(`\npublic/data/therapists.json: ${publicData.length}人`);

const publicShopIds = new Set();
publicData.forEach(t => publicShopIds.add(t.shop_id || t.shopId));
console.log(`  → ユニークshop_id: ${publicShopIds.size}件`);

// 3. src vs public の差分
if (fs.existsSync('./src/data/therapists.json')) {
  const srcData = require('./src/data/therapists.json');
  const srcShopIds = new Set();
  srcData.forEach(t => srcShopIds.add(t.shop_id || t.shopId));
  
  const onlyInSrc = Array.from(srcShopIds).filter(id => !publicShopIds.has(id));
  const onlyInPublic = Array.from(publicShopIds).filter(id => !srcShopIds.has(id));
  
  console.log(`\nsrcにだけある: ${onlyInSrc.length}件`);
  console.log(`publicにだけある: ${onlyInPublic.length}件`);
  
  if (onlyInSrc.length > 0) {
    console.log('\nsrcにだけあるshop_id (最初の20件):');
    onlyInSrc.slice(0, 20).forEach(id => console.log(`  - ${id}`));
  }
}

// 4. gitの履歴を確認
console.log('\n=== Git履歴の確認 ===');
console.log('最近のコミットで削除されたtherapistsがないか確認:');
console.log('以下を実行してください:');
console.log('  git log --all --full-history -- "public/data/therapists.json"');
console.log('  git show HEAD~1:public/data/therapists.json | wc -l');
console.log('  git show HEAD~2:public/data/therapists.json | wc -l');
