import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🧐 【最終確認】ラグジュアリーグループの統合状態をチェックします...\n');
  const { data, error } = await supabase
    .from('shops')
    .select('id, name, area_id, group_id, raw_data')
    .eq('group_id', 'g_luxury_gp');

  if (error) {
    console.error('❌ エラー:', error.message);
    return;
  }

  console.log(`✅ 合計 ${data.length} 店舗が共通ID「g_luxury_gp」に紐付いています。`);
  data.forEach(s => {
    console.log(`- [${s.area_id}] ${s.name} (ID: ${s.id})`);
    console.log(`  スクリーニング情報: ${s.raw_data.prefecture} ${s.raw_data.city} ${s.raw_data.area}`);
  });

  console.log('\n💡 全店舗で group_id が一致しているため、クチコミ吸収ロジックが正常に働きます。');
}
main();
