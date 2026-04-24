import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const logoUpdates = [
  {
    label: '熟れた果実',
    matchQuery: 'name.ilike.%熟れた果実%,name.ilike.%ウレカジ%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/ureta%20kajitsu.png'
  },
  {
    label: 'milk tea (ミルクティー)',
    matchQuery: 'name.ilike.%milk tea%,name.ilike.%ミルクティー%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/milk%20tea.png'
  },
  {
    label: 'Berryz Spa (ベリーズスパ)',
    matchQuery: 'name.ilike.%Berryz Spa%,name.ilike.%ベリーズスパ%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/belly%20spa.png'
  },
  {
    label: 'Aroma one (アロマワン)',
    matchQuery: 'name.ilike.%Aroma one%,name.ilike.%アロマワン%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/aromaone.png'
  },
  {
    label: 'Sanando (サナンド)',
    matchQuery: 'name.ilike.%Sanando%,name.ilike.%サナンド%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/sanand.png'
  }
];

async function main() {
  console.log('🚀 5店舗：ステップ② ロゴの設定を一括開始します...\n');

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

    console.log('\n🎉🎉 5店舗のロゴ設定がすべて完了しました！ 🎉🎉');
    console.log('ブラウザに戻り「Cmd + Shift + R」でスーパーリロードして、画像が反映されたことを確認してください。');

  } catch (err) {
    console.error('❌ 予期せぬエラーが発生しました:', err);
  }
}

main();
