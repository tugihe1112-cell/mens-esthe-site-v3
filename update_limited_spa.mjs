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
    website_url: "https://limited-spa.com/",
    schedule_url: "https://limited-spa.com/schedule/",
    price_system: "90MIN: 20,000円\n120MIN: 24,000円",
    casts: [
      { name: "なな", age: "19", size: "T156/(B)//", img: "https://limited-spa.com/image_girl/589/01.jpg" },
      { name: "ほのか", age: "24", size: "T159/(C)//", img: "https://limited-spa.com/image_girl/590/01.jpg" },
      { name: "みほ", age: "18", size: "T160/(C)//", img: "https://limited-spa.com/image_girl/588/01.jpg" },
      { name: "なつ", age: "24", size: "T153/(D)//", img: "https://limited-spa.com/image_girl/587/01.jpg" },
      { name: "しおり", age: "25", size: "T166/(C)//", img: "https://limited-spa.com/image_girl/583/01.jpg" },
      { name: "まき", age: "21", size: "T162/(E)//", img: "https://limited-spa.com/image_girl/584/01.jpg" },
      { name: "さあや", age: "18", size: "T154/(C)//", img: "https://limited-spa.com/image_girl/581/01.jpg" },
      { name: "いずみ", age: "19", size: "T162/(B)//", img: "https://limited-spa.com/image_girl/578/01.jpg" },
      { name: "かんな", age: "19", size: "T151/(D)//", img: "https://limited-spa.com/image_girl/455/01.jpg" },
      { name: "ここな", age: "19", size: "T155/(B)//", img: "https://limited-spa.com/image_girl/489/01.jpg" },
      { name: "ゆづは", age: "20", size: "T150/(B)//", img: "https://limited-spa.com/image_girl/526/01.jpg" },
      { name: "みずき", age: "19", size: "T164/(B)//", img: "https://limited-spa.com/image_girl/539/01.jpg" },
      { name: "さくらこ", age: "23", size: "T153/(C)//", img: "https://limited-spa.com/image_girl/514/01.jpg" },
      { name: "らら", age: "26", size: "T162/(C)//", img: "https://limited-spa.com/image_girl/510/01.jpg" },
      { name: "みなみ", age: "21", size: "T161/(B)//", img: "https://limited-spa.com/image_girl/385/01.jpg" },
      { name: "あい", age: "25", size: "T148/(D)//", img: "https://limited-spa.com/image_girl/486/01.jpg" },
      { name: "えみ", age: "26", size: "T154/(B)//", img: "https://limited-spa.com/image_girl/451/01.jpg" },
      { name: "るな", age: "24", size: "T165/(C)//", img: "https://limited-spa.com/image_girl/305/01.jpg" },
      { name: "しずか", age: "18", size: "T147/(C)//", img: "https://limited-spa.com/image_girl/575/01.jpg" },
      { name: "りおな", age: "20", size: "T160/(C)//", img: "https://limited-spa.com/image_girl/439/01.jpg" },
      { name: "すみれ", age: "25", size: "T155/(B)//", img: "https://limited-spa.com/image_girl/397/01.jpg" },
      { name: "るか", age: "19", size: "T162/(B)//", img: "https://limited-spa.com/image_girl/571/01.jpg" },
      { name: "ゆりか", age: "26", size: "T158/(D)//", img: "https://limited-spa.com/image_girl/478/01.jpg" },
      { name: "ありさ", age: "29", size: "T160/(D)//", img: "https://limited-spa.com/image_girl/344/01.jpg" },
      { name: "あいか", age: "23", size: "T148/(B)//", img: "https://limited-spa.com/image_girl/149/01.jpg" },
      { name: "ゆうき", age: "27", size: "T153/(F)//", img: "https://limited-spa.com/image_girl/449/01.jpg" },
      { name: "ひより", age: "24", size: "T157/(C)//", img: "https://limited-spa.com/image_girl/513/01.jpg" },
      { name: "ひなき", age: "24", size: "T169/(C)//", img: "https://limited-spa.com/image_girl/393/01.jpg" },
      { name: "みさ", age: "19", size: "T157/(B)//", img: "https://limited-spa.com/image_girl/437/01.jpg" },
      { name: "のあ", age: "20", size: "T158/(C)//", img: "https://limited-spa.com/image_girl/568/01.jpg" },
      { name: "かおる", age: "25", size: "T168/(C)//", img: "https://limited-spa.com/image_girl/444/01.jpg" },
      { name: "もね", age: "21", size: "T162/(E)//", img: "https://limited-spa.com/image_girl/480/01.jpg" },
      { name: "あいこ", age: "26", size: "T153/(D)//", img: "https://limited-spa.com/image_girl/572/01.jpg" },
      { name: "れもん", age: "21", size: "T153/(C)//", img: "https://limited-spa.com/image_girl/558/01.jpg" },
      { name: "さほ", age: "29", size: "T161/(G)//", img: "https://limited-spa.com/image_girl/576/01.jpg" },
      { name: "るい", age: "26", size: "T157/(D)//", img: "https://limited-spa.com/image_girl/398/01.jpg" },
      { name: "なつき", age: "21", size: "T158/(D)//", img: "https://limited-spa.com/image_girl/531/01.jpg" },
      { name: "あや", age: "22", size: "T160/(F)//", img: "https://limited-spa.com/image_girl/340/01.jpg" },
      { name: "さやか", age: "23", size: "T166/(C)//", img: "https://limited-spa.com/image_girl/27/01.jpg" },
      { name: "あめ", age: "19", size: "T160/(B)//", img: "https://limited-spa.com/image_girl/259/01.jpg" },
      { name: "あさひ", age: "22", size: "T157/(C)//", img: "https://limited-spa.com/image_girl/425/01.jpg" },
      { name: "かのん", age: "20", size: "T150/(D)//", img: "https://limited-spa.com/image_girl/498/01.jpg" },
      { name: "りな", age: "30", size: "T153/(B)//", img: "https://limited-spa.com/image_girl/554/01.jpg" },
      { name: "りあ", age: "23", size: "T151/(D)//", img: "https://limited-spa.com/image_girl/536/01.jpg" },
      { name: "かな", age: "23", size: "T153/(C)//", img: "https://limited-spa.com/image_girl/82/01.jpg" },
      { name: "ゆき", age: "18", size: "T161/(E)//", img: "https://limited-spa.com/image_girl/535/01.jpg" },
      { name: "さくら", age: "27", size: "T154/(B)//", img: "https://limited-spa.com/image_girl/386/01.jpg" },
      { name: "ゆうな", age: "19", size: "T160/(E)//", img: "https://limited-spa.com/image_girl/164/01.jpg" },
      { name: "えま", age: "21", size: "T160/(E)//", img: "https://limited-spa.com/image_girl/248/01.jpg" },
      { name: "いちか", age: "24", size: "T165/(B)//", img: "https://limited-spa.com/image_girl/204/01.jpg" },
      { name: "らい", age: "19", size: "T156/(C)//", img: "https://limited-spa.com/image_girl/505/01.jpg" },
      { name: "はるか", age: "20", size: "T154/(D)//", img: "https://limited-spa.com/image_girl/400/01.jpg" },
      { name: "なゆ", age: "22", size: "T155/(G)//", img: "https://limited-spa.com/image_girl/322/01.jpg" },
      { name: "ゆいな", age: "20", size: "T148/(D)//", img: "https://limited-spa.com/image_girl/512/01.jpg" },
      { name: "みみ", age: "21", size: "T153/(B)//", img: "https://limited-spa.com/image_girl/404/01.jpg" },
      { name: "まほ", age: "24", size: "T155/(C)//", img: "https://limited-spa.com/image_girl/182/01.jpg" },
      { name: "りりこ", age: "27", size: "T162/(D)//", img: "https://limited-spa.com/image_girl/494/01.jpg" },
      { name: "かえで", age: "26", size: "T155/(C)//", img: "https://limited-spa.com/image_girl/313/01.jpg" },
      { name: "ひの", age: "19", size: "T154/(C)//", img: "https://limited-spa.com/image_girl/458/01.jpg" },
      { name: "あみ", age: "26", size: "T147/(C)//", img: "https://limited-spa.com/image_girl/438/01.jpg" },
      { name: "いつき", age: "22", size: "T152/(B)//", img: "https://limited-spa.com/image_girl/396/01.jpg" },
      { name: "りさ", age: "22", size: "T153/(E)//", img: "https://limited-spa.com/image_girl/420/01.jpg" },
      { name: "なお", age: "18", size: "T159/(C)//", img: "https://limited-spa.com/image_girl/367/01.jpg" },
      { name: "すず", age: "25", size: "T156/(B)//", img: "https://limited-spa.com/image_girl/183/01.jpg" },
      { name: "ゆきの", age: "27", size: "T163/(C)//", img: "https://limited-spa.com/image_girl/234/01.jpg" },
      { name: "めあ", age: "21", size: "T152/(D)//", img: "https://limited-spa.com/image_girl/380/01.jpg" },
      { name: "らん", age: "21", size: "T153/(B)//", img: "https://limited-spa.com/image_girl/191/01.jpg" },
      { name: "みい", age: "19", size: "T158/(D)//", img: "https://limited-spa.com/image_girl/285/01.jpg" },
      { name: "あんな", age: "18", size: "T153/(B)//", img: "https://limited-spa.com/image_girl/274/01.jpg" },
      { name: "れい", age: "23", size: "T160/(B)//", img: "https://limited-spa.com/image_girl/230/01.jpg" },
      { name: "ゆあ", age: "19", size: "T148/(C)//", img: "https://limited-spa.com/image_girl/352/01.jpg" },
      { name: "なのは", age: "19", size: "T160/(F)//", img: "https://limited-spa.com/image_girl/253/01.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「Limited Spa」を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // 「limited spa」「リミテッドスパ」が含まれる店舗を抽出
    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return n.includes('limited spa') || n.includes('リミテッドスパ') || n.includes('limitedspa');
    });

    if (targetShops.length > 0) {
      for (const shop of targetShops) {
        console.log(`🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
        // 1. ホームページURL、スケジュールURL、料金システムを更新
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            website_url: shopData.website_url,
            schedule_url: shopData.schedule_url,
            price_system: shopData.price_system
          })
        });

        if (patchRes.ok) {
          console.log(`  ✅ ホームページ・スケジュールURL・料金システム更新完了`);
        } else {
          console.error(`  ❌ 店舗情報の更新に失敗しました: ${patchRes.statusText}`);
          continue; 
        }

        // 2. キャストの更新
        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
        const dbCasts = await dbRes.json();
        
        let updateCount = 0;
        let insertCount = 0;

        const uniqueCasts = Array.from(new Map(shopData.casts.map(c => [c.name, c])).values());

        for (const cast of uniqueCasts) {
          // 余計な空白や【体入】などの修飾語を消す
          let cleanName = cast.name.replace(/【.*】/g, '').replace(/[\s　]+/g, ''); 
          const rawData = { age: cast.age, size: cast.size };

          const existing = dbCasts.find(c => c.name.replace(/【.*】/g, '').replace(/[\s　]+/g, '') === cleanName);

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
      console.log(`🎊 「Limited Spa」の更新が完了しました！ブラウザをリロードして確認してください！`);
    } else {
      console.log("⚠️ 「Limited Spa」を含む店舗が見つかりませんでした。");
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
