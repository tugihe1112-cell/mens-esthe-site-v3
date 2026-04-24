import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 更新するデータ
const updateData = {
  keyword: '%Rex%',
  websiteUrl: 'https://rex-luxury-salon.com/',
  logoUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/rex.png'
};

async function main() {
  console.log('🚀 Rexの公式サイトリンクとロゴの更新を開始します...\n');

  try {
    // 1. %Rex% を含む店舗をすべて検索（池袋店・秋葉原店の両方がヒットします）
    const { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id, name')
      .ilike('name', updateData.keyword);

    if (searchError) throw searchError;

    if (!shops || shops.length === 0) {
      console.warn(`⚠️ 「${updateData.keyword}」に一致する店舗が見つかりませんでした。`);
      return;
    }

    // 2. 見つかった店舗の website_url と image_url を同時に更新
    for (const shop of shops) {
      const { error: updateError } = await supabase
        .from('shops')
        .update({
          website_url: updateData.websiteUrl,
          image_url: updateData.logoUrl
        })
        .eq('id', shop.id);

      if (updateError) {
        console.error(`❌ 更新エラー (${shop.name}):`, updateError);
      } else {
        console.log(`✅ 更新完了: ${shop.name} (ID: ${shop.id})`);
      }
    }
    console.log('\n🎉🎉 Rexのデータ更新がすべて完了しました！ 🎉🎉');
  } catch (error) {
    console.error('❌ 予期せぬエラーが発生しました:', error);
  }
}

main();
