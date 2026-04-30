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
    console.log(`🔍 データベースから「relax」または「リラックス」を含む店舗を検索します...\n`);

    // relax または リラックス を含む店舗を検索
    const res = await fetch(`${url}/rest/v1/shops?select=id,name&or=(name.ilike.*relax*,name.ilike.*リラックス*)`, { headers });
    const targetShops = await res.json();

    if (!targetShops || targetShops.length === 0) {
      console.log("⚠️ 該当する店舗が見つかりませんでした。");
      return;
    }

    console.log(`✅ ${targetShops.length} 件の店舗が見つかりました:\n`);
    targetShops.forEach(shop => {
      console.log(`- ID: ${shop.id}`);
      console.log(`  店舗名: ${shop.name}`);
      console.log('-----------------------------------');
    });

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
