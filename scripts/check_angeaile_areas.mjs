import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');

try {
  const locData = fs.readFileSync(locFile, 'utf8');
  console.log('🔍 locations.js 内の Anjuaile 展開エリアの検索結果:\n');
  
  const areasToCheck = ['蒲田', '下北沢', '八王子', '調布', '町田', '藤沢'];
  
  areasToCheck.forEach(area => {
    const regex = new RegExp(`.*${area}.*`, 'g');
    const match = locData.match(regex);
    if (match) {
      console.log(`✅ 「${area}」は見つかりました:\n  ${match.join('\n  ')}`);
    } else {
      console.log(`❌ 「${area}」は見つかりませんでした。`);
    }
  });

} catch (err) {
  console.error('❌ ファイルの読み込みに失敗しました:', err.message);
}
