import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');
const revFile = path.resolve('src/pages/RequestReviewPage.jsx');

try {
  const locData = fs.readFileSync(locFile, 'utf8');
  
  console.log('🔍 locations.js 内の「錦糸町」検索結果:');
  const kinshichoMatch = locData.match(/.*錦糸町.*/g);
  if (kinshichoMatch) {
    console.log(kinshichoMatch.join('\n'));
  } else {
    console.log('「錦糸町」は見つかりませんでした。');
  }

  console.log('\n🔍 locations.js 内の「墨田区」検索結果:');
  const sumidaMatch = locData.match(/.*墨田区.*/g);
  if (sumidaMatch) {
    console.log(sumidaMatch.join('\n'));
  } else {
    console.log('「墨田区」は見つかりませんでした。');
  }

  const revData = fs.readFileSync(revFile, 'utf8');
  console.log('\n🔍 RequestReviewPage.jsx 内の「墨田区」検索結果:');
  const revSumidaMatch = revData.match(/.*墨田区.*/g);
  if (revSumidaMatch) {
    console.log(revSumidaMatch.join('\n').substring(0, 100) + '...'); // 長すぎる場合はカット
  } else {
    console.log('「墨田区」は見つかりませんでした。');
  }

} catch (err) {
  console.error('❌ ファイルの読み込みに失敗しました:', err.message);
}
