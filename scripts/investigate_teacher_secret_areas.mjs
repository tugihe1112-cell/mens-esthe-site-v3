import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 【確認】「女教師の秘め事」の現状と、使用すべきエリアIDを調査します...\n');

  try {
    // 1. 現在の「女教師」の状況
    const { data: shops } = await supabase.from('shops').select('id, name, area_id').ilike('name', '%女教師%');
    console.log('▼ 現在データベースに残っている「女教師の秘め事」:');
    if (shops && shops.length > 0) {
      shops.forEach(s => console.log(`   ID: ${s.id} | エリアID: ${s.area_id}`));
    } else {
      console.log('   (なし)');
    }

    // 2. 「目黒」エリアで正しく絞り込まれるIDの候補を探す
    const { data: meguroShops } = await supabase.from('shops').select('area_id').ilike('area_id', 'tokyo_meguro%').limit(10);
    const meguroAreas = [...new Set(meguroShops.map(s => s.area_id))];
    console.log('\n▼ 参考：システム内に存在する「目黒」関連のエリアID:');
    console.log(`   ${meguroAreas.join(', ')}`);

    // 3. 「五反田」エリアのID候補を探す
    const { data: gotandaShops } = await supabase.from('shops').select('area_id').ilike('area_id', '%gotanda%').limit(10);
    const gotandaAreas = [...new Set(gotandaShops.map(s => s.area_id))];
    console.log('\n▼ 参考：システム内に存在する「五反田」関連のエリアID:');
    console.log(`   ${gotandaAreas.length > 0 ? gotandaAreas.join(', ') : '見つかりませんでした（新規作成になります）'}`);

    console.log('\n--------------------------------------------------');

  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}

main();
