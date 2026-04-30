import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🔍 フロントエンド（画面側）が認識しているエリア階層を確認します...\n');
  
  const candidates = [
    'src/data/areas.json',
    'public/data/areas.json'
  ];

  let found = false;

  for (const p of candidates) {
    const fullPath = path.resolve(p);
    if (fs.existsSync(fullPath)) {
      found = true;
      console.log(`✅ エリア定義ファイルを発見: ${p}`);
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      
      console.log('\n--- 現在の画面上の選択肢（東京・渋谷周辺） ---');
      
      // データ構造がフラットかネストか分からないため、安全に全体を走査
      const shibuyaRelated = data.filter(item => 
        JSON.stringify(item).includes('tokyo') || JSON.stringify(item).includes('shibuya')
      );

      if (shibuyaRelated.length > 0) {
        shibuyaRelated.forEach(area => {
          console.log(`■ ${area.name || '名前なし'} (ID: ${area.id})`);
          // もし子エリア（sub_areas）を持っていれば表示
          if (area.sub_areas && Array.isArray(area.sub_areas)) {
            area.sub_areas.forEach(sub => {
              console.log(`   └ ${sub.name || '名前なし'} (ID: ${sub.id})`);
            });
          }
        });
      } else {
        console.log('東京・渋谷に関連するエリア定義が見当たりませんでした。');
        console.log('ファイルの一部抜粋:', JSON.stringify(data).substring(0, 300));
      }
      break;
    }
  }

  if (!found) {
    console.log('⚠️ エリア定義のJSONファイルが見つかりませんでした。別の場所（定数ファイルなど）で定義されている可能性があります。');
  }
}
main();
