import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const logoUpdates = [
  {
    label: 'AROMA AMOUR',
    matchQuery: 'name.ilike.%AMOUR%,name.ilike.%アムール%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/AMOUR.png'
  },
  {
    label: 'Prispa (プリスパ)',
    matchQuery: 'name.ilike.%Prispa%,name.ilike.%プリスパ%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/pri%20spa.png'
  },
  {
    label: 'ar Tokyo (アールトウキョウ)',
    matchQuery: 'name.ilike.%ar Tokyo%,name.ilike.%アールトウキョウ%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/ar%20tokyo.png'
  },
  {
    label: 'Assouplir (アスプリー)',
    matchQuery: 'name.ilike.%Assouplir%,name.ilike.%アスプリー%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Assouplir.png'
  }
];

async function main() {
  console.log('🚀 秋葉原エリア4店舗：ステップ② ロゴの設定を一括開始します...\n');

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

    console.log('\n🎉🎉 秋葉原エリア4店舗のロゴ設定がすべて完了しました！ 🎉🎉');
    console.log('ブラウザに戻り「Cmd + Shift + R」でスーパーリロードして、一気にロゴが反映されたことを確認してください。');

  } catch (err) {
    console.error('❌ 予期せぬエラーが発生しました:', err);
  }
}

main();
