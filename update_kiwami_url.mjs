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
    console.log("⏳ 「KIWAMI TOKYO」のホームページURLを更新します...\n");

    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*KIWAMI TOKYO*&select=id,name`, { headers });
    const shops = await res.json();

    if (shops && shops.length > 0) {
      const shopId = shops[0].id;
      
      // urlカラムを更新
      const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shopId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ url: 'https://kiwami-tokyo.net/' })
      });

      if (updateRes.ok) {
        console.log(`✅ ${shops[0].name} のホームページリンクを更新しました！`);
        console.log("🔗 新しいURL: https://kiwami-tokyo.net/");
      } else {
        console.error(`❌ 更新に失敗しました: ${updateRes.statusText}`);
      }
    } else {
      console.log(`⚠️ 「KIWAMI TOKYO」が見つかりませんでした。`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
