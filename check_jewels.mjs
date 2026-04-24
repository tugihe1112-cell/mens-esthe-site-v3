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
    console.log(`🔍 データベース内の「Jewel」または「ジュエル」を含む店舗を確認します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*Jewel*,name.ilike.*ジュエル*)&select=id,name`, { headers });
    const shops = await res.json();

    if (shops && shops.length > 0) {
      console.log(`✅ 以下の店舗が見つかりました！`);
      shops.forEach(shop => {
        console.log(`  - 店舗名: ${shop.name} (ID: ${shop.id})`);
      });
    } else {
      console.log(`⚠️ 「Jewel」「ジュエル」を含む店舗は1件も見つかりませんでした。`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
