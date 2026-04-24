import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 Pepe Spa (ペペスパ) の登録状況とエリア設定を確認します...\n');

  try {
    // 1. データベースの確認
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id')
      .or('name.ilike.%Pepe%,name.ilike.%ペペスパ%');

    if (error) throw error;

    if (shops && shops.length > 0) {
      console.log('▼ DBに登録されている Pepe Spa の店舗:');
      shops.forEach(shop => {
        console.log(`  - 店舗名: ${shop.name}`);
        console.log(`    店舗ID: ${shop.id}`);
        console.log(`    エリアID: ${shop.area_id}`);
      });
    } else {
      console.log('⚠️ DBに「Pepe Spa (ペペスパ)」を含む店舗はまだ登録されていません。');
    }

    console.log('\n--------------------------------------------------\n');

    // 2. フロントエンド (locations.js) の確認
    const locFile = path.resolve('src/data/locations.js');
    if (fs.existsSync(locFile)) {
      const locData = fs.readFileSync(locFile, 'utf8');
      console.log('▼ 現在の src/data/locations.js の設定状況:');
      
      // 主要な都道府県の配列を抽出して表示
      const areaRegex = /"(東京都|神奈川県|埼玉県|千葉県|大阪府)":\s*\[(.*?)\]/g;
      let match;
      let found = false;
      while ((match = areaRegex.exec(locData)) !== null) {
        console.log(`  【${match[1]}】: [${match[2]}]`);
        found = true;
      }
      if (!found) {
        console.log('  ※ 正規表現でエリア設定をうまく抽出できませんでした。');
      }
    } else {
      console.log('❌ src/data/locations.js が見つかりませんでした。');
    }

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
