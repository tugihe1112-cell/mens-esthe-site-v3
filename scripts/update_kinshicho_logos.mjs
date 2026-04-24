import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const UPDATES = [
  {
    shopId: 'tokyo_sumida_kinshicho_aroma_cura', // Aroma Cura
    imageUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Aroma%20cura.png'
  },
  {
    shopId: 'tokyo_sumida_kinshicho_wife_collection', // ワイフコレクション
    imageUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/y%20collection.png'
  }
];

async function main() {
  console.log('🖼️ 錦糸町エリア2店舗のロゴ画像更新を開始します...\n');

  try {
    for (const update of UPDATES) {
      console.log(`⏳ ID: ${update.shopId} のロゴを更新中...`);
      const { error } = await supabase
        .from('shops')
        .update({ image_url: update.imageUrl })
        .eq('id', update.shopId);

      if (error) {
        console.error(`❌ エラー (${update.shopId}):`, error.message);
      } else {
        console.log(`✅ 更新成功`);
      }
    }

    console.log('\n🎉 すべてのロゴ画像の更新が完了しました！');
    console.log('ブラウザの「錦糸町」エリアを開き、スーパーリロード(Cmd + Shift + R)してご確認ください。');

  } catch (err) {
    console.error('❌ 予期せぬエラーが発生しました:', err.message);
  }
}

main();
