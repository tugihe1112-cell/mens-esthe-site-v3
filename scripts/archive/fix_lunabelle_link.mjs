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
    console.log("⏳ データベースから「アロマルナベル」の店舗IDを検索中...");
    
    // 「ルナベル」または「Lunabelle」で検索
    const res = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*ルナベル*,name.ilike.*Lunabelle*)&select=id,name`, { headers });
    const shops = await res.json();

    if (!shops || shops.length === 0) {
      console.log("❌ 店舗が見つかりませんでした。店舗名を確認してください。");
      return;
    }

    const correctLink = "https://aroma-lunabelle.com/schedule/";
    console.log(`\n🔗 リンクを修正中: ${correctLink}`);

    for (const shop of shops) {
      const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ schedule_url: correctLink })
      });

      if (updateRes.ok) {
        console.log(`✅ ${shop.name} のリンクを修正しました。`);
      } else {
        console.error(`❌ ${shop.name} の修正に失敗しました。`);
      }
    }

    console.log("\n🎉 すべての修正が完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
