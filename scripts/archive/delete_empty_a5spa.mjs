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
    console.log("🔍 「A5 SPA」の重複店舗を調査中...");
    
    // A5を含む店舗を検索
    const shopRes = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*A5*,name.ilike.*エーゴスパ*)&select=id,name`, { headers });
    const shops = await shopRes.json();

    if (!shops || shops.length === 0) {
      console.log("❌ 「A5 SPA」に関連する店舗が見つかりませんでした。");
      return;
    }

    console.log(`✅ ${shops.length}件の店舗が見つかりました。セラピストの登録状況を確認します...\n`);

    for (const shop of shops) {
      // 各店舗のセラピスト数を取得
      const thermoRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=count`, { 
        headers: { ...headers, 'Prefer': 'count=exact' } 
      });
      
      // Prefer: count=exact を使うと、ヘッダーまたはレンジで数が返るが、
      // ここでは単純に全件取得して長さをチェックする安全策をとります
      const thermoData = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id`, { headers });
      const therapists = await thermoData.json();
      const count = therapists.length;

      console.log(`店舗名: ${shop.name} (ID: ${shop.id}) -> セラピスト数: ${count}名`);

      if (count === 0) {
        console.log(`⚠️ セラピストがいないため、この店舗を削除します...`);
        
        const delRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'DELETE',
          headers: headers
        });

        if (delRes.ok) {
          console.log(`🗑️ 削除完了: ${shop.name}`);
        } else {
          console.error(`❌ ${shop.name} の削除に失敗しました。`);
        }
      } else {
        console.log(`✅ セラピストが登録されているため、この店舗は維持します。`);
      }
      console.log("--------------------------------------------------");
    }

    console.log("\n🎉 重複店舗の整理が完了しました！ブラウザをリロードして確認してください。");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
