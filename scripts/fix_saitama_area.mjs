import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');

try {
  let locData = fs.readFileSync(locFile, 'utf8');
  
  // 埼玉県の配列に「越谷市」を追加
  if (!locData.includes('"越谷市"')) {
    // 既存の配列の中身を保持したまま、末尾に "越谷市" を追加します
    locData = locData.replace(/"埼玉県":\s*\[(.*?)\]/g, '"埼玉県": [$1, "越谷市"]');
    fs.writeFileSync(locFile, locData);
    console.log('✅ src/data/locations.js を修正し、埼玉県に「越谷市」を追加しました！');
  } else {
    console.log('⚠️ すでに「越谷市」は追加されています。');
  }

} catch (err) {
  console.error('❌ ファイルの更新に失敗しました:', err.message);
}
