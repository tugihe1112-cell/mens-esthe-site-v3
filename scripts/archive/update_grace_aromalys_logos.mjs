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

  try {
    console.log(`🚀 「AromaLys」のロゴ設定、および「GRACE」の完全登録処理を開始します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // ==========================================
    // 1. AromaLys のロゴ設定
    // ==========================================
    const aromalysKeywords = ['aromalys', 'アロマリース'];
    const aromalysLogo = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/AromaLys%20.png';
    
    const aromalysShop = allShops.find(shop => 
      aromalysKeywords.some(keyword => shop.name.toLowerCase().includes(keyword.toLowerCase()))
    );

    if (aromalysShop) {
      console.log(`🖼️  更新中: ${aromalysShop.name} (ID: ${aromalysShop.id})`);
      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${aromalysShop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ image_url: aromalysLogo })
      });
      if (patchRes.ok) {
        console.log(`   ✅ AromaLys ロゴ設定完了`);
      } else {
        console.error(`   ❌ AromaLys ロゴ更新失敗: ${patchRes.statusText}`);
      }
    } else {
      console.log(`   ⚠️ AromaLysが見つかりませんでした。`);
    }

    // ==========================================
    // 2. GRACE の基本情報・ロゴ・キャスト登録
    // ==========================================
    console.log(`\n===========================================`);
    console.log(`▶ 処理開始: 【 GRACE (グレース) 】関連`);

    const graceDef = {
      searchKeywords: ['grace', 'グレース'],
      website_url: "https://grace-meguro.com/",
      schedule_url: "https://grace-meguro.com/schedule",
      price_system: "60分 14,000円\n90分 18,000円\n120分 23,000円\n150分 28,000円",
      logo: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/race.png",
      casts: [
        { name: "能代すみれ", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/126/56cde364-ed3c-49e0-93e2-dc17be459c7e.jpg" },
        { name: "一色しずく", age: "31", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/125/5ce24f03-b069-4d9f-8a57-64d1f6c339bd.jpg" },
        { name: "滝河みおり", age: "29", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/124/97c4c5fc-162c-4eea-9838-e01e226cbad8.jpg" },
        { name: "森にき", age: "29", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/122/633b8d94-b31a-4f6d-8299-b7fdd0a93f95.jpg" },
        { name: "新田りえ", age: "41", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/116/7e80e197-c469-478f-82b0-160a58d48778.jpg" },
        { name: "葉月りょう", age: "36", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/115/a2a59a2f-392c-4f51-bd0c-c348afd9c318.jpg" },
        { name: "伊波ひな", age: "34", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/112/f269b76c-1176-4d3d-a957-e107c24b05a4.jpg" },
        { name: "新垣マユ", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/97/008d987a-6866-4a30-8f0c-bf88a1e21fd2.jpg" },
        { name: "月野あおい", age: "33", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/95/91fa31f5-fedd-411c-883c-31eb8c91fa6a.jpg" },
        { name: "水島えみり", age: "35", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/2/fee096bb-5266-41a0-b1bd-41da76698869.jpg" },
        { name: "南ちか", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/6/c23fb709-1cf6-4557-a9d4-482018704cc2.jpg" },
        { name: "有田カスミ", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/66/d6ae6796-c9e2-47e5-b585-d25dd869f285.jpg" },
        { name: "荒木りな", age: "31", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/59/13734f6f-bae7-4f05-ac18-498e262ece4a.jpg" },
        { name: "風間じゅん", age: "41", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/85/22e57519-95ed-4128-9b56-8e02b050177b.jpg" },
        { name: "冬月なな", age: "33", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/17/5c9c5b23-c36a-4ddc-8cc2-ed754671d390.jpg" },
        { name: "岡マルミ", age: "36", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/84/e5ca3bca-2313-4e63-9017-cb8746c30b55.jpg" },
        { name: "福富れな", age: "39", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/113/627177de-b5cf-4e98-b9e1-7ea74fc9c701.jpg" },
        { name: "星しほ", age: "36", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/123/1e91829e-6cb6-418c-b044-1fe2c34af9ea.jpg" },
        { name: "高梨みゆう", age: "31", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/108/e81c2af0-cb0e-41b4-84ca-1f7c96114c61.jpg" },
        { name: "小栗あやな", age: "35", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/83/3fe49f1f-cd62-4a2d-abf9-f58cb5ad9cbe.jpg" },
        { name: "一条さくら", age: "32", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/10/81522fee-af50-4dc0-8e41-2af3eac53229.jpg" },
        { name: "池田モエ", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/102/c2574a1c-921e-42db-b7ec-2c6404e520dc.jpg" },
        { name: "白石こはる", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/118/b17d1ab0-380c-40f1-9464-d89e753c034c.jpg" },
        { name: "石原あやか", age: "29", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/121/f788e8cb-f736-4403-947e-b7cfa8b6d74f.jpg" },
        { name: "一ノ瀬レナ", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/27/ec5ac018-9ec1-4b8f-b1ca-234e24fce984.jpg" },
        { name: "二ノ宮あい", age: "34", size: "T.- / B.- / W.- / H.-", img: "https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/86/d2b19c1b-17ea-4855-aa68-10d4db77e611.jpg" }
      ]
    };

    const graceShop = allShops.find(shop => 
      graceDef.searchKeywords.some(keyword => shop.name.toLowerCase().includes(keyword.toLowerCase()))
    );

    if (!graceShop) {
      console.log(`⚠️ GRACEが見つかりませんでした。スキップします。`);
      return;
    }

    console.log(`\n 🏠 対象店舗: ${graceShop.name} (ID: ${graceShop.id})`);

    const patchGraceRes = await fetch(`${url}/rest/v1/shops?id=eq.${graceShop.id}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ 
        website_url: graceDef.website_url,
        schedule_url: graceDef.schedule_url,
        price_system: graceDef.price_system,
        image_url: graceDef.logo
      })
    });

    if (patchGraceRes.ok) {
      console.log(`   ✅ 店舗基本情報（HP、スケジュール、システム、ロゴ）の更新完了`);
    } else {
      console.error(`   ❌ 店舗基本情報の更新失敗: ${patchGraceRes.statusText}`);
    }

    const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${graceShop.id}&select=id,name`, { headers });
    const dbCasts = await dbRes.json();
    
    let updateCount = 0;
    let insertCount = 0;

    for (const cast of graceDef.casts) {
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
        const newId = `${graceShop.id}_${cleanName}`;
        await fetch(`${url}/rest/v1/therapists`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({
            id: newId,
            shop_id: graceShop.id,
            name: cleanName,
            image_url: cast.img,
            raw_data: rawData
          })
        });
        insertCount++;
      }
    }
    console.log(`   🎉 キャスト26名設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);

    console.log(`\n🎊 すべての処理が終了しました。ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
