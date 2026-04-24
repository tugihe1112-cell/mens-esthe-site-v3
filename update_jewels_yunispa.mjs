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
      keywords: ["Aroma Jewels", "アロマジュエルズ"],
      schedule_url: "https://aroma-jewels.jp/schedule",
      price_system: "60分コース: 14,000円\n70分オールあおむけコース: 18,000円\n90分コース: 18,000円\n120分コース: 23,000円\n150分コース: 28,000円",
      casts: [] // キャスト情報がないため空
    },
    {
      keywords: ["Yuni Spa", "ユニスパ"],
      schedule_url: "https://yunispa.tokyo/schedule",
      price_system: "60分: 16,000円 (通常 17,000円)\n80分: 18,000円 (通常 19,000円)\n100分: 21,000円 (通常 22,000円)\n120分: 25,000円 (通常 26,000円)\n160分: 36,000円 (通常 37,000円)\n180分: 40,000円 (通常 41,000円)\n240分: 53,000円 (通常 54,000円)",
      casts: [
        { name: "あすか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1758542520_9733618.jpg" },
        { name: "ももな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1761187542_9834136.jpeg" },
        { name: "ひかり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1733910561_5351380.jpeg" },
        { name: "せいな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1759806998_8127973.jpeg" },
        { name: "かんな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1761586547_8778421.jpg" },
        { name: "みいな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1760327310_5954583.jpeg" },
        { name: "いと", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1759573472_7316184.jpeg" },
        { name: "まい", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1759062238_2954712.jpeg" },
        { name: "りり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773497000_5011745.jpeg" },
        { name: "ふうあ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1774085379_9911040.jpeg" },
        { name: "なごみ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773068341_2907400.jpeg" },
        { name: "みれい", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771432427_0542737.jpeg" },
        { name: "さな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771209520_6156555.jpeg" },
        { name: "みほ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771391719_3116158.jpeg" },
        { name: "あおい", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1719763250_0818968.jpeg" },
        { name: "えむ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1741679014_9251432.jpg" },
        { name: "はく", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1758893110_0045417.jpg" },
        { name: "みみ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1743404123_5429369.jpg" },
        { name: "まりな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1717760752_7932363.jpg" },
        { name: "えり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1744418552_2479031.jpeg" },
        { name: "まどか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1759146864_7085189.jpeg" },
        { name: "あみ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1758346441_9071854.jpg" },
        { name: "なぎ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1764920064_1883187.jpg" },
        { name: "つむぎ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1769589056_9170349.jpg" },
        { name: "うみ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1761125145_5590867.jpeg" },
        { name: "らいむ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770453552_1637131.jpeg" },
        { name: "みつり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1761148594_1351956.jpeg" },
        { name: "ゆり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1731035270_5547171.jpeg" },
        { name: "りおな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1768303915_9058698.jpeg" },
        { name: "みやび", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1760697745_6018189.jpeg" },
        { name: "れいか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1760680983_3702577.jpeg" },
        { name: "ありな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1754456097_2207286.jpg" },
        { name: "すみれ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1751726027_4343930.jpg" },
        { name: "はるか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1757758595_2096554.jpg" },
        { name: "きらら", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1754567122_7307021.jpg" }
      ]
    }
  ];

  try {
    for (const shop of shopsData) {
      console.log(`\n⏳ 「${shop.keywords[0]}」のスケジュール・料金・キャストデータを更新します...`);

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

      // 1. 店舗のスケジュールURL、料金システムを更新
      await fetch(`${url}/rest/v1/shops?id=eq.${targetShopId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          schedule_url: shop.schedule_url,
          price_system: shop.price_system
        })
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

      console.log(` 🎉 キャスト設定が完了しました！（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    }

    console.log("\n🚀 2店舗のデータ流し込みが完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
