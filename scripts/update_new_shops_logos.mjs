import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 更新対象の店舗と画像URLのリスト
const LOGO_UPDATES = [
  {
    shopId: 'tokyo_taito_ueno_tokyo_luxury', // 東京ラグジュアリー
    imageUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Tokyo%20luxuary.png'
  },
  {
    shopId: 'tokyo_taito_ueno_iyashi_annex', // 癒しの空間 Annex
    imageUrl: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/iyashinokuukan%20anex.png'
  },
  // ラグジュアリーグループは複数店舗あるため、group_id で一括更新します
];

const LUXURY_GROUP_LOGO = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Luxuary%20Group.png';

async function main() {
  console.log('🖼️ 新規3ブランドのロゴ画像更新を開始します...\n');

  try {
    // 1. 東京ラグジュアリー と 癒しの空間 Annex の更新
    for (const update of LOGO_UPDATES) {
      console.log(`⏳ ID: ${update.shopId} のロゴを更新中...`);
      const { error } = await supabase
        .from('shops')
        .update({ image_url: update.imageUrl })
        .eq('id', update.shopId);

      if (error) {
        console.error(`❌ エラー (${update.shopId}):`, error.message);
      } else {
        console.log(`✅ 更新成功`);
      }
    }

    // 2. ラグジュアリーグループの一括更新（group_id を使用）
    console.log(`\n⏳ ラグジュアリーグループ（全6店舗）のロゴを一括更新中...`);
    const { error: groupError } = await supabase
      .from('shops')
      .update({ image_url: LUXURY_GROUP_LOGO })
      .eq('group_id', 'g_luxury_gp');

    if (groupError) {
      console.error(`❌ エラー (ラグジュアリーグループ):`, groupError.message);
    } else {
      console.log(`✅ ラグジュアリーグループのロゴ一括更新成功`);
    }

    console.log('\n🎉 すべてのロゴ画像の更新が完了しました！');
    console.log('ブラウザで各店舗のページを開き、スーパーリロード(Cmd + Shift + R)してご確認ください。');

  } catch (err) {
    console.error('❌ 予期せぬエラーが発生しました:', err.message);
  }
}

main();
