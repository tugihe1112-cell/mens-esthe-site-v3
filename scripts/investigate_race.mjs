import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 【原因調査】データベース内の「RACE」「GRACE」関連データを徹底調査します...\n');

  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, group_id, raw_data, schedule_url')
      .or('name.ilike.%RACE%,name.ilike.%GRACE%,name.ilike.%レイス%,name.ilike.%グレイス%,schedule_url.ilike.%grace-meguro.com%');

    if (error) throw error;

    if (!shops || shops.length === 0) {
      console.log('⚠️ 該当する店舗データが見つかりませんでした。Supabase上には存在しない可能性があります。');
    } else {
      console.log(`✅ ${shops.length}件の関連店舗データを発見しました。\n`);
      
      shops.forEach(shop => {
        console.log(`📌 店舗ID: ${shop.id}`);
        console.log(`  - 登録名(name): ${shop.name}`);
        console.log(`  - URL: ${shop.schedule_url}`);
        
        // raw_dataの中にRACEが潜んでいないかチェック
        let hasRaceInRawData = false;
        if (shop.raw_data) {
          const rawDataStr = JSON.stringify(shop.raw_data);
          if (rawDataStr.includes('RACE') || rawDataStr.includes('レイス')) {
            hasRaceInRawData = true;
            console.log(`  🚨 【警告】raw_data内に「RACE」または「レイス」が含まれています！`);
            console.log(`      中身: ${rawDataStr.substring(0, 150)}...`);
          }
        }
        
        // 原因の推測
        if (shop.name.includes('GRACE') && !hasRaceInRawData) {
          console.log(`  💡 データベース上は完全に「GRACE」です。それでも画面がRACEの場合、フロントエンドのキャッシュか別ファイルの読み込みが原因です。`);
        }
        console.log('--------------------------------------------------');
      });
    }

  } catch (err) {
    console.error('❌ エラーが発生しました:', err);
  }
}

main();
