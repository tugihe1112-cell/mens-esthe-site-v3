import fs from 'fs';

// 既存のshops.jsonを読み込む
const shopsData = JSON.parse(fs.readFileSync('public/data/shops.json', 'utf8'));

// dejavu-tokyo.jsonを読み込む
const dejavuData = JSON.parse(fs.readFileSync('public/data/tokyo/chuo/ginza/dejavu-tokyo.json', 'utf8'));

// Dejavu TOKYOが既に存在するかチェック
const exists = shopsData.find(shop => shop.id === dejavuData.id);

if (!exists) {
  // 配列の最初に追加
  shopsData.unshift(dejavuData);
  
  // 保存
  fs.writeFileSync('public/data/shops.json', JSON.stringify(shopsData, null, 2));
  console.log('✅ Dejavu TOKYOを追加しました！');
  console.log(`現在の店舗数: ${shopsData.length}`);
} else {
  console.log('⚠️  Dejavu TOKYOは既に存在します');
}
