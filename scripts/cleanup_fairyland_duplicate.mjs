import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanup() {
  console.log('🧹 フェアリーランドの重複（ゴミデータ）削除処理を開始します...\n');

  try {
    // 1. 池袋エリアの「フェアリーランド」を検索
    const { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id, name')
      .eq('area_id', 'tokyo_toshima_ikebukuro')
      .or('name.ilike.%フェアリーランド%,name.ilike.%Fairy Land%');

    if (searchError) throw searchError;

    if (!shops || shops.length === 0) {
      console.log('⚠️ 対象店舗が見つかりませんでした。');
      return;
    }

    // 2. キャスト数を調べて、0人の店舗だけを削除する
    for (const shop of shops) {
      const { count } = await supabase
        .from('therapists')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id)
        .eq('is_active', true);

      if (count === 0) {
        console.log(`🗑️ キャスト0名の不要データを発見: ${shop.name} (ID: ${shop.id})`);
        
        // 念のため紐づくキャスト情報（inactiveなものがあるかもしれないので）を削除
        await supabase.from('therapists').delete().eq('shop_id', shop.id);
        
        // 店舗を削除
        const { error: deleteError } = await supabase.from('shops').delete().eq('id', shop.id);
        
        if (deleteError) {
          console.error(`  ❌ 削除エラー:`, deleteError);
        } else {
          console.log(`  ✅ 削除完了しました。`);
        }
      } else {
         console.log(`🛡️ キャスト${count}名の正解データを保持します: ${shop.name} (ID: ${shop.id})`);
      }
    }

    console.log('\n🎉 重複のクリーンアップが完了しました！');
    console.log('ブラウザで「Cmd + Shift + R」でリロードして、池袋に完璧な「Tokyo Fairy Land」が1つだけ表示されるか確認してください。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

cleanup();
