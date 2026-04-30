import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 サムネイルが「完全に空（またはNo Image）」の店舗を抽出します...\n');

  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, image_url, raw_data')
    .order('id');

  if (error) {
    console.error('❌ エラー:', error.message);
    return;
  }

  const emptyThumbnails = shops.filter(shop => {
    const raw = shop.raw_data || {};
    
    // フロントエンドでサムネイルとして読み込まれる可能性のあるキーを全て確認
    const imgUrl = shop.image_url || '';
    const rawImage = raw.image || '';
    const rawImageUrl = raw.image_url || '';

    // どれか1つでも有効なURL（ロゴ含む）が入っていればOKとする
    const hasValidImage = 
      (imgUrl && !imgUrl.includes('no_image')) ||
      (rawImage && rawImage !== '設定なし' && !rawImage.includes('no_image') && !rawImage.includes('placeholder')) ||
      (rawImageUrl && rawImageUrl !== '設定なし' && !rawImageUrl.includes('no_image') && !rawImageUrl.includes('placeholder'));

    // 有効な画像が1つもない場合のみ抽出
    return !hasValidImage;
  });

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🖼️ サムネイルが空の店舗: 【 ${emptyThumbnails.length} 件 】 / 全 ${shops.length} 件`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (emptyThumbnails.length > 0) {
    emptyThumbnails.forEach((s, i) => {
      console.log(`${String(i + 1).padStart(3, ' ')}. ${s.name}`);
      console.log(`     ID: ${s.id}`);
    });
    
    fs.writeFileSync('real_empty_thumbnails.json', JSON.stringify(emptyThumbnails, null, 2));
    console.log('\n✅ リストを `real_empty_thumbnails.json` に保存しました。');
  } else {
    console.log('🎉 サムネイルが空の店舗はありませんでした。');
  }
}

main();
