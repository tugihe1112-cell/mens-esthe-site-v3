import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');

try {
  const locData = fs.readFileSync(locFile, 'utf8');
  console.log('🔍 locations.js 内の B-QINS 展開エリアの検索結果:\n');
  
  const areasToCheck = ['三軒茶屋', '自由が丘', '中目黒'];
  
  areasToCheck.forEach(area => {
    const regex = new RegExp(`.*${area}.*`, 'g');
    const match = locData.match(regex);
    if (match) {
      console.log(`✅ 「${area}」は見つかりました:\n  ${match.join('\n  ')}`);
    } else {
      console.log(`❌ 「${area}」は見つかりませんでした。`);
    }
  });

  // 目黒区の存在確認
  if (locData.includes('"目黒区":')) {
    console.log(`✅ 「目黒区」は定義されています。`);
  } else {
    console.log(`❌ 「目黒区」は定義されていません。`);
  }

} catch (err) {
  console.error('❌ ファイルの読み込みに失敗しました:', err.message);
}
