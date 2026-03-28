import fs from 'fs';

// エリアマッピング（ディレクトリ名 → 店舗情報）
const areaMap = {
  'ginza': { city: '中央区', area: '銀座' },
  'shinjuku_gyoen': { city: '新宿区', area: '新宿御苑' },
  'okubo': { city: '新宿区', area: '大久保' },
  'takadanobaba': { city: '新宿区', area: '高田馬場' },
  'higashishinjuku': { city: '新宿区', area: '東新宿' },
  'shinjuku_sanchome': { city: '新宿区', area: '新宿三丁目' },
  'nishishinjuku': { city: '新宿区', area: '西新宿' },
  'ikebukuro': { city: '豊島区', area: '池袋' },
  'shibuya': { city: '渋谷区', area: '渋谷' }
};

// すべてのmirajour.jsonを検索
import { execSync } from 'child_process';
const files = execSync('find public/data -name "mirajour.json"').toString().trim().split('\n');

console.log(`見つかったファイル数: ${files.length}\n`);

files.forEach(filePath => {
  // パスからエリア情報を抽出
  const parts = filePath.split('/');
  const areaDir = parts[parts.length - 2];
  
  const locationInfo = areaMap[areaDir];
  if (!locationInfo) {
    console.log(`⚠️  マッピングなし: ${filePath} (${areaDir})`);
    return;
  }
  
  // JSONを読み込んで修正
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  data[0].city = locationInfo.city;
  data[0].area = locationInfo.area;
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ ${locationInfo.area} (ID: ${data[0].id}): city="${locationInfo.city}", area="${locationInfo.area}"`);
});

console.log('\n✅ 完了！shops.jsonを再生成してください');
