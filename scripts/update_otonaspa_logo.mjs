import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const SHOP_ID = 'tokyo_sumida_ryogoku_otonaspa_kutsurogi';
const LOGO_URL = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/otonaspa%20kutsurogi%20ryogoku.png';

async function main() {
  console.log('🖼️ 「大人スパ くつろぎ 両国」のロゴ画像更新を開始します...\n');

  try {
    console.log(`⏳ ID: ${SHOP_ID} のロゴを更新中...`);
    const { error } = await supabase
      .from('shops')
      .update({ image_url: LOGO_URL })
      .eq('id', SHOP_ID);

    if (error) {
      console.error(`❌ エラー:`, error.message);
    } else {
      console.log(`✅ 更新成功`);
    }

    console.log('\n🎉 ロゴ画像の更新が完了しました！');
    console.log('ブラウザの「両国」エリアを開き、スーパーリロード(Cmd + Shift + R)してご確認ください。');

  } catch (err) {
    console.error('❌ 予期せぬエラーが発生しました:', err.message);
  }
}

main();
