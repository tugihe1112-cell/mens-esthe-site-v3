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
      { name: "天使りさ", age: "27", size: "T.154 / B.86(E) / W.55 / H.84", img: "https://peach-next.com/optImg/1004152/item/10019335/11054796_640_0.jpg" },
      { name: "星乃あみの", age: "20", size: "T.163 / B.86(F) / W.55 / H.87", img: "https://peach-next.com/optImg/1004152/item/10028942/11076799_640_0.jpg" },
      { name: "真白ゆあ", age: "25", size: "T.155 / B.91(F) / W.56 / H.87", img: "https://peach-next.com/optImg/1004152/item/10033686/11107250_640_0.jpg" },
      { name: "黒瀬みおり", age: "25", size: "T.161 / B.84(D) / W.55 / H.85", img: "https://peach-next.com/optImg/1004152/item/10038331/11123179_640_0.jpg" },
      { name: "楠希あいす", age: "22", size: "T.170 / B.86(E) / W.57 / H.88", img: "https://peach-next.com/optImg/1004152/item/10038523/11123821_640_0.jpg" },
      { name: "愛原みゆ", age: "28", size: "T.160 / B.98(H) / W.57 / H.94", img: "https://peach-next.com/optImg/1004152/item/10038498/11124448_640_0.jpg" },
      { name: "島村きい", age: "20", size: "T.152 / B.83(D) / W.55 / H.86", img: "https://peach-next.com/optImg/1004152/item/10038647/11124515_640_0.jpg" },
      { name: "森かすみ", age: "20", size: "T.150 / B.82(D) / W.57 / H.85", img: "https://peach-next.com/optImg/1004152/item/10033984/11123952_640_0.jpg" },
      { name: "夏目ほのか", age: "21", size: "T.160 / B.87(D) / W.56 / H.88", img: "https://peach-next.com/optImg/1004152/item/10037189/11117687_640_0.jpg" },
      { name: "葉山じゅり", age: "24", size: "T.168 / B.90(G) / W.58 / H.92", img: "https://peach-next.com/optImg/1004152/item/10038639/11124291_640_0.jpg" },
      { name: "前田まゆ", age: "21", size: "T.162 / B.105(I) / W.58 / H.90", img: "https://peach-next.com/optImg/1004152/item/10038271/11122790_640_0.jpg" },
      { name: "桐島いぶき", age: "22", size: "T.158 / B.86(E) / W.57 / H.89", img: "https://peach-next.com/optImg/1004152/item/10038428/11123507_640_0.jpg" },
      { name: "天宮かえで", age: "23", size: "T.161 / B.-(C) / W.55 / H.-", img: "https://peach-next.com/optImg/1004152/item/10038280/11123043_640_0.jpg" },
      { name: "有村まりん", age: "26", size: "T.168 / B.83(D) / W.56 / H.87", img: "https://peach-next.com/optImg/1004152/item/10038627/11124552_640_0.jpg" },
      { name: "葉月まな", age: "20", size: "T.150 / B.87(F) / W.57 / H.90", img: "https://peach-next.com/optImg/1004152/item/10038370/11123503_640_0.jpg" },
      { name: "橋本あや", age: "22", size: "T.162 / B.87(F) / W.56 / H.84", img: "https://peach-next.com/optImg/1004152/item/10037509/11119402_640_0.jpg" },
      { name: "山中ひかる", age: "23", size: "T.155 / B.100(H) / W.58 / H.94", img: "https://peach-next.com/optImg/1004152/item/10038565/11124175_640_0.jpg" },
      { name: "綾瀬めい", age: "22", size: "T.158 / B.92(G) / W.58 / H.90", img: "https://peach-next.com/optImg/1004152/item/10038605/11124237_640_0.jpg" },
      { name: "宇佐美るか", age: "23", size: "T.160 / B.83(C) / W.56 / H.86", img: "https://peach-next.com/optImg/1004152/item/10038528/11123950_640_0.jpg" },
      { name: "神崎こころ", age: "23", size: "T.164 / B.86(D) / W.57 / H.88", img: "https://peach-next.com/optImg/1004152/item/10038407/11123505_640_0.jpg" },
      { name: "月城りあ", age: "26", size: "T.166 / B.94(G) / W.56 / H.88", img: "https://peach-next.com/optImg/1004152/item/10038122/11122036_640_0.jpg" },
      { name: "早乙女ひな", age: "22", size: "T.165 / B.85(D) / W.55 / H.87", img: "https://peach-next.com/optImg/1004152/item/10038350/11123732_640_0.jpg" },
      { name: "美月りか", age: "22", size: "T.165 / B.86(D) / W.56 / H.87", img: "https://peach-next.com/optImg/1004152/item/10038345/11123182_640_0.jpg" },
      { name: "桜庭ひなの", age: "25", size: "T.160 / B.87(F) / W.57 / H.88", img: "https://peach-next.com/optImg/1004152/item/10038257/11122710_640_0.jpg" },
      { name: "白花ゆめか", age: "23", size: "T.166 / B.105(I) / W.58 / H.92", img: "https://peach-next.com/optImg/1004152/item/10037773/11120814_640_0.jpg" },
      { name: "柊のん", age: "23", size: "T.154 / B.86(F) / W.55 / H.87", img: "https://peach-next.com/optImg/1004152/item/10037675/11120124_640_0.jpg" },
      { name: "惣流アスカ", age: "26", size: "T.168 / B.100(H) / W.57 / H.90", img: "https://peach-next.com/optImg/1004152/item/10037267/11118139_640_0.jpg" },
      { name: "渚ゆき", age: "22", size: "T.155 / B.92(G) / W.54 / H.79", img: "https://peach-next.com/optImg/1004152/item/10032951/11104619_640_0.jpg" },
      { name: "華神えれな", age: "20", size: "T.158 / B.95(G) / W.57 / H.87", img: "https://peach-next.com/optImg/1004152/item/10036969/11116833_640_0.jpg" },
      { name: "冨士ちひろ", age: "25", size: "T.162 / B.95(G) / W.57 / H.91", img: "https://peach-next.com/optImg/1004152/item/10037191/11117796_640_0.jpg" },
      { name: "相沢みなと", age: "24", size: "T.155 / B.85(E) / W.55 / H.86", img: "https://peach-next.com/optImg/1004152/item/10037496/11119180_640_0.jpg" },
      { name: "桃瀬らむ", age: "20", size: "T.152 / B.93(G) / W.60 / H.91", img: "https://peach-next.com/optImg/1004152/item/10038185/11122683_640_0.jpg" },
      { name: "山崎しおん", age: "23", size: "T.170 / B.84(E) / W.57 / H.88", img: "https://peach-next.com/optImg/1004152/item/10037756/11120614_640_0.jpg" },
      { name: "斉藤ちゅり", age: "20", size: "T.165 / B.86(E) / W.57 / H.90", img: "https://peach-next.com/optImg/1004152/item/10037282/11118278_640_0.jpg" }
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

    // 「ピーチネクスト」または「peach next」が含まれる店舗を抽出
    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return n.includes('peach') || n.includes('ピーチ') || n.includes('next') || n.includes('ネクスト');
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
      console.log(`🎊 「ピーチネクスト」の更新が完了しました！ブラウザをリロードして確認してください！`);
    } else {
      console.log("⚠️ 「ピーチネクスト」を含む店舗が見つかりませんでした。");
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
