const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));

// area未設定のlynx店舗
const broken = data.filter(s => s.brandId === 'lynx' && !s.area);
if (broken.length) {
  console.log('area未設定:');
  console.log(JSON.stringify(broken[0], null, 2));
}

// 全ブランドのgroup_id統一チェック
const brandMap = {};
data.forEach(s => {
  if (!s.brandId) return;
  if (!brandMap[s.brandId]) brandMap[s.brandId] = new Set();
  brandMap[s.brandId].add(s.group_id);
});
const ng = Object.entries(brandMap).filter(([,ids]) => ids.size > 1);
console.log('\ngroup_idバラバラのブランド: ' + ng.length);
ng.forEach(([b, ids]) => console.log(b + ': ' + [...ids].join(', ')));
