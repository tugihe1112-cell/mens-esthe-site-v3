import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const TARGET_SHOP_ID = 'tokyo_nakano_nakano_red_ribbon'; // 前回の登録ID
const NEW_NAME = 'NAMEX SPA'; // 画像から抽出した新しい名前

async function main() {
  console.log(`⏳ 店舗 ID「${TARGET_SHOP_ID}」の名前を「${NEW_NAME}」に更新しています...`);

  try {
    const { data, error } = await supabase
      .from('shops')
      .update({ name: NEW_NAME })
      .eq('id', TARGET_SHOP_ID)
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      console.log(`✅ 店舗名の更新が完了しました。`);
      console.log(`   ID: ${data[0].id}`);
      console.log(`   新しい名前: ${data[0].name}`);
    } else {
      console.log(`❌ 指定された店舗 ID「${TARGET_SHOP_ID}」が見つかりませんでした。前回の登録スクリプトが正常に実行されているか確認してください。`);
    }

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
