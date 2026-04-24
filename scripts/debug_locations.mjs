import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');

try {
  const locData = fs.readFileSync(locFile, 'utf8');
  
  console.log('🔍 [1] 「世田谷区」の現在の定義ブロック:');
  const setagayaMatch = locData.match(/"世田谷区":\s*\[[\s\S]*?\]/);
  if (setagayaMatch) {
    console.log(setagayaMatch[0]);
  } else {
    console.log('❌ 「世田谷区」の定義が見つかりません。');
  }

  console.log('\n🔍 [2] 「目黒区」の残存確認:');
  const meguroMatch = locData.match(/"目黒区"[\s\S]*?(?=\n|\]|\})/g);
  if (meguroMatch) {
    console.log(meguroMatch.join('\n'));
  } else {
    console.log('✅ 目黒区の記述は存在しません。');
  }

  console.log('\n🔍 [3] 「池尻大橋」のファイル内完全検索 (行数付き):');
  const lines = locData.split('\n');
  let found = false;
  lines.forEach((line, index) => {
    if(line.includes('池尻大橋')) {
      console.log(`行 ${index + 1}: ${line.trim()}`);
      found = true;
    }
  });
  if (!found) {
    console.log('❌ ファイル内に「池尻大橋」という文字列は一切存在しません。');
  }

} catch (err) {
  console.error('❌ ファイルの読み込みに失敗しました:', err.message);
}
