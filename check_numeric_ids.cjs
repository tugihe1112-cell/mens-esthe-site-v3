const fs = require('fs');

const shops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));

// 東京都の数字IDの店舗
const numericTokyo = shops.filter(s => 
  s.prefecture === '東京都' && 
  String(s.id).match(/^\d+$/)
);

console.log('東京都の数字ID店舗数:', numericTokyo.length);
console.log('\n先頭10件のデータ構造:');
numericTokyo.slice(0, 3).forEach(s => {
  console.log('\n---');
  console.log('id:', s.id);
  console.log('name:', s.name);
  console.log('brandId:', s.brandId);
  console.log('websiteUrl:', s.websiteUrl);
  console.log('therapists[0]:', s.therapists?.[0]);
  console.log('therapists数:', s.therapists?.length || 0);
});
