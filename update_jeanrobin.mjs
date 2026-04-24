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
    searchKeywords: ['jean robin', 'ジャンロビン'],
    website_url: "https://jean-robin.com/",
    schedule_url: "https://jean-robin.com/schedule",
    price_system: "60分(新規限定) 17,000円\n90分 20,000円\n120分 26,000円\n150分 32,000円\n180分 39,000円",
    casts: [
      { name: "翡翠れいか", age: "24", size: "T.156 / B.91(G) / W.56 / H.83", img: "https://jean-robin.com/photos/232/main_232.jpg" },
      { name: "長谷川ゆい", age: "27", size: "T.168 / B.90(F) / W.56 / H.85", img: "https://jean-robin.com/photos/230/main_230.jpg" },
      { name: "鈴木みな", age: "25", size: "T.158 / B.92(G) / W.56 / H.85", img: "https://jean-robin.com/photos/228/main_228.jpg" },
      { name: "蒼井りこ", age: "24", size: "T.162 / B.85(D) / W.56 / H.88", img: "https://jean-robin.com/photos/229/main_229.jpg" },
      { name: "綾瀬さくら", age: "22", size: "T.155 / B.88(E) / W.56 / H.84", img: "https://jean-robin.com/photos/226/main_226.jpg" },
      { name: "森川ゆな", age: "23", size: "T.160 / B.86(E) / W.59 / H.88", img: "https://jean-robin.com/photos/225/main_225.jpg" },
      { name: "幸村ほのか", age: "22", size: "T.165 / B.86(D) / W.56 / H.87", img: "https://jean-robin.com/photos/222/main_222.jpg" },
      { name: "小川みお", age: "23", size: "T.158 / B.90(F) / W.58 / H.86", img: "https://jean-robin.com/photos/208/main_208.jpg" },
      { name: "松野すみれ", age: "20", size: "T.162 / B.96(H) / W.58 / H.88", img: "https://jean-robin.com/photos/139/main_139.jpg" },
      { name: "大森ゆあ", age: "22", size: "T.155 / B.90(F) / W.56 / H.88", img: "https://jean-robin.com/photos/179/main_179.jpg" },
      { name: "白石りん", age: "26", size: "T.157 / B.87(E) / W.56 / H.84", img: "https://jean-robin.com/photos/194/main_194.jpg" },
      { name: "桃乃木さや", age: "23", size: "T.160 / B.87(E) / W.57 / H.85", img: "https://jean-robin.com/photos/218/main_218.jpg" },
      { name: "秋月さな", age: "26", size: "T.163 / B.88(E) / W.57 / H.85", img: "https://jean-robin.com/photos/221/main_221.jpg" },
      { name: "田中ひな", age: "25", size: "T.163 / B.90(F) / W.58 / H.87", img: "https://jean-robin.com/photos/217/main_217.jpg" },
      { name: "天音りな", age: "24", size: "T.155 / B.84(D) / W.55 / H.83", img: "https://jean-robin.com/photos/213/main_213.jpg" },
      { name: "一条ももか", age: "27", size: "T.158 / B.93(G) / W.55 / H.84", img: "https://jean-robin.com/photos/141/main_141.jpg" },
      { name: "山寺すず", age: "25", size: "T.170 / B.84(D) / W.57 / H.88", img: "https://jean-robin.com/photos/209/main_209.jpg" },
      { name: "野中ちひろ", age: "26", size: "T.163 / B.91(F) / W.59 / H.88", img: "https://jean-robin.com/photos/216/main_216.jpg" },
      { name: "栗原ひま", age: "23", size: "T.160 / B.85(D) / W.56 / H.86", img: "https://jean-robin.com/photos/196/main_196.jpg" },
      { name: "春谷ゆか", age: "28", size: "T.160 / B.90(E) / W.57 / H.80", img: "https://jean-robin.com/photos/134/main_134.jpg" },
      { name: "松井れいな", age: "24", size: "T.161 / B.87(D) / W.58 / H.86", img: "https://jean-robin.com/photos/184/main_184.jpg" },
      { name: "山田りょう", age: "28", size: "T.168 / B.85(D) / W.58 / H.85", img: "https://jean-robin.com/photos/101/main_101.jpg" },
      { name: "成海そら", age: "24", size: "T.163 / B.88(E) / W.57 / H.88", img: "https://jean-robin.com/photos/126/main_126.jpg" },
      { name: "小山てんか", age: "26", size: "T.158 / B.85(D) / W.56 / H.88", img: "https://jean-robin.com/photos/176/main_176.jpg" },
      { name: "藤野あかり", age: "22", size: "T.155 / B.88(E) / W.55 / H.85", img: "https://jean-robin.com/photos/171/main_171.jpg" },
      { name: "望月じゅり", age: "26", size: "T.163 / B.86(D) / W.57 / H.88", img: "https://jean-robin.com/photos/160/main_160.jpg" },
      { name: "水咲えみり", age: "22", size: "T.163 / B.85(D) / W.56 / H.84", img: "https://jean-robin.com/photos/107/main_107.jpg" },
      { name: "胡桃さあや", age: "22", size: "T.155 / B.85(C) / W.56 / H.84", img: "https://jean-robin.com/photos/182/main_182.jpg" },
      { name: "佐倉もも", age: "26", size: "T.160 / B.84(D) / W.56 / H.85", img: "https://jean-robin.com/photos/190/main_190.jpg" },
      { name: "岩下しま", age: "23", size: "T.160 / B.89(E) / W.56 / H.78", img: "https://jean-robin.com/photos/121/main_121.jpg" },
      { name: "木村えな", age: "27", size: "T.157 / B.88(E) / W.58 / H.83", img: "https://jean-robin.com/photos/116/main_116.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「JEAN ROBIN」を検索し、完全な情報とキャスト更新を実行します...\n`);

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
