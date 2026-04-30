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

  const targetImageUrl = "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Chocolate.png";

  try {
    console.log("🔍 データベースから「Chocolate」または「チョコレート」を探しています...\n");

    // "cho" や "チョコ" を含む店舗を幅広く検索
    const res = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*cho*,name.ilike.*チョコ*)&select=id,name`, { headers });
    const shops = await res.json();

    if (shops && shops.length > 0) {
      console.log(`✅ 以下の店舗がヒットしました:`);
      
      // ヒットした店舗すべてに対して画像URLを更新（もし複数あっても、今回対象のものに当たるはずです）
      for (const shop of shops) {
        console.log(`🏠 店舗名: ${shop.name} (ID: ${shop.id})`);
        
        const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ image_url: targetImageUrl })
        });

        if (updateRes.ok) {
          console.log(` ➡️ ロゴ画像を設定しました！`);
        } else {
          console.error(` ❌ 更新に失敗しました: ${updateRes.statusText}`);
        }
      }
      
      console.log("\n🎉 Chocolateのロゴ画像設定が完了しました！ブラウザをリロードして確認してください！");
    } else {
      console.log("⚠️ データベースに「Chocolate」に該当する店舗が見つかりませんでした。店舗IDを手動で確認する必要があるかもしれません。");
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
