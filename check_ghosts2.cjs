const fs = require('fs');
const shops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));

const realAreas = new Set();
shops.forEach(s => {
  if (s.area) realAreas.add(s.area);
  if (s.city) realAreas.add(s.city);
  if (s.prefecture) realAreas.add(s.prefecture);
});

// constをvarに変換してsandboxに載せる
const code = fs.readFileSync('./src/data/locations.js', 'utf8');
const vm = require('vm');
const sandbox = {};
const cjs = code
  .replace(/export const /g, 'var ')
  .replace(/Object\.fromEntries[\s\S]*?]\s*\)\s*\)/m, '{}'); // PREF_CITY_MAPの評価エラー回避

vm.runInNewContext(cjs, sandbox);

const WARDS = sandbox.WARDS;
console.log('WAROSキー総数:', Object.keys(WARDS).length);

const ghostKeys = Object.keys(WARDS).filter(k => !realAreas.has(k));
console.log('ゴーストキー数:', ghostKeys.length);
console.log('先頭20件:', ghostKeys.slice(0, 20));

// ghost_areas_report.jsonの中身も確認
const existing = JSON.parse(fs.readFileSync('./ghost_areas_report.json', 'utf8'));
console.log('\nghost_areas_report.jsonの型:', Array.isArray(existing) ? '配列' : typeof existing);
console.log('件数:', Array.isArray(existing) ? existing.length : Object.keys(existing).length);
console.log('先頭5件:', Array.isArray(existing) ? existing.slice(0,5) : Object.keys(existing).slice(0,5));
