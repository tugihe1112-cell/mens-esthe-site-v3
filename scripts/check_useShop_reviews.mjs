import fs from 'fs';
import path from 'path';

// 考えられるデータ取得ファイルの候補
const candidates = [
  'src/hooks/useShop.js',
  'src/hooks/useShopDetails.js',
  'src/pages/ShopDetailPage.jsx' // 念のためもう一度別のキーワードで
];

let found = false;

for (const file of candidates) {
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    
    // group_id や brand_id、あるいは or 条件を使っている部分を探す
    const idx = lines.findIndex(l => l.includes('group_id') || l.includes('brand_id') || l.includes('.or('));
    
    if (idx !== -1) {
      console.log(`\n🎯 【発見】 ${file} のクチコミ/店舗データ取得ロジック`);
      console.log('--------------------------------------------------');
      console.log(lines.slice(Math.max(0, idx - 10), Math.min(lines.length, idx + 20)).join('\n'));
      console.log('--------------------------------------------------');
      found = true;
    }
  }
}

if (!found) {
  console.log('⚠️ group_id や brand_id を使ったロジックが見つかりませんでした。');
}
