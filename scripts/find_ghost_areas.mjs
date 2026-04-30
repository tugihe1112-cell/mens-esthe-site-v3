import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 エリア定義（locations.js）とDBを突き合わせ、実店舗が0件のエリアを調査します...\n');

  // locations.js の簡易パース（正規表現でキーと配列要素をざっくり抽出）
  const locationsContent = fs.readFileSync('src/data/locations.js', 'utf8');
  const allSubAreas = new Set();
  
  // 文字列配列の中身を抽出する簡単な正規表現
  const matches = locationsContent.match(/"([^"-]+)"/g);
  if (matches) {
    matches.forEach(m => {
      const areaName = m.replace(/"/g, '').trim();
      if (areaName && areaName !== 'tokyo' && areaName.length > 1) {
        allSubAreas.add(areaName);
      }
    });
  }

  // 1. 全店舗のデータを取得してメモリに乗せる（高速化のため）
  const { data: shops, error } = await supabase.from('shops').select('name, raw_data, id');
  if (error) {
    console.error('❌ DB取得エラー:', error.message);
    return;
  }

  const ghostAreas = [];
  const activeAreas = [];

  // 2. 抽出したエリア名ごとに、店舗が存在するかチェック
  for (const area of allSubAreas) {
    // 検索をスキップする汎用的な単語を除外
    if (area === '東京' || area === '首都圏' || area === '区' || area.includes('---')) continue;

    let foundCount = 0;
    
    // DB内の全店舗の「名前」「ID」「raw_data内のエリア情報」にそのエリア名が含まれているかチェック
    shops.forEach(shop => {
      const raw = shop.raw_data || {};
      const shopArea = raw.area || '';
      const shopCity = raw.city || '';
      const shopPref = raw.prefecture || '';
      
      if (
        shop.name.includes(area) ||
        shop.id.includes(area) ||
        shopArea.includes(area) ||
        shopCity.includes(area) ||
        shopPref.includes(area)
      ) {
        foundCount++;
      }
    });

    if (foundCount === 0) {
      ghostAreas.push(area);
    } else {
      activeAreas.push({ area, count: foundCount });
    }
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`👻 店舗が1件も登録されていないゴーストエリア: 【 ${ghostAreas.length} 件 】`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (ghostAreas.length > 0) {
    console.log(ghostAreas.join(', '));
  }

  // 結果をファイルにも保存
  fs.writeFileSync('ghost_areas_report.json', JSON.stringify({
    ghostAreas,
    activeAreas: activeAreas.sort((a, b) => b.count - a.count)
  }, null, 2));
  
  console.log('\n✅ 詳細レポートを `ghost_areas_report.json` に保存しました。');
}

main();
