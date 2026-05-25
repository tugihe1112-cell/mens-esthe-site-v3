const fs = require('fs');
const shops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));
const sample = shops.find(s => s.id == '1130');
console.log(JSON.stringify(sample?.therapists?.slice(0,3), null, 2));
