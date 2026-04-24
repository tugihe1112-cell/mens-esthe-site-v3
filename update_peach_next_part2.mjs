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
    casts: [
      { name: "松木いちか", age: "20", size: "T.160 / B.89(G) / W.57 / H.91", img: "https://peach-next.com/optImg/1004152/item/10028719/11075579_640_0.jpg" },
      { name: "四ノ宮らん", age: "20", size: "T.148 / B.85(E) / W.55 / H.84", img: "https://peach-next.com/optImg/1004152/item/10035653/11117925_640_0.jpg" },
      { name: "高野いおり", age: "21", size: "T.148 / B.87(F) / W.58 / H.88", img: "https://peach-next.com/optImg/1004152/item/10038198/11122419_640_0.jpg" },
      { name: "水輝つみき", age: "23", size: "T.155 / B.84(E) / W.56 / H.82", img: "https://peach-next.com/optImg/1004152/item/10035111/11108406_640_0.jpg" },
      { name: "葵あずさ", age: "23", size: "T.168 / B.105(I) / W.58 / H.92", img: "https://peach-next.com/optImg/1004152/item/10037494/11119820_640_0.jpg" },
      { name: "雪代ゆん", age: "21", size: "T.160 / B.105(K) / W.56 / H.86", img: "https://peach-next.com/optImg/1004152/item/10036617/11115136_640_0.jpg" },
      { name: "佐々木もえか", age: "24", size: "T.166 / B.85(D) / W.56 / H.87", img: "https://peach-next.com/optImg/1004152/item/10036820/11116205_640_0.jpg" },
      { name: "花咲なぎ", age: "25", size: "T.150 / B.88(G) / W.57 / H.89", img: "https://peach-next.com/optImg/1004152/item/10036537/11114676_640_0.jpg" },
      { name: "愛沢ありさ", age: "22", size: "T.152 / B.82(C) / W.56 / H.84", img: "https://peach-next.com/optImg/1004152/item/10036714/11115669_640_0.jpg" },
      { name: "胡蝶らいか", age: "24", size: "T.163 / B.103(H) / W.58 / H.92", img: "https://peach-next.com/optImg/1004152/item/10033332/11114673_640_0.jpg" },
      { name: "白雪ゆめの", age: "27", size: "T.165 / B.85(E) / W.57 / H.87", img: "https://peach-next.com/optImg/1004152/item/10036684/11121855_640_0.jpg" },
      { name: "兎咲にあ", age: "22", size: "T.157 / B.94(G) / W.57 / H.90", img: "https://peach-next.com/optImg/1004152/item/10036615/11115127_640_0.jpg" },
      { name: "椿ねね", age: "22", size: "T.154 / B.88(F) / W.56 / H.87", img: "https://peach-next.com/optImg/1004152/item/10036794/11116373_640_0.jpg" },
      { name: "桐谷みお", age: "27", size: "T.155 / B.85(E) / W.57 / H.87", img: "https://peach-next.com/optImg/1004152/item/10036884/11117060_640_0.jpg" },
      { name: "若槻ゆら", age: "20", size: "T.153 / B.85(F) / W.56 / H.86", img: "https://peach-next.com/optImg/1004152/item/10036373/11113715_640_0.jpg" },
      { name: "北村しほ", age: "25", size: "T.160 / B.89(F) / W.55 / H.86", img: "https://peach-next.com/optImg/1004152/item/10033432/11110092_640_0.jpg" },
      { name: "涼森うみね", age: "24", size: "T.165 / B.87(E) / W.57 / H.86", img: "https://peach-next.com/optImg/1004152/item/10035107/11108562_640_0.jpg" },
      { name: "桜あい", age: "24", size: "T.161 / B.89(G) / W.57 / H.91", img: "https://peach-next.com/optImg/1004152/item/10036035/11112772_640_0.jpg" },
      { name: "東雲このは", age: "20", size: "T.159 / B.85(E) / W.56 / H.86", img: "https://peach-next.com/optImg/1004152/item/10036544/11114803_640_0.jpg" },
      { name: "山田しおん", age: "26", size: "T.160 / B.82(D) / W.57 / H.85", img: "https://peach-next.com/optImg/1004152/item/10036474/11114384_640_0.jpg" },
      { name: "七瀬さき", age: "21", size: "T.174 / B.85(F) / W.58 / H.89", img: "https://peach-next.com/optImg/1004152/item/10036619/11115333_640_0.jpg" },
      { name: "夢乃あむ", age: "22", size: "T.163 / B.91(G) / W.56 / H.88", img: "https://peach-next.com/optImg/1004152/item/10035722/11110780_640_0.jpg" },
      { name: "成瀬ここ", age: "20", size: "T.153 / B.81(C) / W.55 / H.83", img: "https://peach-next.com/optImg/1004152/item/10034981/11108408_640_0.jpg" },
      { name: "河北なつき", age: "24", size: "T.163 / B.93(G) / W.57 / H.88", img: "https://peach-next.com/optImg/1004152/item/10034895/11122496_640_0.jpg" },
      { name: "白咲もえ", age: "20", size: "T.152 / B.84(E) / W.55 / H.86", img: "https://peach-next.com/optImg/1004152/item/10036782/11115916_640_0.jpg" },
      { name: "立花あまね", age: "26", size: "T.165 / B.92(G) / W.57 / H.89", img: "https://peach-next.com/optImg/1004152/item/10033971/11107402_640_0.jpg" },
      { name: "朝倉らら", age: "20", size: "T.160 / B.93(F) / W.57 / H.91", img: "https://peach-next.com/optImg/1004152/item/10028949/11102262_640_0.jpg" },
      { name: "一ノ瀬れい", age: "27", size: "T.161 / B.90(G) / W.57 / H.86", img: "https://peach-next.com/optImg/1004152/item/10026644/11065540_640_0.jpg" },
      { name: "伊藤あすか", age: "21", size: "T.150 / B.85(E) / W.56 / H.87", img: "https://peach-next.com/optImg/1004152/item/10034449/11105163_640_0.jpg" }
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

    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return n.includes('peach') || n.includes('ピーチ') || n.includes('next') || n.includes('ネクスト');
    });

    if (targetShops.length > 0) {
      for (const shop of targetShops) {
        console.log(`🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
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
      console.log(`🎊 「ピーチネクスト」パート2の更新が完了しました！`);
    } else {
      console.log("⚠️ 「ピーチネクスト」を含む店舗が見つかりませんでした。");
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
