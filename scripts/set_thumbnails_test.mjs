import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 高級エステ風のダミー画像（Unsplashのフリー素材）を最初からセットしています
const SHOP_IMAGES = {
  // a laise
  'tokyo_suginami_ogikubo_a-laise': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=600&auto=format&fit=crop',
  
  // よりみち (Yorimichi) 荻窪
  'tokyo_suginami_ogikubo_yorimichi': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop',
  
  // CREST SPA TOKYO (クレストスパ)
  'tokyo_suginami_ogikubo_crest_spa_tokyo': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=600&auto=format&fit=crop',
  
  // Aroma charmant (アロマシャルマント)
  'tokyo_suginami_ogikubo_aroma_charmant': 'https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=600&auto=format&fit=crop'
};

async function main() {
  console.log('🚀 他の店舗にJJと同じサムネイルデザインを適用します...\n');
  try {
    for (const [shopId, imageUrl] of Object.entries(SHOP_IMAGES)) {
      await supabase
        .from('shops')
        .update({ image_url: imageUrl })
        .eq('id', shopId);
      
      console.log(`✅ ${shopId} の背景画像を更新しました。`);
    }

    // Vite用にローカルJSONを同期して即時反映させる
    console.log('\n⏳ JSONデータを更新中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log('\n🎉 完了しました！');
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
