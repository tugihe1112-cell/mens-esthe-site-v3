const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/data/all_shops.json', 'utf8'));

const brandMap = {};
data.forEach(s => {
  const key = s.brandId || null;
  if (!key) return;
  if (!brandMap[key]) brandMap[key] = [];
  brandMap[key].push({ id: s.id, name: s.name, pref: s.prefecture, area: s.area, group_id: s.group_id });
});

const multi = Object.entries(brandMap)
  .filter(([,shops]) => shops.length > 1)
  .sort((a,b) => b[1].length - a[1].length);

console.log('複数展開ブランド数: ' + multi.length);
multi.slice(0, 15).forEach(([brand, shops]) => {
  console.log('\n【' + brand + '】' + shops.length + '店舗');
  shops.forEach(s => console.log('  - ' + s.area + ' (' + s.pref + ') group_id=' + s.group_id));
});
