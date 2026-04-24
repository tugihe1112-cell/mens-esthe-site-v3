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

  // 検索対象の広範なキーワード（旧名・新名どちらでも引っかかるように）
  const searchKeywords = ['chat noir', 'シャノワール', 'elteras', 'エルテラス'];

  try {
    console.log(`🔍 データベースから「ELTERAS TOKYO（旧シャノワール）」の全店舗を検索し、一括更新します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // 全系列店をフィルタリング
    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
    });

    if (targetShops.length === 0) {
      console.log(`⚠️ 該当する店舗が見つかりませんでした。`);
      return;
    }

    let count = 0;
    for (const shop of targetShops) {
      // 「〇〇店」などのルーム名を残すためのスマートな名前置換
      let updatedName = shop.name;
      if (updatedName.match(/Chat\s*noir|シャノワール/i)) {
         updatedName = updatedName.replace(/Chat\s*noir|シャノワール/ig, 'ELTERAS TOKYO (エルテラス)');
      }

      console.log(`🏠 更新対象: ${shop.name} (ID: ${shop.id})`);
      if (shop.name !== updatedName) {
        console.log(`   📝 店名変更: ${shop.name} ➡️ ${updatedName}`);
      }
      
      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          name: updatedName,
          website_url: "https://chat-noir.site/",
          schedule_url: "https://chat-noir.site/",
          price_system: "60分: 19,000円 → 17,000円\n90分: 23,000円 → 20,000円\n120分: 30,000円 → 26,000円\n150分: 36,000円 → 31,000円",
          image_url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/eltrelas.png"
        })
      });

      if (patchRes.ok) {
        console.log(`   ✅ 名前・ロゴ・システム情報の更新完了`);
        count++;
      } else {
        console.error(`   ❌ 更新失敗: ${patchRes.statusText}`);
      }
    }
    
    console.log(`\n🎊 合計 ${count} 店舗の「ELTERAS TOKYO」全店舗一括更新が完了しました！ブラウザをご確認ください。`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
