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
      keywords: ["NAOMI SPA", "ナオミスパ"],
      schedule_url: "https://www.naomi-spa.com/schedule/",
      price_system: "90分: 22,000円\n120分: 29,000円\n150分: 37,000円\n180分: 44,000円\n延長30分: 9,000円"
    },
    {
      keywords: ["GRANMATOM", "グランマトム"],
      schedule_url: "https://matom.net/cast/sindex.cgi",
      price_system: "60分: 14,000円\n80分: 18,000円\n100分: 20,000円\n120分: 24,000円\n150分: 30,000円\n180分: 36,000円"
    },
    {
      keywords: ["MINERVA", "ミネルバ"],
      schedule_url: "https://minerva-ebisu.com/schedule",
      price_system: "50分: 12,000円\n70分: 16,000円\n90分: 19,000円\n120分: 24,000円\n150分: 31,000円\n180分: 37,000円\n延長30分: 8,000円\n本指名料: 2,000円"
    },
    {
      keywords: ["LINDA SPA", "リンダスパ"],
      schedule_url: "https://linda-spa.com/schedule/",
      price_system: "70分: 15,000円\n80分: 17,000円\n90分: 18,000円\n100分: 21,000円\n120分: 23,000円\n150分: 29,000円"
    },
    {
      keywords: ["Belle É", "ベルエ", "Belle E"],
      website_url: "https://bellee-spa.com/",
      schedule_url: "https://bellee-spa.com/schedule",
      price_system: "80分コース: 16,000円\n100分コース: 20,000円\n120分コース: 24,000円"
    }
  ];

  try {
    console.log("⏳ 恵比寿エリア5店舗のスケジュールと料金を更新中...\n");

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
        // ベルエ用にwebsite_urlがあれば追加
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
      
      console.log(`✅ 「${targetShops[0].name}」のスケジュールと料金を更新しました！`);
    }

    console.log("\n🎉 5店舗のデータ更新が完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
