import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 千葉・埼玉・大阪の【データベース登録状況】と【画面メニュー設定】を比較調査します...\n');

  const targets = [
    { eng: 'chiba', jpn: '千葉' },
    { eng: 'saitama', jpn: '埼玉' },
    { eng: 'osaka', jpn: '大阪' }
  ];

  console.log('==================================================');
  console.log(' 📊 1. データベース (Supabase) の実際の店舗数');
  console.log('==================================================');

  for (const t of targets) {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id')
      .or(`area_id.ilike.%${t.eng}%,name.ilike.%${t.jpn}%`);

    if (error) {
      console.log(`❌ ${t.jpn}の取得エラー: ${error.message}`);
      continue;
    }

    if (shops && shops.length > 0) {
      const areaCount = {};
      shops.forEach(s => {
        const aid = s.area_id || '未設定';
        areaCount[aid] = (areaCount[aid] || 0) + 1;
      });
      console.log(`✅ ${t.jpn}エリア (計 ${shops.length} 店舗):`);
      Object.entries(areaCount).forEach(([aid, count]) => {
         console.log(`   - ${aid}: ${count}店舗`);
      });
    } else {
      console.log(`⚠️ ${t.jpn}エリア: 実際の店舗登録は 0 件です。`);
    }
  }

  console.log('\n==================================================');
  console.log(' 🖥️ 2. 画面メニュー (locations.js) の設定状況');
  console.log('==================================================');

  const locPath = path.resolve('src/data/locations.js');
  if (fs.existsSync(locPath)) {
    const content = fs.readFileSync(locPath, 'utf-8');
    const lines = content.split('\n');

    let foundLines = new Set();

    lines.forEach((line, index) => {
      if (line.includes('千葉') || line.includes('埼玉') || line.includes('大阪')) {
        // メニューが配列で定義されているはずなので、見つかった行の前後を含めて抽出
        for (let j = 0; j <= 2; j++) {
           if (lines[index + j]) foundLines.add(`[${index + j + 1}行目] ${lines[index + j].trim()}`);
        }
        foundLines.add('---');
      }
    });

    if (foundLines.size > 0) {
       Array.from(foundLines).forEach(l => console.log(l));
       console.log('\n💡 結論: 上記の [2. 画面のメニュー] に名前があるのに、[1. DBの店舗数] に出てこない地名が、削除すべき「空っぽエリア」です！');
    } else {
       console.log('⚠️ locations.js 内に千葉・埼玉・大阪の記述が見つかりませんでした。');
    }
  } else {
    console.log('⚠️ src/data/locations.js が見つかりません。');
  }
}
main();
