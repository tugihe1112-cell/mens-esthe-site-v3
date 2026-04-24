import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log("🔍 Supabaseの書き込み権限（サイレントエラー）をテストします...\n");

  // 1. RexのIDを取得
  const { data: shops, error: fetchErr } = await supabase
    .from('shops')
    .select('id, name')
    .ilike('name', '%Rex%')
    .limit(1);

  if (fetchErr || !shops || shops.length === 0) {
    console.error("❌ 読み込み失敗、または店舗が見つかりません。");
    return;
  }

  const targetId = shops[0].id;
  console.log(`✅ ターゲット確認: ${shops[0].name} (ID: ${targetId})`);

  // 2. テスト更新（.select() をつけて実データを取り出す）
  console.log(`\n⚙️ 試しに website_url を更新してみます...`);
  const testUrl = "https://rex-luxury-salon.com/?test=1";

  const { data: updatedData, error: updateErr } = await supabase
    .from('shops')
    .update({ website_url: testUrl })
    .eq('id', targetId)
    .select(); // 🌟 ここが重要：更新した行を返させる

  if (updateErr) {
    console.error("❌ 明示的な更新エラーが発生:", updateErr);
  } else if (!updatedData || updatedData.length === 0) {
    console.error("\n🚫 【原因判明】サイレントエラーです！");
    console.error("エラーは出ていませんが、更新された行が「0件」でした。");
    console.error("💡 理由: SupabaseのRLS設定により、ANON_KEY（公開キー）での更新が弾かれています。");
    console.error("👉 解決策: スクリプト用の環境変数に SUPABASE_SERVICE_ROLE_KEY を追加する必要があります。");
  } else {
    console.log("\n✅ 【DB更新成功】データは確実に書き換わっています！");
    console.log(`反映されたURL: ${updatedData[0].website_url}`);
    console.log("💡 理由: DBは更新されているので、ブラウザ（React）側で古いデータがキャッシュされているのが原因です。");
  }
}

main();
