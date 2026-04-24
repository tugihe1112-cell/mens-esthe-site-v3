import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// 「reviews」を取得して画面にセットしている付近をピンポイントで探します
const targetIdx = lines.findIndex(l => l.includes('from(\'reviews\')') || l.includes('from("reviews")') || l.includes('setReviews'));

if (targetIdx !== -1) {
  console.log(`\n🎯 【発見】クチコミ取得のコアロジック`);
  console.log('--------------------------------------------------');
  // 前後15行を抽出してロジックの全体像を見ます
  console.log(lines.slice(Math.max(0, targetIdx - 10), Math.min(lines.length, targetIdx + 20)).join('\n'));
  console.log('--------------------------------------------------');
} else {
  // もしAPI経由（fetch）で取っている場合
  const fetchIdx = lines.findIndex(l => l.includes('fetch') && l.includes('reviews'));
  if (fetchIdx !== -1) {
    console.log(`\n🎯 【発見】API経由でのクチコミ取得ロジック`);
    console.log('--------------------------------------------------');
    console.log(lines.slice(Math.max(0, fetchIdx - 5), Math.min(lines.length, fetchIdx + 15)).join('\n'));
    console.log('--------------------------------------------------');
  } else {
    console.log('⚠️ やはり見つかりません。別のファイル（コンポーネント）に切り出されている可能性があります。');
  }
}
