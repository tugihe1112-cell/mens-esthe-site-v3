import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 DB内の「a laise」関連店舗をすべて確認します...\n');
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id, raw_data')
      .ilike('name', '%laise%');

    if (error) throw error;

    shops.forEach(shop => {
      console.log(`- 店舗名: ${shop.name}`);
      console.log(`  ID: ${shop.id}`);
      console.log(`  エリアID: ${shop.area_id}`);
      console.log(`  タグ: ${shop.raw_data?.tags ? shop.raw_data.tags.join(', ') : 'なし'}`);
      console.log('---');
    });
    console.log(`✅ 計 ${shops.length} 件の店舗データを検出しました。`);
    
  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}
main();
