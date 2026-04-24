import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const LOGO_URL = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/biserakiwami.png';

async function main() {
  console.log('🚀 KIWAMI系列店：ステップ② ロゴの一括設定を開始します...\n');

  try {
    // KIWAMI系列店を検索してロゴを一括更新
    const { data: updatedShops, error: updateError } = await supabase
      .from('shops')
      .update({ image_url: LOGO_URL })
      .or('name.ilike.%KIWAMI%,name.ilike.%美・セラ極%')
      .select('id, name, image_url');

    if (updateError) throw updateError;

    if (!updatedShops || updatedShops.length === 0) {
      console.warn('⚠️ 対象となるKIWAMIの店舗がDBで見つかりませんでした。');
      return;
    }

    console.log(`✅ 合計 ${updatedShops.length} 店舗のロゴを設定しました:`);
    updatedShops.forEach(shop => {
      console.log(` - ${shop.name} (ID: ${shop.id})`);
    });

    console.log('\n🎉🎉 KIWAMIのデータ登録＆ロゴ設定がすべて完了しました！ 🎉🎉');
    console.log('ブラウザに戻り「Cmd + Shift + R」でスーパーリロードして、「No Image」が消えたことを確認してください。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

main();
