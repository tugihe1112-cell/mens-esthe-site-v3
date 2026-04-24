import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');

try {
  const locData = fs.readFileSync(locFile, 'utf8');
  console.log('🔍 locations.js 内の「三軒茶屋」関連エリアの検索結果:\n');
  
  // 世田谷区の確認
  const setagayaMatch = locData.match(/.*世田谷区.*/g);
  if (setagayaMatch) {
    console.log(`✅ 世田谷区の記述:\n  ${setagayaMatch.join('\n  ')}`);
  } else {
    console.log(`❌ 「世田谷区」は見つかりませんでした。`);
  }

  // 三軒茶屋の確認
  const sangenjayaMatch = locData.match(/.*三軒茶屋.*/g);
  if (sangenjayaMatch) {
    console.log(`\n✅ 三軒茶屋のマッピングの記述:\n  ${sangenjayaMatch.join('\n  ')}`);
  } else {
    console.log(`❌ 「三軒茶屋」のマッピングは見つかりませんでした。`);
  }

} catch (err) {
  console.error('❌ ファイルの読み込みに失敗しました:', err.message);
}
