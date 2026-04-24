import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const logoUpdates = [
  {
    label: 'Weal (ウィール秋葉原店)',
    matchQuery: 'name.ilike.%Weal%,name.ilike.%ウィール%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/weal%20akihabara.png'
  },
  {
    label: 'Hiran Next (平安NEXT)',
    matchQuery: 'name.ilike.%Hiran Next%,name.ilike.%平安NEXT%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/HIRAN%20NEXT.png'
  }
];

async function main() {
  console.log('🚀 秋葉原エリア2店舗：ステップ② ロゴの設定を開始します...\n');

  try {
    for (const target of logoUpdates) {
      console.log(`▶️ 処理中: ${target.label}`);
      
      const { data: updatedShops, error: updateError } = await supabase
        .from('shops')
        .update({ image_url: target.logoUrl })
        .or(target.matchQuery)
        .select('id, name');

      if (updateError) {
        console.error(`  ❌ エラー:`, updateError);
        continue;
      }

      if (!updatedShops || updatedShops.length === 0) {
        console.warn(`  ⚠️ 店舗が見つかりませんでした。`);
      } else {
        updatedShops.forEach(shop => {
          console.log(`  ✅ ロゴ更新完了: ${shop.name} (ID: ${shop.id})`);
        });
      }
    }

    console.log('\n🎉🎉 秋葉原エリア2店舗のロゴ設定が完了しました！ 🎉🎉');
    console.log('ブラウザに戻り「Cmd + Shift + R」でスーパーリロードして、秋葉原のカードにロゴが反映されたことを確認してください。');

  } catch (err) {
    console.error('❌ 予期せぬエラーが発生しました:', err);
  }
}

main();
