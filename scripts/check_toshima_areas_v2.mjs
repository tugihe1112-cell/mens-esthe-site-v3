import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkShopsPerArea() {
  console.log("🔍 DBに登録されている全店舗のエリア分布を調査します...\n");

  try {
    // 1. 全店舗のデータを取得
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, area_id');

    if (error) throw error;

    if (!shops || shops.length === 0) {
      console.log("⚠️ 店舗データが見つかりませんでした。");
      return;
    }

    // 2. エリアごとに店舗数を集計
    const areaCounts = {};
    const areaShops = {};

    shops.forEach(shop => {
      const area = shop.area_id || '未設定(null)';
      if (!areaCounts[area]) {
        areaCounts[area] = 0;
        areaShops[area] = [];
      }
      areaCounts[area]++;
      areaShops[area].push(shop.name);
    });

    // 3. 結果の表示
    const results = [];
    for (const [area, count] of Object.entries(areaCounts)) {
      results.push({
        'エリアID': area,
        '店舗数': count
      });
    }

    console.table(results);

    // 4. 詳細な店舗リストの表示
    console.log("\n📋 【エリア別の登録店舗リスト】");
    for (const [area, count] of Object.entries(areaCounts)) {
      console.log(`\n📍 ${area} (${count}店舗)`);
      areaShops[area].forEach(name => console.log(`  - ${name}`));
    }

    console.log("\n💡 【結論】");
    console.log("この一覧に表示されていないエリア（東池袋、西池袋、駒込など）は、現在DB上で「登録店舗数0」の状態です！");

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

checkShopsPerArea();
