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
      keywords: ["Sugar Spa", "シュガースパ"],
      schedule_url: "http://www.sugar-spa.net/schedule/",
      price_system: "90分: 20,000円\n120分: 26,000円\n150分: 32,000円",
      casts: [
        { name: "柏木みこと", img: "http://www.sugar-spa.net/images/ml_11_1_773.jpeg" },
        { name: "白川りょう", img: "http://www.sugar-spa.net/images/ml_11_1_2941.jpeg" },
        { name: "守谷なち", img: "http://www.sugar-spa.net/images/ml_11_1_2797.jpeg" },
        { name: "夏目響子", img: "http://www.sugar-spa.net/images/ml_11_1_995.jpeg" },
        { name: "夏川ゆうか", img: "http://www.sugar-spa.net/images/ml_11_1_3552.jpeg" },
        { name: "峰ゆりあ", img: "http://www.sugar-spa.net/images/ml_11_1_2160.jpeg" },
        { name: "星乃エマ", img: "http://www.sugar-spa.net/images/ml_11_1_3667.jpeg" },
        { name: "千原あさな", img: "http://www.sugar-spa.net/images/ml_11_1_3706.jpeg" }
      ]
    },
    {
      keywords: ["Poonys", "プーニーズ"],
      schedule_url: "https://www.poonys.tokyo/",
      price_system: "80分: 12,000円\n100分: 15,000円\n120分: 18,000円\n150分: 22,000円\n180分: 26,000円",
      casts: [
        { name: "エマ", img: "https://www.poonys.tokyo/uploads/1/2/4/1/124120020/snow-20230722-005756-794_6.jpg" },
        { name: "すみれ", img: "https://www.poonys.tokyo/uploads/1/2/4/1/124120020/unnamed_orig.jpg" },
        { name: "らん", img: "https://www.poonys.tokyo/uploads/1/2/4/1/124120020/wm4mku8zivf59mn1772460986-1772461014_orig.jpg" },
        { name: "せいな", img: "https://www.poonys.tokyo/uploads/1/2/4/1/124120020/1707203997124_orig.jpg" },
        { name: "かすみ", img: "https://www.poonys.tokyo/uploads/1/2/4/1/124120020/1697372792327_orig.jpg" },
        { name: "芙美", img: "https://www.poonys.tokyo/uploads/1/2/4/1/124120020/snow-20231014-160625-880_orig.jpg" },
        { name: "よしの", img: "https://www.poonys.tokyo/uploads/1/2/4/1/124120020/unnamedw_orig.jpg" }
      ]
    }
  ];

  try {
    for (const shop of shopsData) {
      console.log(`\n⏳ 「${shop.keywords[0]}」のスケジュール・料金・キャスト写真を一括更新します...`);

      // 店舗IDを検索
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

      // 1. 店舗のスケジュールURLと料金システムを更新
      await fetch(`${url}/rest/v1/shops?id=eq.${targetShopId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          schedule_url: shop.schedule_url,
          price_system: shop.price_system
        })
      });
      console.log(` ✅ 店舗情報の更新完了！`);

      // 2. 現在データベースにいるキャストのリストを取得
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${targetShopId}&select=id,name,image_url`, { headers });
      const dbCasts = await dbRes.json();

      let updateCount = 0;
      let insertCount = 0;

      // 3. キャストの写真データを追加・更新
      for (const cast of shop.casts) {
        const cleanName = cast.name.replace(/[\s　]+/g, '');
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

      console.log(` 🎉 「${shop.keywords[0]}」のキャスト設定が完了しました！（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    }

    console.log("\n🚀 2店舗のデータ流し込みが完璧に完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
