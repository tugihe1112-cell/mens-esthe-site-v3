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
    console.log("⏳ まずは『極楽エステ』の店名を『KIWAMI TOKYO』に変更します...\n");

    // 1. 極楽エステの名前変更
    const kiwamiRes = await fetch(`${url}/rest/v1/shops?name=ilike.*極楽エステ*&select=id,name`, { headers });
    const kiwamiJson = await kiwamiRes.json();

    if (kiwamiJson && kiwamiJson.length > 0) {
      const kiwamiId = kiwamiJson[0].id;
      const updateNameRes = await fetch(`${url}/rest/v1/shops?id=eq.${kiwamiId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ name: 'KIWAMI TOKYO' }) // 名前を上書き！
      });
      if (updateNameRes.ok) {
        console.log(` ✅ 店名を「KIWAMI TOKYO」に更新しました！`);
      } else {
        console.log(` ❌ 店名の更新に失敗しました。`);
      }
    } else {
      console.log(` ⚠️ 「極楽エステ」が見つかりませんでした（すでに変更済みの可能性あり）。`);
    }

    console.log("\n⏳ 続いて『Chocolate』のスケジュール・料金・キャストを一括登録します...\n");

    const chocolateData = {
      keywords: ["Chocolate", "チョコレート", "代々木ルーム"],
      schedule_url: "https://www.aroma-chocolate.com/schedule/",
      price_system: "90分: 18,000円\n120分: 24,000円",
      casts: [
        { name: "白石ゆな", img: "https://www.aroma-chocolate.com/images/ml_11_1_668.JPG" },
        { name: "本条さゆり", img: "https://www.aroma-chocolate.com/images/ml_11_1_702.JPG" },
        { name: "日向ゆう", img: "https://www.aroma-chocolate.com/images/ml_11_1_686.jpg" },
        { name: "植田えま", img: "https://www.aroma-chocolate.com/images/ml_11_1_683.jpeg" },
        { name: "森山みさ", img: "https://www.aroma-chocolate.com/images/ml_11_1_659.jpg" },
        { name: "宇佐美ありさ", img: "https://www.aroma-chocolate.com/images/ml_11_1_665.JPG" }
      ]
    };

    let chocoShopId = null;
    for (const query of chocolateData.keywords) {
      const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(query)}*&select=id,name`, { headers });
      const json = await res.json();
      if (json && json.length > 0) {
        chocoShopId = json[0].id;
        break;
      }
    }

    if (!chocoShopId) {
      console.log(`⚠️ 「Chocolate」が見つかりませんでした。`);
      return;
    }

    // Chocolateの店舗情報更新
    await fetch(`${url}/rest/v1/shops?id=eq.${chocoShopId}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ 
        schedule_url: chocolateData.schedule_url,
        price_system: chocolateData.price_system
      })
    });
    console.log(` ✅ Chocolateの店舗情報の更新完了！`);

    // Chocolateのキャスト登録
    const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${chocoShopId}&select=id,name,image_url`, { headers });
    const dbCasts = await dbRes.json();

    let updateCount = 0;
    let insertCount = 0;

    for (const cast of chocolateData.casts) {
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
        const newId = `${chocoShopId}_${cleanName}`;
        await fetch(`${url}/rest/v1/therapists`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({
            id: newId,
            shop_id: chocoShopId,
            name: cleanName,
            image_url: cast.img
          })
        });
        insertCount++;
      }
    }

    console.log(` 🎉 Chocolateのキャスト設定が完了しました！（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    console.log("\n🚀 全てのミッションが完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
