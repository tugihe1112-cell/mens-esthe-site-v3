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
    console.log("⏳ 「大人のやすらぎSPA」の各店舗データを取得中...");
    
    // ひらがなの「やすらぎ」と漢字の「安らぎ」両方でヒットするように検索を強化
    const res = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*やすらぎ*,name.ilike.*安らぎ*)&select=id,name`, { headers });
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
        // 店舗名にエリアが含まれていない場合は、一旦恵比寿をデフォルトに
        correctUrl = "https://www.otonaspa-tokyo.com/reserve?shop_id=10";
      }

      const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ schedule_url: correctUrl })
      });

      if (updateRes.ok) {
        console.log(`✅ ${shop.name} -> リンクを修正完了: ${correctUrl}`);
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
