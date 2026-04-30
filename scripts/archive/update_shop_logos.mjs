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

  // 更新する店舗ロゴのデータ
  const logosData = [
    {
      keywords: ["AromaCharm", "アロマチャーム"],
      image_url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/AromaCharm.png"
    },
    {
      keywords: ["Yuni Spa", "ユニスパ"],
      image_url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Yuni%20Spa.png"
    },
    {
      keywords: ["コルカロリ", "コル・カロリ", "cor caroli", "corcaroli"],
      image_url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/corcaroli.png"
    },
    {
      keywords: ["小悪魔", "koakuma"],
      image_url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/koakumaspa.png"
    },
    {
      keywords: ["東京メンズエステ", "tokyomensesthe", "東京メンズ"],
      image_url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/tokyomenseste.png"
    }
  ];

  try {
    console.log(`🔍 データベースから対象店舗を検索し、フロント画像を一括更新します...\n`);

    // 全店舗を取得
    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    for (const logo of logosData) {
      console.log(`========================================`);
      console.log(`🚀 「${logo.keywords[0]}」の画像を更新中...`);
      
      // キーワードに合致する店舗を抽出（大文字小文字を区別しない）
      const targetShops = allShops.filter(shop => {
        const shopName = shop.name.toLowerCase();
        return logo.keywords.some(keyword => shopName.includes(keyword.toLowerCase()));
      });

      if (targetShops.length > 0) {
        let updateCount = 0;
        for (const shop of targetShops) {
          console.log(` 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
          
          // 店舗の image_url を更新
          const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ 
              image_url: logo.image_url
            })
          });

          if (patchRes.ok) {
            console.log(`  ✅ フロント画像更新完了`);
            updateCount++;
          } else {
            console.error(`  ❌ 画像の更新に失敗しました: ${patchRes.statusText}`);
          }
        }
        console.log(` 🎉 計 ${updateCount} 店舗の画像を更新しました！`);
      } else {
        console.log(` ⚠️ 該当する店舗が見つかりませんでした。`);
      }
    }

    console.log("\n🎊 すべてのフロント画像の更新処理が完了しました！ブラウザをリロードして確認してください！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
