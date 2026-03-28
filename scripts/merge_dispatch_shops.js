const fs = require('fs');
const path = require('path');

// shops.jsonを読み込み
const shopsPath = 'public/data/shops.json';
let shops = JSON.parse(fs.readFileSync(shopsPath, 'utf8'));

// dispatch/23wardsフォルダ内の全JSONファイルを読み込み
const dispatchDir = 'dispatch/23wards';
const files = fs.readdirSync(dispatchDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(dispatchDir, file);
  const shopData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // 既存のIDと重複しないかチェック
  const existingIndex = shops.findIndex(s => s.id === shopData.id);
  if (existingIndex >= 0) {
    shops[existingIndex] = shopData; // 更新
    console.log(`Updated: ${shopData.name}`);
  } else {
    shops.push(shopData); // 追加
    console.log(`Added: ${shopData.name}`);
  }
});

// 保存
fs.writeFileSync(shopsPath, JSON.stringify(shops, null, 2));
console.log(`\nTotal shops: ${shops.length}`);
