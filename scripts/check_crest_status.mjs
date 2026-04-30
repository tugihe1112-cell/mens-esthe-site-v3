import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 現在の荻窪エリアの店舗データを確認します...\n');
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, website_url, image_url, area_id')
      .eq('area_id', 'tokyo_suginami_ogikubo');

    if (error) throw error;

    if (shops.length === 0) {
      console.log('⚠️ 荻窪エリアに店舗が見つかりませんでした。');
    } else {
      shops.forEach((shop, index) => {
        console.log(`[${index + 1}] 店舗名: ${shop.name}`);
        console.log(`    ID: ${shop.id}`);
        console.log(`    URL: ${shop.website_url || '設定なし'}`);
        console.log(`    画像: ${shop.image_url ? '✅ あり' : '❌ なし'}`);
        console.log('    ---');
      });
    }
  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}
main();
