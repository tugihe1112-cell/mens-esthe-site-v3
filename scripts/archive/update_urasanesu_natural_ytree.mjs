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
      keywords: ["UraSanEsu", "ウラサンエス"],
      url: "https://urasanesu.com/",
      schedule_url: "https://urasanesu.com/week.cgi",
      price_system: "🆕Short 60分\n(平日17:30スタートまで) 12,000円\nShort 75分: 16,000円\nStandard 90分: 18,000円\nPremium 120分: 24,000円\nLong 150分: 30,000円",
      casts: [
        { name: "広瀬ゆず", img: "https://urasanesu.com/therapist_img/344-1.jpg" },
        { name: "月野れい", img: "https://urasanesu.com/therapist_img/378-1.jpg" },
        { name: "西野みつき", img: "https://urasanesu.com/therapist_img/379-1.jpg" },
        { name: "宮本ほのか", img: "https://urasanesu.com/therapist_img/381-1.jpg" },
        { name: "柏木のぞみ", img: "https://urasanesu.com/therapist_img/376-1.jpg" }
      ]
    },
    {
      keywords: ["NATURAL", "ナチュラル"],
      schedule_url: "https://esthe-natural.com/schedule",
      price_system: "Naturalコース -癒しのトリートメント-\n90min: 15,000円\n120min: 20,000円\n150min: 25,000円",
      casts: [
        { name: "水野まほ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/23/43b886ca-05bb-434b-9f59-aa77d4bdb7d7.jpg" },
        { name: "夏目ゆうか", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/534/b740cb59-4e18-4733-b7a4-6c793fde6de9.jpg" },
        { name: "武内ちひろ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/571/bcdadca0-6018-4edf-b451-d5beca6050de.jpg" },
        { name: "成美ありさ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/17/f61c1a80-a9fd-44ae-a30b-ddceee168e89.jpg" },
        { name: "白咲みゆ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/689/9f4295db-d04b-4def-9cfc-240b14231ba7.jpg" },
        { name: "工藤ひなの", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/652/1bbb0239-ad92-4bda-b144-4ffd3eab3b57.jpg" },
        { name: "華月さくら", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/672/e5304d67-53be-4cc2-8f3a-ae5d7858f8f9.jpg" },
        { name: "夢乃りり", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/685/cca24b2b-c1c5-4745-9b57-3a9ec471fd78.jpg" },
        { name: "逢沢きらり", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/686/00441b41-dde5-4003-af70-9260000c2824.jpg" },
        { name: "瀬戸あすか", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/664/c8912165-2e55-436a-bd76-e93ef9d77860.jpg" },
        { name: "永野りおん", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/666/64081c38-0414-4a0e-ba1b-1b9f43624332.jpg" },
        { name: "双葉ゆめ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/643/31837eec-205b-41f8-9a61-35e0e43df5b8.jpg" },
        { name: "三上にこ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/625/4afcdcdf-2db9-4461-ae89-7c9f67c522b8.jpg" },
        { name: "佐藤じゅり", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/662/92ec420f-cad2-4f7e-af24-42766691168b.jpg" },
        { name: "三吉るな", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/586/6aa5bcf2-cdb5-4251-b9b4-9776008533b3.jpg" },
        { name: "佐々木ゆいな", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/663/a4f23959-c6b3-488b-ba73-7876c099a1d8.jpg" },
        { name: "百音らむ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/631/e3978c0e-e170-454c-845e-91ded7693af4.jpg" },
        { name: "白花あや", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/687/6c8223ef-714b-4200-bac6-a66af74fc98e.jpg" },
        { name: "森野いちご", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/694/7f65a88b-df25-4c79-afa2-95e5b6768173.jpg" },
        { name: "白石かのん", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/691/6b7985eb-eb98-4e83-9af8-b02fd4c61ea3.jpg" },
        { name: "七瀬おと", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/693/96cd76b1-bc29-4dfa-8e7b-b5c652cff0aa.jpg" },
        { name: "篠田さな", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/674/a24f41de-7985-473a-a62e-f059ad6565e9.jpg" },
        { name: "南ゆな", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/639/6695fdbd-e7bd-42d9-9f10-dd227e3d0108.jpg" },
        { name: "天音ここ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/525/eb780d92-5edb-48b9-9b13-e8a8e9ad28b1.jpg" },
        { name: "小川まなみ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/683/94377e22-aa0b-46d2-8fa1-cc3dc553e40e.jpg" },
        { name: "山本ひめの", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/668/cc568f9e-9f9e-4918-8a24-043565f192d7.jpg" },
        { name: "吉乃ちゆ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/688/2a6f2774-2565-4d38-be4d-36477bcc1077.jpg" },
        { name: "柚木あまね", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/626/d3f90779-581e-4de2-b6d0-0049dd6bd1ac.jpg" },
        { name: "桜庭ふうか", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/651/7aac5d86-8317-4b70-a3b7-5d5884644ff6.jpg" },
        { name: "椿えりか", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/549/fff2758f-923b-4381-b15a-98c91b5f2332.jpg" },
        { name: "柊いおり", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/45/b9528692-09a8-4667-8078-6b0175927604.png" },
        { name: "折本なごみ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/633/62cf5d43-f9e9-43d7-8412-774ace12c7de.jpg" },
        { name: "湊まお", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/648/905854f0-9915-4cbd-aa73-416188be3378.jpg" },
        { name: "椎名えみり", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/647/7ae15da3-434f-4b08-a14d-4dc890e2ef21.jpg" },
        { name: "白雪愛", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/531/ce2ef6e8-b236-4059-993b-8c9a8951bc45.jpg" },
        { name: "神城りん", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/646/0f687aa5-0988-4100-9b99-3eeebc3641b2.jpg" },
        { name: "壱宮りあ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/650/844db507-83a4-494a-9d49-814de9b3e63c.jpg" },
        { name: "松田あん", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/669/86293fa9-274f-42e2-9f0e-62d1d8062d24.jpg" },
        { name: "谷村あいり", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/596/be55ec64-0520-4c34-ad99-e8f6a9f25d68.jpg" },
        { name: "桃羽めあ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/675/6f6cf422-4228-4ffd-ad9d-09dc721127ca.jpg" },
        { name: "長岡わかな", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/6/da01f109-f6eb-441c-8eca-ba75626aec93.png" },
        { name: "月野のぞみ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/670/a18fe9c1-d103-4e21-92cc-df6cf4267f93.jpg" },
        { name: "如月なお", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/690/2991c6ce-a8a3-44d2-bd6d-7f130c7ffdc2.jpg" },
        { name: "立花もも", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/700/1640fdce-e4af-41e8-bc2f-9d3d52f51c27.jpg" },
        { name: "長谷川なつみ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/695/3c19c540-e757-4832-b484-2cb7b4117fcd.jpg" },
        { name: "星野ななこ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/698/07eb3501-e328-44eb-ac80-08f16be32d4e.jpg" },
        { name: "神楽こはく", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/697/44a5ec06-a856-4ac8-9872-da61ac686d66.jpg" },
        { name: "神崎ゆり", img: "https://esthe-natural.com/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" },
        { name: "河本りお", img: "https://esthe-natural.com/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" },
        { name: "桐谷れいみ", img: "https://natural-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/699/33dbb6d5-d1f8-4a5e-874b-b0f78b36b838.jpg" },
        { name: "西野ひめか", img: "https://esthe-natural.com/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" },
        { name: "福原みつき", img: "https://esthe-natural.com/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" },
        { name: "松坂れある", img: "https://esthe-natural.com/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" },
        { name: "天羽なつね", img: "https://esthe-natural.com/assets/customer/no_image-6557b0d4b7836491411802db2c3ca4668d6bdece8eb29aa4ffacdfeeee63a799.jpg" }
      ]
    },
    {
      keywords: ["Spa Ytree", "Ytree"],
      schedule_url: "https://spa-ytree.com/schedule/",
      price_system: "90min: 12,000yen\n120min: 16,000yen\n150min: 20,000yen\n180min: 24,000yen",
      casts: [
        { name: "つむぎ", img: "https://spa-ytree.com/images_staff/151/01_1775197647.jpg" },
        { name: "のあ", img: "https://spa-ytree.com/images_staff/149/01_1772533617.jpg" },
        { name: "ここ", img: "https://spa-ytree.com/images_staff/148/01_1772441548.jpg" },
        { name: "しおん", img: "https://spa-ytree.com/images_staff/146/01_1763545433.jpg" },
        { name: "らん", img: "https://spa-ytree.com/images_staff/145/01_1772758635.jpg" },
        { name: "なおみ", img: "https://spa-ytree.com/images_staff/144/01_1761994869.jpg" },
        { name: "くみ", img: "https://spa-ytree.com/images_staff/139/01_1757390420.jpg" },
        { name: "るりか", img: "https://spa-ytree.com/images_staff/138/01_1755244053.jpg" },
        { name: "ふたば", img: "https://spa-ytree.com/images_staff/137/01_1754385792.jpg" },
        { name: "とわ", img: "https://spa-ytree.com/images_staff/135/01_1750741879.jpg" },
        { name: "セイラ", img: "https://spa-ytree.com/images_staff/134/01_1749815190.jpg" },
        { name: "さき", img: "https://spa-ytree.com/images_staff/133/01_1769747246.jpg" },
        { name: "優", img: "https://spa-ytree.com/images_staff/132/01_1771597183.jpg" },
        { name: "れいか", img: "https://spa-ytree.com/images_staff/130/01_1746809293.jpg" },
        { name: "ひめか", img: "https://spa-ytree.com/images_staff/129/01_1746835628.jpg" },
        { name: "あいの", img: "https://spa-ytree.com/images_staff/128/01_1745985772.jpg" },
        { name: "ゆりな", img: "https://spa-ytree.com/images_staff/124/01_1731895181.jpg" },
        { name: "りお", img: "https://spa-ytree.com/images_staff/117/01_1754532516.jpg" },
        { name: "音羽", img: "https://spa-ytree.com/images_staff/116/01_1701253928.jpg" },
        { name: "ミイ", img: "https://spa-ytree.com/images_staff/114/01_1761559753.jpg" },
        { name: "リリー", img: "https://spa-ytree.com/images_staff/111/01_1695892415.jpg" },
        { name: "芽依", img: "https://spa-ytree.com/images_staff/108/01_1690770921.jpg" },
        { name: "みゆめ", img: "https://spa-ytree.com/images_staff/107/01_1688527361.jpg" },
        { name: "りょう", img: "https://spa-ytree.com/images_staff/106/01_1683370580.jpg" },
        { name: "まや", img: "https://spa-ytree.com/images_staff/101/01_1674796683.jpg" },
        { name: "はな", img: "https://spa-ytree.com/images_staff/100/01_1690776563.jpg" },
        { name: "ゆたか", img: "https://spa-ytree.com/images_staff/98/01_1699780215.jpg" },
        { name: "ねね", img: "https://spa-ytree.com/images_staff/94/01_1659062843.jpg" },
        { name: "みお", img: "https://spa-ytree.com/images_staff/93/01_1658905578.jpg" },
        { name: "もえ", img: "https://spa-ytree.com/images_staff/92/01_1708503326.jpg" },
        { name: "夏菜子", img: "https://spa-ytree.com/images_staff/89/01_1771258124.jpg" },
        { name: "静香", img: "https://spa-ytree.com/images_staff/88/01_1651930292.jpg" },
        { name: "こころ", img: "https://spa-ytree.com/images_staff/84/01_1644741695.jpg" },
        { name: "桃香", img: "https://spa-ytree.com/images_staff/82/01_1641733569.jpg" },
        { name: "るり", img: "https://spa-ytree.com/images_staff/77/01_1634879902.jpg" },
        { name: "凛", img: "https://spa-ytree.com/images_staff/75/01_1635317247.jpg" },
        { name: "みおり", img: "https://spa-ytree.com/images_staff/73/01_1701761912.jpg" },
        { name: "はるか", img: "https://spa-ytree.com/images_staff/72/01_1629110985.jpg" },
        { name: "なな", img: "https://spa-ytree.com/images_staff/65/01_1770873565.jpg" },
        { name: "みゆき", img: "https://spa-ytree.com/images_staff/62/01_1625731727.jpg" },
        { name: "よしの", img: "https://spa-ytree.com/images_staff/61/01_1620874595.jpg" },
        { name: "めぐ", img: "https://spa-ytree.com/images_staff/59/01_1623864093.jpg" },
        { name: "ありす", img: "https://spa-ytree.com/images_staff/57/01_1619370019.jpg" },
        { name: "瑞音", img: "https://spa-ytree.com/images_staff/56/01_1747657420.jpg" },
        { name: "あんな", img: "https://spa-ytree.com/images_staff/51/01_1621999073.jpg" },
        { name: "あやめ", img: "https://spa-ytree.com/images_staff/31/01_1610250198.jpg" },
        { name: "えみり", img: "https://spa-ytree.com/images_staff/22/01_1622465610.jpg" },
        { name: "まりあ", img: "https://spa-ytree.com/images_staff/16/01_1603799700.jpg" },
        { name: "はるな", img: "https://spa-ytree.com/images_staff/15/01_1603798970.jpg" },
        { name: "りの", img: "https://spa-ytree.com/images_staff/26/01_1603861665.jpg" },
        { name: "あや", img: "https://spa-ytree.com/images_staff/21/01_1603802276.jpg" },
        { name: "みき", img: "https://spa-ytree.com/images_staff/12/01_1667841355.jpg" },
        { name: "小鳥", img: "https://spa-ytree.com/images_staff/29/01_1603880551.jpg" },
        { name: "すず", img: "https://spa-ytree.com/images_staff/6/01_1603793164.jpg" },
        { name: "みか", img: "https://spa-ytree.com/images_staff/11/01_1603795993.jpg" },
        { name: "まい", img: "https://spa-ytree.com/images_staff/18/01_1603799923.jpg" },
        { name: "ほのか", img: "https://spa-ytree.com/images_staff/13/01_1603796908.jpg" },
        { name: "ちかこ", img: "https://spa-ytree.com/images_staff/20/01_1603800529.jpg" },
        { name: "きょうこ", img: "https://spa-ytree.com/images_staff/7/01_1771901885.jpg" },
        { name: "りえ", img: "https://spa-ytree.com/images_staff/17/01_1603799808.jpg" }
      ]
    }
  ];

  try {
    for (const shop of shopsData) {
      console.log(`\n⏳ 「${shop.keywords[0]}」のスケジュール・料金・キャスト写真を一括更新します...`);

      let targetShopId = null;
      for (const query of shop.keywords) {
        const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(query)}*&select=id,name`, { headers });
        const json = await res.json();
        if (json && json.length > 0) {
          targetShopId = json[0].id;
          break;
        }
      }

      if (!targetShopId) {
        console.log(`⚠️ 「${shop.keywords[0]}」が見つかりませんでした。`);
        continue;
      }

      // 1. 店舗のURL、スケジュールURL、料金システムを更新
      const updateData = { 
        schedule_url: shop.schedule_url,
        price_system: shop.price_system
      };
      if (shop.url) updateData.url = shop.url;

      await fetch(`${url}/rest/v1/shops?id=eq.${targetShopId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(updateData)
      });
      console.log(` ✅ 店舗情報の更新完了！`);

      if (shop.casts.length === 0) {
         console.log(` ℹ️ キャストデータがないためスキップします。`);
         continue;
      }

      // 2. 現在データベースにいるキャストのリストを取得
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${targetShopId}&select=id,name,image_url`, { headers });
      const dbCasts = await dbRes.json();

      let updateCount = 0;
      let insertCount = 0;

      // 3. キャストの写真データを追加・更新
      for (const cast of shop.casts) {
        // 名前から空白やカッコ書きを取り除く
        const cleanName = cast.name.replace(/[\s　]+/g, '').replace(/（.*）/g, ''); 
        const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '').replace(/（.*）/g, '') === cleanName);

        if (existing) {
          if (existing.image_url !== cast.img) {
            await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
              method: 'PATCH',
              headers: headers,
              body: JSON.stringify({ image_url: cast.img })
            });
            updateCount++;
          }
        } else {
          const newId = `${targetShopId}_${cleanName}`;
          await fetch(`${url}/rest/v1/therapists`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({
              id: newId,
              shop_id: targetShopId,
              name: cleanName,
              image_url: cast.img
            })
          });
          insertCount++;
        }
      }

      console.log(` 🎉 「${shop.keywords[0]}」のキャスト設定が完了しました！（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    }

    console.log("\n🚀 3店舗のデータ流し込みが完璧に完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
