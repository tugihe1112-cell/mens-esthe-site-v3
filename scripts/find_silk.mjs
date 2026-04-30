import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 「メンズエステシルク」のデータベース上の現在地を検索します...\n');
  try {
    // 名前の一部に「シルク」または「silk」(大文字小文字問わず) を含むものを全検索
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id, is_active, status, website_url')
      .or('name.ilike.%シルク%,name.ilike.%silk%');

    if (error) throw error;

    if (!shops || shops.length === 0) {
      console.log('⚠️ データベース全体から「シルク」という名前の店舗が見つかりませんでした。完全に削除されている可能性があります。');
      return;
    }

    console.log(`✅ ${shops.length} 件の店舗が見つかりました:\n`);
    shops.forEach((shop, index) => {
      console.log(`[${index + 1}] 店舗名: ${shop.name}`);
      console.log(`    ID: ${shop.id}`);
      console.log(`    エリアID: ${shop.area_id || '設定なし'}`);
      console.log(`    表示フラグ: is_active=${shop.is_active}, status=${shop.status || '設定なし'}`);
      console.log(`    URL: ${shop.website_url || '設定なし'}`);
      console.log('    ----------------------------------------');
    });

    console.log('\n💡 画面から消えた原因のヒント:');
    console.log('・エリアIDが「東京」以外（神奈川や別エリア）に変わっている。');
    console.log('・is_active が false、または status が published 以外になり非表示にされている。');

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
