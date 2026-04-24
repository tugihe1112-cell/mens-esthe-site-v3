import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 【調査】「ラグジュアリーグループ」の展開エリアの現状を確認します...\n');

  try {
    const targetAreas = ['上野', '松戸', '南越谷', '本八幡', '新小岩', '亀有'];

    console.log('▼ システム内に存在する関連エリアIDの検索結果:');
    
    for (const area of targetAreas) {
       // shopsテーブルの raw_data->city または area_id、name 等から検索して、既存のエリアIDの使われ方を推測します
       const { data, error } = await supabase
         .from('shops')
         .select('area_id')
         .or(`area_id.ilike.%${area}%, name.ilike.%${area}%`)
         .limit(5);
         
       if (error) {
           console.log(`  [${area}] エラー: ${error.message}`);
           continue;
       }

       if (data && data.length > 0) {
           const uniqueIds = [...new Set(data.map(s => s.area_id).filter(id => id))];
           console.log(`  [${area}] 既存のエリアID候補: ${uniqueIds.join(', ')}`);
       } else {
           console.log(`  [${area}] 既存のエリアIDが見つかりません。（新規作成が必要）`);
       }
    }
    
    // 既存の「Luxury」関連店舗がないか確認
    const { data: existShops } = await supabase
        .from('shops')
        .select('id, name, area_id')
        .ilike('name', '%Luxury%');
        
    console.log('\n▼ 現在登録されている「Luxury」関連の店舗:');
    if (existShops && existShops.length > 0) {
        existShops.forEach(s => console.log(`  ID: ${s.id} | 名前: ${s.name} | エリアID: ${s.area_id}`));
    } else {
        console.log('  見つかりません。');
    }

  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}

main();
