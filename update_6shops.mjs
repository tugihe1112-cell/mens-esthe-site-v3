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
      keywords: ["Aroma Miely", "アロマミエリー"],
      schedule_url: "https://aroma-miely.com/schedule/",
      price_system: "60分(仰向けメイン): 16,000円\n90分: 19,000円\n120分: 25,000円\n150分: 31,000円"
    },
    {
      keywords: ["天界のスパ"],
      schedule_url: "https://www.tennesu.com/schedule/",
      price_system: "【OPEN割価格】\n80分: 18,000円 ⇒ 16,000円\n100分: 22,000円 ⇒ 20,000円\n120分: 26,000円 ⇒ 24,000円\n150分: 32,000円 ⇒ 30,000円\n180分: 38,000円 ⇒ 36,000円"
    },
    {
      keywords: ["BELLA SPA", "ベラスパ"],
      schedule_url: "https://bella-spa-esthe.com/schedule",
      price_system: "【Luxury Supine コース(仰向けのみ)】\n70分: 18,000円\n\n【Bella コース】\n90分: 20,000円\n120分: 24,000円\n150分: 30,000円"
    },
    {
      keywords: ["ポセイドン"],
      schedule_url: "https://aroma-poseidon.com/schedule.php",
      price_system: "60分(仰向け): 23,000円 ⇒ 21,000円\n80分: 25,000円 ⇒ 23,000円\n100分: 28,000円 ⇒ 26,000円\n120分: 31,000円 ⇒ 29,000円"
    },
    {
      keywords: ["MoMo Spa", "モモスパ"],
      schedule_url: "https://www.momospa.tokyo/schedule",
      price_system: "【スタンダードコース】\n70分: 16,000円\n90分: 20,000円\n\n【エクストラコース】\n70分: 18,000円\n90分: 22,000円"
    },
    {
      keywords: ["Vicca", "ヴィッカ"],
      schedule_url: "https://viccaplus.net/schedule/",
      price_system: "【スペシャルウェーブ】\n70分: 16,000円\n90分: 19,000円\n120分: 23,000円\n\n【ALL仰向けコース】\n75分: 21,000円"
    }
  ];

  try {
    console.log("⏳ 6店舗のスケジュールと料金を一括更新中...\n");

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
      
      console.log(`✅ 「${targetShops[0].name}」の情報を更新しました！`);
    }

    console.log("\n🎉 6店舗のデータ更新が完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
