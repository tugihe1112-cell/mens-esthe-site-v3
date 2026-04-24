import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const UPDATES = [
  {
    type: 'id',
    target: 'tokyo_ota_kamata_angeaile',
    imageUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Angeaile.png',
    name: 'Anjuaile (アンジュエール)'
  },
  {
    type: 'group_id',
    target: 'g_pepespa',
    imageUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Pepe%20Spa.png',
    name: 'Pepe Spa (ペペスパ) 全店舗'
  },
  {
    type: 'group_id',
    target: 'g_livspa',
    imageUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/LIVSPA.png',
    name: 'LIVSPA (リブスパ) 全店舗'
  }
];

async function main() {
  console.log('🖼️ 3ブランドのロゴ画像一括更新を開始します...\n');

  try {
    for (const update of UPDATES) {
      console.log(`⏳ ${update.name} のロゴを更新中...`);
      const { error } = await supabase
        .from('shops')
        .update({ image_url: update.imageUrl })
        .eq(update.type, update.target);

      if (error) {
        console.error(`❌ エラー (${update.name}):`, error.message);
      } else {
        console.log(`✅ 更新成功`);
      }
    }

    console.log('\n🎉 すべてのロゴ画像の更新が完了しました！');
    console.log('ブラウザを開き、各エリアでスーパーリロード(Cmd + Shift + R)してご確認ください。');

  } catch (err) {
    console.error('❌ 予期せぬエラーが発生しました:', err.message);
  }
}

main();
