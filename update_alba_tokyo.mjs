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
    // --- 1. The Salon の削除 ---
    console.log(`🧹 「The Salon」関連の全店舗およびキャストの削除を開始します...`);
    
    const resShops = await fetch(`${url}/rest/v1/shops?select=id,name&name=ilike.*The%20Salon*`, { headers });
    const theSalonShops = await resShops.json();

    if (theSalonShops && theSalonShops.length > 0) {
      for (const shop of theSalonShops) {
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
      console.log(`   ✅ The Salonの削除が完了しました。`);
    } else {
      console.log(`   ⚠️  The Salonに該当する店舗が見つかりませんでした。`);
    }

    // --- 2. アルバTOKYO の登録・更新 ---
    console.log(`\n🚀 「アルバTOKYO」の登録・更新を開始します...`);

    const albaDef = {
      searchKeywords: ['alba tokyo', 'アルバtokyo', 'アルバ'],
      website_url: "https://ginza.alba-e.com/",
      schedule_url: "https://ginza.alba-e.com/schedule/",
      price_system: "90分 16,000円\n120分 20,000円\n150分 24,000円\n180分 28,000円",
      casts: [
        { name: "れいな", age: "43", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2022/10/300bcee4cdde5a7635aa339574db4f1b.jpg" },
        { name: "いずみ", age: "39", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2023/06/1752051231007-520x520.jpg" },
        { name: "ゆめ", age: "39", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2024/10/1773205617531-520x520.jpg" },
        { name: "ゆい", age: "38", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/01/20251003_013720-520x520.jpg" },
        { name: "さら", age: "39", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/08/1756467698720-e1775361424374-520x520.jpg" },
        { name: "真矢", age: "-", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2022/12/1739865322873-520x520.jpg" },
        { name: "あみ", age: "40", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2023/02/20250317_224212-520x520.jpg" },
        { name: "みさき", age: "39", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/09/1757586803244-520x520.jpg" },
        { name: "京香", age: "-", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/11/1764504432171-520x520.jpg" },
        { name: "りんか", age: "41", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/10/1760260534000-520x520.jpg" },
        { name: "ありさ", age: "35", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2024/07/1722059347367-520x520.jpg" },
        { name: "しずか", age: "38", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2023/07/k0dtod.jpg" },
        { name: "すみれ", age: "39", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/08/1754034305331-520x520.jpg" },
        { name: "なお", age: "38", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/09/1775198404406-520x520.jpg" },
        { name: "さゆり", age: "40", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/01/Screenshot_2025-01-19-16-42-40-46_40deb401b9ffe8e1df2f1cc5ba480b122-483x520.jpg" },
        { name: "れん", age: "34", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2024/05/1775359767217-520x520.jpg" },
        { name: "あおい", age: "37", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2024/11/1739893943094-1-520x520.jpg" },
        { name: "けいこ", age: "41", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2023/06/MYXJ_20240708104058682_save.jpg" },
        { name: "愛桜", age: "25", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/05/hyi597-520x520.jpg" },
        { name: "さくら", age: "33", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2026/03/1773378275632-520x520.jpg" },
        { name: "あづさ", age: "35", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/02/1739235171443-520x520.jpg" },
        { name: "りお", age: "35", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/12/1767352888936-520x520.jpg" },
        { name: "なな", age: "39", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/03/1772150446582-520x520.jpg" },
        { name: "華", age: "38", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/08/1761276104561-520x520.jpg" },
        { name: "かほ", age: "41", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2025/07/1773362927842-520x520.jpg" },
        { name: "まい", age: "35", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2023/04/75a7f45e282fe7f4faf4ee3ab0f12e55.jpg" },
        { name: "あやか", age: "36", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2024/08/1737285061218-scaled-e1774879991679-520x520.jpg" },
        { name: "なつこ", age: "-", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2024/02/q01zv0-520x520.jpg" },
        { name: "寧々", age: "40", size: "T.- / B.-", img: "https://ginza.alba-e.com/wp-content/uploads/2023/09/1761182134748-520x520.jpg" }
      ]
    };

    const resAlba = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allAlbaShops = await resAlba.json();

    const targetAlbaShops = allAlbaShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return albaDef.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
    });

    if (targetAlbaShops.length === 0) {
      console.log(`⚠️ アルバTOKYOが見つかりませんでした。`);
      return;
    }

    for (const shop of targetAlbaShops) {
      console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);

      await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          website_url: albaDef.website_url,
          schedule_url: albaDef.schedule_url,
          price_system: albaDef.price_system
        })
      });
      console.log(`   ✅ 店舗基本情報の更新完了`);

      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name`, { headers });
      const dbCasts = await dbRes.json();
      
      let updateCount = 0;
      let insertCount = 0;

      const uniqueCasts = Array.from(new Map(albaDef.casts.map(c => [c.name, c])).values());

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
      console.log(`   🎉 キャスト29名設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    }

    console.log(`\n🎊 すべての処理が終了しました。ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
