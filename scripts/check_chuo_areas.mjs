import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 東京都 中央区のエリアごとの登録店舗数を確認します...\n');

  // area_id が tokyo_chuo_ から始まるものをすべて取得
  const { data: shops, error } = await supabase
    .from('shops')
    .select('name, area_id')
    .like('area_id', 'tokyo_chuo_%');

  if (error) {
    console.error('❌ エラーが発生しました:', error);
    return;
  }

  const counts = {
    '銀座': 0,
    '日本橋': 0,
    '築地': 0,
    '月島': 0,
    '人形町': 0,
  };

  shops.forEach(shop => {
    if (shop.area_id.includes('ginza')) counts['銀座']++;
    else if (shop.area_id.includes('nihonbashi')) counts['日本橋']++;
    else if (shop.area_id.includes('tsukiji')) counts['築地']++;
    else if (shop.area_id.includes('tsukishima')) counts['月島']++;
    else if (shop.area_id.includes('ningyocho')) counts['人形町']++;
  });

  console.log('🏢 集計結果:');
  Object.entries(counts).forEach(([area, count]) => {
    if (count === 0) {
      console.log(`❌ ${area}: ${count}件 （※サイドバーから削除推奨）`);
    } else {
      console.log(`✅ ${area}: ${count}件`);
    }
  });
}

main();
