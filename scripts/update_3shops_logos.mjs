import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const logoUpdates = [
  {
    label: '竜宮城 旧百万石 (人形町店)',
    matchQuery: 'name.ilike.%竜宮城%,name.ilike.%百万石%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/ryuuguzyo.png'
  },
  {
    label: 'Ginza Rich (銀座リッチ)',
    matchQuery: 'name.ilike.%Ginza Rich%,name.ilike.%銀座リッチ%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/ginza%20rich.png'
  },
  {
    label: 'ロンド 旧下弦の月 (銀座店)',
    matchQuery: 'name.ilike.%ロンド%,name.ilike.%下弦の月%',
    logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/rond.png'
  }
];

async function main() {
  console.log('🚀 3店舗：ステップ② ロゴの設定を一括開始します...\n');

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

    console.log('\n🎉🎉 3店舗のロゴ設定がすべて完了しました！ 🎉🎉');
    console.log('ブラウザに戻り「Cmd + Shift + R」でスーパーリロードして、画像が反映されたことを確認してください。');

  } catch (err) {
    console.error('❌ 予期せぬエラーが発生しました:', err);
  }
}

main();
