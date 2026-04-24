import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

  const targetShopId = 'tokyo_shibuya_onkochishin';

  try {
    console.log("🗑️ 「温故知新」のデータ（店舗・キャスト）を削除中...\n");

    // 1. まず、この店舗に紐づくキャスト（therapists）を削除
    const deleteCastsRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${targetShopId}`, {
      method: 'DELETE',
      headers: headers
    });

    if (deleteCastsRes.ok) {
      console.log("✅ 紐づくキャストデータを削除しました。");
    } else {
      console.log("⚠️ キャストデータの削除中にエラーが発生したか、キャストが存在しませんでした。");
    }

    // 2. 次に、店舗データ（shops）を削除
    const deleteShopRes = await fetch(`${url}/rest/v1/shops?id=eq.${targetShopId}`, {
      method: 'DELETE',
      headers: headers
    });

    if (deleteShopRes.ok) {
      console.log("✅ 店舗データ「温故知新」を完全に削除しました！");
    } else {
      console.log("❌ 店舗データの削除に失敗しました。");
    }

    console.log("\n🎉 削除処理が完了しました！ブラウザをリロードして確認してください。");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
