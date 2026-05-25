const shops = require('./public/data/shops.json');

const idMap = {};
shops.forEach((s, index) => {
  if (!idMap[s.id]) idMap[s.id] = [];
  idMap[s.id].push({ index, name: s.name, prefecture: s.prefecture });
});

const duplicates = Object.entries(idMap).filter(([id, arr]) => arr.length > 1);
console.log('=== DUPLICATE SHOPS ===\n');
duplicates.forEach(([id, arr]) => {
  console.log(`ID: ${id} (${arr.length} times)`);
  arr.forEach(item => console.log(`  - ${item.name} (${item.prefecture}) [index: ${item.index}]`));
  console.log('');
});
