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

  const shopData = {
    website_url: "https://cor-caroli.net/",
    schedule_url: "https://cor-caroli.net/schedule/",
    price_system: "70分: 16,000円 (通常 18,000円)\n90分: 18,000円 (通常 20,000円)\n120分: 23,000円 (通常 25,000円)",
    casts: [
      { name: "本郷ましろ", img: "https://cor-caroli.net/wp-content/uploads/2025/03/f80fd9ffe83ce3bbcbb316fdf7ba9c15.jpg" },
      { name: "三好えま", img: "https://cor-caroli.net/wp-content/uploads/2026/01/6c399f84adb294dbc333a1745baaa587-e1769264170831.jpg" },
      { name: "真野みこと", img: "https://cor-caroli.net/wp-content/uploads/2023/07/c40059194f158cfa4281f115757b70cc-e1688979776121.jpg" },
      { name: "如月るい", img: "https://cor-caroli.net/wp-content/uploads/2023/12/471624e6f5f0b01eb923bb64df168a8a-e1701434941763.jpg" },
      { name: "竹内まほ", img: "https://cor-caroli.net/wp-content/uploads/2025/10/f14a8387a3f69a9890bf7e326cd981e9.jpg" },
      { name: "藍乃みや", img: "https://cor-caroli.net/wp-content/uploads/2024/04/c67d07fd91a8a1bc9c353ccdb98b355d-2.jpg" },
      { name: "京野ゆずき", img: "https://cor-caroli.net/wp-content/uploads/2024/08/c67d07fd91a8a1bc9c353ccdb98b355d.jpg" },
      { name: "戸田ゆいか", img: "https://cor-caroli.net/wp-content/uploads/2026/04/IMG_9200.jpeg" },
      { name: "凪さくら", img: "https://cor-caroli.net/wp-content/uploads/2026/03/6c6abc826f7232b0b16455614e0214c3.jpg" },
      { name: "新城すずか", img: "https://cor-caroli.net/wp-content/uploads/2026/03/IMG_8137-e1774763431133.jpeg" },
      { name: "白鳥つかさ", img: "https://cor-caroli.net/wp-content/uploads/2026/03/IMG_8104-e1774171684473.jpeg" },
      { name: "月岡まひろ", img: "https://cor-caroli.net/wp-content/uploads/2026/03/IMG_8097-e1773670458457.jpeg" },
      { name: "白愛なゆ", img: "https://cor-caroli.net/wp-content/uploads/2026/03/b1194a4317ca3e52bea56085200f2bd9.jpg" },
      { name: "水川ゆら", img: "https://cor-caroli.net/wp-content/uploads/2026/03/74c34b8d910992f2020e57f9d89ec0ae.jpg" },
      { name: "花森おとは", img: "https://cor-caroli.net/wp-content/uploads/2025/03/5fed25e4eff8dd6ede1f8e4b74290a3a-e1742701334270.jpg" },
      { name: "真波ゆか", img: "https://cor-caroli.net/wp-content/uploads/2026/03/fb3cd94a5bb72a3b001fa5a355222c0f-e1774868238911.jpg" },
      { name: "水野ゆめ", img: "https://cor-caroli.net/wp-content/uploads/2024/02/c4a2985393507189be94efc6876122b7-e1708365578365.jpg" },
      { name: "霧島さゆき", img: "https://cor-caroli.net/wp-content/uploads/2025/09/64b231c402e2a5e943e67c787357b8a2.jpg" },
      { name: "美咲めいさ", img: "https://cor-caroli.net/wp-content/uploads/2025/08/IMG_6998.jpeg" },
      { name: "栗原もな", img: "https://cor-caroli.net/wp-content/uploads/2022/09/3c8dcb4999302c36306530b92ce9e5c8-e1663147735598.jpg" },
      { name: "桜木ひな", img: "https://cor-caroli.net/wp-content/uploads/2026/02/7434d7c8075fffe7576cc42161362638-e1771768647445.jpg" },
      { name: "村瀬あゆみ", img: "https://cor-caroli.net/wp-content/uploads/2026/01/c0e323fb01ca66459158d5019a3cae46.jpg" },
      { name: "夏目のん", img: "https://cor-caroli.net/wp-content/uploads/2025/06/019f2b74e40faf59344ab18ab42b3b36.jpg" },
      { name: "希波きこ", img: "https://cor-caroli.net/wp-content/uploads/2026/03/IMG_8136-e1774759568969.jpeg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「コル・カロリ」を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // 「コルカロリ」「コル・カロリ」「cor caroli」が含まれる店舗を抽出
    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return n.includes('コルカロリ') || n.includes('コル・カロリ') || n.includes('cor caroli') || n.includes('corcaroli');
    });

    if (targetShops.length > 0) {
      for (const shop of targetShops) {
        console.log(`🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
        // 1. ホームページURL、スケジュールURL、料金システムを更新（正しい website_url を使用）
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            website_url: shopData.website_url,
            schedule_url: shopData.schedule_url,
            price_system: shopData.price_system
          })
        });

        if (patchRes.ok) {
          console.log(`  ✅ ホームページ・スケジュールURL・料金システム更新完了`);
        } else {
          console.error(`  ❌ 店舗情報の更新に失敗しました: ${patchRes.statusText}`);
          continue; // エラーが起きたらキャスト更新をスキップ
        }

        // 2. キャストの更新
        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
        const dbCasts = await dbRes.json();
        
        let updateCount = 0;
        let insertCount = 0;

        // 重複を除去
        const uniqueCasts = Array.from(new Map(shopData.casts.map(c => [c.name, c])).values());

        for (const cast of uniqueCasts) {
          // 余計な空白やカッコを消す
          let cleanName = cast.name.replace(/[\s　]+/g, '').replace(/（.*）/g, '').replace(/\(.*\)/g, ''); 

          const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '').replace(/（.*）/g, '').replace(/\(.*\)/g, '') === cleanName);

          if (existing) {
            if (existing.image_url !== cast.img) {
              await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ image_url: cast.img })
              });
              updateCount++;
            }
          } else {
            const newId = `${shop.id}_${cleanName}`;
            await fetch(`${url}/rest/v1/therapists`, {
              method: 'POST',
              headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
              body: JSON.stringify({
                id: newId,
                shop_id: shop.id,
                name: cleanName,
                image_url: cast.img
              })
            });
            insertCount++;
          }
        }
        console.log(`  🎉 キャスト設定完了（新規: ${insertCount}名 / 画像更新: ${updateCount}名）\n`);
      }
      console.log(`🎊 「コル・カロリ」の更新が完了しました！ブラウザをリロードして確認してください！`);
    } else {
      console.log("⚠️ 「コル・カロリ」を含む店舗が見つかりませんでした。");
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
