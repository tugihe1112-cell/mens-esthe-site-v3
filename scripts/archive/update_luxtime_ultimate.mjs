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
      searchKeywords: ['luxtime', 'ラグタイム'],
      website_url: "https://www.mensesthe-luxtime.jp/",
      schedule_url: "https://www.mensesthe-luxtime.jp/schedule.html",
      price_system: "60分 14,000円\n90分 18,000円\n120分 23,000円\n150分 29,000円\n180分 35,000円",
      casts: [
        { name: "峰あこ", age: "28", size: "T.160 / B.96(G) / W.55 / H.88", img: "https://www.mensesthe-luxtime.jp/therapists/973/t.jpg.300_400.jpg" },
        { name: "速水せな", age: "27", size: "T.158 / B.87(E) / W.56 / H.84", img: "https://www.mensesthe-luxtime.jp/therapists/671/t.jpg.300_400.jpg" },
        { name: "松本ありさ", age: "25", size: "T.158 / B.85(E) / W.54 / H.83", img: "https://www.mensesthe-luxtime.jp/therapists/969/t.jpg.300_400.jpg" },
        { name: "紫苑いとは", age: "24", size: "T.158 / B.87(E) / W.55 / H.85", img: "https://www.mensesthe-luxtime.jp/therapists/925/t.jpg.300_400.jpg" },
        { name: "瞳みらい", age: "23", size: "T.156 / B.83(C) / W.54 / H.84", img: "https://www.mensesthe-luxtime.jp/therapists/878/t.jpg.300_400.jpg" },
        { name: "宮坂らん", age: "28", size: "T.157 / B.84(D) / W.56 / H.83", img: "https://www.mensesthe-luxtime.jp/therapists/124/t.jpg.300_400.jpg" },
        { name: "秋元めいみ", age: "22", size: "T.157 / B.85(E) / W.57 / H.83", img: "https://www.mensesthe-luxtime.jp/therapists/239/t.jpg.300_400.jpg" },
        { name: "青木リト", age: "21", size: "T.150 / B.88(F) / W.54 / H.85", img: "https://www.mensesthe-luxtime.jp/therapists/962/t.jpg.300_400.jpg" },
        { name: "七星うた", age: "22", size: "T.155 / B.95(G) / W.55 / H.86", img: "https://www.mensesthe-luxtime.jp/therapists/824/t.jpg.300_400.jpg" },
        { name: "望月みく", age: "24", size: "T.156 / B.86(D) / W.56 / H.84", img: "https://www.mensesthe-luxtime.jp/therapists/623/t.jpg.300_400.jpg" },
        { name: "成宮りん", age: "20", size: "T.160 / B.86(E) / W.55 / H.84", img: "https://www.mensesthe-luxtime.jp/therapists/776/t.jpg.300_400.jpg" },
        { name: "増田ねね", age: "23", size: "T.160 / B.86(E) / W.55 / H.85", img: "https://www.mensesthe-luxtime.jp/therapists/842/t.jpg.300_400.jpg" },
        { name: "橘ゆり", age: "25", size: "T.157 / B.88(F) / W.56 / H.89", img: "https://www.mensesthe-luxtime.jp/therapists/958/t.jpg.300_400.jpg" },
        { name: "春奈おぼろ", age: "21", size: "T.163 / B.82(B) / W.54 / H.81", img: "https://www.mensesthe-luxtime.jp/therapists/713/t.jpg.300_400.jpg" },
        { name: "白浜りの", age: "20", size: "T.165 / B.99(G) / W.56 / H.86", img: "https://www.mensesthe-luxtime.jp/therapists/638/t.jpg.300_400.jpg" },
        { name: "新泉なぎさ", age: "24", size: "T.156 / B.89(F) / W.55 / H.88", img: "https://www.mensesthe-luxtime.jp/therapists/966/t.jpg.300_400.jpg" },
        { name: "水川まりん", age: "26", size: "T.160 / B.83(C) / W.58 / H.86", img: "https://www.mensesthe-luxtime.jp/therapists/223/t.jpg.300_400.jpg" },
        { name: "相川ここな", age: "21", size: "T.157 / B.85(D) / W.55 / H.83", img: "https://www.mensesthe-luxtime.jp/therapists/909/t.jpg.300_400.jpg" },
        { name: "岸ののか", age: "25", size: "T.165 / B.83(B) / W.53 / H.82", img: "https://www.mensesthe-luxtime.jp/therapists/857/t.jpg.300_400.jpg" },
        { name: "今森すみの", age: "26", size: "T.155 / B.89(E) / W.55 / H.87", img: "https://www.mensesthe-luxtime.jp/therapists/955/t.jpg.300_400.jpg" },
        { name: "有栖のあ", age: "24", size: "T.148 / B.88(E) / W.56 / H.84", img: "https://www.mensesthe-luxtime.jp/therapists/206/t.jpg.300_400.jpg" },
        { name: "山本なな", age: "26", size: "T.160 / B.89(F) / W.56 / H.85", img: "https://www.mensesthe-luxtime.jp/therapists/688/t.jpg.300_400.jpg" },
        { name: "伊吹れむ", age: "23", size: "T.170 / B.82(B) / W.54 / H.83", img: "https://www.mensesthe-luxtime.jp/therapists/863/t.jpg.300_400.jpg" },
        { name: "秋山せりか", age: "25", size: "T.155 / B.88(E) / W.54 / H.85", img: "https://www.mensesthe-luxtime.jp/therapists/846/t.jpg.300_400.jpg" },
        { name: "水原あんじゅ", age: "29", size: "T.163 / B.98(H) / W.56 / H.88", img: "https://www.mensesthe-luxtime.jp/therapists/952/t.jpg.300_400.jpg" },
        { name: "彩瀬さやか", age: "27", size: "T.160 / B.85(D) / W.55 / H.83", img: "https://www.mensesthe-luxtime.jp/therapists/938/t.jpg.300_400.jpg" },
        { name: "杉浦ゆい", age: "27", size: "T.160 / B.86(E) / W.55 / H.84", img: "https://www.mensesthe-luxtime.jp/therapists/888/t.jpg.300_400.jpg" },
        { name: "水澤まりな", age: "28", size: "T.155 / B.84(D) / W.56 / H.84", img: "https://www.mensesthe-luxtime.jp/therapists/762/t.jpg.300_400.jpg" },
        { name: "倉本かほ", age: "21", size: "T.151 / B.83(B) / W.56 / H.84", img: "https://www.mensesthe-luxtime.jp/therapists/265/t.jpg.300_400.jpg" },
        { name: "森宮みずき", age: "22", size: "T.155 / B.86(E) / W.57 / H.86", img: "https://www.mensesthe-luxtime.jp/therapists/128/t.jpg.300_400.jpg" },
        { name: "雪見かずは", age: "26", size: "T.155 / B.83(C) / W.56 / H.80", img: "https://www.mensesthe-luxtime.jp/therapists/150/t.jpg.300_400.jpg" },
        { name: "常田まどか", age: "21", size: "T.168 / B.85(D) / W.57 / H.86", img: "https://www.mensesthe-luxtime.jp/therapists/78/t.jpg.300_400.jpg" },
        { name: "葛城えれな", age: "19", size: "T.151 / B.80(B) / W.55 / H.80", img: "https://www.mensesthe-luxtime.jp/therapists/31/t.jpg.300_400.jpg" },
        { name: "天乃りお", age: "21", size: "T.153 / B.84(D) / W.57 / H.85", img: "https://www.mensesthe-luxtime.jp/therapists/161/t.jpg.300_400.jpg" },
        { name: "釘宮ゆうか", age: "24", size: "T.148 / B.85(D) / W.57 / H.83", img: "https://www.mensesthe-luxtime.jp/therapists/41/t.jpg.300_400.jpg" },
        { name: "月見いおり", age: "22", size: "T.156 / B.83(C) / W.56 / H.81", img: "https://www.mensesthe-luxtime.jp/therapists/146/t.jpg.300_400.jpg" },
        { name: "由井つきか", age: "21", size: "T.165 / B.85(E) / W.56 / H.85", img: "https://www.mensesthe-luxtime.jp/therapists/282/t.jpg.300_400.jpg" }
      ]
    },
    {
      searchKeywords: ['ultimate spa', 'アルティメットスパ', 'アルティメット'],
      website_url: "https://ultimate-spa.com/",
      schedule_url: "https://ultimate-spa.com/schedule.php",
      price_system: "60分 10,000円\n90分 15,000円\n120分 20,000円(割引中 19,000円)\n150分 25,000円(割引中 24,000円)",
      casts: [
        { name: "渡辺なな", age: "20", size: "T.160 / B.-", img: "https://ultimate-spa.com/images_staff/448/010217464356.jpg" },
        { name: "結城ななみ", age: "27", size: "T.164 / B.-", img: "https://ultimate-spa.com/images_staff/433/022814172524.jpg" },
        { name: "秋山なぎさ", age: "25", size: "T.160 / B.-", img: "https://ultimate-spa.com/images_staff/347/091217104376.jpg" },
        { name: "西村はるか", age: "22", size: "T.156 / B.-", img: "https://ultimate-spa.com/images_staff/439/052314460180.jpg" },
        { name: "佐野みずき", age: "23", size: "T.156 / B.-", img: "https://ultimate-spa.com/images_staff/396/020921461537.jpg" },
        { name: "不二峰はな", age: "26", size: "T.163 / B.-", img: "https://ultimate-spa.com/images_staff/418/080319263667.jpg" },
        { name: "北川りな", age: "28", size: "T.155 / B.-", img: "https://ultimate-spa.com/images_staff/366/072818124664.jpg" },
        { name: "市川ゆな", age: "28", size: "T.162 / B.-", img: "https://ultimate-spa.com/images_staff/399/012117222845.jpg" },
        { name: "早川ゆりあ", age: "28", size: "T.157 / B.-", img: "https://ultimate-spa.com/images_staff/350/072816315281.jpg" },
        { name: "岸本うみ", age: "28", size: "T.170 / B.-", img: "https://ultimate-spa.com/images_staff/430/010921433659.jpg" },
        { name: "七瀬まい", age: "20", size: "T.150 / B.-", img: "https://ultimate-spa.com/images_staff/383/10141940113.jpg" },
        { name: "高橋あすか", age: "23", size: "T.157 / B.-", img: "https://ultimate-spa.com/images_staff/427/091312264066.jpg" },
        { name: "池田れいな", age: "26", size: "T.160 / B.-", img: "https://ultimate-spa.com/images_staff/422/090520155252.jpg" },
        { name: "月野あやか", age: "26", size: "T.163 / B.-", img: "https://ultimate-spa.com/images_staff/401/060619271745.jpg" },
        { name: "佐伯りな", age: "22", size: "T.155 / B.-", img: "https://ultimate-spa.com/images_staff/368/102214314583.jpg" }
      ]
    }
  ];

  try {
    console.log(`🔍 データベースから「Luxtime」と「ULTIMATE SPA」を検索し、完全な情報とキャスト更新を実行します...\n`);

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
