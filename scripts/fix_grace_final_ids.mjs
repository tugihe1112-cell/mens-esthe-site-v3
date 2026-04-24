import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 調査で判明した、修正が必要なIDリスト
const TARGET_IDS = [
  'tokyo_meguro_meguro_grace',
  'tokyo_meguro_nakameguro_grace',
  'tokyo_shinagawa_shinagawa_grace',
  '8069b9a3-7bb1-44d3-a381-bfd1ff2bf9d5'
];

const CORRECT_DATA = {
  name: 'GRACE (グレイス)',
  image_url: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Grace.png'
};

async function main() {
  console.log('🚀 目黒・中目黒エリアを含む、すべてのGRACEの名称とロゴを修正します...\n');

  try {
    const { data: updatedShops, error } = await supabase
      .from('shops')
      .update(CORRECT_DATA)
      .in('id', TARGET_IDS)
      .select('id, name, area_id');

    if (error) throw error;

    if (!updatedShops || updatedShops.length === 0) {
      console.warn('⚠️ 対象の店舗が見つかりませんでした。');
    } else {
      updatedShops.forEach(shop => {
        console.log(`✅ 修正完了: ID [${shop.id}] (${shop.area_id}) を「${shop.name}」に更新しました。`);
      });
    }

    console.log('\n🎉 これで「目黒」エリアで表示されるカードも修正されました。');
    console.log('ブラウザで確認してください。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
