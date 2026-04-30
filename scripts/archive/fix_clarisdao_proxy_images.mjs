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
      // 元のHTMLにあった /optImg/ から始まるパスをそのまま使用します
      { name: "茜", img: "https://fujoho.jp/optImg/1004126/item/10037875/11121467_640_0.jpg" },
      { name: "茶々", img: "https://fujoho.jp/optImg/1004126/item/10035996/11116847_640_0.jpg" },
      { name: "羽生ひかり", img: "https://fujoho.jp/optImg/1004126/item/10033794/11107207_640_0.jpg" },
      { name: "我妻", img: "https://fujoho.jp/optImg/1004126/item/10033240/11100220_640_0.jpg" },
      { name: "かなみ", img: "https://fujoho.jp/optImg/1004126/item/10033155/11099919_640_0.jpg" },
      { name: "桜井みゆ", img: "https://fujoho.jp/optImg/1004126/item/10033005/11100659_640_0.jpg" },
      { name: "佐久間", img: "https://fujoho.jp/optImg/1004126/item/10032776/11098118_640_0.jpg" },
      { name: "愛沢", img: "https://fujoho.jp/optImg/1004126/item/10032140/11100608_640_0.jpg" },
      { name: "黒川はる", img: "https://fujoho.jp/optImg/1004126/item/10030952/11088779_640_0.jpg" },
      { name: "浅野あみ", img: "https://fujoho.jp/optImg/1004126/item/10030417/11104491_640_0.jpg" },
      { name: "神谷", img: "https://fujoho.jp/optImg/1004126/item/10028762/11117586_640_0.jpg" },
      { name: "朝倉みく", img: "https://fujoho.jp/optImg/1004126/item/10028583/11077218_640_0.jpg" },
      { name: "桃瀬ゆぁ", img: "https://fujoho.jp/optImg/1004126/item/10024723/11092740_640_0.jpg" },
      { name: "田中えり", img: "https://fujoho.jp/optImg/1004126/item/10023897/11054322_640_0.jpg" },
      { name: "本田みなみ", img: "https://fujoho.jp/optImg/10016853/11061555_640_0.jpg" },
      { name: "安藤ゆみ", img: "https://fujoho.jp/optImg/1004126/item/10014802/11091613_640_0.jpg" },
      { name: "城田れい", img: "https://fujoho.jp/optImg/1004126/item/10014788/11093432_640_0.jpg" },
      { name: "七瀬なな", img: "https://fujoho.jp/optImg/1004126/item/10014782/11097370_640_0.jpg" },
      { name: "花村ひなた", img: "https://fujoho.jp/optImg/1004126/item/10014786/11063809_640_0.jpg" },
      { name: "佐藤はなこ", img: "https://fujoho.jp/optImg/1004126/item/10014780/11071329_640_0.jpg" },
      { name: "片桐", img: "https://fujoho.jp/optImg/1004126/item/10033578/11102010_640_0.jpg" },
      { name: "紫音", img: "https://fujoho.jp/optImg/1004126/item/10033523/11101257_640_0.jpg" },
      { name: "夜", img: "https://fujoho.jp/optImg/1004126/item/10030863/11102291_640_0.jpg" },
      { name: "井川りょう", img: "https://fujoho.jp/optImg/1004126/item/10030827/11088832_640_0.jpg" },
      { name: "五条なつ", img: "https://fujoho.jp/optImg/1004126/item/10030769/11087049_640_0.jpg" },
      { name: "小島さら", img: "https://fujoho.jp/optImg/1004126/item/10028578/11074952_640_0.jpg" },
      { name: "藤咲りこ", img: "https://fujoho.jp/optImg/1004126/item/10026383/11063551_640_0.jpg" },
      { name: "吹雪", img: "https://fujoho.jp/optImg/1004126/item/10027823/11091448_640_0.jpg" },
      { name: "吉沢かのん", img: "https://fujoho.jp/optImg/1004126/item/10016961/11066177_640_0.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「クラリスDAO」を検索し、画像URLをプロキシ経由に修正します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) return;

    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return shopDef.searchKeywords.some(keyword => n.includes(keyword));
    });

    for (const shop of targetShops) {
      console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
      
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name`, { headers });
      const dbCasts = await dbRes.json();
      
      let updateCount = 0;

      for (const cast of shopDef.casts) {
        let cleanName = cast.name.replace(/[\s　]+/g, ''); 
        const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === cleanName);

        if (existing) {
          // 画像CDN「images.weserv.nl」を使用し、リファラを偽装するパラメータ(&n)を付与
          const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cast.img)}&n=-1`;

          await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ 
              image_url: proxiedUrl,
              image: proxiedUrl
            })
          });
          updateCount++;
        }
      }
      console.log(`   🎉 画像URLの修正完了（更新: ${updateCount}名）`);
    }
    console.log(`\n🎊 全ての更新が完了しました！ブラウザをリロードして画像が表示されるか確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
