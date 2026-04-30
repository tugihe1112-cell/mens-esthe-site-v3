import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 「メンズエステシルク」の現在地を再検索します...\n');
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id, status, website_url')
      .or('name.ilike.%シルク%,name.ilike.%silk%');

    if (error) throw error;

    if (!shops || shops.length === 0) {
      console.log('⚠️ データベース全体から「シルク」が見つかりませんでした。');
      console.log('💡 完全に削除されてしまったか、名前が全く別のものに変更されている可能性があります。');
      return;
    }

    console.log(`✅ ${shops.length} 件の店舗が見つかりました:\n`);
    shops.forEach((shop, index) => {
      console.log(`[${index + 1}] 店舗名: ${shop.name}`);
      console.log(`    ID: ${shop.id}`);
      console.log(`    エリアID: ${shop.area_id || '設定なし'}`);
      console.log(`    ステータス: status = ${shop.status || '設定なし'}`);
      console.log(`    URL: ${shop.website_url || '設定なし'}`);
      console.log('    ----------------------------------------');
    });

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
