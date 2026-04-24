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
    // --- 1. Aroma Rejina の削除 ---
    console.log(`🧹 「Aroma Rejina」関連の全店舗およびキャストの削除を開始します...`);
    
    const resShops = await fetch(`${url}/rest/v1/shops?select=id,name&name=ilike.*Aroma%20Rejina*`, { headers });
    const rejinaShops = await resShops.json();

    if (rejinaShops && rejinaShops.length > 0) {
      for (const shop of rejinaShops) {
        console.log(`   🗑️  削除中: ${shop.name} (ID: ${shop.id})`);
        
        await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, {
          method: 'DELETE',
          headers: headers
        });
        
        await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'DELETE',
          headers: headers
        });
      }
      console.log(`   ✅ Aroma Rejinaの削除が完了しました。`);
    } else {
      console.log(`   ⚠️  Aroma Rejinaに該当する店舗が見つかりませんでした。`);
    }

    // --- 2. AromaLys (アロマリース) の登録・更新 ---
    console.log(`\n🚀 「AromaLys」の登録・更新を開始します...`);

    const aromalysDef = {
      searchKeywords: ['aromalys', 'アロマリース'],
      website_url: "https://mens-esute.jp/",
      schedule_url: "https://mens-esute.jp/schedule/",
      price_system: "【基本コース】\n75分 15,000円(割引中 11,000円)\n90分 18,000円(割引中 14,000円)\n120分 22,000円(割引中 18,000円)\n150分 26,000円(割引中 22,000円)\n180分 30,000円(割引中 26,000円)\n\n【ご新規様限定】\n60分 13,000円",
      casts: [
        { name: "大原 まいみ", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/655/1.webp" },
        { name: "斉藤 つむぎ", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/654/1.webp" },
        { name: "佐久間 ゆき", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/653/1.webp" },
        { name: "木下 ゆうな", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/656/1.webp" },
        { name: "森脇 なのは", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/628/1.webp" },
        { name: "松村 さな", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/641/1.webp" },
        { name: "黒崎 るな", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/650/1.webp" },
        { name: "柊 らん", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/596/1.webp" },
        { name: "村井 ことみ", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/536/1.webp" },
        { name: "藤本 るり", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/522/1.webp" },
        { name: "千堂 はな", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/558/1.webp" },
        { name: "杉野 あおい", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/577/1.webp" },
        { name: "永瀬 みお", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/455/1.webp" },
        { name: "白石 みゆき", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/644/1.webp" },
        { name: "清水 りか", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/635/1.webp" },
        { name: "南 さくら", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/649/1.webp" },
        { name: "桐谷 まゆ", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/640/1.webp" },
        { name: "有栖川 めあ", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/645/1.webp" },
        { name: "美月 えりあ", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/646/1.webp" },
        { name: "本田 かれん", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/651/1.webp" },
        { name: "佐々木 まお", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/643/1.webp" },
        { name: "武田 なな", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/616/1.webp" },
        { name: "早乙女 もも", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/642/1.webp" },
        { name: "泉 みさ", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/588/1.webp" },
        { name: "工藤 ひめな", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/598/1.webp" },
        { name: "五十嵐 めい", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/575/1.webp" },
        { name: "黒木 のあ", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/496/1.webp" },
        { name: "九条 れいら", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/469/1.webp" },
        { name: "佐藤 かりな", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/495/1.webp" },
        { name: "川北 れみ", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/486/1.webp" },
        { name: "橋本 れいな", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/612/1.webp" },
        { name: "小西 まな", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/625/1.webp" },
        { name: "白藤 もえか", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/619/1.webp" },
        { name: "持田 めぐ", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/617/1.webp" },
        { name: "七瀬 さくら", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/613/1.webp" },
        { name: "星 ななみ", age: "-", size: "T.- / B.- / W.- / H.-", img: "https://mens-esute.jp/picture/629/1.webp" }
      ]
    };

    const resAlba = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allAlbaShops = await resAlba.json();

    const targetAlbaShops = allAlbaShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return aromalysDef.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
    });

    if (targetAlbaShops.length === 0) {
      console.log(`⚠️ AromaLysが見つかりませんでした。`);
      return;
    }

    for (const shop of targetAlbaShops) {
      console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);

      await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          website_url: aromalysDef.website_url,
          schedule_url: aromalysDef.schedule_url,
          price_system: aromalysDef.price_system
        })
      });
      console.log(`   ✅ 店舗基本情報の更新完了`);

      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name`, { headers });
      const dbCasts = await dbRes.json();
      
      let updateCount = 0;
      let insertCount = 0;

      const uniqueCasts = Array.from(new Map(aromalysDef.casts.map(c => [c.name, c])).values());

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
      console.log(`   🎉 キャスト36名設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    }

    console.log(`\n🎊 すべての処理が終了しました。ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
