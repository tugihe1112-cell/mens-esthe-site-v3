import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 Reactコンポーネントの仕様に基づき、サムネイルが空になる店舗を抽出します...\n');

  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, image_url, raw_data')
    .order('id');

  if (error) {
    console.error('❌ エラー:', error.message);
    return;
  }

  const emptyThumbnailShops = shops.filter(shop => {
    // Reactと全く同じロジックで画像URLを判定
    const uiImage = shop.image_url || (shop.raw_data ? shop.raw_data.image : null);
    
    // 画像URLが存在しない、または no_image / placeholder のプレースホルダー名になっているものを「空」と判定
    if (!uiImage || uiImage.trim() === '' || uiImage.includes('no_image') || uiImage.includes('placeholder')) {
      return true;
    }
    return false;
  });

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🖼️ サムネイルが「空」の店舗: 【 ${emptyThumbnailShops.length} 件 】 / 全 ${shops.length} 件`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (emptyThumbnailShops.length > 0) {
    emptyThumbnailShops.forEach((s, i) => {
      console.log(`${String(i + 1).padStart(3, ' ')}. ${s.name}`);
      console.log(`     ID: ${s.id}`);
    });
    
    fs.writeFileSync('empty_thumbnails.json', JSON.stringify(emptyThumbnailShops, null, 2));
    console.log('\n✅ 抽出リストを `empty_thumbnails.json` に保存しました。');
  }
}

main();
