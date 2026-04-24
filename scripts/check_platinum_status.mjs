import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log("🔍 PLATINUM TOKYO グループのDB登録状況を調査します...\n");

  // 名前で「PLATINUM」または「プラチナム」を含む店舗を検索
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, area_id, image_url, website_url')
    .or('name.ilike.%PLATINUM%,name.ilike.%プラチナム%');

  if (error) {
    console.error('❌ エラー:', error);
    return;
  }

  if (!shops || shops.length === 0) {
    console.log("⚠️ 該当する店舗（PLATINUM TOKYO）はDBに見つかりませんでした。");
    return;
  }

  console.log(`📊 該当店舗: ${shops.length}件が見つかりました`);
  
  // 結果をテーブル形式で表示
  const statusTable = shops.map(s => ({
    店舗名: s.name,
    エリアID: s.area_id,
    ロゴ画像: s.image_url ? "⭕️ 設定済み" : "❌ 未設定",
    公式サイト: s.website_url ? "⭕️ 設定済み" : "❌ 未設定"
  }));

  console.table(statusTable);

  console.log("\n💡 未設定（❌）の店舗に対して、池袋店のロゴやURLを一括反映する準備ができます。");
}

main();
