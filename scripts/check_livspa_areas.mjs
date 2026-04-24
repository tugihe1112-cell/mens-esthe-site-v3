import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');

try {
  const locData = fs.readFileSync(locFile, 'utf8');
  console.log('🔍 locations.js 内の LIVSPA 展開エリアの検索結果:\n');
  
  // 大田区・蒲田の確認
  const otaMatch = locData.match(/.*大田区.*/g);
  if (otaMatch) {
    console.log(`✅ 大田区の記述:\n  ${otaMatch.join('\n  ')}`);
  } else {
    console.log(`❌ 「大田区」は見つかりませんでした。`);
  }

  // 川崎市の確認
  const kawasakiPrefMatch = locData.match(/.*神奈川県.*/g);
  if (kawasakiPrefMatch) {
     console.log(`\n✅ 神奈川県の記述:\n  ${kawasakiPrefMatch.join('\n  ')}`);
  } else {
     console.log(`❌ 「神奈川県」は見つかりませんでした。`);
  }

  const kawasakiMatch = locData.match(/.*川崎市.*/g);
  if (kawasakiMatch) {
    console.log(`\n✅ 川崎市のマッピングの記述:\n  ${kawasakiMatch.join('\n  ')}`);
  } else {
    console.log(`❌ 「川崎市」のマッピングは見つかりませんでした。`);
  }

} catch (err) {
  console.error('❌ ファイルの読み込みに失敗しました:', err.message);
}
