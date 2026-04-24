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
    console.log("⏳ 3店舗のロゴ画像をフロントに設定します...\n");

    for (const update of logoUpdates) {
      let targetShopId = null;
      let foundName = "";

      // キーワードで店舗を検索
      for (const query of update.keywords) {
        const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(query)}*&select=id,name`, { headers });
        const json = await res.json();
        if (json && json.length > 0) {
          targetShopId = json[0].id;
          foundName = json[0].name;
          break;
        }
      }

      if (targetShopId) {
        // 画像URLを更新
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${targetShopId}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ image_url: update.image_url })
        });

        if (patchRes.ok) {
          console.log(`✅ ${foundName} のロゴ画像を設定しました！`);
        } else {
          console.error(`❌ ${foundName} の更新に失敗しました: ${patchRes.statusText}`);
        }
      } else {
        console.log(`⚠️ 「${update.keywords[0]}」が見つかりませんでした。`);
      }
    }

    console.log("\n🎉 すべてのロゴ画像の設定が完了しました！ブラウザをリロードして確認してください！");
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
