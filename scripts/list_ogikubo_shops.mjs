import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 荻窪エリアの店舗一覧を確認します...\n');
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id, image_url')
      .eq('area_id', 'tokyo_suginami_ogikubo');

    if (error) throw error;

    console.log(`📍 荻窪エリアで見つかった店舗: ${shops.length}件`);
    shops.forEach(shop => {
      const status = shop.image_url && !shop.image_url.includes('placehold.jp') ? '✅ 画像あり' : '⚠️ 画像なし/仮';
      console.log(`- [${shop.name}]`);
      console.log(`  ID: ${shop.id}`);
      console.log(`  状態: ${status}`);
      console.log('---');
    });
    
  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}
main();
