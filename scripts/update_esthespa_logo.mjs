import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const logoUpdate = {
  label: 'Esthe Spa (エステスパ)',
  matchQuery: 'name.ilike.%Esthe Spa%,name.ilike.%エステスパ%',
  logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/este%20spa.png'
};

async function main() {
  console.log('🚀 ステップ② ロゴの設定を開始します...\n');

  try {
    console.log(`▶️ 処理中: ${logoUpdate.label}`);
    
    const { data: updatedShops, error: updateError } = await supabase
      .from('shops')
      .update({ image_url: logoUpdate.logoUrl })
      .or(logoUpdate.matchQuery)
      .select('id, name');

    if (updateError) {
      console.error(`  ❌ エラー:`, updateError);
    } else if (!updatedShops || updatedShops.length === 0) {
      console.warn(`  ⚠️ 店舗が見つかりませんでした。`);
    } else {
      updatedShops.forEach(shop => {
        console.log(`  ✅ ロゴ更新完了: ${shop.name} (ID: ${shop.id})`);
      });
    }

    console.log('\n🎉 ロゴ設定が完了しました！');
    console.log('ブラウザに戻り「Cmd + Shift + R」でスーパーリロードして、画像が反映されたことを確認してください。');

  } catch (err) {
    console.error('❌ 予期せぬエラーが発生しました:', err);
  }
}

main();
