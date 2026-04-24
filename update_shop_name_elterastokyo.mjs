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

  // 旧店舗名の検索キーワードと、新しい店舗名
  const shopDef = {
    searchKeywords: ['chat noir', 'シャノワール'],
    newName: "ELTERAS TOKYO (エルテラス)"
  };

  try {
    console.log(`🔍 データベースから「Chat noir (シャノワール)」を検索し、店舗名を更新します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return shopDef.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
    });

    if (targetShops.length === 0) {
      console.log(`⚠️ 「Chat noir (シャノワール)」が見つかりませんでした。`);
      return;
    }

    for (const shop of targetShops) {
      console.log(`🏠 更新対象: ${shop.name} (ID: ${shop.id})`);
      
      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          name: shopDef.newName
        })
      });

      if (patchRes.ok) {
        console.log(`   ✅ 店舗名を「${shopDef.newName}」に更新しました`);
      } else {
        console.error(`   ❌ 店舗名の更新に失敗しました: ${patchRes.statusText}`);
      }
    }
    
    console.log(`\n🎊 店舗名の変更処理が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
