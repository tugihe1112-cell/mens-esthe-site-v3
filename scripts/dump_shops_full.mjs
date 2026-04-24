import fs from 'fs';

function run() {
  const path = 'src/data/shops.json';
  if (!fs.existsSync(path)) {
    console.log('ファイルが見つかりません。');
    return;
  }
  
  const raw = JSON.parse(fs.readFileSync(path, 'utf8'));
  const shops = Array.isArray(raw) ? raw : raw.shops || [];
  
  const yuru = shops.find(s => s.id === 'tokyo_shinagawa_gotanda_yuru_spa');
  const menes = shops.find(s => s.id === 'tokyo_setagaya_futakotamagawa_mens_esthe_group');

  console.log('==================================================');
  console.log('✅ ゆるスパ 五反田店 の全データ');
  console.log('==================================================');
  console.log(JSON.stringify(yuru, null, 2));
  
  console.log('\n==================================================');
  console.log('⚠️ メンエスグループ の全データ');
  console.log('==================================================');
  console.log(JSON.stringify(menes, null, 2));
}

run();
