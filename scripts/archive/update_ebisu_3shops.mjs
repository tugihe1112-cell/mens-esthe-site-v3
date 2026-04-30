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
      keywords: ["THE HALF", "ザ・ハーフ"],
      schedule_url: "https://the-half.com/schedule/",
      price_system: "【スタンダードコース】\n60分: 12,000円 (本指名のみ)\n90分: 18,000円\n120分: 24,000円"
    },
    {
      keywords: ["Aroma Blossom", "アロマブロッサム"],
      schedule_url: "https://aroma-blossom.com/schedule/",
      price_system: "【アロマコース】\n60分: 14,000円\n90分: 19,000円\n120分: 24,000円\n150分: 29,000円\n180分: 34,000円"
    },
    {
      keywords: ["Candy Spa", "キャンディスパ"],
      schedule_url: "https://candy-s-candy.men-es.jp/schedule.html",
      price_system: "60分: 16,000円\n90分: 20,000円\n120分: 25,000円\n150分: 30,000円\n180分: 35,000円"
    }
  ];

  try {
    console.log("⏳ 恵比寿エリア3店舗のスケジュールと料金を更新中...\n");

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
