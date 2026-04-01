import fs from 'fs';

try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');

  const headers = { 
    'apikey': key, 
    'Authorization': `Bearer ${key}`, 
    'Content-Type': 'application/json' 
  };

  const updateShop = async (searchName, scheduleUrl, priceSystem) => {
    console.log(`\n⏳ 「${searchName}」を検索中...`);
    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(searchName)}*&select=id,name`, { headers });
    const data = await res.json();
    
    if (!data || data.length === 0) {
      console.log(`❌ 「${searchName}」が見つかりませんでした。`);
      return;
    }

    const updateData = {
      schedule_url: scheduleUrl,
      price_system: priceSystem
    };

    let successCount = 0;
    for (const shop of data) {
      const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(updateData)
      });
      if (updateRes.ok) successCount++;
    }
    
    console.log(`✅ ${successCount}件の「${data[0].name}」のデータを更新しました！`);
    console.log("--- 登録した料金システム ---");
    console.log(priceSystem);
    console.log("----------------------------");
  };

  const run = async () => {
    // 1. 超レベチなエステ24
    const levechiSystem = 
`60分　　¥13,000
90分　　¥18,000
120分　 ¥23,000
150分　 ¥28,000`;
    await updateShop("レベチなエステ", "https://tokyo242424.com/schedule/", levechiSystem);

    // 2. ONE ROOM
    // 画像から読み取り、デザインを綺麗に成形
    const oneroomSystem = 
`60分　　15,000円 → 13,000円
90分　　22,000円 → 19,000円
120分　 28,000円 → 25,000円
150分　 34,000円 → 31,000円`;
    await updateShop("ONE ROOM", "https://www.oneroom-shinjyuku.com/", oneroomSystem);
    
    console.log("\n🎉 すべての更新が完了しました！");
  };
  run();
} catch (e) {
  console.error("エラー:", e.message);
}
