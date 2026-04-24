import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 【原因究明】表示されている店舗と、表示されない店舗の全データ比較を行います...\n');

  try {
    // 1. 正常に表示されている店舗（GRACE）の全データを取得
    const { data: validShop, error: validErr } = await supabase
      .from('shops')
      .select('*')
      .eq('id', 'tokyo_meguro_meguro_grace')
      .single();

    if (validErr) throw new Error(`GRACEの取得エラー: ${validErr.message}`);

    // 2. 表示されていない店舗（女教師の秘め事 目黒店）の全データを取得
    const { data: missingShop, error: missingErr } = await supabase
      .from('shops')
      .select('*')
      .eq('id', 'tokyo_meguro_meguro_teacher_secret')
      .single();

    if (missingErr) throw new Error(`女教師の秘め事の取得エラー: ${missingErr.message}`);

    // 3. データの比較と出力
    console.log('▼ 必須項目やフラグの差分チェック（GRACE vs 女教師の秘め事）\n');
    
    const keys = Object.keys(validShop);
    let diffCount = 0;

    keys.forEach(key => {
      const validValue = validShop[key];
      const missingValue = missingShop[key];

      // raw_dataのような巨大なJSONや、id, nameなどの固有値は詳細比較から省く
      if (['id', 'name', 'raw_data', 'created_at', 'updated_at'].includes(key)) return;

      // 値が違う（あるいは片方がnull）場合に出力
      if (validValue !== missingValue) {
        console.log(`⚠️ カラム名: ${key}`);
        console.log(`   表示OK (GRACE) : ${validValue === null ? 'null' : validValue}`);
        console.log(`   表示NG (女教師): ${missingValue === null ? 'null' : missingValue}`);
        console.log('--------------------------------------------------');
        diffCount++;
      }
    });

    if (diffCount === 0) {
        console.log('💡 データベースのカラム値に決定的な差は見つかりませんでした。');
        console.log('   フロントエンドのソースコード側で、「女教師の秘め事」という名前や特定のIDをハードコードして除外している可能性があります。');
    } else {
        console.log(`\n上記の ${diffCount} 個の差分の中に、フロントエンドのスクリーニングで弾かれている原因があるはずです！`);
    }

  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}

main();
