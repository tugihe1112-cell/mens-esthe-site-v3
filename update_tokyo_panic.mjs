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
    searchKeywords: ['tokyo panic', 'トウキョウパニック', '東京パニック'],
    website_url: "https://tokyo-panic.com",
    schedule_url: "https://tokyo-panic.com/schedule/",
    price_system: "80分: 17,000円\n100分: 20,000円\n120分: 24,000円",
    casts: [
      { name: "小春ひまり", age: "21", size: "T.155 / B.79(美B) / W.52 / H.81", img: "https://tokyo-panic.com/wp-content/uploads/2026/03/6993_20260402182803_600_800_4.jpg" },
      { name: "藤原きほ", age: "28", size: "T.158 / B.87(D (ビンビン)) / W.57 / H.89", img: "https://tokyo-panic.com/wp-content/uploads/2026/03/S__77602853.jpg" },
      { name: "蜜蜂ぷりん", age: "21", size: "T.148 / B.89(F (甘々)) / W.58 / H.92", img: "https://tokyo-panic.com/wp-content/uploads/2026/03/6950_20260323022847_600_800_1.jpg" },
      { name: "黒木すみれ", age: "34", size: "T.163 / B.87(E) / W.56 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2026/02/S__87269467_0.jpg" },
      { name: "桜庭さくら", age: "19", size: "T.156 / B.83(C) / W.55 / H.84", img: "https://tokyo-panic.com/wp-content/uploads/2026/02/6840_20260209174704_600_800_4.jpg" },
      { name: "川崎あゆか", age: "24", size: "T.158 / B.82(B) / W.55 / H.84", img: "https://tokyo-panic.com/wp-content/uploads/2026/01/6810_20260324172518_600_800_0.jpg" },
      { name: "赤西なお", age: "26", size: "T.154 / B.87(E) / W.56 / H.86", img: "https://tokyo-panic.com/wp-content/uploads/2026/01/6746_20260115143718_600_800_0.jpg" },
      { name: "森ここな", age: "23", size: "T.148 / B.83(C) / W.56 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2026/01/no_image.jpg" },
      { name: "花園こと", age: "20", size: "T.152 / B.92(F) / W.58 / H.91", img: "https://tokyo-panic.com/wp-content/uploads/2025/12/6720_20260122172002_600_800_1.jpg" },
      { name: "星野らむ", age: "24", size: "T.146 / B.83(D) / W.54 / H.80", img: "https://tokyo-panic.com/wp-content/uploads/2025/12/856dd2045123bdcb2f17d394a3705896.jpg" },
      { name: "桃々(もも)なの", age: "20", size: "T.162 / B.87(E) / W.56 / H.85", img: "https://tokyo-panic.com/wp-content/uploads/2025/06/6463_20251116174131_600_800_0.jpg" },
      { name: "姫宮ももあ", age: "19", size: "T.155 / B.86(E) / W.56 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2024/10/5445_20251116183446_600_800_0.jpg" },
      { name: "愛蘭かほ", age: "20", size: "T.153 / B.89(F) / W.56 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2025/04/5722_20250531232218_600_800_0.jpg" },
      { name: "松井ひめか", age: "23", size: "T.160 / B.88(D) / W.57 / H.86", img: "https://tokyo-panic.com/wp-content/uploads/2025/06/6479_20250624143559_600_800_4.jpg" },
      { name: "類沢るり", age: "24", size: "T.155 / B.94(G) / W.57 / H.93", img: "https://tokyo-panic.com/wp-content/uploads/2025/08/6546_20250826233330_600_800_0.jpg" },
      { name: "天音みさ", age: "19", size: "T.158 / B.86(D) / W.56 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2024/07/Photoroom_20260304_094108.jpeg" },
      { name: "芹澤あんな", age: "23", size: "T.153 / B.88(F) / W.58 / H.89", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1799_20251130221151_600_800_3.jpg" },
      { name: "南條めい", age: "26", size: "T.155 / B.91(F＋デカ尻) / W.58 / H.93", img: "https://tokyo-panic.com/wp-content/uploads/2025/05/IMG_0253.jpeg" },
      { name: "永瀬ひな", age: "23", size: "T.160 / B.85(D) / W.55 / H.84", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1751_20251116183435_600_800_0.jpg" },
      { name: "加賀美ゆき", age: "23", size: "T.161 / B.88(E) / W.57 / H.90", img: "https://tokyo-panic.com/wp-content/uploads/2023/08/1904_20251009150248_600_800_1.jpg" },
      { name: "辻元りおな", age: "24", size: "T.148 / B.86(D) / W.56 / H.89", img: "https://tokyo-panic.com/wp-content/uploads/2025/07/IMG_0248.jpeg" },
      { name: "小鳥遊えな", age: "25", size: "T.160 / B.87(E) / W.56 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2024/10/5462_20250531233211_600_800_0.jpg" },
      { name: "瀬戸内えりか", age: "23", size: "T.158 / B.88(F) / W.55 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2025/11/6683_20251120103342_600_800_0.jpg" },
      { name: "東雲るみな", age: "22", size: "T.163 / B.91(G) / W.57 / H.89", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1835_20260404162011_600_800_3.jpg" },
      { name: "春日いちか", age: "26", size: "T.150 / B.88(E) / W.57 / H.86", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1829_20250531232710_600_800_0.jpg" },
      { name: "華宮めぐ", age: "21", size: "T.151 / B.87(E) / W.57 / H.87", img: "https://tokyo-panic.com/wp-content/uploads/2023/12/4961_20250607113237_600_800_0.jpg" },
      { name: "月島かえ", age: "25", size: "T.164 / B.88(D(激弱)) / W.58 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2025/10/6597_20251006163330_600_800_0.jpg" },
      { name: "沙月ゆり", age: "28", size: "T.160 / B.90(F) / W.58 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1841_20250531233040_600_800_0.jpg" },
      { name: "花城れいか", age: "24", size: "T.164 / B.87((D +軟体)) / W.57 / H.90", img: "https://tokyo-panic.com/wp-content/uploads/2025/09/6560_20260111192133_600_800_0.jpg" },
      { name: "浅見みゆ", age: "28", size: "T.165 / B.83(C) / W.54 / H.82", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1580_20250531232350_600_800_0.jpg" },
      { name: "水沢みつき", age: "22", size: "T.163 / B.93(美形G) / W.58 / H.95", img: "https://tokyo-panic.com/wp-content/uploads/2024/04/5223_20250531233741_600_800_1.jpg" },
      { name: "堀川るい", age: "24", size: "T.158 / B.83(C) / W.52 / H.83", img: "https://tokyo-panic.com/wp-content/uploads/2025/06/6418_20250605174708_600_800_0.jpg" },
      { name: "吉岡こころ", age: "22", size: "T.158 / B.84(D) / W.54 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2023/09/2737_20250531233857_600_800_0.jpg" },
      { name: "吹雪えみり", age: "25", size: "T.154 / B.86(D) / W.57 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1858_20250605165451_600_800_1.jpg" },
      { name: "浅井れいら", age: "23", size: "T.155 / B.88(E) / W.57 / H.90", img: "https://tokyo-panic.com/wp-content/uploads/2024/02/5159_20250531234533_600_800_0.jpg" },
      { name: "香坂りょう", age: "25", size: "T.157 / B.95(H) / W.59 / H.95", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1759_20250531232944_600_800_0.jpg" },
      { name: "峰不二ことは", age: "23", size: "T.160 / B.91(G) / W.56 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2024/12/5558_20250531233818_600_800_0.jpg" },
      { name: "相澤わかな", age: "24", size: "T.154 / B.90(G) / W.55 / H.92", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/IMG_8191.jpeg" },
      { name: "天咲ゆりな", age: "27", size: "T.154 / B.86(D) / W.56 / H.86", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1878_20250531232425_600_800_0.jpg" },
      { name: "椎名あいか", age: "20", size: "T.160 / B.88(E) / W.57 / H.90", img: "https://tokyo-panic.com/wp-content/uploads/2023/10/3515_20251116183422_600_800_0.jpg" },
      { name: "錦木めぐみ", age: "26", size: "T.162 / B.88(E) / W.56 / H.89", img: "https://tokyo-panic.com/wp-content/uploads/2024/04/5203_20250531233350_600_800_5.jpg" },
      { name: "三上りな", age: "27", size: "T.163 / B.93(G) / W.56 / H.90", img: "https://tokyo-panic.com/wp-content/uploads/2023/09/2355_20250531233804_600_800_3.jpg" },
      { name: "米倉まみ", age: "24", size: "T.160 / B.86(D) / W.57 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2023/08/1919_20250531233914_600_800_2.jpg" },
      { name: "玉城のあ", age: "22", size: "T.163 / B.90(F) / W.58 / H.93", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1658_20250531233234_600_800_0.jpg" },
      { name: "山田いおり", age: "23", size: "T.169 / B.95(H) / W.57 / H.91", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1704_20260122110828_600_800_0.jpg" },
      { name: "白浜しおり", age: "21", size: "T.158 / B.85(C) / W.56 / H.85", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1722_20250602061121_600_800_0.jpg" },
      { name: "愛川ゆきな", age: "18", size: "T.168 / B.88(E) / W.58 / H.90", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1739_20250531232204_600_800_0.jpg" },
      { name: "一ノ瀬らん", age: "25", size: "T.156 / B.95(H) / W.58 / H.93", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1815_20250531232526_600_800_0.jpg" },
      { name: "雛乃まりん", age: "24", size: "T.156 / B.88(F) / W.54 / H.90", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1790_20250531233445_600_800_0.jpg" },
      { name: "MANAMI♤TOJO", age: "29", size: "T.164 / B.89(F) / W.56 / H.88", img: "https://tokyo-panic.com/wp-content/uploads/2023/07/1756_20250531235304_600_800_0.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから対象店舗を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    console.log(`\n===========================================`);
    console.log(`▶ 処理開始: 【 ${shopDef.searchKeywords[0]} 】関連`);
    
    // 対象店舗（系列含む複数）を抽出
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
