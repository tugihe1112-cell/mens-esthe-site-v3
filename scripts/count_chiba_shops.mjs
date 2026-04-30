import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 千葉エリアの登録店舗数を調査します...\n');
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id')
      .or('area_id.ilike.%chiba%,name.ilike.%千葉%');

    if (error) throw error;

    console.log(`✅ 千葉エリアに関連する店舗は 【 ${shops.length} 店舗 】 登録されています。\n`);

    if (shops.length > 0) {
      shops.forEach((shop, index) => {
        console.log(`[${index + 1}] 店舗名: ${shop.name}`);
        console.log(`    └ エリアID: ${shop.area_id}`);
      });
    } else {
      console.log('⚠️ 千葉エリアの店舗はまだ1件も登録されていないようです。');
    }
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
