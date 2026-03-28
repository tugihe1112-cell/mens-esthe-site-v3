import fs from 'fs';
import { execSync } from 'child_process';

// エリア名マッピング（ディレクトリ名 → 表示名）
const areaMap = {
  'ginza': { city: '中央区', area: '銀座' },
  'nihonbashi': { city: '中央区', area: '日本橋' },
  'roppongi': { city: '港区', area: '六本木' },
  'takadanobaba': { city: '新宿区', area: '高田馬場' },
  'kabukicho': { city: '新宿区', area: '歌舞伎町' },
  'shinjuku': { city: '新宿区', area: '新宿' },
  'nishishinjuku': { city: '新宿区', area: '西新宿' },
  'ikebukuro': { city: '豊島区', area: '池袋' },
  'yoyogi_harajuku': { city: '渋谷区', area: '代々木・原宿' },
  'ebisu': { city: '渋谷区', area: '恵比寿' }
};

// すべてのaromamore.jsonを検索
const files = execSync('find public/data -name "aromamore.json"').toString().trim().split('\n');

console.log(`見つかったファイル数: ${files.length}`);

files.forEach(filePath => {
  // パスからエリア情報を抽出
  const parts = filePath.split('/');
  const areaDir = parts[parts.length - 2]; // 最後のディレクトリ名
  
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
  console.log(`✅ ${locationInfo.area}: city="${locationInfo.city}", area="${locationInfo.area}"`);
});

console.log('\n=== shops.jsonを再生成 ===');
execSync('node scripts/generate_shops_json.js');
console.log('✅ 完了！');
