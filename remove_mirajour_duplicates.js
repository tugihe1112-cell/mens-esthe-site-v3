import fs from 'fs';

const shops = JSON.parse(fs.readFileSync('src/data/all_shops.json', 'utf8'));

// Mirajourを検索
const mirajour = shops.filter(s => s.name.includes('Mirajour'));
console.log('削除前のMirajour店舗数:', mirajour.length);

// ID 60025を残す（新宿・池袋・銀座をカバー）
const keepId = 60025;
const mirajourIds = mirajour.map(s => s.id);

// Mirajour以外の店舗 + ID 60025のMirajour のみ残す
const filtered = shops.filter(s => 
  !s.name.includes('Mirajour') || s.id === keepId
);

console.log('削除前の店舗数:', shops.length);
console.log('削除後の店舗数:', filtered.length);
console.log('削除した店舗数:', shops.length - filtered.length);

// 保存
fs.writeFileSync('src/data/all_shops.json', JSON.stringify(filtered, null, 2));
fs.writeFileSync('public/data/shops.json', JSON.stringify(filtered, null, 2));

console.log('✅ Mirajour重複を削除しました');
console.log('残したMirajour:', filtered.find(s => s.id === keepId)?.name);
