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
    console.log("🔍 店舗「エレン」のデータとキャスト写真をチェックします...\n");
    
    // 1. 店舗を検索
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*エレン*&select=id,name`, { headers });
    const shops = await shopRes.json();

    if (shops && shops.length > 0) {
      const shop = shops[0];
      console.log(`🏠 店舗が見つかりました: ${shop.name} (ID: ${shop.id})\n`);

      // 2. キャストを検索
      const castRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
      const casts = await castRes.json();

      if (casts && casts.length > 0) {
        console.log(`👯‍♀️ 登録されているキャスト（全${casts.length}名）の写真URLをチェックします:\n`);
        // 最初の5人くらいを表示
        casts.slice(0, 10).forEach(cast => {
          console.log(`📛 名前: ${cast.name}`);
          console.log(`📸 画像: ${cast.image_url ? cast.image_url : '❌ 未設定'}`);
          console.log("------------------------");
        });
        if (casts.length > 10) console.log(`...他 ${casts.length - 10} 名`);
      } else {
        console.log("⚠️ この店舗にはキャストが一人も登録されていません！");
      }
    } else {
      console.log("⚠️ 「エレン」という名前の店舗がデータベースに見つかりませんでした。");
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
