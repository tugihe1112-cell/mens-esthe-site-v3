import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 日本全国の店舗登録状況をデータベースから集計します...\n');
  try {
    const { data: shops, error } = await supabase.from('shops').select('id, name, area_id');
    if (error) throw error;

    const prefCounts = {};
    let noAreaCount = 0;

    shops.forEach(shop => {
      if (!shop.area_id) {
        noAreaCount++;
        return;
      }
      // area_id は "tokyo_shibuya_..." のような形式だと仮定し、最初の部分（都道府県）を抽出
      const prefCode = shop.area_id.split('_')[0].toLowerCase();
      prefCounts[prefCode] = (prefCounts[prefCode] || 0) + 1;
    });

    console.log(`✅ 全 ${shops.length} 店舗のデータを集計しました。（エリア未設定: ${noAreaCount}件）\n`);
    console.log('📊 【都道府県コード別】実際の店舗数:');
    
    // 店舗数が多い順にソートして表示
    Object.entries(prefCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([pref, count]) => {
        console.log(`   - ${pref}: ${count} 店舗`);
      });

    console.log('\n💡 結論: 上記のリストに表示されていない県（例えば ibaraki, kyoto, hyogo など）は、データベース上「完全に空っぽ」です。');
    console.log('出力結果を教えていただければ、locations.js から「完全に空っぽの都道府県」のメニューを丸ごと一掃する安全なコードを作成します！');

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
