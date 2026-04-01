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

  // ロゴ設定のリスト
  const logoData = [
    { keywords: ["ONE ROOM", "ワンルーム"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/ONE%20ROOM.png" },
    { keywords: ["超レベルチャイナスパ", "chourebechinaspa24"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/chourebechinaspa24.png" },
    { keywords: ["REVE SPA", "レーヴスパ"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/REVE%20SPA%20.png" },
    { keywords: ["Belle Lily", "ベルリリー"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Belle%20Lily.png" },
    { keywords: ["Aroma Lunabelle", "ルナベル"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Aroma%20Lunabelle.png" },
    { keywords: ["SPA Real", "リアル"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/SPA%20Real.png" },
    { keywords: ["HaTaEsu", "ハタエス"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/HaTaEsu.png" },
    { keywords: ["A5 SPA", "エーゴスパ"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/A5%20SPA.png" },
    { keywords: ["TIAMO", "ティアモ", "ティアーモ"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/AROMA%20TIAMO.png" },
    { keywords: ["QUEEN'S COLLECTION", "クイーンズコレクション"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/QUEEN'S%20COLLECTION.png" },
    { keywords: ["Rise", "リゼ"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Rise.png" },
    { keywords: ["Ho・O・Zu・Ki", "ホオズキ"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/HoOZuKiSPA.png" },
    { keywords: ["Grand Gaia", "グランドガイア"], url: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Grand%20Gaia.png" }
  ];

  try {
    console.log("⏳ 13店舗のロゴ画像をデータベースに一括設定します...\n");

    for (const item of logoData) {
      let targetShops = [];
      
      // 検索キーワードで店舗を探す
      for (const query of item.keywords) {
        const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(query)}*&select=id,name`, { headers });
        const json = await res.json();
        if (json && json.length > 0) {
          targetShops = json;
          break; // 見つかったら次のキーワードは検索しない
        }
      }

      if (targetShops.length === 0) {
        console.log(`⚠️ 「${item.keywords[0]}」に該当する店舗が見つかりませんでした。スキップします。`);
        continue;
      }

      let successCount = 0;
      for (const shop of targetShops) {
        // 店舗テーブルの画像URLカラムを更新
        // ※カラム名が image_url であることを前提としています。もしロゴ用の別の名前(logo_urlなど)であれば変更が必要です。
        const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ image_url: item.url })
        });
        if (updateRes.ok) successCount++;
      }
      
      console.log(`✅ 「${targetShops[0].name}」など ${successCount}店舗にロゴ画像を設定しました！`);
    }

    console.log("\n🎉 すべてのロゴ設定処理が完了しました！ブラウザで確認してみてください！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
