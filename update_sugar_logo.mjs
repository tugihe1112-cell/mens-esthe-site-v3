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

  const targetKeyword = "Sugar Spa";
  const targetImageUrl = "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Sugar%20Spa.png";

  try {
    console.log(`⏳ 「${targetKeyword}」のロゴ画像を登録します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(targetKeyword)}*&select=id,name`, { headers });
    const shops = await res.json();

    if (shops && shops.length > 0) {
      const shopId = shops[0].id;
      const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shopId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ image_url: targetImageUrl })
      });

      if (updateRes.ok) {
        console.log(`✅ ${shops[0].name} のロゴ画像を設定しました！`);
        console.log("🎉 ブラウザをリロードして確認してみてください！");
      } else {
        console.error(`❌ 更新に失敗しました: ${updateRes.statusText}`);
      }
    } else {
      console.log(`⚠️ 「${targetKeyword}」が見つかりませんでした。`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
