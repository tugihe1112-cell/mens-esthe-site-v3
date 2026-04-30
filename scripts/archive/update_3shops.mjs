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

  const shopsData = [
    {
      searchKeywords: ['カノネコ', 'もしも彼女が黒猫だったら', 'kanoneko'],
      website_url: "https://the-garnet-kanoneko.com/",
      schedule_url: "https://the-garnet-kanoneko.com/schedule/",
      price_system: "80分 16,000円(1周年割引価格)\n100分 20,000円(1周年割引価格)\n120分 24,000円(1周年割引価格)",
      casts: [
        { name: "りか", age: "21", size: "T.166 / B.88(E) / W.56 / H.87", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/04/9545_20260407103128_600_800_0.jpg" },
        { name: "こよみ", age: "25", size: "T.153 / B.85(E) / W.57 / H.83", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2025/07/4035_20260406222449_600_800_0.jpg" },
        { name: "かりな", age: "23", size: "T.165 / B.84(D) / W.54 / H.80", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/04/9524_20260406204435_600_800_0.jpg" },
        { name: "こゆい", age: "24", size: "T.161 / B.84(D) / W.57 / H.85", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/04/9505_20260408163948_600_800_0.jpg" },
        { name: "りのあ", age: "26", size: "T.157 / B.83(D) / W.56 / H.85", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/04/9105_20260406053835_600_800_0.jpg" },
        { name: "ゆうか", age: "23", size: "T.165 / B.85(D) / W.55 / H.86", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8955_20260406053616_600_800_0.jpg" },
        { name: "ひなみ", age: "21", size: "T.163 / B.90(G) / W.56 / H.85", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8926_20260406053413_600_800_0.jpg" },
        { name: "きいな", age: "21", size: "T.155 / B.93(G) / W.57 / H.86", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8939_20260406053501_600_800_0.jpg" },
        { name: "とわ", age: "26", size: "T.169 / B.86(E) / W.57 / H.89", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8916_20260406053743_600_800_0.jpg" },
        { name: "けい", age: "25", size: "T.156 / B.85(E) / W.57 / H.87", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8901_20260410195542_600_800_0.jpg" },
        { name: "りん", age: "22", size: "T.147 / B.82(D) / W.54 / H.81", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8824_20260407052520_600_800_0.jpg" },
        { name: "きなつ", age: "20", size: "T.165 / B.86(E) / W.55 / H.83", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8792_20260406053635_600_800_0.jpg" },
        { name: "せな", age: "25", size: "T.158 / B.88(F) / W.58 / H.86", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8875_20260406053707_600_800_0.jpg" },
        { name: "あみ", age: "23", size: "T.158 / B.83(C) / W.56 / H.85", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8783_20260406053356_600_800_0.jpg" },
        { name: "あおい", age: "21", size: "T.161 / B.90(G) / W.57 / H.86", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8509_20260406053541_600_800_0.jpg" },
        { name: "かんな", age: "24", size: "T.164 / B.88(D) / W.58 / H.88", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8724_20260406053819_600_800_0.jpg" },
        { name: "まりん", age: "22", size: "T.161 / B.88(G) / W.57 / H.85", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8654_20260406053520_600_800_0.jpg" },
        { name: "なつき", age: "25", size: "T.168 / B.86(C) / W.56 / H.85", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/8518_20260406053445_600_800_0.jpg" },
        { name: "かのん", age: "20", size: "T.155 / B.86(E) / W.54 / H.84", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/03/7992_20260406053725_600_800_0.jpg" },
        { name: "あい", age: "22", size: "T.158 / B.86(D) / W.57 / H.85", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2026/02/7159_20260406054205_600_800_0.jpg" },
        { name: "あいみ", age: "20", size: "T.154 / B.88(E) / W.56 / H.85", img: "https://the-garnet-kanoneko.com/wp-content/uploads/2025/03/1779_20260406054058_600_800_0.jpg" }
      ]
    },
    {
      searchKeywords: ['rhea spa', 'レアスパ'],
      website_url: "https://rhea-spa.net/",
      schedule_url: "https://rhea-spa.net/schedule",
      price_system: "90分 18,000円\n120分 23,000円\n150分 28,000円",
      casts: [
        { name: "神宮寺なる", age: "23", size: "T.158 / B.-(G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747667349_3136913.jpg" },
        { name: "伊東えみ", age: "32", size: "T.165 / B.-(H)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747815914_3568206.jpeg" },
        { name: "結城みお", age: "21", size: "T.158 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1752989056_3167100.jpg" },
        { name: "宮野あやの", age: "25", size: "T.153 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747667365_7455637.jpg" },
        { name: "蒼井はるか", age: "32", size: "T.155 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747667372_3714491.jpg" },
        { name: "五十嵐らら", age: "20", size: "T.154 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747667440_1721226.jpg" },
        { name: "椿あや", age: "28", size: "T.155 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1761888836_4608401.jpeg" },
        { name: "成瀬あさみ", age: "28", size: "T.164 / B.-(I)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747667391_4169078.jpg" },
        { name: "七瀬みり", age: "23", size: "T.153 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775128332_5044953.jpg" },
        { name: "諸星かすみ", age: "24", size: "T.155 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1774445306_0156662.jpeg" },
        { name: "鈴鹿かりな", age: "21", size: "T.163 / B.-(H)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775128340_3788937.jpg" },
        { name: "葉加瀬まい", age: "28", size: "T.156 / B.-(F)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775128349_2423298.jpg" },
        { name: "流川みみ", age: "21", size: "T.160 / B.-(G)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767652102_5030823.jpeg" },
        { name: "栗原あゆむ", age: "25", size: "T.157 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771386952_0990028.jpeg" },
        { name: "白華ひとみ", age: "22", size: "T.158 / B.-(H)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771215919_5271546.jpeg" },
        { name: "日野なの", age: "23", size: "T.154 / B.-(I)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770624205_6454338.jpeg" },
        { name: "中島さえ", age: "25", size: "T.164 / B.-(H)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747667675_3048599.jpg" },
        { name: "伊吹いぶ", age: "27", size: "T.165 / B.-(E)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1772080283_1785708.jpeg" },
        { name: "佐久間ひかる", age: "22", size: "T.158 / B.-(I)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747667455_1820577.jpeg" },
        { name: "瀬那いおり", age: "21", size: "T.160 / B.-(D)", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1747667446_5784344.jpg" },
        { name: "月城ねる", age: "22", size: "T.156 / B.-(H)", img: "https://cdn2-caskan.com/caskan/img/comingsoon.png?v=5" }
      ]
    },
    {
      searchKeywords: ['rains rapt', 'レインズラプト'],
      website_url: "https://www.rainsrapt.com/",
      schedule_url: "https://www.rainsrapt.com/schedule/",
      price_system: "60分 14,000円\n80分 17,000円\n100分 20,000円\n120分 24,000円\n140分 29,000円",
      casts: [
        { name: "朝倉みゆう", age: "25", size: "T.162 / B.- / W.- / H.-", img: "https://www.rainsrapt.com/images/ml_11_1_10903.jpg" },
        { name: "花宮たえ", age: "23", size: "T.159 / B.- / W.- / H.-", img: "https://www.rainsrapt.com/images/ml_11_1_10900.jpg" },
        { name: "真白ほのか", age: "26", size: "T.164 / B.- / W.- / H.-", img: "https://www.rainsrapt.com/images/ml_11_1_10897.jpg" },
        { name: "常盤まりこ", age: "30", size: "T.161 / B.- / W.- / H.-", img: "https://www.rainsrapt.com/images/ml_11_1_10883.jpg" },
        { name: "玉置ももか", age: "23", size: "T.155 / B.- / W.- / H.-", img: "https://www.rainsrapt.com/images/ml_11_1_10854.jpg" },
        { name: "瀬戸加奈子", age: "29", size: "T.160 / B.- / W.- / H.-", img: "https://www.rainsrapt.com/images/ml_11_1_10851.jpg" },
        { name: "久保田舞衣", age: "27", size: "T.155 / B.- / W.- / H.-", img: "https://www.rainsrapt.com/images/ml_11_1_10840.jpg" },
        { name: "寺内あやめ", age: "32", size: "T.163 / B.- / W.- / H.-", img: "https://www.rainsrapt.com/images/ml_11_1_10831.jpg" }
      ]
    }
  ];

  try {
    console.log(`🔍 データベースから対象店舗を検索し、完全な情報とキャスト更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    for (const shopDef of shopsData) {
      console.log(`\n===========================================`);
      console.log(`▶ 処理開始: 【 ${shopDef.searchKeywords[0]} 】関連`);
      
      const targetShops = allShops.filter(shop => {
        const n = shop.name.toLowerCase();
        return shopDef.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
      });

      if (targetShops.length === 0) {
        console.log(`⚠️ 店舗が見つかりませんでした。スキップします。`);
        continue;
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
    }
    
    console.log(`\n🎊 すべての更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
