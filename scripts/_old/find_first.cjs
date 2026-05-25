const fs = require('fs');
const shops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));
const first = shops.filter(s => 
  String(s.name).includes('First') || 
  String(s.name).includes('ファースト') ||
  String(s.id).includes('first')
);
first.forEach(s => console.log(s.id, '|', s.name, '|', s.websiteUrl || s.website_url));
