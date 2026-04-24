import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');

try {
  let locData = fs.readFileSync(locFile, 'utf8');
  
  // 埼玉県の配列部分だけを抜き出して判定
  const saitamaRegex = /"埼玉県":\s*\[(.*?)\]/;
  const match = locData.match(saitamaRegex);

  if (match) {
    const currentArray = match[1]; // 例: '"さいたま市", "川越市", "川口市"'
    if (!currentArray.includes('"越谷市"')) {
      // 埼玉県の配列内に越谷市がない場合のみ追加
      locData = locData.replace(saitamaRegex, `"埼玉県": [${currentArray}, "越谷市"]`);
      fs.writeFileSync(locFile, locData);
      console.log('✅ 【成功】埼玉県の配列に「越谷市」を確実に追加しました！');
    } else {
      console.log('⚠️ 埼玉県の配列にすでに「越谷市」が存在します。');
    }
  } else {
    console.log('❌ 埼玉県の配列が見つかりませんでした。');
  }

} catch (err) {
  console.error('❌ ファイルの更新に失敗しました:', err.message);
}
