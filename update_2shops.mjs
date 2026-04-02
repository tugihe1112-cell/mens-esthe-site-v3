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

  const shopData = [
    {
      keywords: ["Aroma Blanca", "アロマブランカ"],
      schedule_url: "https://www.aroma-blanca.com/schedule/",
      price_system: "70分: 18,000円\n100分: 22,000円\n120分: 26,000円"
    },
    {
      keywords: ["Belle Lily", "ベルリリィ", "ベルリリー"],
      website_url: "https://shibuya-belle-lily.com/",
      schedule_url: "https://shibuya-belle-lily.com/schedule.php",
      price_system: "【オープニングキャンペーン】\n90分: 22,000円 ⇒ 20,000円\n120分: 28,000円 ⇒ 26,000円\n150分: 34,000円 ⇒ 32,000円"
    }
  ];

  try {
    console.log("⏳ Aroma Blanca と Belle Lily の情報を更新中...\n");

    for (const item of shopData) {
      let targetShops = [];
      
      for (const query of item.keywords) {
        const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(query)}*&select=id,name`, { headers });
        const json = await res.json();
        if (json && json.length > 0) {
          targetShops = json;
          break;
        }
      }

      if (targetShops.length === 0) {
        console.log(`⚠️ 「${item.keywords[0]}」が見つかりませんでした。`);
        continue;
      }

      let successCount = 0;
      for (const shop of targetShops) {
        const updateBody = { 
          schedule_url: item.schedule_url,
          price_system: item.price_system
        };
        // ベルリリィ用にwebsite_urlがあれば追加
        if (item.website_url) {
          updateBody.website_url = item.website_url;
        }

        const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify(updateBody)
        });
        if (updateRes.ok) successCount++;
      }
      
      console.log(`✅ 「${targetShops[0].name}」の情報を更新しました！`);
    }

    console.log("\n🎉 2店舗のデータ更新が完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
