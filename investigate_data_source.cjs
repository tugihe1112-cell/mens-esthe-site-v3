const fs = require('fs');
const shops = require('./public/data/shops.json');
const therapists = require('./public/data/therapists.json');

// 0人店舗の例: Lynx
const lynx = shops.find(s => s.name.includes('Lynx'));

// 正常な店舗の例: Limited Spa以外で人がいる店舗
const therapistsByShop = therapists.reduce((acc, t) => {
  if (!acc[t.shop_id]) acc[t.shop_id] = [];
  acc[t.shop_id].push(t);
  return acc;
}, {});

// Limited Spaのデータを見る
const limitedSpa = shops.find(s => s.name.includes('Limited Spa'));
const limitedSpaTherapists = therapistsByShop[limitedSpa?.id] || [];

// 正常に動いている店舗（セラピスト10人以上）
const normalShop = shops.find(s => {
  const count = therapistsByShop[s.id]?.length || 0;
  return count >= 10 && !s.name.includes('Lynx') && !s.name.includes('Limited');
});
const normalTherapists = therapistsByShop[normalShop?.id] || [];

console.log('\n=== 0人店舗の例: Lynx ===');
console.log(JSON.stringify(lynx, null, 2));

console.log('\n=== 0人店舗の例: Limited Spa ===');
console.log(JSON.stringify(limitedSpa, null, 2));
console.log(`セラピスト数: ${limitedSpaTherapists.length}人`);

console.log('\n=== 正常な店舗の例 ===');
console.log(JSON.stringify(normalShop, null, 2));
console.log(`セラピスト数: ${normalTherapists.length}人`);
console.log('\nセラピストの例（最初の2人）:');
normalTherapists.slice(0, 2).forEach(t => {
  console.log(JSON.stringify(t, null, 2));
});

// URLの構造を比較
console.log('\n=== URL比較 ===');
console.log(`Lynx: ${lynx?.url || '未設定'}`);
console.log(`Limited Spa: ${limitedSpa?.url || '未設定'}`);
console.log(`正常店舗: ${normalShop?.url || '未設定'}`);
