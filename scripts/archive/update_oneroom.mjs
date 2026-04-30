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
    website_url: "https://www.oneroom-shinjyuku.com/",
    schedule_url: "https://www.oneroom-shinjyuku.com/schedule/",
    price_system: "60分: 13,000円 (通常 15,000円)\n70分オールあおむけコース: 18,000円\n90分: 19,000円 (通常 22,000円)\n120分: 25,000円 (通常 28,000円)\n150分: 31,000円 (通常 34,000円)",
    casts: [
      { name: "月瀬美優", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6369.jpg" },
      { name: "大西みな", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7371.jpg" },
      { name: "姫沢みれい", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7381.jpg" },
      { name: "有坂りお", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6760.jpg" },
      { name: "保科", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6294.jpg" },
      { name: "早乙女", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_5284.jpg" },
      { name: "月城りあ", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7395.jpg" },
      { name: "深山ましろ", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7363.jpg" },
      { name: "原口れいか", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7237.jpeg" },
      { name: "花村ネネ", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7094.jpg" },
      { name: "宮中るな", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6081.jpeg" },
      { name: "工藤まな", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_4972.jpg" },
      { name: "朝霧", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7303.jpg" },
      { name: "相田さおり", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7110.jpg" },
      { name: "乃木つき", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7311.jpg" },
      { name: "黒田のあ", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7141.jpg" },
      { name: "松坂かほ", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7107.jpg" },
      { name: "西山", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6522.jpeg" },
      { name: "藤かえで", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7206.jpg" },
      { name: "吉田ひな", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6952.jpg" },
      { name: "佐々木", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_1448.jpg" },
      { name: "望月みさき", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7147.jpeg" },
      { name: "双葉", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6275.jpg" },
      { name: "夏目ゆあ", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7350.jpg" },
      { name: "椿れむ", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7139.jpg" },
      { name: "瀬古", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6352.jpg" },
      { name: "森川れいな", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7326.jpg" },
      { name: "谷", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_3570.jpg" },
      { name: "牧野", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7430.jpg" },
      { name: "横知みく", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_1484.jpg" },
      { name: "秋山ゆう", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6172.jpg" },
      { name: "愛宮", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6716.jpg" },
      { name: "三上", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_5624.jpg" },
      { name: "音嶋りり", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7215.jpg" },
      { name: "天海", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_4955.jpg" },
      { name: "源しずか", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6370.jpeg" },
      { name: "弓木みゆ", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6187.jpg" },
      { name: "星", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7338.jpg" },
      { name: "渡辺うい", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7333.jpg" },
      { name: "葵", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6057.jpeg" },
      { name: "村瀬なぎ", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_6936.jpg" },
      { name: "浅香めい", img: "https://www.oneroom-shinjyuku.com/images/ml_11_1_7036.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「ONE ROOM」を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // 「one room」「ワンルーム」が含まれる店舗を抽出
    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return n.includes('one room') || n.includes('ワンルーム');
    });

    if (targetShops.length > 0) {
      for (const shop of targetShops) {
        console.log(`🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
        // 1. ホームページURL、スケジュールURL、料金システムを更新
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            website_url: shopData.website_url,
            schedule_url: shopData.schedule_url,
            price_system: shopData.price_system
          })
        });

        if (patchRes.ok) {
          console.log(`  ✅ URL・料金システム更新完了`);
        } else {
          console.error(`  ❌ 店舗情報の更新に失敗しました: ${patchRes.statusText}`);
          continue; 
        }

        // 2. キャストの更新
        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
        const dbCasts = await dbRes.json();
        
        let updateCount = 0;
        let insertCount = 0;

        // 重複を除去
        const uniqueCasts = Array.from(new Map(shopData.casts.map(c => [c.name, c])).values());

        for (const cast of uniqueCasts) {
          // 余計な空白を消す
          let cleanName = cast.name.replace(/[\s　]+/g, '');

          const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === cleanName);

          if (existing) {
            if (existing.image_url !== cast.img) {
              await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ image_url: cast.img })
              });
              updateCount++;
            }
          } else {
            const newId = `${shop.id}_${cleanName}`;
            await fetch(`${url}/rest/v1/therapists`, {
              method: 'POST',
              headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
              body: JSON.stringify({
                id: newId,
                shop_id: shop.id,
                name: cleanName,
                image_url: cast.img
              })
            });
            insertCount++;
          }
        }
        console.log(`  🎉 キャスト設定完了（新規: ${insertCount}名 / 画像更新: ${updateCount}名）\n`);
      }
      console.log(`🎊 「ONE ROOM」の更新が完了しました！ブラウザをリロードして確認してください！`);
    } else {
      console.log("⚠️ 「ONE ROOM」または「ワンルーム」を含む店舗が見つかりませんでした。");
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
