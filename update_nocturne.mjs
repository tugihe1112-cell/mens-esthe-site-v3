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
    searchKeywords: ['nocturne spa', 'ノクターンスパ', 'ノクターン'],
    website_url: "https://nocturne-spa.com/",
    schedule_url: "https://nocturne-spa.com/schedule/",
    price_system: "60分 17,500円\n90分 22,500円\n120分 27,500円\n150分 32,500円\n180分 37,500円",
    casts: [
      { name: "かなで", age: "25", size: "T.163 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/あ-のコピー-のコピー-1.jpg" },
      { name: "みお", age: "25", size: "T.160 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/３-のコピー-1.jpg" },
      { name: "さな", age: "21", size: "T.160 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/２-のコピー.jpg" },
      { name: "のあ", age: "22", size: "T.152 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/1-のコピーあ.jpg" },
      { name: "ちえり", age: "19", size: "T.156 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/１-のコピー-8.jpg" },
      { name: "みりや", age: "27", size: "T.155 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/03/４-のコピー-2.jpg" },
      { name: "なな", age: "26", size: "T.155 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/03/１-のコピー-5.jpg" },
      { name: "はる", age: "25", size: "T.162 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/02/４-のコピー.jpg" },
      { name: "すず", age: "21", size: "T.157 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/ああのコピー-のコピー.jpg" },
      { name: "せりな", age: "27", size: "T.162 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/03/４-のコピー-4.jpg" },
      { name: "ましろ", age: "23", size: "T.157 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/03/２のコピー-のコピー.jpg" },
      { name: "みいな", age: "20", size: "T.160 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/04/u-のコピー-1.jpg" },
      { name: "ゆうな", age: "25", size: "T.157 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/aa-のコピー-のコピー.jpg" },
      { name: "あかり", age: "25", size: "T.160 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/uuのコピー-のコピー.jpg" },
      { name: "るい", age: "24", size: "T.154 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/１-.jpg" },
      { name: "いずみ", age: "34", size: "T.152 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/02/１-のコピーコピー-のコピー.jpg" },
      { name: "かな", age: "23", size: "T.157 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/03/q-のコピー.jpg" },
      { name: "かれん", age: "28", size: "T.165 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/１-のコピー-3.jpg" },
      { name: "れな", age: "25", size: "T.155 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/でで-のコピー.jpg" },
      { name: "みおん", age: "27", size: "T.158 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/01/い-のコピー.jpg" },
      { name: "あすな", age: "29", size: "T.157 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/03/１-のコピー-4.jpg" },
      { name: "ゆいか", age: "24", size: "T.155 / B.-(-) / W.- / H.-", img: "https://nocturne-spa.com/wp-content/uploads/2026/04/あ.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「ノクターンスパ」を検索し、完全な情報とキャスト更新を実行します...\n`);

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

      // 1. 店舗情報の更新
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
        console.log(`   ✅ 店舗基本情報（HP、スケジュール、システム）の更新完了`);
      } else {
        console.error(`   ❌ 店舗基本情報の更新失敗: ${patchRes.statusText}`);
      }

      // 2. キャストの登録・更新
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name`, { headers });
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
      console.log(`   🎉 キャスト${uniqueCasts.length}名設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    }
    
    console.log(`\n🎊 すべての更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
