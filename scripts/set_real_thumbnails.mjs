import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 各店舗の実際の公式サイトや関連サイトから取得した画像URL
const REAL_SHOP_IMAGES = {
  // a laise (公式サイトのトップ画像)
  'tokyo_suginami_ogikubo_a-laise': 'https://a-laise-sk.com/wp-content/uploads/2021/04/top_main.jpg',
  
  // よりみち (Yorimichi) 荻窪 (公式サイトのトップ画像)
  'tokyo_suginami_ogikubo_yorimichi': 'https://yorimichi-spa.com/images/top/main_sp.jpg',
  
  // CREST SPA TOKYO (荻窪の共通ロゴ/店舗画像)
  'tokyo_suginami_ogikubo_crest_spa_tokyo': 'https://crest-spa-tokyo.com/wp-content/uploads/2023/10/top_main_pc.jpg',
  
  // Aroma charmant (アロマシャルマント) (公式サイトのトップ画像)
  'tokyo_suginami_ogikubo_aroma_charmant': 'https://aroma-charmant.com/img/top/main.jpg'
};

async function main() {
  console.log('🚀 荻窪エリアの店舗に実際の公式サイトの画像を適用します...\n');
  try {
    for (const [shopId, imageUrl] of Object.entries(REAL_SHOP_IMAGES)) {
      await supabase
        .from('shops')
        .update({ image_url: imageUrl })
        .eq('id', shopId);
      
      console.log(`✅ ${shopId} に本物の画像をセットしました。`);
    }

    // Vite用にローカルJSONを同期して即時反映させる
    console.log('\n⏳ JSONデータを更新中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log('\n🎉 全て完了しました！ブラウザをリロードして確認してください。');
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
