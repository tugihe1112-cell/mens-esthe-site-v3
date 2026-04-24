import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 「LINDA SPA（リンダスパ）」の現状をデータベースで確認します...\n');

  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id, group_id, image_url, schedule_url, website_url')
      .or('name.ilike.%LINDA%,name.ilike.%リンダ%');

    if (error) throw error;

    if (!shops || shops.length === 0) {
      console.log('⚠️ LINDA SPAに関する店舗データが見つかりませんでした。');
      return;
    }

    console.log(`✅ ${shops.length}件のデータが見つかりました。\n`);

    shops.forEach(shop => {
      console.log(`📌 店舗ID: ${shop.id}`);
      console.log(`  - 登録名: ${shop.name}`);
      console.log(`  - エリアID: ${shop.area_id}`);
      console.log(`  - グループID: ${shop.group_id ? shop.group_id : 'なし'}`);
      console.log(`  - 画像URL(ロゴ): ${shop.image_url ? shop.image_url : 'なし'}`);
      console.log(`  - スケジュール: ${shop.schedule_url ? shop.schedule_url : 'なし'}`);
      console.log(`  - WEBサイト: ${shop.website_url ? shop.website_url : 'なし'}`);
      console.log('--------------------------------------------------');
    });

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
