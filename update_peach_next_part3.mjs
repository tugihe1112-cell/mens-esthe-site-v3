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

  // パート3のキャストデータ
  const shopData = {
    searchKeywords: ['peach', 'ピーチ', 'next', 'ネクスト'],
    casts: [
      { name: "南ゆず", age: "24", size: "T.161 / B.82(C) / W.57 / H.86", img: "https://peach-next.com/optImg/1004152/item/10035683/11120888_640_0.jpg" },
      { name: "長谷川みいな", age: "21", size: "T.158 / B.86(E) / W.56 / H.-", img: "https://peach-next.com/optImg/1004152/item/10037757/11120627_640_0.jpg" },
      { name: "有栖みなみ", age: "22", size: "T.161 / B.91(G) / W.57 / H.89", img: "https://peach-next.com/optImg/1004152/item/10031034/11114122_640_0.jpg" },
      { name: "如月しいな", age: "26", size: "T.156 / B.101(I) / W.57 / H.90", img: "https://peach-next.com/optImg/1004152/item/10032234/11121087_640_0.jpg" },
      { name: "一条ゆうな", age: "23", size: "T.149 / B.89(F) / W.56 / H.85", img: "https://peach-next.com/optImg/1004152/item/10031540/11094221_640_0.jpg" },
      { name: "朝比奈りりか", age: "30", size: "T.160 / B.88(F) / W.57 / H.87", img: "https://peach-next.com/optImg/1004152/item/10019332/11036518_640_0.jpg" },
      { name: "甘露寺みつり", age: "30", size: "T.153 / B.93(G) / W.56 / H.83", img: "https://peach-next.com/optImg/1004152/item/10035598/11110656_640_0.jpg" },
      { name: "榎並あいり", age: "20", size: "T.158 / B.83(E) / W.56 / H.85", img: "https://peach-next.com/optImg/1004152/item/10035564/11109963_640_0.jpg" },
      { name: "神楽みいさ", age: "26", size: "T.160 / B.86(E) / W.57 / H.84", img: "https://peach-next.com/optImg/1004152/item/10034398/11107231_640_0.jpg" },
      { name: "小野寺るな", age: "20", size: "T.165 / B.85(E) / W.56 / H.86", img: "https://peach-next.com/optImg/1004152/item/10038134/11122540_640_0.jpg" },
      { name: "川合ななみ", age: "20", size: "T.158 / B.85(F) / W.57 / H.87", img: "https://peach-next.com/optImg/1004152/item/10033538/11101900_640_0.jpg" },
      { name: "小芝ほのか", age: "20", size: "T.149 / B.83(E) / W.55 / H.82", img: "https://peach-next.com/optImg/1004152/item/10033979/11104839_640_0.jpg" },
      { name: "黒崎あみ", age: "27", size: "T.152 / B.93(G) / W.57 / H.87", img: "https://peach-next.com/optImg/1004152/item/10033477/11113915_640_0.jpg" },
      { name: "三崎みさき", age: "25", size: "T.150 / B.95(H) / W.55 / H.88", img: "https://peach-next.com/optImg/1004152/item/10033988/11107200_640_0.jpg" },
      { name: "瑠璃川ひめか", age: "21", size: "T.159 / B.87(E) / W.57 / H.88", img: "https://peach-next.com/optImg/1004152/item/10031048/11089550_640_0.jpg" },
      { name: "桃園きょうか", age: "26", size: "T.163 / B.89(F) / W.55 / H.84", img: "https://peach-next.com/optImg/1004152/item/10031438/11091856_640_0.jpg" },
      { name: "海乃さんご", age: "21", size: "T.151 / B.82(C) / W.55 / H.83", img: "https://peach-next.com/optImg/1004152/item/10030539/11086108_640_0.jpg" },
      { name: "夢咲すず", age: "21", size: "T.156 / B.83(D) / W.55 / H.86", img: "https://peach-next.com/optImg/1004152/item/10033224/11100355_640_0.jpg" },
      { name: "桜井かりん", age: "21", size: "T.158 / B.85(D) / W.58 / H.87", img: "https://peach-next.com/optImg/1004152/item/10032321/11097604_640_0.jpg" },
      { name: "美波ゆり", age: "21", size: "T.166 / B.85(D) / W.58 / H.87", img: "https://peach-next.com/optImg/1004152/item/10030006/11083222_640_0.jpg" },
      { name: "白石れいな", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://peach-next.com/optImg/1004152/item/10022919/11071386_640_0.jpg" }
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

    // 対象店舗（系列含む複数）を抽出
    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return shopData.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
    });

    if (targetShops.length > 0) {
      for (const shop of targetShops) {
        console.log(`🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
        // キャストの更新
        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
        const dbCasts = await dbRes.json();
        
        let updateCount = 0;
        let insertCount = 0;

        const uniqueCasts = Array.from(new Map(shopData.casts.map(c => [c.name, c])).values());

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
        console.log(`  🎉 キャスト設定完了（新規: ${insertCount}名 / 画像・プロフ更新: ${updateCount}名）\n`);
      }
      console.log(`🎊 「ピーチネクスト」パート3の更新が完了しました！`);
    } else {
      console.log("⚠️ 「ピーチネクスト」を含む店舗が見つかりませんでした。");
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
