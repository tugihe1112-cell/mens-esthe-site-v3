import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkFairyLand() {
  console.log("🔍 東京フェアリーランドの登録状況を調査します...\n");

  try {
    // 「フェアリーランド」または「Fairy Land」で検索
    const { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('*')
      .or('name.ilike.%フェアリーランド%,name.ilike.%Fairy Land%');

    if (searchError) throw searchError;

    if (!shops || shops.length === 0) {
      console.log("⚠️ 該当する店舗（フェアリーランド）はDBに見つかりませんでした。");
      return;
    }

    console.log(`📊 該当店舗: ${shops.length}件が見つかりました\n`);
    
    const results = [];
    
    // 各店舗の在籍キャスト数を取得してテーブル用に成形
    for (const shop of shops) {
      const { count } = await supabase
        .from('therapists')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id)
        .eq('is_active', true);

      results.push({
        店舗名: shop.name,
        エリアID: shop.area_id,
        ロゴ画像: shop.image_url ? "⭕️ 設定済" : "❌ 未設定",
        URL関係: (shop.website_url || shop.schedule_url) ? "⭕️ 設定済" : "❌ 未設定",
        料金システム: shop.price_system ? "⭕️ 設定済" : "❌ 未設定",
        キャスト数: `${count || 0} 名`
      });
    }

    console.table(results);
    console.log("\n💡 池袋（tokyo_toshima_ikebukuro）のデータが「❌ 未設定」や「0 名」になっている場合は、更新が漏れている状態です。");

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

checkFairyLand();
