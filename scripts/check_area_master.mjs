import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 データベース上の「エリア情報（幡ヶ谷・渋谷周辺）」を正確に確認します...\n');
  try {
    let areasFound = false;

    // 1. エリアマスター（areasテーブル）が存在するか確認
    const { data: areas, error: areaErr } = await supabase
      .from('areas')
      .select('*')
      .or('name.ilike.%幡ヶ谷%,name.ilike.%渋谷%,id.ilike.%hatagaya%,id.ilike.%shibuya%');

    if (!areaErr && areas && areas.length > 0) {
      areasFound = true;
      console.log(`✅ areasテーブルに以下のエリアデータが見つかりました:\n`);
      areas.forEach((area, index) => {
        console.log(`[${index + 1}] エリア名: ${area.name}`);
        console.log(`    エリアID (id): ${area.id}`);
        console.log('    ----------------------------------------');
      });
    } else {
      console.log('⚠️ areasテーブルからは見つかりませんでした（テーブルがないか、名称が異なります）。');
    }

    // 2. 実際の店舗（shopsテーブル）に登録されているエリアIDから逆引きで探す（超確実な代替案）
    console.log('\n🔍 shopsテーブルで実際に使われている「渋谷・幡ヶ谷関連のエリアID」を抽出します...');
    const { data: shops, error: shopErr } = await supabase
      .from('shops')
      .select('area_id')
      .not('area_id', 'is', null);

    if (shopErr) throw shopErr;

    // 重複を排除して、shibuya や hatagaya という文字を含むものをリストアップ
    const uniqueAreaIds = [...new Set(shops.map(s => s.area_id))]
      .filter(id => id.includes('shibuya') || id.includes('hatagaya'));

    if (uniqueAreaIds.length > 0) {
      console.log('✅ 現在使用されている該当エリアID:');
      uniqueAreaIds.forEach(id => console.log(`   - ${id}`));
    } else {
      console.log('⚠️ shopsテーブル内にも該当しそうなエリアIDは見当たりませんでした。');
    }

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
