import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 荻窪エリア【以外】の店舗のセラピスト登録状況を調査します...\n');
  try {
    // 1. 荻窪以外のエリアIDを持つ店舗をいくつか取得（セラピストが存在しそうな店舗）
    const { data: shops, error: shopErr } = await supabase
      .from('shops')
      .select('id, name, area_id')
      .not('area_id', 'eq', 'tokyo_suginami_ogikubo')
      .limit(10); // 候補を10店舗ほど取得

    if (shopErr) throw shopErr;

    if (!shops || shops.length === 0) {
      console.log('⚠️ 荻窪以外の店舗が見つかりませんでした。');
      return;
    }

    let foundTherapists = false;

    // 2. 取得した店舗の中から、実際にセラピストが登録されている店舗を探し、データ構造を解析
    for (const shop of shops) {
      const { data: therapists, error: thErr } = await supabase
        .from('therapists')
        .select('*')
        .eq('shop_id', shop.id)
        .limit(1); // 構造を見るだけなので1人分で十分

      if (thErr) throw thErr;

      if (therapists && therapists.length > 0) {
        foundTherapists = true;
        console.log(`✅ 店舗名: ${shop.name} (${shop.area_id})`);
        console.log(`   └ 登録されているセラピストのデータ構造（1件抜粋）:`);
        
        const th = therapists[0];
        for (const [key, value] of Object.entries(th)) {
           // 値が長すぎる場合は省略して表示
           const displayValue = String(value).length > 50 ? String(value).substring(0, 50) + '...' : value;
           console.log(`      - ${key}: ${displayValue} (${typeof value})`);
        }
        console.log('--------------------------------------------------\n');
        
        // 3店舗分見つかったら十分なのでループを抜ける
        if (foundTherapists) break; // とりあえず1店舗見つかればOKな場合は break。複数見たい場合はカウンターを設けます。
      }
    }

    if (!foundTherapists) {
      console.log('⚠️ 調査した店舗には、まだセラピストが1人も登録されていませんでした。');
    }

    console.log('🎉 調査が完了しました。');
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
