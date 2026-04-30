const fs = require('fs');

const supaTherapists = JSON.parse(
  fs.readFileSync('./database_backups/therapists_backup_2026-04-11T01-34-25-910Z.json', 'utf8')
);
const supaShopIds = new Set(supaTherapists.map(t => t.shop_id));

const shops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));

// 東京都 かつ 正規ID（数字IDを除く）の未登録店舗
const missing = shops.filter(s =>
  s.prefecture === '東京都' &&
  !String(s.id).match(/^\d+$/) &&
  !supaShopIds.has(s.id)
);

console.log('正規IDで未登録の東京都店舗:', missing.length, '件');
missing.forEach(s => console.log(' ', s.id, '|', s.name));
