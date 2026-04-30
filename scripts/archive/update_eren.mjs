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

  // エレンの店舗ID（先ほど確認したもの）
  const targetShopId = 'tokyo_shibuya_eren';

  const shopData = {
    schedule_url: "http://www.eren.tokyo/schedule/",
    price_system: "70分: 14,000円\n90分: 18,000円 → 16,000円（Open割引）\n120分: 24,000円 → 22,000円（Open割引）\n150分: 30,000円 → 28,000円（Open割引）\n180分: 36,000円 → 34,000円（Open割引）",
    casts: [
      { name: "涼宮ひとみ", img: "http://www.eren.tokyo/images/ml_11_1_8063.jpeg" },
      { name: "東條あおい", img: "http://www.eren.tokyo/images/ml_11_1_7956.jpeg" },
      { name: "乃木坂ゆな", img: "http://www.eren.tokyo/images/ml_11_1_8510.jpeg" },
      { name: "木崎ゆめ", img: "http://www.eren.tokyo/images/ml_11_1_8346.JPG" },
      { name: "川村もも", img: "http://www.eren.tokyo/images/ml_11_1_8347.JPG" },
      { name: "生田あみ", img: "http://www.eren.tokyo/images/ml_11_1_8527.JPG" },
      { name: "黒咲れみ", img: "http://www.eren.tokyo/images/ml_11_1_8322.JPG" },
      { name: "葉月みう", img: "http://www.eren.tokyo/images/ml_11_1_7777.jpg" },
      { name: "白雪えま", img: "http://www.eren.tokyo/images/ml_11_1_8256.JPG" },
      { name: "白浜れいか", img: "http://www.eren.tokyo/images/ml_11_1_9912.jpg" },
      { name: "佐々木ゆり", img: "http://www.eren.tokyo/images/ml_11_1_8093.JPG" },
      { name: "谷崎くるみ", img: "http://www.eren.tokyo/images/ml_11_1_8420.JPG" },
      { name: "青山りん", img: "http://www.eren.tokyo/images/ml_11_1_6576.jpeg" },
      { name: "米谷りほ", img: "http://www.eren.tokyo/images/ml_11_1_10116.JPG" },
      { name: "水谷かおり", img: "http://www.eren.tokyo/images/ml_11_1_8047.JPG" },
      { name: "春野るい", img: "http://www.eren.tokyo/images/ml_11_1_8513.jpeg" },
      { name: "雪村かい", img: "http://www.eren.tokyo/images/ml_11_1_8038.JPG" },
      { name: "如月なな", img: "http://www.eren.tokyo/images/ml_11_1_8066.jpeg" },
      { name: "美月ゆい", img: "http://www.eren.tokyo/images/ml_11_1_8403.jpeg" },
      { name: "梅田こはる", img: "http://www.eren.tokyo/images/ml_11_1_8650.JPG" },
      { name: "白鳥ふうか", img: "http://www.eren.tokyo/images/ml_11_1_6579.jpg" },
      { name: "三上さら", img: "http://www.eren.tokyo/images/ml_11_1_10260.JPG" },
      { name: "西内のぞみ", img: "http://www.eren.tokyo/images/ml_11_1_8036.JPG" },
      { name: "上条こはる", img: "http://www.eren.tokyo/images/ml_11_1_6584.jpeg" },
      { name: "志田ゆうり", img: "http://www.eren.tokyo/images/ml_11_1_8600.jpeg" },
      { name: "辻ほのか", img: "http://www.eren.tokyo/images/ml_11_1_7879.jpg" },
      { name: "月見りこ", img: "http://www.eren.tokyo/images/ml_11_1_8054.jpeg" },
      { name: "南もも", img: "http://www.eren.tokyo/images/ml_11_1_8184.JPG" },
      { name: "加藤まゆ", img: "http://www.eren.tokyo/images/ml_11_1_10148.JPG" },
      { name: "小柳りほ", img: "http://www.eren.tokyo/images/ml_11_1_10119.JPG" },
      { name: "朝比奈かれん", img: "http://www.eren.tokyo/images/ml_11_1_8829.JPG" },
      { name: "北川ひな", img: "http://www.eren.tokyo/images/ml_11_1_7877.jpg" },
      { name: "小倉ひなの", img: "http://www.eren.tokyo/images/ml_11_1_8050.JPG" },
      { name: "宇多川うらら", img: "http://www.eren.tokyo/images/ml_11_1_7880.jpeg" },
      { name: "水野るな", img: "http://www.eren.tokyo/images/ml_11_1_6582.JPG" },
      { name: "神咲りの", img: "http://www.eren.tokyo/images/ml_11_1_8410.jpeg" },
      { name: "松田もえ", img: "http://www.eren.tokyo/images/ml_11_1_8418.jpeg" },
      { name: "一ノ瀬あやか", img: "http://www.eren.tokyo/images/ml_11_1_8407.jpeg" },
      { name: "鳴海るか", img: "http://www.eren.tokyo/images/ml_11_1_8720.jpeg" },
      { name: "竹田なぎさ", img: "http://www.eren.tokyo/images/ml_11_1_10239.jpg" },
      { name: "成瀬まお", img: "http://www.eren.tokyo/images/ml_11_1_8417.jpeg" },
      { name: "久我まひろ", img: "http://www.eren.tokyo/images/ml_11_1_9192.jpeg" },
      { name: "滝川れいな", img: "http://www.eren.tokyo/images/ml_11_1_10018.jpeg" },
      { name: "藤倉さえ", img: "http://www.eren.tokyo/images/ml_11_1_9158.jpeg" },
      { name: "若菜ひより", img: "http://www.eren.tokyo/images/ml_11_1_9349.jpg" },
      { name: "若月みんと", img: "http://www.eren.tokyo/images/ml_11_1_9964.jpeg" },
      { name: "三輪かなで", img: "http://www.eren.tokyo/images/ml_11_1_9276.jpg" },
      { name: "桜田ゆり", img: "http://www.eren.tokyo/images/ml_11_1_8956.JPG" },
      { name: "浜崎かほ", img: "http://www.eren.tokyo/images/ml_11_1_9946.jpg" },
      { name: "新木りお", img: "http://www.eren.tokyo/images/ml_11_1_9915.jpg" },
      { name: "一条さな", img: "http://www.eren.tokyo/images/ml_11_1_6587.jpeg" },
      { name: "月島あいり", img: "http://www.eren.tokyo/images/ml_11_1_8598.JPG" },
      { name: "小宮あさみ", img: "http://www.eren.tokyo/images/ml_11_1_8645.jpeg" },
      { name: "吉川みく", img: "http://www.eren.tokyo/images/ml_11_1_7886.jpeg" },
      { name: "黒木めぐ", img: "http://www.eren.tokyo/images/ml_11_1_8059.jpeg" }
    ]
  };

  try {
    console.log("⏳ 店舗「エレン (Eren)」のスケジュール・料金・キャスト写真を一括更新します...\n");

    // 1. 店舗のスケジュールURLと料金システムを更新
    await fetch(`${url}/rest/v1/shops?id=eq.${targetShopId}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ 
        schedule_url: shopData.schedule_url,
        price_system: shopData.price_system
      })
    });
    console.log(` ✅ 店舗情報の更新完了！`);

    // 2. 現在データベースにいるキャストのリストを取得（基本空のはず）
    const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${targetShopId}&select=id,name,image_url`, { headers });
    const dbCasts = await dbRes.json();

    let updateCount = 0;
    let insertCount = 0;

    // 3. キャストの写真データを追加・更新
    for (const cast of shopData.casts) {
      const cleanName = cast.name.replace(/[\s　]+/g, ''); // 空白除去
      const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === cleanName);

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

    console.log(` 🎉 エレンのキャスト設定が完了しました！（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    console.log("\n🚀 ブラウザをリロードして、エレンのページを確認してみてください！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
