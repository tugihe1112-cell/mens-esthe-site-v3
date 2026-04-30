const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));
const eren = data.filter(s => String(s.id).includes('eren') || s.brandId === 'eren');
console.log('eren店舗数:', eren.length);
eren.forEach(s => console.log(s.id, '| therapists数:', s.therapists ? s.therapists.length : 0, '| group_id:', s.group_id));
