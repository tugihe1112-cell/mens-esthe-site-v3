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

  const shopData = {
    schedule_url: "https://peach-next.com/scheduleAll.html",
    price_system: "80分コース: 24,000円→16,000円\n100分コース: 28,000円→20,000円"
  };

  try {
    console.log(`🔍 データベースから「ピーチネクスト」を検索し、店舗情報を更新します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // 「ピーチネクスト」または「peach next」が含まれる店舗を抽出
    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return n.includes('ピーチネクスト') || n.includes('peach next') || n.includes('peachnext');
    });

    if (targetShops.length > 0) {
      for (const shop of targetShops) {
        console.log(`🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
        // スケジュールURL、料金システムを更新
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            schedule_url: shopData.schedule_url,
            price_system: shopData.price_system
          })
        });

        if (patchRes.ok) {
          console.log(`  ✅ スケジュールURL・料金システム更新完了\n`);
        } else {
          console.error(`  ❌ 店舗情報の更新に失敗しました: ${patchRes.statusText}\n`);
        }
      }
      console.log(`🎊 「ピーチネクスト」の更新が完了しました！ブラウザをリロードして確認してください！`);
    } else {
      console.log("⚠️ 「ピーチネクスト」を含む店舗が見つかりませんでした。");
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
