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

  const logoUpdates = [
    {
      keywords: ["NATURAL", "ナチュラル"],
      image_url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/NATURAL.png"
    },
    {
      keywords: ["Spa Ytree", "Ytree"],
      image_url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Spa%20Ytree.png"
    },
    {
      keywords: ["UraSanEsu", "ウラサンエス"],
      image_url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/UraSanEsu.png"
    }
  ];

  try {
    console.log("🔍 「全系列店」にロゴ画像をガツンと設定し直します...\n");

    for (const update of logoUpdates) {
      let isUpdated = false;

      for (const query of update.keywords) {
        // 条件に合う店舗を【すべて】取得する
        const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(query)}*&select=id,name`, { headers });
        const shops = await res.json();

        if (shops && shops.length > 0) {
          // 見つかった全店舗に対してアップデートをかける！
          for (const shop of shops) {
            const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
              method: 'PATCH',
              headers: headers,
              body: JSON.stringify({ image_url: update.image_url })
            });

            if (patchRes.ok) {
              console.log(`✅ ${shop.name} のロゴ画像を設定しました！`);
            }
          }
          isUpdated = true;
          break; // 次の店舗グループへ
        }
      }
      
      if (!isUpdated) {
        console.log(`⚠️ 「${update.keywords[0]}」に該当する店舗が見つかりませんでした。`);
      }
    }

    console.log("\n🎉 今度こそ系列店すべてへのロゴ設定が完了しました！ブラウザをリロードしてください！");
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
