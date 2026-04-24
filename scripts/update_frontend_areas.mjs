import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');
const revFile = path.resolve('src/pages/RequestReviewPage.jsx');

try {
  // 1. locations.js の更新
  let locData = fs.readFileSync(locFile, 'utf8');
  
  // 都道府県配列への追加
  if (!locData.includes('"葛飾区"')) {
    locData = locData.replace(/"東京都":\s*\[(.*?)\],/g, '"東京都": [$1, "葛飾区"],');
  }
  if (!locData.includes('"松戸市"')) {
    locData = locData.replace(/"千葉県":\s*\[(.*?)\],/g, '"千葉県": [$1, "松戸市", "市川市"],');
  }
  
  // 市区町村からエリアへのマッピング追加 (川越市の後ろに追記)
  if (!locData.includes('"松戸"')) {
    const extraMappings = '\n  "葛飾区": ["新小岩", "亀有"],\n  "松戸市": ["松戸"],\n  "市川市": ["本八幡"],\n  "越谷市": ["南越谷"],';
    locData = locData.replace(/"川越市":\s*\["川越"\],/g, `"川越市": ["川越"],${extraMappings}`);
  }
  
  fs.writeFileSync(locFile, locData);
  console.log('✅ src/data/locations.js を自動更新しました（エリア追加完了）');

  // 2. RequestReviewPage.jsx の更新
  let revData = fs.readFileSync(revFile, 'utf8');
  if (!revData.includes('"葛飾区"')) {
    // 既存の並びを見つけて追加
    revData = revData.replace(/"さいたま市",\s*"川越市",/g, '"さいたま市", "川越市", "葛飾区", "松戸市", "市川市",');
  }
  
  fs.writeFileSync(revFile, revData);
  console.log('✅ src/pages/RequestReviewPage.jsx を自動更新しました（口コミエリア追加完了）');

} catch (err) {
  console.error('❌ ファイルの更新に失敗しました:', err.message);
}
