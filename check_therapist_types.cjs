const fs = require('fs');
const shops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));

let patternA = 0; // 連番IDのみ
let patternB = 0; // 実名あり
const patternBShops = [];

shops.forEach(s => {
  if (!s.therapists || s.therapists.length === 0) return;
  const hasRealName = s.therapists.some(t => {
    if (typeof t !== 'string') return false;
    const parts = t.split('_');
    const name = parts[parts.length - 1];
    return isNaN(name) && !name.match(/^\d+-\d+$/);
  });
  if (hasRealName) {
    patternB++;
    patternBShops.push({ id: s.id, name: s.name, sample: s.therapists[0] });
  } else {
    patternA++;
  }
});

console.log('パターンA（連番IDのみ・実質データなし）:', patternA, '件');
console.log('パターンB（実名あり・移行価値あり）:', patternB, '件');
console.log('\nパターンBの先頭10件:');
patternBShops.slice(0, 10).forEach(s => 
  console.log(' ', s.id, '|', s.name, '|', s.sample)
);
