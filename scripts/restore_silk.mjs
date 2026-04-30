import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🚀 「Silk (シルク)」のエリアIDを修正して画面に復活させます...\n');
  try {
    const SHOP_ID = 'tokyo_shibuya_silk';
    
    // 👇 もし「渋谷」以外の専用エリアIDがある場合はここを書き換えてください
    const CORRECT_AREA_ID = 'tokyo_shibuya_shibuya'; 

    console.log(`1. 誤ったエリアIDを [${CORRECT_AREA_ID}] に修正中...`);
    const { error: updateErr } = await supabase
      .from('shops')
      .update({ area_id: CORRECT_AREA_ID })
      .eq('id', SHOP_ID);

    if (updateErr) throw updateErr;
    console.log('✅ データベースの修正が完了しました。');

    console.log('2. 画面反映のためにローカルJSONを同期中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
      }
    });

    console.log('\n🎉 修正が完了しました！ブラウザをリロードして、渋谷エリアに「Silk」が戻っているか確認してください。');

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
