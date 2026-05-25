const fs = require('fs');
const path = 'src/data/all_shops.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const shops = Array.isArray(data) ? data : Object.values(data);

// Mrs Crystalを含む店舗を抽出
const targets = shops.filter(s => s.name && s.name.includes("Mrs Crystal"));

console.log(`🔍 Mrs Crystal の登録状況 (${targets.length}件):`);
targets.forEach(s => {
  console.log(`--------------------------------------------------`);
  console.log(`  店名: ${s.name}`);
  console.log(`  ID  : ${s.id}`);
});
