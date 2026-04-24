import fs from 'fs';
import path from 'path';

const locFile = path.resolve('src/data/locations.js');

try {
  const locData = fs.readFileSync(locFile, 'utf8');
  
  console.log('🔍 locations.js 内の「足立区（北千住）」検索結果:');
  const adachiMatch = locData.match(/.*足立区.*/g);
  const kinshichoMatch = locData.match(/.*北千住.*/g);
  
  if (adachiMatch) {
    console.log(adachiMatch.join('\n'));
  } else {
    console.log('「足立区」は見つかりませんでした。');
  }
  
  if (kinshichoMatch && !adachiMatch) {
     console.log('北千住でのマッチ:', kinshichoMatch.join('\n'));
  }

  console.log('\n🔍 locations.js 内の「さいたま市（南浦和）」検索結果:');
  const saitamaMatch = locData.match(/.*さいたま市.*/g);
  const minamiUrawaMatch = locData.match(/.*南浦和.*/g);

  if (saitamaMatch) {
    console.log(saitamaMatch.join('\n'));
  } else {
    console.log('「さいたま市」は見つかりませんでした。');
  }
  
  if (minamiUrawaMatch && !saitamaMatch) {
     console.log('南浦和でのマッチ:', minamiUrawaMatch.join('\n'));
  }

} catch (err) {
  console.error('❌ ファイルの読み込みに失敗しました:', err.message);
}
