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

  const shopDef = {
    searchKeywords: ['the esthe', 'ザエステ', 'エステアザブ', 'the esthe azabu'],
    website_url: "https://the-esthe.tokyo/",
    schedule_url: "https://the-esthe.tokyo/schedule/",
    price_system: "100分 27,000円\n130分 33,000円\n160分 39,000円",
    casts: [
      { name: "綾瀬りお", age: "28", size: "T.163 / B.89(D) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/sd_344_9_616025.png" },
      { name: "雪城みゆ", age: "25", size: "T.154 / B.94(H) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/sd_344_9_616025.png" },
      { name: "黒崎すずか", age: "31", size: "T.155 / B.88(G) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/104759_1_20240729074710.jpg" },
      { name: "八木レイ", age: "27", size: "T.170 / B.88(F) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/104626_1_20241017114135.jpg" },
      { name: "如月ふみか", age: "27", size: "T.155 / B.87(E) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/104604_1_20240516114819.jpg" },
      { name: "真城ゆうり", age: "26", size: "T.156 / B.96(I) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/100026_1_20230504110338.jpg" },
      { name: "南かれん", age: "31", size: "T.160 / B.90(F) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/101425_1_20211201011903.jpg" },
      { name: "鈴川りな", age: "25", size: "T.155 / B.85(D) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/101845_1_20220302151153.jpg" },
      { name: "日高なぎさ", age: "23", size: "T.160 / B.83(D) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/101347_1_20211111155637.jpg" },
      { name: "桐谷ありな", age: "22", size: "T.160 / B.85(D) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/sd_344_9_616025.png" },
      { name: "天乃かのん", age: "27", size: "T.154 / B.86(F) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/101996_1_20220420144633.jpg" },
      { name: "佐伯みほ", age: "22", size: "T.156 / B.88(F) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/102220_1_20220530073217.jpg" },
      { name: "城川あまね", age: "25", size: "T.162 / B.87(D) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/102057_1_20220419081412.jpg" },
      { name: "相武さとみ", age: "26", size: "T.156 / B.88(E) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/101184_1_20210927182316.jpg" },
      { name: "葵なな", age: "26", size: "T.158 / B.85(E) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/102525_1_20220830091058.jpg" },
      { name: "間宮ゆきな", age: "23", size: "T.157 / B.82(D) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/100471_1_20201213081906.jpg" },
      { name: "葉山ゆうか", age: "28", size: "T.165 / B.88(E) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/102276_1_20220614090206.jpg" },
      { name: "上條かりん", age: "22", size: "T.165 / B.85(D) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/102017_1_20220408211041.jpg" },
      { name: "加藤めい", age: "26", size: "T.158 / B.81(C) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/100814_1_20210927163846.jpg" },
      { name: "石原ゆりあ", age: "27", size: "T.160 / B.87(D) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/100356_1_20210920225242.jpg" },
      { name: "天使らい", age: "19", size: "T.154 / B.87(E) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/102517_1_20220830125051.jpg" },
      { name: "美咲まゆ", age: "29", size: "T.157 / B.87(E) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/101797_1_20220218161330.jpg" },
      { name: "一ノ瀬みつき", age: "28", size: "T.157 / B.87(F) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/104303_1_20240124110955.jpg" },
      { name: "藤崎レイラ", age: "25", size: "T.160 / B.88(F) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/101604_1_20220202164010.jpg" },
      { name: "相原ゆみか", age: "27", size: "T.150 / B.88(F) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/102149_1_20220514161705.jpg" },
      { name: "及川ゆうか", age: "25", size: "T.158 / B.85(E) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/101609_1_20211227190001.jpg" },
      { name: "吉野ゆきな", age: "23", size: "T.156 / B.82(D) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/101907_1_20220315203526.jpg" },
      { name: "篠原ゆずき", age: "26", size: "T.156 / B.84(D) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/102380_1_20220710094916.jpg" },
      { name: "倉持れいな", age: "24", size: "T.166 / B.88(F) / W.- / H.-", img: "https://the-esthe.tokyo/photo/staff/7/102741_1_20221019085130.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「THE ESTHE AZABU」を検索し、完全な情報とキャスト更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return shopDef.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
    });

    if (targetShops.length === 0) {
      console.log(`⚠️ 店舗が見つかりませんでした。スキップします。`);
      return;
    }

    for (const shop of targetShops) {
      console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);

      // 1. 店舗情報の更新
      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          website_url: shopDef.website_url,
          schedule_url: shopDef.schedule_url,
          price_system: shopDef.price_system
        })
      });

      if (patchRes.ok) {
        console.log(`   ✅ 店舗基本情報（HP、スケジュール、システム）の更新完了`);
      } else {
        console.error(`   ❌ 店舗基本情報の更新失敗: ${patchRes.statusText}`);
      }

      // 2. キャストの登録・更新
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name`, { headers });
      const dbCasts = await dbRes.json();
      
      let updateCount = 0;
      let insertCount = 0;

      const uniqueCasts = Array.from(new Map(shopDef.casts.map(c => [c.name, c])).values());

      for (const cast of uniqueCasts) {
        let cleanName = cast.name.replace(/[\s　]+/g, ''); 
        const rawData = { age: cast.age, size: cast.size };

        const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === cleanName);

        if (existing) {
          await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ 
              image_url: cast.img,
              raw_data: rawData
            })
          });
          updateCount++;
        } else {
          const newId = `${shop.id}_${cleanName}`;
          await fetch(`${url}/rest/v1/therapists`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({
              id: newId,
              shop_id: shop.id,
              name: cleanName,
              image_url: cast.img,
              raw_data: rawData
            })
          });
          insertCount++;
        }
      }
      console.log(`   🎉 キャスト${uniqueCasts.length}名設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    }
    
    console.log(`\n🎊 すべての更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
