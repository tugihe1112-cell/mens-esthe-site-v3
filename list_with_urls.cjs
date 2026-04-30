const fs = require('fs');
const supa = JSON.parse(fs.readFileSync('./database_backups/therapists_backup_2026-04-11T01-34-25-910Z.json', 'utf8'));
const supaIds = new Set(supa.map(t => t.shop_id));
const shops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));
const targets = shops.filter(s =>
  s.prefecture === '東京都' &&
  !String(s.id).match(/^\d+$/) &&
  !supaIds.has(s.id) &&
  (s.websiteUrl || s.website_url)
);
console.log('URLあり未登録店舗:', targets.length, '件');
targets.forEach(s => console.log(s.id, '|', s.name, '|', s.websiteUrl || s.website_url));
