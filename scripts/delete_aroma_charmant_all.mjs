import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🚀 「Aroma charmant」の完全一掃を開始します...\n');
  try {
    // 名前の一部に Aroma charmant が含まれる店舗をすべて検索
    const { data: shops, error: fetchErr } = await supabase
      .from('shops')
      .select('id, name')
      .ilike('name', '%Aroma charmant%');

    if (fetchErr) throw fetchErr;

    if (!shops || shops.length === 0) {
      console.log('⚠️ 「Aroma charmant」は見つかりませんでした。既に削除されている可能性があります。');
    } else {
      for (const shop of shops) {
        console.log(`🗑️ ${shop.name} (${shop.id}) を発見しました。削除中...`);
        // エラーを防ぐため紐づくキャストデータを先に削除
        await supabase.from('therapists').delete().eq('shop_id', shop.id);
        // 店舗を削除
        await supabase.from('shops').delete().eq('id', shop.id);
        console.log(`✅ 削除完了。`);
      }
    }

    // Vite用のJSON同期
    console.log('\n⏳ JSONデータを更新中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log('\n🎉 完全削除が完了しました！ブラウザをリロードして確認してください。');
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}

main();
