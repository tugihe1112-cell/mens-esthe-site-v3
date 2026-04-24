import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 恵比寿店などで使われている公式ロゴURL
const LOGO_URL = 'https://linda-spa.com/wp-content/themes/linda2/img/logo.png';

async function main() {
  console.log('🚀 LINDA SPA（リンダスパ）のロゴ設定を開始します...\n');

  try {
    // 名前が「LINDA」または「リンダ」を含み、かつ画像が設定されていない店舗を更新
    const { data: updatedShops, error } = await supabase
      .from('shops')
      .update({ image_url: LOGO_URL })
      .or('name.ilike.%LINDA%,name.ilike.%リンダ%')
      .is('image_url', null)
      .select('id, name');

    if (error) throw error;

    if (!updatedShops || updatedShops.length === 0) {
      console.log('⚠️ 更新対象の店舗（ロゴが未設定のLINDA SPA）はありませんでした。');
    } else {
      updatedShops.forEach(shop => {
        console.log(`✅ ロゴ設定完了: ${shop.name} (ID: ${shop.id})`);
      });
    }

    console.log('\n🎉 これで中目黒店のカードにもロゴが表示されるようになります！');
    console.log('ブラウザに戻り「Cmd + Shift + R」でスーパーリロードして確認してください。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
