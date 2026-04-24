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

  // 2店舗分の店舗情報データ（キャストなし）
  const shopsData = [
    {
      searchKeywords: ['aroma mrs', 'アロマミセス', 'アロママダム'],
      website_url: "https://aroma-mrs.com/",
      schedule_url: "https://aroma-mrs.com/schedule.php",
      price_system: "60min: 12,000円\n90min: 16,000円\n120min: 20,000円"
    },
    {
      searchKeywords: ['chat noir', 'シャノワール'],
      website_url: "https://chat-noir.site/",
      schedule_url: "https://chat-noir.site/",
      price_system: "60分: 19,000円 → 17,000円\n90分: 23,000円 → 20,000円\n120分: 30,000円 → 26,000円\n150分: 36,000円 → 31,000円"
    }
  ];

  try {
    console.log(`🔍 データベースから対象の2店舗を検索し、店舗情報の更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    for (const shopDef of shopsData) {
      console.log(`\n===========================================`);
      console.log(`▶ 処理開始: 【 ${shopDef.searchKeywords[0]} 】関連`);
      
      const targetShops = allShops.filter(shop => {
        const n = shop.name.toLowerCase();
        return shopDef.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
      });

      if (targetShops.length === 0) {
        console.log(`⚠️ 店舗が見つかりませんでした。スキップします。`);
        continue;
      }

      for (const shop of targetShops) {
        console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            website_url: shopDef.website_url,
            schedule_url: shopDef.schedule_url,
            price_system: shopDef.price_system
          })
        });

        if (patchRes.ok) {
          console.log(`   ✅ 店舗基本情報の更新完了`);
        } else {
          console.error(`   ❌ 店舗基本情報の更新失敗: ${patchRes.statusText}`);
        }
      }
    }
    
    console.log(`\n🎊 店舗情報の更新が完了しました！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
