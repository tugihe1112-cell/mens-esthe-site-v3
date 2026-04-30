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

  const targetKeyword = "Aroma Levante";
  const updateData = {
    schedule_url: "https://aroma-levante.com/schedule",
    image_url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Aroma%20Lunabelle.png"
  };

  try {
    console.log(`🔍 「${targetKeyword}」のデータを更新します...\n`);

    // 店舗を検索
    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(targetKeyword)}*&select=id,name`, { headers });
    const shops = await res.json();

    if (shops && shops.length > 0) {
      for (const shop of shops) {
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify(updateData)
        });

        if (patchRes.ok) {
          console.log(`✅ ${shop.name} のスケジュールとロゴを更新しました！`);
        } else {
          console.error(`❌ ${shop.name} の更新に失敗しました: ${patchRes.statusText}`);
        }
      }
      console.log("\n🎉 すべての更新が完了しました！ブラウザをリロードして確認してください！");
    } else {
      console.log(`⚠️ 「${targetKeyword}」に該当する店舗が見つかりませんでした。`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
