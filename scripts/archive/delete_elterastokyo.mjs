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

  // 削除対象のキーワード
  const searchKeywords = ['elteras', 'エルテラス', 'chat noir', 'シャノワール'];

  try {
    console.log(`🧹 データベースから「ELTERAS TOKYO」関連の店舗を検索し、データを完全削除します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // 全系列店をフィルタリング
    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
    });

    if (targetShops.length === 0) {
      console.log(`⚠️ 該当する店舗が見つかりませんでした。すでに削除されている可能性があります。`);
      return;
    }

    let deletedShopCount = 0;

    for (const shop of targetShops) {
      console.log(`🏠 削除対象: ${shop.name} (ID: ${shop.id})`);
      
      // 1. まず、その店舗に紐づくキャスト（セラピスト）のデータを削除
      const delCastsRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, {
        method: 'DELETE',
        headers: headers
      });

      if (delCastsRes.ok) {
        console.log(`   ✅ 所属キャストのデータを削除しました`);
      } else {
        console.error(`   ❌ キャストの削除失敗: ${delCastsRes.statusText}`);
      }

      // 2. 次に、店舗データ自体を削除
      const delShopRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'DELETE',
        headers: headers
      });

      if (delShopRes.ok) {
        console.log(`   ✅ 店舗自体のデータを削除しました`);
        deletedShopCount++;
      } else {
        console.error(`   ❌ 店舗の削除失敗: ${delShopRes.statusText}`);
      }
    }
    
    console.log(`\n🎊 合計 ${deletedShopCount} 店舗の「ELTERAS TOKYO」関連データを完全に削除しました！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
