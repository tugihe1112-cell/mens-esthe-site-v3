import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 【調査】「東京都 目黒」のスクリーニング条件とデータの差異を確認します...\n');

  try {
    // 1. 目黒で正常に表示されている店舗（GRACE）を取得
    const { data: validShop, error: validErr } = await supabase
      .from('shops')
      .select('id, name, area_id, raw_data')
      .eq('id', 'tokyo_meguro_meguro_grace')
      .single();

    if (validErr) throw new Error(`GRACEの取得エラー: ${validErr.message}`);

    // 2. 表示されていない店舗（女教師の秘め事 目黒店）を取得
    const { data: missingShop, error: missingErr } = await supabase
      .from('shops')
      .select('id, name, area_id, raw_data')
      .eq('id', 'tokyo_meguro_meguro_teacher_secret')
      .single();

    if (missingErr) throw new Error(`女教師の秘め事の取得エラー: ${missingErr.message}`);

    // 3. データの比較出力
    console.log('▼ スクリーニングに関わりそうなカラムの比較');
    
    console.log('\n【エリアID (area_id)】');
    console.log(`  GRACE:     ${validShop.area_id}`);
    console.log(`  女教師:    ${missingShop.area_id}`);

    // raw_data内に、住所や都道府県、市区町村情報などが格納されているか確認
    const validRaw = validShop.raw_data || {};
    const missingRaw = missingShop.raw_data || {};

    console.log('\n【raw_data 内のエリア関連情報】');
    const areaKeys = ['prefecture', 'city', 'address', 'access', 'area'];
    
    let hasRawDataDiff = false;
    areaKeys.forEach(key => {
        const v = validRaw[key];
        const m = missingRaw[key];
        if (v !== undefined || m !== undefined) {
             hasRawDataDiff = true;
             console.log(`  [${key}]`);
             console.log(`    GRACE:     ${v !== undefined ? v : '未設定'}`);
             console.log(`    女教師:    ${m !== undefined ? m : '未設定'}`);
        }
    });

    if (!hasRawDataDiff) {
         console.log('  raw_data内には、比較できるエリア関連キー(prefecture, city等)が見当たりませんでした。');
    }

  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}

main();
