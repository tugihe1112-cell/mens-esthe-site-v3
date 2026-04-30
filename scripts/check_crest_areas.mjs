import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');

try {
  const locData = fs.readFileSync(locFile, 'utf8');
  console.log('🔍 locations.js 内のエリア検索結果:\n');
  
  const targetAreas = ['立川', '荻窪', '赤羽', '吉祥寺'];
  
  targetAreas.forEach(area => {
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
