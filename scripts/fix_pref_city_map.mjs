import fs from 'fs';
import path from 'path';

async function main() {
  const targetFile = path.resolve('src/data/locations.js');
  
  if (!fs.existsSync(targetFile)) {
    console.log('⚠️ locations.js が見つかりません。');
    return;
  }

  let content = fs.readFileSync(targetFile, 'utf-8');

  // 先ほどの修復スクリプトで足した「空っぽの PREF_CITY_MAP」を完全に消去
  content = content.replace(/\/\/ --- 自動修復スクリプトによって追加 ---\nexport const PREF_CITY_MAP = \{\};\n?/g, '');
  content = content.replace(/export const PREF_CITY_MAP\s*=\s*\{\};/g, '');

  // ファイルの末尾に、WARDS を PREF_CITY_MAP としても export する行を追加
  // これにより、React側が PREF_CITY_MAP を要求しても、中身の詰まった WARDS のデータが渡されるようになります。
  content += `\n// --- PREF_CITY_MAP エイリアス --- \nexport const PREF_CITY_MAP = WARDS;\n`;

  fs.writeFileSync(targetFile, content);

  console.log('✅ PREF_CITY_MAP のデータを WARDS（実体データ）に紐付け直しました！');
  console.log('🔄 ブラウザをリロードして、メニューの枠の中に正しく文字（地名）が表示されるか確認してください。');
}

main();
