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
      searchKeywords: ['grand chariot', 'グランシャリオ'],
      website_url: "https://www.grandchariottakadababa.com/",
      schedule_url: "https://www.grandchariottakadababa.com/schedule/",
      price_system: "70分: 15,000円\n90分: 19,000円\n120分: 24,000円\n150分: 29,000円\n180分: 37,000円\n210分: 42,000円\n240分: 48,000円",
      casts: [
        { name: "生田 あゆ", age: "25", size: "T.155 / W.58", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11317.jpg" },
        { name: "涼野なな", age: "25", size: "T.153 / W.53", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11314.jpg" },
        { name: "潤間　えりか", age: "18", size: "T.154 / W.57", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11310.jpg" },
        { name: "神谷 ここ", age: "25", size: "T.158 / W.58", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11293.jpg" },
        { name: "綾 ひいな", age: "26", size: "T.145 / W.57", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11296.jpg" },
        { name: "花村 りお", age: "20", size: "T.166", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11184.jpeg" },
        { name: "桜井うさ", age: "26", size: "T.158", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11252.jpg" },
        { name: "宮瀬 ちなつ", age: "24", size: "T.154 / W.57", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11254.jpg" },
        { name: "綾瀬 ゆき", age: "20", size: "T.150 / W.59", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11303.jpg" },
        { name: "広瀬みくも", age: "25", size: "T.159 / W.59", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11298.jpg" },
        { name: "立花 れいこ", age: "33", size: "T.159", img: "https://www.grandchariottakadababa.com/images/ml_11_1_5773.jpg" },
        { name: "百瀬 らん", age: "23", size: "T.158", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11201.jpg" },
        { name: "白石　りの", age: "24", size: "T.156", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11232.jpg" },
        { name: "藍沢 あゆ", age: "24", size: "T.155", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11250.jpg" },
        { name: "小山 ゆい", age: "23", size: "T.157 / W.58", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11260.jpg" },
        { name: "直井 れいな", age: "24", size: "T.155", img: "https://www.grandchariottakadababa.com/images/ml_11_1_6851.jpg" },
        { name: "まりん", age: "22", size: "T.158", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11225.jpg" },
        { name: "明日美 すず", age: "25", size: "T.162", img: "https://www.grandchariottakadababa.com/images/ml_11_1_10725.jpg" },
        { name: "七瀬 かずさ", age: "26", size: "T.163", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11209.jpg" },
        { name: "大谷 るな", age: "22", size: "T.162", img: "https://www.grandchariottakadababa.com/images/ml_11_1_10321.jpeg" },
        { name: "紬 あやね", age: "20", size: "T.162", img: "https://www.grandchariottakadababa.com/images/ml_11_1_10598.jpg" },
        { name: "中村 ゆりな", age: "25", size: "T.158", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11122.jpeg" },
        { name: "土生 みずほ", age: "25", size: "T.164", img: "https://www.grandchariottakadababa.com/images/ml_11_1_5548.jpg" },
        { name: "小野寺 にいな", age: "23", size: "T.154", img: "https://www.grandchariottakadababa.com/images/ml_11_1_6704.jpg" },
        { name: "花咲ゆい", age: "25", size: "T.165", img: "https://www.grandchariottakadababa.com/images/ml_11_1_11207.jpg" },
        { name: "如月れみ", age: "24", size: "T.160", img: "https://www.grandchariottakadababa.com/images/ml_11_1_8936.jpg" },
        { name: "堂園 かすみ", age: "22", size: "T.160", img: "https://www.grandchariottakadababa.com/images/ml_11_1_8459.jpeg" },
        { name: "椿 かれん", age: "24", size: "T.150", img: "https://www.grandchariottakadababa.com/images/ml_11_1_9399.jpg" },
        { name: "要じゅり", age: "-", size: "-", img: "https://www.grandchariottakadababa.com/asset/img/noimage.jpg" }
      ]
    },
    {
      searchKeywords: ['r.s', 'アールエス', 'rs'],
      website_url: "https://rs-spa.com/",
      schedule_url: "https://rs-spa.com/schedule/",
      price_system: "90min: 17,000yen\n120min: 22,000yen\n150min: 27,000yen",
      casts: [
        { name: "はな", age: "22", size: "T.157 / B.88(E) / W.56 / H.86", img: "https://rs-spa.com/wp-content/uploads/2025/05/1932_20250627164629_600_800_0.jpg" },
        { name: "あゆか", age: "20", size: "T.161 / B.91(G) / W.56 / H.86", img: "https://rs-spa.com/wp-content/uploads/2025/07/3268_20250927143217_600_800_0.jpg" },
        { name: "みき", age: "18", size: "T.162 / B.84(C) / W.53 / H.86", img: "https://rs-spa.com/wp-content/uploads/2025/09/3609_20250918115417_600_800_0.jpg" },
        { name: "りり", age: "24", size: "T.158 / B.93(F) / W.56 / H.87", img: "https://rs-spa.com/wp-content/uploads/2025/09/4ejAigkrWKTcDKM1757505681_1757505704_0-1.jpg" },
        { name: "ゆきの", age: "22", size: "T.165 / B.87(D) / W.53 / H.86", img: "https://rs-spa.com/wp-content/uploads/2025/11/3928_20251129191108_600_800_0.jpg" },
        { name: "なる", age: "19", size: "T.157 / B.92(F) / W.57 / H.88", img: "https://rs-spa.com/wp-content/uploads/2025/08/3432_20250815145654_600_800_0.jpg" },
        { name: "つき", age: "23", size: "T.156 / B.87(D) / W.55 / H.84", img: "https://rs-spa.com/wp-content/uploads/2026/03/8cFhXD7PH3wVmzy1772532845_1772532948.jpg" },
        { name: "なな", age: "21", size: "T.155 / B.86(D) / W.54 / H.85", img: "https://rs-spa.com/wp-content/uploads/2025/09/S__2220072.jpg" },
        { name: "まどか", age: "25", size: "T.160 / B.100(H) / W.55 / H.90", img: "https://rs-spa.com/wp-content/uploads/2026/02/4484_20260317194618_600_800_0.jpg" },
        { name: "うさ", age: "21", size: "T.147 / B.91(F) / W.55 / H.86", img: "https://rs-spa.com/wp-content/uploads/2026/01/4188_20260225144601_600_800_0.jpg" },
        { name: "しおね", age: "23", size: "T.153 / B.89(E) / W.55 / H.87", img: "https://rs-spa.com/wp-content/uploads/2025/10/3728_20251010181533_600_800_0.jpg" },
        { name: "みかさ", age: "27", size: "T.160 / B.85(D) / W.54 / H.86", img: "https://rs-spa.com/wp-content/uploads/2026/02/2sLaS2WdIaXu9ae1771760268_1771760287.jpg" },
        { name: "まり", age: "26", size: "T.145 / B.89(H) / W.55 / H.86", img: "https://rs-spa.com/wp-content/uploads/2025/12/gs3WquUVzsgikqC1765702540_1765702592.jpg" },
        { name: "ゆうり", age: "27", size: "T.160 / B.84(C) / W.56 / H.86", img: "https://rs-spa.com/wp-content/uploads/2026/03/4QJr1WF8Y4zBVWI1772531381_1772531447.jpg" },
        { name: "すい", age: "19", size: "T.145 / B.89(F) / W.53 / H.85", img: "https://rs-spa.com/wp-content/uploads/2026/03/tsaB8NzuM2GmixW1774145953_1774146131.jpg" },
        { name: "きさき", age: "18", size: "T.165 / B.92(G) / W.54 / H.85", img: "https://rs-spa.com/wp-content/uploads/2025/12/i8T80kcwVp63pzo1764574074_1764574096.jpg" },
        { name: "れんか", age: "18", size: "T.152 / B.83(A) / W.52 / H.86", img: "https://rs-spa.com/wp-content/uploads/2025/10/5.jpg" },
        { name: "さく", age: "28", size: "T.165 / B.92(G) / W.55 / H.88", img: "https://rs-spa.com/wp-content/uploads/2026/02/NQgAZSEgYJ0fEPW1771266320_1771266366_0.jpg" },
        { name: "かや", age: "28", size: "T.153 / B.101(I) / W.56 / H.89", img: "https://rs-spa.com/wp-content/uploads/2026/01/zQKU9madEILrOeW1768643159_1768643200.jpg" },
        { name: "みずき", age: "27", size: "T.157 / B.88(E) / W.55 / H.86", img: "https://rs-spa.com/wp-content/uploads/2026/01/4Nw23IKoXc6g7zV1768048712_1768048749.jpg" },
        { name: "らら", age: "21", size: "T.168 / B.89(F) / W.56 / H.86", img: "https://rs-spa.com/wp-content/uploads/2025/05/1911_20250627164711_600_800_0.jpg" },
        { name: "いぶき", age: "21", size: "T.160 / B.85(C) / W.53 / H.84", img: "https://rs-spa.com/wp-content/uploads/2025/11/S__2785376.jpg" },
        { name: "みみ", age: "20", size: "T.155 / B.91(G) / W.58 / H.87", img: "https://rs-spa.com/wp-content/uploads/2025/05/1933_20250627164731_600_800_0.jpg" },
        { name: "ゆめの", age: "25", size: "T.157 / B.88(D) / W.55 / H.85", img: "https://rs-spa.com/wp-content/uploads/2025/07/3356_20250927135437_600_800_0.jpg" },
        { name: "えりか", age: "25", size: "T.155 / B.88(D) / W.56 / H.87", img: "https://rs-spa.com/wp-content/uploads/2025/06/2674_20250627164650_600_800_0.jpg" },
        { name: "のの", age: "21", size: "T.157 / B.92(G) / W.55 / H.87", img: "https://rs-spa.com/wp-content/uploads/2025/05/1851_20250627164846_600_800_0.jpg" },
        { name: "みれい", age: "20", size: "T.162 / B.88(E) / W.56 / H.87", img: "https://rs-spa.com/wp-content/uploads/2025/05/1917_20250627164916_600_800_0.jpg" },
        { name: "らむ", age: "22", size: "T.171 / B.94(H) / W.58 / H.88", img: "https://rs-spa.com/wp-content/uploads/2025/07/3262_20250804164204_600_800_0.jpg" },
        { name: "みゆ", age: "19", size: "T.168 / B.91(E) / W.57 / H.88", img: "https://rs-spa.com/wp-content/uploads/2025/09/3550_20250910214451_600_800_0.jpg" },
        { name: "みなみ", age: "24", size: "T.161 / B.104(I) / W.57 / H.88", img: "https://rs-spa.com/wp-content/uploads/2025/06/ZLkKJdhOqdT7wxu1754133132_1754133212.jpg" },
        { name: "おと", age: "20", size: "T.156 / B.87(D) / W.54 / H.84", img: "https://rs-spa.com/wp-content/uploads/2025/06/3013_20250627164749_600_800_0.jpg" },
        { name: "かのん", age: "28", size: "T.157 / B.84(B) / W.54 / H.86", img: "https://rs-spa.com/wp-content/uploads/2025/12/PQfR4vtWwtkb0jU1764579374_1764579435.jpg" },
        { name: "みつ", age: "26", size: "T.157 / B.88(E) / W.57 / H.90", img: "https://rs-spa.com/wp-content/uploads/2026/01/d1w4UPrEdx2LxEL1768213832_1768214034.jpg" },
        { name: "りか", age: "21", size: "T.167 / B.87(D) / W.53 / H.85", img: "https://rs-spa.com/wp-content/uploads/2025/05/1902_20250627164815_600_800_0.jpg" },
        { name: "ひより", age: "24", size: "T.156 / B.83(C) / W.51 / H.82", img: "https://rs-spa.com/wp-content/uploads/2025/06/3088_20250710155638_600_800_0.jpg" },
        { name: "りさ", age: "21", size: "T.161 / B.90(F) / W.58 / H.87", img: "https://rs-spa.com/wp-content/uploads/2025/07/6JEU0FKznTAaueM1751877344_1751877376.jpg" },
        { name: "みあ", age: "24", size: "T.165 / B.86(C) / W.54 / H.85", img: "https://rs-spa.com/wp-content/uploads/2025/09/3645_20251008132129_600_800_0.jpg" },
        { name: "せいな", age: "24", size: "T.143 / B.106(I) / W.54 / H.85", img: "https://rs-spa.com/wp-content/uploads/2026/03/qGHbFc5LsfteB671774144697_1774144778.jpg" },
        { name: "しらす", age: "24", size: "T.155 / B.98(H) / W.56 / H.89", img: "https://rs-spa.com/wp-content/uploads/2026/02/4523_20260227023102_600_800_0.jpg" },
        { name: "もえ", age: "26", size: "T.160 / B.89(E) / W.56 / H.85", img: "https://rs-spa.com/wp-content/uploads/2026/04/MZtAivCDa3KZbqn1775547207_1775547230.jpg" },
        { name: "まな", age: "20", size: "T.155 / B.84(C) / W.53 / H.82", img: "https://rs-spa.com/wp-content/uploads/2026/03/iku9Mp0wGX6FZ2r1773812388_1773812473.jpg" },
        { name: "いろは", age: "27", size: "T.151 / B.88(E) / W.58 / H.86", img: "https://rs-spa.com/wp-content/uploads/2026/04/KJAtxulWeAaei1j1774608520_1774608560.jpg" },
        { name: "さくら", age: "25", size: "T.160 / B.84(C) / W.56 / H.83", img: "https://rs-spa.com/wp-content/uploads/2026/04/GWUrorj9J2iN95F1775363670_1775363775.jpg" },
        { name: "しおん", age: "18", size: "T.152 / B.87(D) / W.56 / H.88", img: "https://rs-spa.com/wp-content/uploads/2026/04/Lty8ChXV1el36hC1775537733_1775537799.jpg" }
      ]
    }
  ];

  try {
    console.log(`🔍 データベースから対象の2店舗を検索し、一括更新を実行します...\n`);

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
    }
    
    console.log(`\n🎊 すべての店舗の更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
