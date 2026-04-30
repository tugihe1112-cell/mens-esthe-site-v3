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

  const shopDef = {
    searchKeywords: ['クラリスdao', 'clarisdao', 'クラリスダオ'],
    website_url: "https://clarice-dao.jp/",
    schedule_url: "https://fujoho.jp/index.php?p=shop_info&id=57056"
  };

  try {
    console.log(`🔍 データベースから「クラリスDAO」を検索し、URLの修正を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) { return; }

    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return shopDef.searchKeywords.some(keyword => n.includes(keyword));
    });

    if (targetShops.length === 0) {
      console.log(`⚠️ 店舗が見つかりませんでした。`);
      return;
    }

    for (const shop of targetShops) {
      console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
      
      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          website_url: shopDef.website_url,
          schedule_url: shopDef.schedule_url
        })
      });

      if (patchRes.ok) {
        console.log(`   ✅ URLの修正完了`);
      } else {
        console.error(`   ❌ URLの修正失敗: ${patchRes.statusText}`);
      }
    }
    console.log(`\n🎊 全ての更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
