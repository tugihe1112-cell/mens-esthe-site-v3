import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const TARGET_IDS = [
  '8069b9a3-7bb1-44d3-a381-bfd1ff2bf9d5',
  'tokyo_shinagawa_shinagawa_grace'
];

const UPDATE_DATA = {
  name: 'GRACE (グレイス)',
  image_url: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Grace.png'
};

async function main() {
  console.log('🚀 指定されたIDの店舗名称とロゴを修正します...\n');

  try {
    const { data: updatedShops, error } = await supabase
      .from('shops')
      .update(UPDATE_DATA)
      .in('id', TARGET_IDS)
      .select('id, name');

    if (error) throw error;

    if (!updatedShops || updatedShops.length === 0) {
      console.warn('⚠️ 対象の店舗IDが見つかりませんでした。');
    } else {
      updatedShops.forEach(shop => {
        console.log(`✅ 修正完了: ID [${shop.id}] の名称を「${shop.name}」に更新し、ロゴを設定しました。`);
      });
    }

    console.log('\n🎉 すべての修正が完了しました！');
    console.log('ブラウザで「Cmd + Shift + R」を押して、カードの表示が「GRACE」に直っているか確認してください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err);
  }
}

main();
