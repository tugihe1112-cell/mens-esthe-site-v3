import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const CONFIG = {
  searchKeyword: '%熟れた果実%',
  searchKeyword2: '%ウレカジ%',
  shopName: '熟れた果実',
  // 追加いただいた画像を元に料金システムを修正
  priceSystem: '60分 12,000円\n70分 13,000円\n90分 15,000円\n120分 19,000円\n150分 23,000円'
};

async function main() {
  console.log(`🚀 ${CONFIG.shopName}：料金システムの修正を開始します...\n`);

  try {
    const { data: updatedShops, error: updateError } = await supabase
      .from('shops')
      .update({ price_system: CONFIG.priceSystem })
      .or(`name.ilike.${CONFIG.searchKeyword},name.ilike.${CONFIG.searchKeyword2}`)
      .select('id, name');

    if (updateError) throw updateError;

    if (!updatedShops || updatedShops.length === 0) {
      console.warn('⚠️ 店舗が見つかりませんでした。（ステップ①が正常に完了しているか確認してください）');
      return;
    }

    console.log(`✅ 以下の店舗の料金システムを更新しました:`);
    updatedShops.forEach(shop => {
      console.log(` - ${shop.name} (ID: ${shop.id})`);
    });

    console.log('\n🎉 熟れた果実の料金システム修正が完了しました！');
    console.log('ブラウザに戻り「Cmd + Shift + R」でスーパーリロードして、料金が反映されたことを確認してください。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

main();
