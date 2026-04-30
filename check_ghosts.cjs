const fs = require('fs');
const shops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));

// 実在するエリア名を全部収集
const realAreas = new Set();
shops.forEach(s => {
  if (s.area) realAreas.add(s.area);
  if (s.city) realAreas.add(s.city);
  if (s.prefecture) realAreas.add(s.prefecture);
});

// locations.jsのWARDSキーと照合
const code = fs.readFileSync('./src/data/locations.js', 'utf8');
const vm = require('vm');
const sandbox = {};
vm.runInNewContext(code.replace(/export const /g, 'const '), sandbox);

const ghostKeys = Object.keys(sandbox.WARDS).filter(k => !realAreas.has(k));
console.log('ゴーストキー数:', ghostKeys.length);
console.log(ghostKeys.slice(0, 20));
