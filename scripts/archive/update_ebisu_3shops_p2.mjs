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
      keywords: ["Love it", "ラヴィット"],
      schedule_url: "https://loveit.love/schedule.html",
      price_system: "60分(仰向けのみ): 15,000円\n90分: 20,000円⇒18,000円\n100分: 22,000円⇒20,000円\n120分: 25,000円⇒23,000円\n150分: 30,000円⇒28,000円"
    },
    {
      keywords: ["AQUA", "アクア"],
      schedule_url: "https://www.nakameguro-aqua.com/schedule/",
      price_system: "【アクアコース】\n60分(お試し): 14,000円\n90分(レギュラー): 19,000円\n120分(オススメ): 24,000円\n150分(会員様限定): 29,000円\n180分(会員様限定): 34,000円"
    },
    {
      keywords: ["ANAICHI", "アナイチ"],
      schedule_url: "https://www.anaichi-este.com/schedule/",
      price_system: "90分: 16,000円\n120分(→130分): 21,000円\n150分(→160分): 26,000円\n180分(→190分): 31,000円"
    }
  ];

  try {
    console.log("⏳ Love it、AQUA、アナイチのスケジュールと料金を更新中...\n");

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
        const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            schedule_url: item.schedule_url,
            price_system: item.price_system
          })
        });
        if (updateRes.ok) successCount++;
      }
      
      console.log(`✅ 「${targetShops[0].name}」のスケジュールと料金を更新しました！`);
    }

    console.log("\n🎉 3店舗のデータ更新が完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
