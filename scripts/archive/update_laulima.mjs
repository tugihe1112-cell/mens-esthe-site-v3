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

  const shopDef = {
    searchKeywords: ['laulima', 'ラウリマ'],
    website_url: "http://www.laulima.tokyo/",
    schedule_url: "http://www.laulima.tokyo/schedule/",
    price_system: "60分 14,000円\n75分 16,000円\n90分 19,000円\n120分 24,000円\n150分 29,000円\n180分 34,000円",
    casts: [
      { name: "涼風 ななみ", age: "29", size: "T.165 / B.83(E) / W.59 / H.84", img: "http://www.laulima.tokyo/images/ml_11_1_1037.jpeg" },
      { name: "水野 恋", age: "24", size: "T.160 / B.86(F) / W.58 / H.86", img: "http://www.laulima.tokyo/images/ml_11_1_1047.jpeg" },
      { name: "田中 りえ", age: "31", size: "T.157 / B.90(G) / W.62 / H.90", img: "http://www.laulima.tokyo/images/ml_11_1_1040.jpeg" },
      { name: "中川 美沙", age: "27", size: "T.155 / B.85(F) / W.62 / H.84", img: "http://www.laulima.tokyo/images/ml_11_1_1044.jpeg" },
      { name: "磯野 すず", age: "23", size: "T.153 / B.90(G) / W.61 / H.91", img: "http://www.laulima.tokyo/images/ml_11_1_1048.jpeg" },
      { name: "乙葉", age: "31", size: "T.159 / B.83(E) / W.59 / H.84", img: "http://www.laulima.tokyo/images/ml_11_1_1043.jpeg" },
      { name: "ゆうか Yuka", age: "31", size: "T.154 / B.91(G) / W.59 / H.89", img: "http://www.laulima.tokyo/images/ml_11_1_1672.jpeg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「Laulima」関連の店舗を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return shopDef.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
    });

    if (targetShops.length === 0) {
      console.log(`⚠️ 店舗が見つかりませんでした。スキップします。`);
      return;
    }

    for (const shop of targetShops) {
      console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
      
      // 1. 店舗情報（HP、スケジュール、システム）の更新
      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          website_url: shopDef.website_url,
          schedule_url: shopDef.schedule_url,
          price_system: shopDef.price_system
        })
      });

      if (patchRes.ok) {
        console.log(`   ✅ 店舗基本情報の更新完了`);
      } else {
        console.error(`   ❌ 店舗基本情報の更新失敗: ${patchRes.statusText}`);
      }

      // 2. キャストの更新
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
      const dbCasts = await dbRes.json();
      
      let updateCount = 0;
      let insertCount = 0;

      const uniqueCasts = Array.from(new Map(shopDef.casts.map(c => [c.name, c])).values());

      for (const cast of uniqueCasts) {
        let cleanName = cast.name.replace(/[\s　]+/g, ''); 
        const rawData = { age: cast.age, size: cast.size };

        const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === cleanName);

        if (existing) {
          await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ 
              image_url: cast.img,
              raw_data: rawData
            })
          });
          updateCount++;
        } else {
          const newId = `${shop.id}_${cleanName}`;
          await fetch(`${url}/rest/v1/therapists`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({
              id: newId,
              shop_id: shop.id,
              name: cleanName,
              image_url: cast.img,
              raw_data: rawData
            })
          });
          insertCount++;
        }
      }
      console.log(`   🎉 キャスト設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    }
    
    console.log(`\n🎊 すべての店舗の更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
