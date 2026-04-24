import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

console.log('🔍 ShopDetailPage.jsx 内の画像（<img>）とロゴ関連のコードを確認します...');

let found = false;
lines.forEach((line, i) => {
  // imgタグ、または先ほど追加したlogoUrlが含まれる行を抽出
  if (line.includes('<img') || line.includes('logoUrl')) {
    console.log(`\n📍 L${i + 1}:`);
    console.log('--------------------------------------------------');
    console.log(lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 4)).join('\n'));
    console.log('--------------------------------------------------');
    found = true;
  }
});

if (!found) {
  console.log('⚠️ 対象のコードが見つかりませんでした。');
}
