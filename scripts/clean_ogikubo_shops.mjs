import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🚀 店舗データのクリーニングを開始します...\n');
  try {
    // 1. 閉店した「Aroma charmant」の削除
    const AROMA_ID = 'tokyo_suginami_ogikubo_aroma_charmant';
    console.log(`🗑️ Aroma charmant (${AROMA_ID}) を削除中...`);
    // 先に紐づくセラピストを削除（外部キー制約エラー回避のため）
    await supabase.from('therapists').delete().eq('shop_id', AROMA_ID);
    // 店舗本体を削除
    await supabase.from('shops').delete().eq('id', AROMA_ID);
    console.log(`✅ Aroma charmant の削除が完了しました。`);

    // 2. 「CREST SPA」の重複を解消（メインを残し、サブを削除）
    const CREST_MAIN_ID = 'tokyo_suginami_ogikubo_crest_spa_tokyo';
    const CREST_DUP_ID = 'tokyo_suginami_ogikubo_crest';
    console.log(`\n🔄 CREST SPA の重複データを統合中...`);
    
    // もし重複側にキャストが登録されていた場合、メイン店舗に移動させる
    await supabase.from('therapists').update({ shop_id: CREST_MAIN_ID }).eq('shop_id', CREST_DUP_ID);
    
    // 重複している店舗本体を削除
    await supabase.from('shops').delete().eq('id', CREST_DUP_ID);
    console.log(`✅ CREST SPA の重複を解消し、1店舗にまとめました。`);

    // 3. ローカルJSONの同期（画面反映用）
    console.log('\n⏳ JSONデータを更新中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log('\n🎉 クリーニングがすべて完了しました！ブラウザをリロードして確認してください。');
  } catch (e) {
    console.error('❌ エラーが発生しました:', e.message);
  }
}

main();
