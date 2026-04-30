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

  // NATURALのデータ定義
  const shopDef = {
    searchKeywords: ['natural', 'ナチュラル'],
    website_url: "https://esthe-natural.com/",
    schedule_url: "https://esthe-natural.com/schedule",
    price_system: "Naturalコース -癒しのトリートメント-\n90min ¥15,000\n120min ¥20,000\n150min ¥25,000",
    casts: [
      { name: "水野まほ", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/23/43b886ca-05bb-434b-9f59-aa77d4bdb7d7.jpg" },
      { name: "夏目ゆうか", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/534/b740cb59-4e18-4733-b7a4-6c793fde6de9.jpg" },
      { name: "武内ちひろ", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/571/bcdadca0-6018-4edf-b451-d5beca6050de.jpg" },
      { name: "成美ありさ", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/17/f61c1a80-a9fd-44ae-a30b-ddceee168e89.jpg" },
      { name: "白咲みゆ", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/689/9f4295db-d04b-4def-9cfc-240b14231ba7.jpg" },
      { name: "工藤ひなの", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/652/1bbb0239-ad92-4bda-b144-4ffd3eab3b57.jpg" },
      { name: "華月さくら", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/672/e5304d67-53be-4cc2-8f3a-ae5d7858f8f9.jpg" },
      { name: "夢乃りり", age: "20", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/685/cca24b2b-c1c5-4745-9b57-3a9ec471fd78.jpg" },
      { name: "逢沢きらり", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/686/00441b41-dde5-4003-af70-9260000c2824.jpg" },
      { name: "瀬戸あすか", age: "19", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/664/c8912165-2e55-436a-bd76-e93ef9d77860.jpg" },
      { name: "永野りおん", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/666/64081c38-0414-4a0e-ba1b-1b9f43624332.jpg" },
      { name: "双葉ゆめ", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/643/31837eec-205b-41f8-9a61-35e0e43df5b8.jpg" },
      { name: "三上にこ", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/625/4afcdcdf-2db9-4461-ae89-7c9f67c522b8.jpg" },
      { name: "佐藤じゅり", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/662/92ec420f-cad2-4f7e-af24-42766691168b.jpg" },
      { name: "三吉るな", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/586/6aa5bcf2-cdb5-4251-b9b4-9776008533b3.jpg" },
      { name: "佐々木ゆいな", age: "19", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/663/a4f23959-c6b3-488b-ba73-7876c099a1d8.jpg" },
      { name: "百音らむ", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/631/e3978c0e-e170-454c-845e-91ded7693af4.jpg" },
      { name: "白花あや", age: "18", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/687/6c8223ef-714b-4200-bac6-a66af74fc98e.jpg" },
      { name: "森野いちご", age: "18", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/694/7f65a88b-df25-4c79-afa2-95e5b6768173.jpg" },
      { name: "七瀬おと", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/693/96cd76b1-bc29-4dfa-8e7b-b5c652cff0aa.jpg" },
      { name: "篠田さな", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/674/a24f41de-7985-473a-a62e-f059ad6565e9.jpg" },
      { name: "南ゆな", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/639/6695fdbd-e7bd-42d9-9f10-dd227e3d0108.jpg" },
      { name: "天音ここ", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/525/eb780d92-5edb-48b9-9b13-e8a8e9ad28b1.jpg" },
      { name: "小川まなみ", age: "20", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/683/94377e22-aa0b-46d2-8fa1-cc3dc553e40e.jpg" },
      { name: "山本ひめの", age: "20", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/668/cc568f9e-9f9e-4918-8a24-043565f192d7.jpg" },
      { name: "吉乃ちゆ", age: "18", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/688/2a6f2774-2565-4d38-be4d-36477bcc1077.jpg" },
      { name: "柚木あまね", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/626/d3f90779-581e-4de2-b6d0-0049dd6bd1ac.jpg" },
      { name: "桜庭ふうか", age: "19", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/651/7aac5d86-8317-4b70-a3b7-5d5884644ff6.jpg" },
      { name: "椿えりか", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/549/fff2758f-923b-4381-b15a-98c91b5f2332.jpg" },
      { name: "柊いおり", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/45/b9528692-09a8-4667-8078-6b0175927604.png" },
      { name: "折本なごみ", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/633/62cf5d43-f9e9-43d7-8412-774ace12c7de.jpg" },
      { name: "湊まお", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/648/905854f0-9915-4cbd-aa73-416188be3378.jpg" },
      { name: "椎名えみり", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/647/7ae15da3-434f-4b08-a14d-4dc890e2ef21.jpg" },
      { name: "白雪愛", age: "20", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/531/ce2ef6e8-b236-4059-993b-8c9a8951bc45.jpg" },
      { name: "神城りん", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/646/0f687aa5-0988-4100-9b99-3eeebc3641b2.jpg" },
      { name: "壱宮りあ", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/650/844db507-83a4-494a-9d49-814de9b3e63c.jpg" },
      { name: "松田あん", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/669/86293fa9-274f-42e2-9f0e-62d1d8062d24.jpg" },
      { name: "谷村あいり", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/596/be55ec64-0520-4c34-ad99-e8f6a9f25d68.jpg" },
      { name: "桃羽めあ", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/675/6f6cf422-4228-4ffd-ad9d-09dc721127ca.jpg" },
      { name: "長岡わかな", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/6/da01f109-f6eb-441c-8eca-ba75626aec93.png" },
      { name: "月野のぞみ", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/670/a18fe9c1-d103-4e21-92cc-df6cf4267f93.jpg" },
      { name: "如月なお", age: "20", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/690/2991c6ce-a8a3-44d2-bd6d-7f130c7ffdc2.jpg" },
      { name: "立花もも", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/700/1640fdce-e4af-41e8-bc2f-9d3d52f51c27.jpg" },
      { name: "長谷川なつみ", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/695/3c19c540-e757-4832-b484-2cb7b4117fcd.jpg" },
      { name: "星野ななこ", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/698/07eb3501-e328-44eb-ac80-08f16be32d4e.jpg" },
      { name: "神楽こはく", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/697/44a5ec06-a856-4ac8-9872-da61ac686d66.jpg" },
      { name: "神崎ゆり", age: "20", size: "T.- / B.- / W.- / H.-", img: "/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" },
      { name: "河本りお", age: "26", size: "T.- / B.- / W.- / H.-", img: "/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" },
      { name: "桐谷れいみ", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/699/33dbb6d5-d1f8-4a5e-874b-b0f78b36b838.jpg" },
      { name: "西野ひめか", age: "23", size: "T.- / B.- / W.- / H.-", img: "/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" },
      { name: "福原みつき", age: "28", size: "T.- / B.- / W.- / H.-", img: "/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" },
      { name: "松坂れある", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/701/c8375c13-b7b5-41f3-9f22-9f5fdf85a916.jpg" },
      { name: "天羽なつね", age: "25", size: "T.- / B.- / W.- / H.-", img: "/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" },
      { name: "大榎ねね", age: "18", size: "T.- / B.- / W.- / H.-", img: "/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" },
      { name: "姫崎いちか", age: "19", size: "T.- / B.- / W.- / H.-", img: "/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「NATURAL」関連の店舗を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      // "natural" または "ナチュラル" を含む店舗を抽出（半角全角を吸収）
      return shopDef.searchKeywords.some(keyword => n.includes(keyword));
    });

    if (targetShops.length === 0) {
      console.log(`⚠️ 店舗が見つかりませんでした。スキップします。`);
      return;
    }

    for (const shop of targetShops) {
      console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
      
      // 1. 店舗情報（HP、スケジュール、システム）の更新
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

      // 2. キャストの更新
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
      const dbCasts = await dbRes.json();
      
      let updateCount = 0;
      let insertCount = 0;

      // HTMLから抽出したキャストの重複排除
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
    
    console.log(`\n🎊 すべての店舗の更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
