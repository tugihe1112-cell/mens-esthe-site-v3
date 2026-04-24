import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAreas() {
  console.log("🔍 豊島区のエリアごとの店舗登録数を調査します...\n");

  try {
    // 1. 豊島区に該当するエリア（areasテーブル）を取得
    // ※ id が 'tokyo_toshima_' から始まるものを対象と想定
    const { data: areas, error: areaError } = await supabase
      .from('areas')
      .select('id, name')
      .like('id', 'tokyo_toshima_%');

    if (areaError) throw areaError;

    if (!areas || areas.length === 0) {
      console.log("⚠️ 豊島区のエリアデータが見つかりませんでした。");
      return;
    }

    const results = [];

    // 2. 各エリアに紐づく店舗数（shopsテーブル）をカウント
    for (const area of areas) {
      const { count, error: countError } = await supabase
        .from('shops')
        .select('*', { count: 'exact', head: true })
        .eq('area_id', area.id);

      if (countError) {
        console.error(`❌ エリア ${area.name} の集計エラー:`, countError);
        continue;
      }

      results.push({
        'エリア名': area.name,
        'エリアID': area.id,
        '登録店舗数': count
      });
    }

    // 3. 結果を表形式で表示
    console.table(results);
    
    // 店舗数が0のエリアをリストアップ
    const emptyAreas = results.filter(r => r['登録店舗数'] === 0).map(r => r['エリア名']);
    if (emptyAreas.length > 0) {
      console.log(`\n💡 【店舗数0のエリア】\n${emptyAreas.join('、')}`);
      console.log("これらのエリアを削除してよろしい場合は、次の指示をお願いします。");
    } else {
      console.log("\n💡 すべてのエリアに店舗が登録されています。");
    }

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

checkAreas();
