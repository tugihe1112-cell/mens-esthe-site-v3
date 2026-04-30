import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 DB内の「JJ」関連店舗を確認します...\n');
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id, raw_data')
      .ilike('name', '%JJ%');

    if (error) throw error;

    shops.forEach(shop => {
      console.log(`- 店舗名: ${shop.name}`);
      console.log(`  ID: ${shop.id}`);
      console.log(`  エリアID: ${shop.area_id}`);
      console.log(`  タグ: ${shop.raw_data?.tags ? shop.raw_data.tags.join(', ') : 'なし'}`);
      console.log('---');
    });
    
    if(shops.length === 0) {
      console.log('⚠️ 「JJ」が含まれる店舗は見つかりませんでした。');
    }
  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}
main();
