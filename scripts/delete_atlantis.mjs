import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const TARGET_NAME = 'ATLANTIS';

async function main() {
  console.log(`🧹 ${TARGET_NAME} (アトランティス) のデータ削除処理を開始します...\n`);

  try {
    // 1. 対象の店舗IDを特定
    const { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id, name')
      .or(`name.ilike.%${TARGET_NAME}%,name.ilike.%アトランティス%`);

    if (searchError) throw searchError;

    if (!shops || shops.length === 0) {
      console.warn('⚠️ 該当する店舗が見つかりませんでした。既に削除されている可能性があります。');
      return;
    }

    for (const shop of shops) {
      console.log(`📝 対象店舗を確認: ${shop.name} (ID: ${shop.id})`);

      // 2. 紐づくセラピストを先に削除（外部キー制約対策）
      console.log(`  - セラピスト情報を削除中...`);
      await supabase.from('therapists').delete().eq('shop_id', shop.id);

      // 3. 店舗自体を削除
      console.log(`  - 店舗データを削除中...`);
      const { error: deleteError } = await supabase.from('shops').delete().eq('id', shop.id);

      if (deleteError) {
        console.error(`  ❌ ${shop.name} の削除中にエラーが発生しました:`, deleteError);
      } else {
        console.log(`  ✅ ${shop.name} をデータベースから完全に削除しました。`);
      }
    }

    console.log('\n🎉 クリーンアップが完了しました！ブラウザをリロードしてカードが消えたことを確認してください。');

  } catch (err) {
    console.error('❌ 予期せぬエラーが発生しました:', err);
  }
}

main();
