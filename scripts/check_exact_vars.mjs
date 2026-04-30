import fs from 'fs';

try {
  const text = fs.readFileSync('src/pages/ShopDetailPage.jsx', 'utf8');
  const lines = text.split('\n');

  console.log('▼ 料金(PRICE)のコード');
  const priceIdx = lines.findIndex(l => l.includes('PRICE</dt>'));
  if(priceIdx !== -1) {
    console.log(lines.slice(priceIdx, priceIdx + 15).join('\n'));
  }

  console.log('\n▼ リンク(a href)のコード');
  // href={shop.xxx} のような記述を探す
  for(let i=0; i<lines.length; i++) {
    if(lines[i].includes('href={') && (lines[i].includes('shop.') || lines[i].includes('raw_data'))) {
      console.log(lines.slice(Math.max(0, i-2), i+3).join('\n'));
      console.log('---');
    }
  }
} catch(e) {
  console.log('エラー:', e.message);
}
