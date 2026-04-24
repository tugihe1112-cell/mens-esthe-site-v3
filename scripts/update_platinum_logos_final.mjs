import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const LOGO_URL = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/platinum%20tokyo.png';

async function main() {
  console.log('🚀 PLATINUM TOKYO グループ全店舗のロゴ更新を開始します...\n');

  try {
    // 1. 名前で対象店舗を検索し、一括更新を実行
    const { data: updatedShops, error: updateError } = await supabase
      .from('shops')
      .update({ image_url: LOGO_URL })
      .or('name.ilike.%PLATINUM%,name.ilike.%プラチナム%')
      .select('id, name, image_url'); // 更新後のデータを取得

    if (updateError) throw updateError;

    if (!updatedShops || updatedShops.length === 0) {
      console.warn('⚠️ 対象となる店舗がDBで見つかりませんでした。');
      return;
    }

    // 2. 更新結果の表示
    console.log(`✅ 合計 ${updatedShops.length} 店舗のロゴを更新しました:`);
    updatedShops.forEach(shop => {
      console.log(` - ${shop.name}: ${shop.image_url}`);
    });

    console.log('\n🎉 データベースの更新は完全に完了しました！');
    console.log('💡 ブラウザで反映を確認する際は、必ず「Cmd + Shift + R」でスーパーリロードしてください。');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

main();
