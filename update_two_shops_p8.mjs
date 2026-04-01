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

  // --- 汎用: 店舗データ更新関数 ---
  const updateShop = async (searchQueries, updateData) => {
    let data = [];
    for (const query of searchQueries) {
      const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(query)}*&select=id,name`, { headers });
      const json = await res.json();
      if (json && json.length > 0) {
        data = json;
        break;
      }
    }
    
    if (data.length === 0) {
      console.log(`❌ 「${searchQueries[0]}」が見つかりませんでした。`);
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
    return data;
  };

  try {
    console.log("⏳ 2店舗のスケジュール・料金システムを更新中...\n");

    // 1. Ho・O・Zu・Ki・SPA (ホオズキスパ)
    const hoozukiSystem = 
`90分　通常料金 16,000円 / ご新規様 15,000円
120分　通常料金 21,000円 / ご新規様 20,000円`;

    await updateShop(["Ho・O・Zu・Ki", "ホオズキ"], { 
      schedule_url: "https://hoozuki-spa.net/schedule.php", 
      price_system: hoozukiSystem 
    });

    console.log("-----------------------");

    // 2. グランドガイア (Grand Gaia) - 画像から抽出
    const gaiaSystem = 
`70分　オール仰向け (割引対象外)　17,000円
60分　お試し (割引対象外)　15,000円
90分　19,000円
120分　24,000円
150分　29,000円
180分　34,000円`;

    await updateShop(["グランドガイア", "Grand Gaia"], { 
      schedule_url: "https://grandgaia.jp/schedule", 
      price_system: gaiaSystem 
    });

    console.log("\n🎉 2店舗の更新が完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
