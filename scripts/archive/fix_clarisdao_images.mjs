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
    searchKeywords: ['クラリスdao', 'clarisdao', 'クラリスダオ'],
    casts: [
      { name: "茜", age: "37", size: "T.153 / B.88(E) / W.59 / H.86", img: "https://fujoho.jp/optImg/1004126/item/10037875/11121467_640_0.jpg" },
      { name: "茶々", age: "37", size: "T.160 / B.92(F) / W.60 / H.88", img: "https://fujoho.jp/optImg/1004126/item/10035996/11116847_640_0.jpg" },
      { name: "羽生ひかり", age: "35", size: "T.155 / B.82(D) / W.57 / H.83", img: "https://fujoho.jp/optImg/1004126/item/10033794/11107207_640_0.jpg" },
      { name: "我妻", age: "30", size: "T.155 / B.85(D) / W.56 / H.86", img: "https://fujoho.jp/optImg/1004126/item/10033240/11100220_640_0.jpg" },
      { name: "かなみ", age: "31", size: "T.167 / B.96(H) / W.60 / H.88", img: "https://fujoho.jp/optImg/1004126/item/10033155/11099919_640_0.jpg" },
      { name: "桜井みゆ", age: "38", size: "T.165 / B.84(D) / W.56 / H.85", img: "https://fujoho.jp/optImg/1004126/item/10033005/11100659_640_0.jpg" },
      { name: "佐久間", age: "34", size: "T.165 / B.88(D) / W.59 / H.89", img: "https://fujoho.jp/optImg/1004126/item/10032776/11098118_640_0.jpg" },
      { name: "愛沢", age: "33", size: "T.160 / B.88(E) / W.56 / H.87", img: "https://fujoho.jp/optImg/1004126/item/10032140/11100608_640_0.jpg" },
      { name: "黒川はる", age: "36", size: "T.158 / B.87(E) / W.58 / H.86", img: "https://fujoho.jp/optImg/1004126/item/10030952/11088779_640_0.jpg" },
      { name: "浅野あみ", age: "38", size: "T.162 / B.97(G) / W.60 / H.98", img: "https://fujoho.jp/optImg/1004126/item/10030417/11104491_640_0.jpg" },
      { name: "神谷", age: "36", size: "T.158 / B.88(E) / W.58 / H.87", img: "https://fujoho.jp/optImg/1004126/item/10028762/11117586_640_0.jpg" },
      { name: "朝倉みく", age: "32", size: "T.163 / B.90(H) / W.58 / H.87", img: "https://fujoho.jp/optImg/1004126/item/10028583/11077218_640_0.jpg" },
      { name: "桃瀬ゆぁ", age: "32", size: "T.153 / B.88(E) / W.59 / H.87", img: "https://fujoho.jp/optImg/1004126/item/10024723/11092740_640_0.jpg" },
      { name: "田中えり", age: "41", size: "T.161 / B.88(F) / W.56 / H.88", img: "https://fujoho.jp/optImg/1004126/item/10023897/11054322_640_0.jpg" },
      { name: "本田みなみ", age: "35", size: "T.158 / B.87(C) / W.56 / H.88", img: "https://fujoho.jp/optImg/1004126/item/10016853/11061555_640_0.jpg" },
      { name: "安藤ゆみ", age: "38", size: "T.161 / B.91(G) / W.59 / H.90", img: "https://fujoho.jp/optImg/1004126/item/10014802/11091613_640_0.jpg" },
      { name: "城田れい", age: "35", size: "T.173 / B.95(F) / W.60 / H.91", img: "https://fujoho.jp/optImg/1004126/item/10014788/11093432_640_0.jpg" },
      { name: "七瀬なな", age: "35", size: "T.158 / B.96(F) / W.57 / H.85", img: "https://fujoho.jp/optImg/1004126/item/10014782/11097370_640_0.jpg" },
      { name: "花村ひなた", age: "38", size: "T.145 / B.90(E) / W.57 / H.86", img: "https://fujoho.jp/optImg/1004126/item/10014786/11063809_640_0.jpg" },
      { name: "佐藤はなこ", age: "40", size: "T.155 / B.85(E) / W.55 / H.81", img: "https://fujoho.jp/optImg/1004126/item/10014780/11071329_640_0.jpg" },
      { name: "片桐", age: "37", size: "T.170 / B.89(E) / W.60 / H.90", img: "https://fujoho.jp/optImg/1004126/item/10033578/11102010_640_0.jpg" },
      { name: "紫音", age: "32", size: "T.158 / B.85(E) / W.58 / H.86", img: "https://fujoho.jp/optImg/1004126/item/10033523/11101257_640_0.jpg" },
      { name: "夜", age: "38", size: "T.160 / B.87(E) / W.58 / H.88", img: "https://fujoho.jp/optImg/1004126/item/10030863/11102291_640_0.jpg" },
      { name: "井川りょう", age: "32", size: "T.162 / B.87(E) / W.58 / H.88", img: "https://fujoho.jp/optImg/1004126/item/10030827/11088832_640_0.jpg" },
      { name: "五条なつ", age: "36", size: "T.155 / B.87(D) / W.57 / H.88", img: "https://fujoho.jp/optImg/1004126/item/10030769/11087049_640_0.jpg" },
      { name: "小島さら", age: "37", size: "T.149 / B.90(G) / W.59 / H.89", img: "https://fujoho.jp/optImg/1004126/item/10028578/11074952_640_0.jpg" },
      { name: "藤咲りこ", age: "35", size: "T.162 / B.87(D) / W.56 / H.88", img: "https://fujoho.jp/optImg/1004126/item/10026383/11063551_640_0.jpg" },
      { name: "吹雪", age: "33", size: "T.165 / B.88(E) / W.59 / H.89", img: "https://fujoho.jp/optImg/1004126/item/10027823/11091448_640_0.jpg" },
      { name: "吉沢かのん", age: "36", size: "T.156 / B.85(D) / W.57 / H.85", img: "https://fujoho.jp/optImg/1004126/item/10016961/11066177_640_0.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「クラリスDAO」を検索し、画像の修正を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) { return; }

    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return shopDef.searchKeywords.some(keyword => n.includes(keyword));
    });

    for (const shop of targetShops) {
      console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
      
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name`, { headers });
      const dbCasts = await dbRes.json();
      
      let updateCount = 0;
      const uniqueCasts = Array.from(new Map(shopDef.casts.map(c => [c.name, c])).values());

      for (const cast of uniqueCasts) {
        let cleanName = cast.name.replace(/[\s　]+/g, ''); 
        const rawData = { age: cast.age, size: cast.size };

        const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === cleanName);

        if (existing) {
          // wsrv.nl という有名な画像プロキシサーバーを経由させてブロックを回避します
          const proxiedImgUrl = `https://wsrv.nl/?url=${encodeURIComponent(cast.img.replace('https://', ''))}`;

          await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ 
              image_url: proxiedImgUrl,  // プロキシ経由のURL
              image: proxiedImgUrl,      // 念のためimageカラムにも入れる
              raw_data: rawData
            })
          });
          updateCount++;
        }
      }
      console.log(`   🎉 画像とプロフィールの修正完了（更新: ${updateCount}名）`);
    }
    console.log(`\n🎊 全ての更新が完了しました！ブラウザをリロードして画像が表示されるか確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
