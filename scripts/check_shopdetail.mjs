import fs from 'fs';

try {
  const text = fs.readFileSync('src/pages/ShopDetailPage.jsx', 'utf8');
  const lines = text.split('\n');
  let extracted = false;
  
  for(let i=0; i<lines.length; i++) {
     // 料金、営業時間、オフィシャルサイトのリンク付近のコードを探す
     if(lines[i].includes('料金情報なし') || lines[i].includes('営業時間情報なし') || lines[i].includes('OFFICIAL WEBSITE')) {
        console.log('\n--- 📄 ShopDetailPage.jsx の該当部分 ---');
        console.log(lines.slice(Math.max(0, i-4), i+4).join('\n'));
        extracted = true;
     }
  }
  if(!extracted) console.log('該当するテキストが見つかりませんでした。別のコンポーネントの可能性があります。');
} catch(e) { 
  console.log('エラー:', e.message); 
}
