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
    console.log("🔍 「サロンブランカ」の重複原因を調査します...\n");
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*ブランカ*&select=id,name`, { headers });
    const shops = await shopRes.json();

    if (!shops || shops.length === 0) {
      console.log("❌ 「ブランカ」に関連する店舗が見つかりませんでした。");
      return;
    }

    console.log(`✅ ${shops.length}件の店舗が見つかりました。\n`);

    for (const shop of shops) {
      const castRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id`, { headers });
      const casts = await castRes.json();

      console.log(`店舗名: ${shop.name}`);
      console.log(`店舗ID: ${shop.id}`);
      console.log(`➡️ セラピスト登録数: ${casts.length}名`);
      console.log("--------------------------------------------------");
    }
  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
