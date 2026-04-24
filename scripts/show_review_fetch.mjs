import fs from 'fs';

const lines = fs.readFileSync('src/pages/ShopDetailPage.jsx', 'utf8').split('\n');
let found = false;

for (let i = 0; i < lines.length; i++) {
  // DBからreviewsテーブルを引っ張っている箇所を探す
  if (lines[i].includes('from(\'reviews\')') || lines[i].includes('from("reviews")') || lines[i].includes('from(`reviews`)')) {
    console.log('\n👀 【発見】クチコミ取得コード:');
    console.log(lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 6)).join('\n'));
    found = true;
    break; 
  }
}

if (!found) console.log('❌ コードが見つかりませんでした。');
