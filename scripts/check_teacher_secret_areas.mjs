import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 「女教師の秘め事」の現在の登録状況（エリアとグループ）を確認します...\n');

  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id, group_id')
      .ilike('name', '%女教師%');

    if (error) throw error;

    if (!shops || shops.length === 0) {
      console.log('⚠️ 「女教師の秘め事」の店舗データが見つかりませんでした。');
      return;
    }

    console.log(`✅ ${shops.length}件の店舗データを発見しました。\n`);
    
    shops.forEach(shop => {
      console.log(`📌 店舗ID: ${shop.id}`);
      console.log(`  - 登録名: ${shop.name}`);
      console.log(`  - エリアID: ${shop.area_id ? shop.area_id : 'なし(null)'}`);
      console.log(`  - グループID: ${shop.group_id ? shop.group_id : 'なし(null)'}`);
      console.log('--------------------------------------------------');
    });

  } catch (err) {
    console.error('❌ エラーが発生しました:', err);
  }
}

main();
