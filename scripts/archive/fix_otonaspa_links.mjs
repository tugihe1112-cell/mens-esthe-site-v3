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

  try {
    console.log("⏳ 「大人の安らぎSPA」の各店舗データを取得中...");
    
    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*大人の安らぎ*&select=id,name`, { headers });
    const shops = await res.json();

    if (!shops || shops.length === 0) {
      console.log("❌ 店舗が見つかりませんでした。");
      return;
    }

    console.log(`✅ ${shops.length}件の店舗が見つかりました。個別にリンクを修正します。\n`);

    for (const shop of shops) {
      let correctUrl = "";
      
      if (shop.name.includes("恵比寿")) {
        correctUrl = "https://www.otonaspa-tokyo.com/reserve?shop_id=10";
      } else if (shop.name.includes("銀座")) {
        correctUrl = "https://www.otonaspa-tokyo.com/reserve?shop_id=12";
      } else {
        // どちらも含まない場合は、一旦恵比寿店のリンクをデフォルトとして設定
        correctUrl = "https://www.otonaspa-tokyo.com/reserve?shop_id=10";
      }

      const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ schedule_url: correctUrl })
      });

      if (updateRes.ok) {
        console.log(`✅ ${shop.name} -> リンクを修正完了`);
      } else {
        console.error(`❌ ${shop.name} の修正に失敗しました。`);
      }
    }

    console.log("\n🎉 すべてのリンク修正が完了しました！ブラウザで確認してください。");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
