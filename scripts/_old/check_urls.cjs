const fs = require('fs');
const shops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));
const missing = shops.filter(s =>
  s.prefecture === '東京都' &&
  !String(s.id).match(/^\d+$/) &&
  !s.websiteUrl && !s.website_url
);
console.log('URLなし店舗数:', missing.length);
missing.slice(0,10).forEach(s => console.log(' ', s.id, '|', s.name));
