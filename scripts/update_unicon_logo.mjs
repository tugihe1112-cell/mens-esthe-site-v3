import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const LOGO_URL = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/unicon.png';

async function main() {
  console.log('🚀 UNICON (ユニコン)：ステップ② ロゴの設定を開始します...\n');

  try {
    // 新しい店舗名「UNICON」や「ユニコン」で検索してロゴを更新
    const { data: updatedShops, error: updateError } = await supabase
      .from('shops')
      .update({ image_url: LOGO_URL })
      .or('name.ilike.%UNICON%,name.ilike.%ユニコン%')
      .select('id, name');

    if (updateError) throw updateError;

    if (!updatedShops || updatedShops.length === 0) {
      console.warn('⚠️ 店舗が見つかりませんでした。（ステップ①が正常に完了しているか確認してください）');
      return;
    }

    console.log(`✅ 合計 ${updatedShops.length} 店舗のロゴを設定しました:`);
    updatedShops.forEach(shop => {
      console.log(` - ${shop.name} (ID: ${shop.id})`);
    });

    console.log('\n🎉🎉 UNICON (ユニコン)のデータ登録＆ロゴ設定がすべて完了しました！ 🎉🎉');
    console.log('ブラウザに戻り「Cmd + Shift + R」でスーパーリロードして、旧ウルレアが完全な「UNICON」に生まれ変わったことを確認してください。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

main();
