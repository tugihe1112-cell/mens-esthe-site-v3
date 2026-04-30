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

  // 更新する画像URL
  const logoUrl = "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Tokyo%20Aroma%20Este.png";

  try {
    console.log(`🔍 データベースから「Tokyo Aroma Este」を検索し、フロント画像を更新します...\n`);

    // 全店舗を取得
    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // Tokyo Aroma Este に合致するものを抽出（グランドアロマは除外）
    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return (n.includes('tokyo') && n.includes('aroma') && !n.includes('grand')) || 
             (n.includes('東京') && n.includes('アロマ') && !n.includes('グランド')) ||
             n.includes('tokyoaroma');
    });

    if (targetShops.length > 0) {
      let updateCount = 0;
      for (const shop of targetShops) {
        console.log(` 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
        // 店舗の image_url を更新
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            image_url: logoUrl
          })
        });

        if (patchRes.ok) {
          console.log(`  ✅ フロント画像更新完了`);
          updateCount++;
        } else {
          console.error(`  ❌ 画像の更新に失敗しました: ${patchRes.statusText}`);
        }
      }
      console.log(`\n🎉 計 ${updateCount} 店舗のフロント画像を更新しました！ブラウザをリロードしてください！`);
    } else {
      console.log(` ⚠️ 「Tokyo Aroma Este」に該当する店舗が見つかりませんでした。`);
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
