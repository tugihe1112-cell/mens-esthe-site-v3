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
    console.log("🔍 データベース上の「ティアモ」をすべて調査します...\n");
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*ティアモ*&select=id,name`, { headers });
    const shops = await shopRes.json();

    if (!shops || shops.length === 0) {
      console.log("❌ ティアモが見つかりません。");
      return;
    }

    for (const shop of shops) {
      const castRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
      const casts = await castRes.json();
      console.log(`店舗: ${shop.name} (ID: ${shop.id})`);
      console.log(`➡️ 登録されているキャスト数: ${casts.length}名`);
      if(casts.length > 0) {
        console.log(`📸 画像URLの例: ${casts[0].image_url}`);
      }
      console.log("----------------------------------------");
    }
  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
