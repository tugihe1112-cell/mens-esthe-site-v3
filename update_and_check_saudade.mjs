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

  const updateShop = async (searchName, updateData) => {
    console.log(`\n⏳ 「${searchName}」を検索中...`);
    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(searchName)}*&select=id,name`, { headers });
    const data = await res.json();
    
    if (!data || data.length === 0) {
      console.log(`❌ 「${searchName}」が見つかりませんでした。`);
      return null;
    }

    let successCount = 0;
    for (const shop of data) {
      const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(updateData)
      });
      if (updateRes.ok) successCount++;
    }
    console.log(`✅ ${successCount}件の「${data[0].name}」の店舗データを更新しました！`);
    return data[0].id;
  };

  const checkTherapists = async (shopId) => {
    console.log(`\n🔍 サウダージのセラピスト画像データを診断中...`);
    const res = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shopId}&select=name,image_url&limit=5`, { headers });
    const data = await res.json();
    
    if (!data || data.length === 0) {
      console.log(`⚠️ セラピストが1件も登録されていません。`);
      return;
    }
    console.log(`--- 画像URLの現在の状態（上位5名） ---`);
    data.forEach(t => {
      console.log(`名前: ${t.name}\n画像URL: ${t.image_url}\n`);
    });
    console.log(`--------------------------------------`);
  };

  const run = async () => {
    // 1. reve spa の更新
    await updateShop("reve spa", { schedule_url: "https://revespa.net/" });

    // 2. サウダージ の更新
    const saudadeSystem = 
`60分　　18,000円
90分　　20,000円
120分　 24,000円
150分　 30,000円`;
    
    const saudadeId = await updateShop("サウダージ", { 
      schedule_url: "https://saudade-tokyo.com/schedule.html",
      price_system: saudadeSystem
    });

    // 3. サウダージのセラピスト画像データの診断
    if (saudadeId) {
      await checkTherapists(saudadeId);
    }
    
    console.log("\n🎉 スクリプトの実行が完了しました！");
  };
  run();
} catch (e) {
  console.error("エラー:", e.message);
}
