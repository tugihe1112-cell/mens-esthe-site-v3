const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));

const targets = data.filter(s => 
  String(s.name).includes('AROMA more') || 
  String(s.name).includes('アロマモア') ||
  String(s.name).includes('リンダ') ||
  String(s.name).includes('LINDA') ||
  String(s.brandId) === 'aromamore' ||
  String(s.brandId) === 'linda_spa'
);

targets.forEach(s => {
  console.log('=== ' + s.name + ' ===');
  console.log('id:', s.id);
  console.log('brandId:', s.brandId);
  console.log('group_id:', s.group_id);
  console.log('image:', s.image);
  console.log('image_url:', s.image_url);
  console.log('therapists数:', s.therapists ? s.therapists.length : 0);
  console.log('therapists[0]:', s.therapists ? s.therapists[0] : 'なし');
  console.log('');
});
