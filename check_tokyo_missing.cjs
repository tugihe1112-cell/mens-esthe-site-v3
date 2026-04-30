const fs = require('fs');

const supaTherapists = JSON.parse(
  fs.readFileSync('./database_backups/therapists_backup_2026-04-11T01-34-25-910Z.json', 'utf8')
);
const supaShopIds = new Set(supaTherapists.map(t => t.shop_id));

const shops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));

// 東京都の店舗だけ絞り込む
const tokyoShops = shops.filter(s => s.prefecture === '東京都');

const missing = tokyoShops.filter(s => !supaShopIds.has(s.id));
const ok = tokyoShops.filter(s => supaShopIds.has(s.id));

console.log('東京都の店舗総数:', tokyoShops.length);
console.log('✅ Supabase登録あり:', ok.length, '件');
console.log('❌ Supabase未登録:', missing.length, '件');

console.log('\n=== ❌ 未登録店舗一覧 ===');
missing.forEach(s => console.log(' ', s.id, '|', s.name, '|', s.area));

const rows = ['id,name,area'];
missing.forEach(s => rows.push([s.id, s.name, s.area].join(',')));
fs.writeFileSync('tokyo_missing_therapists.csv', rows.join('\n'), 'utf8');
console.log('\n✅ tokyo_missing_therapists.csv に出力しました');
