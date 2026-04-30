import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 👇 ここに、各店舗のサムネイルにしたい画像のURLを入れてください
const SHOP_IMAGES = {
  // a laise
  'tokyo_suginami_ogikubo_a-laise': '画像のURLをここに入れる',
  
  // よりみち (Yorimichi) 荻窪
  'tokyo_suginami_ogikubo_yorimichi': '画像のURLをここに入れる',
  
  // CREST SPA TOKYO (クレストスパ)
  'tokyo_suginami_ogikubo_crest_spa_tokyo': '画像のURLをここに入れる',
  
  // Aroma charmant (アロマシャルマント)
  'tokyo_suginami_ogikubo_aroma_charmant': '画像のURLをここに入れる'
};

async function main() {
  console.log('🚀 他の店舗にJJと同じサムネイルデザインを適用します...\n');
  try {
    for (const [shopId, imageUrl] of Object.entries(SHOP_IMAGES)) {
      if (imageUrl === '画像のURLをここに入れる' || !imageUrl) continue;

      await supabase
        .from('shops')
        .update({ image_url: imageUrl })
        .eq('id', shopId);
      
      console.log(`✅ ${shopId} の画像を更新しました。`);
    }

    // Vite用にローカルJSONを同期して即時反映させる
    console.log('⏳ JSONデータを更新中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log('🎉 完了しました！ブラウザをリロードして、他の店舗もJJと同じデザインになったか確認してください。');
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
