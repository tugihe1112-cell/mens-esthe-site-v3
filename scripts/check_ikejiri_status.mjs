import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 池尻大橋エリアの設定と AUTHORITY の登録状況を確認します...\n');

  try {
    // 1. locations.js の確認
    const locFile = path.resolve('src/data/locations.js');
    if (fs.existsSync(locFile)) {
      const locData = fs.readFileSync(locFile, 'utf8');
      console.log('▼ src/data/locations.js 内の「池尻大橋」検索結果:');
      const ikejiriMatch = locData.match(/.*池尻大橋.*/g);
      if (ikejiriMatch) {
        console.log(ikejiriMatch.join('\n'));
      } else {
        console.log('❌ 「池尻大橋」は見つかりませんでした。');
      }

      console.log('\n▼ 「世田谷区」と「目黒区」の現在の定義:');
      const setagayaMatch = locData.match(/"世田谷区":\s*\[.*?\]/);
      const meguroMatch = locData.match(/"目黒区":\s*\[.*?\]/);
      if (setagayaMatch) console.log(`  ${setagayaMatch[0]}`);
      if (meguroMatch) console.log(`  ${meguroMatch[0]}`);
    }

    console.log('\n--------------------------------------------------\n');

    // 2. データベースの確認
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id')
      .or('name.ilike.%AUTHORITY%,name.ilike.%オーソリティ%');

    if (error) throw error;

    if (shops && shops.length > 0) {
      console.log('▼ DBに登録されている AUTHORITY の店舗リスト:');
      shops.forEach(shop => {
        console.log(`  - ${shop.name} (ID: ${shop.id}, エリア: ${shop.area_id})`);
      });
    } else {
      console.log('⚠️ DBに AUTHORITY の店舗はまだ登録されていません。');
    }

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
