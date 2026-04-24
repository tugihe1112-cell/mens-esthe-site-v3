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
      searchKeywords: ['aria', 'アリア'],
      website_url: "https://aria-azabu.com/",
      schedule_url: "https://aria-azabu.com/schedule/",
      price_system: "70分 14,000円\n90分 17,000円\n100分 20,000円\n120分 22,000円\n150分 28,000円\n180分 34,000円",
      casts: [
        { name: "綾野るな", age: "28", size: "T.161 / B.85(E) / W.56 / H.82", img: "https://aria-azabu.com/wp-content/uploads/2026/04/1775468896_3127099.jpeg" },
        { name: "九条さら", age: "21", size: "T.163 / B.88(E) / W.57 / H.87", img: "https://aria-azabu.com/wp-content/uploads/2026/03/719316cae3fd9260950283d9271cb491.jpg" },
        { name: "鳳あお", age: "25", size: "T.163 / B.84(C) / W.57 / H.78", img: "https://aria-azabu.com/wp-content/uploads/2026/03/8d53680106d718cbcaaa7c2d622b0ac9.jpg" },
        { name: "如月はる", age: "25", size: "T.157 / B.83(C) / W.53 / H.78", img: "https://aria-azabu.com/wp-content/uploads/2026/03/b11a3c2462217016f11c74e46523e4da.jpg" },
        { name: "白山みなみ", age: "26", size: "T.166 / B.100(I) / W.58 / H.98", img: "https://aria-azabu.com/wp-content/uploads/2026/03/41537dc59dcdf89e917e196108700474.jpg" },
        { name: "小春みお", age: "21", size: "T.166 / B.98(H) / W.58 / H.92", img: "https://aria-azabu.com/wp-content/uploads/2026/03/ec839a4d8a126e426bc3d9ed4b4fd41e.jpeg" },
        { name: "楠ひめの", age: "22", size: "T.156 / B.100(I) / W.59 / H.90", img: "https://aria-azabu.com/wp-content/uploads/2026/03/7954609c02846daf72a71e70dacb892e.jpg" },
        { name: "吉野さくら", age: "20", size: "T.160 / B.82(C) / W.58 / H.88", img: "https://aria-azabu.com/wp-content/uploads/2026/03/33b09499a04379f31d82735719d315dc.jpg" },
        { name: "上野かえで", age: "21", size: "T.166 / B.86(E) / W.57 / H.82", img: "https://aria-azabu.com/wp-content/uploads/2026/03/aac4bb4aace37f6a38a36eef75559a8f.jpeg" },
        { name: "立花エレナ", age: "26", size: "T.166 / B.58(C) / W.85 / H.84", img: "https://aria-azabu.com/wp-content/themes/design01/img/common/noimage_cast.png" },
        { name: "加藤まい", age: "21", size: "T.152 / B.84(C) / W.58 / H.87", img: "https://aria-azabu.com/wp-content/uploads/2026/02/3dd6b45e1cb0fc88258579364cabebc3.jpeg" },
        { name: "野薔薇ロゼ", age: "31", size: "T.162 / B.82(E) / W.62 / H.95", img: "https://aria-azabu.com/wp-content/themes/design01/img/common/noimage_cast.png" },
        { name: "来栖まな", age: "27", size: "T.154 / B.72(C) / W.60 / H.82", img: "https://aria-azabu.com/wp-content/uploads/2026/03/6f780b188315f6c59a638a48bf92a56e.jpeg" },
        { name: "星乃うさぎ", age: "23", size: "T.155 / B.89(E) / W.59 / H.80", img: "https://aria-azabu.com/wp-content/uploads/2026/02/98f2cc3f220b52e99b5378e3308e1f7a.jpg" },
        { name: "神崎ゆうこ", age: "29", size: "T.160 / B.85(E) / W.56 / H.83", img: "https://aria-azabu.com/wp-content/uploads/2026/02/c0dc046684b905fe3e16c15eec3d5607.jpg" },
        { name: "日向あおい", age: "26", size: "T.160 / B.85(C) / W.58 / H.85", img: "https://aria-azabu.com/wp-content/uploads/2026/02/7d05eb353e2053af2a9fdc2da4d15a8d.jpg" },
        { name: "葉月まみ", age: "25", size: "T.169 / B.82(D) / W.57 / H.87", img: "https://aria-azabu.com/wp-content/uploads/2026/02/95dcbb380bb8e6682866b08164dd1f7c.jpeg" },
        { name: "小鳥遊れいな", age: "25", size: "T.160 / B.87(G) / W.57 / H.83", img: "https://aria-azabu.com/wp-content/uploads/2026/01/line_oa_chat_260221_024034_group_2.jpg" },
        { name: "泉あん", age: "24", size: "T.163 / B.98(G) / W.65 / H.92", img: "https://aria-azabu.com/wp-content/uploads/2026/02/35bc6ed3d0ad1937a02f382445acdb8e.jpeg" },
        { name: "未咲みか", age: "24", size: "T.170 / B.82(D) / W.58 / H.87", img: "https://aria-azabu.com/wp-content/uploads/2026/01/IMG_0986.jpeg" },
        { name: "乃木みく", age: "24", size: "T.154 / B.82(E) / W.59 / H.80", img: "https://aria-azabu.com/wp-content/uploads/2026/01/IMG_0098.jpeg" }
      ]
    },
    {
      searchKeywords: ['royal spa', 'ロイヤルスパ'],
      website_url: "https://royal-spa.jp/",
      schedule_url: "https://royal-spa.jp/schedules/",
      price_system: "45分 13,000円\n60分 15,000円\n75分 17,000円\n90分 19,000円\n105分 22,000円\n120分 24,000円\n150分 32,000円\n180分 40,000円",
      casts: [
        { name: "白鳥えま", age: "30", size: "T.164 / B.87(D) / W.57 / H.85", img: "https://royal-spa.jp/vars/imgs/profiles/265/prof_thumb_1_s.jpg" },
        { name: "早川みゆき", age: "23", size: "T.154 / B.84(D) / W.57 / H.86", img: "https://royal-spa.jp/vars/imgs/profiles/263/prof_thumb_1_s.jpg" },
        { name: "真白れん", age: "24", size: "T.161 / B.84(D) / W.55 / H.83", img: "https://royal-spa.jp/vars/imgs/profiles/166/prof_thumb_1_s.jpg" },
        { name: "月森のぞみ", age: "32", size: "T.157 / B.87(E) / W.59 / H.86", img: "https://royal-spa.jp/vars/imgs/profiles/262/prof_thumb_1_s.jpg" },
        { name: "沢田まみ", age: "28", size: "T.163 / B.85(-) / W.58 / H.85", img: "https://royal-spa.jp/vars/imgs/profiles/261/prof_thumb_1_s.jpg" },
        { name: "花咲ゆな", age: "26", size: "T.168 / B.85(E) / W.56 / H.84", img: "https://royal-spa.jp/vars/imgs/profiles/260/prof_thumb_1_s.jpg" },
        { name: "檀あおい", age: "27", size: "T.158 / B.86(F) / W.58 / H.84", img: "https://royal-spa.jp/vars/imgs/profiles/259/prof_thumb_1_s.jpg" },
        { name: "美月かのん", age: "32", size: "T.158 / B.85(E) / W.58 / H.83", img: "https://royal-spa.jp/vars/imgs/profiles/258/prof_thumb_1_s.jpg" },
        { name: "森咲ゆきの", age: "27", size: "T.160 / B.82(D) / W.55 / H.83", img: "https://royal-spa.jp/vars/imgs/profiles/252/prof_thumb_1_s.jpg" },
        { name: "有村みなみ", age: "27", size: "T.163 / B.95(H) / W.60 / H.88", img: "https://royal-spa.jp/vars/imgs/profiles/248/prof_thumb_1_s.jpg" },
        { name: "愛沢さら", age: "27", size: "T.151 / B.83(C) / W.56 / H.83", img: "https://royal-spa.jp/vars/imgs/profiles/246/prof_thumb_1_s.jpg" },
        { name: "渡辺あんず", age: "24", size: "T.155 / B.83(C) / W.58 / H.84", img: "https://royal-spa.jp/vars/imgs/profiles/235/prof_thumb_1_s.jpg" },
        { name: "柚木ミア", age: "26", size: "T.160 / B.88(E) / W.58 / H.90", img: "https://royal-spa.jp/vars/imgs/profiles/206/prof_thumb_1_s.jpg" },
        { name: "高嶺えりか", age: "27", size: "T.167 / B.84(D) / W.57 / H.95", img: "https://royal-spa.jp/vars/imgs/profiles/169/prof_thumb_1_s.jpg" }
      ]
    }
  ];

  try {
    console.log(`🔍 データベースから「ARIA」と「Royal Spa」を検索し、完全な情報とキャスト更新を実行します...\n`);

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
