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
    website_url: "https://gyokurou.com/",
    schedule_url: "https://gyokurou.com/schedule/",
    price_system: "70分: 16,000円 (通常 18,000円)\n90分: 18,000円 (通常 20,000円)\n120分: 23,000円 (通常 25,000円)",
    casts: [
      { name: "永瀬みお", age: "23", size: "T.153 Gカップ", img: "https://gyokurou.com/wp-content/uploads/2025/05/ef7008cff9c0e79742da3ccdb6891073-e1747191392108.jpg" },
      { name: "姫宮らむ", age: "23", size: "T.158 Eカップ", img: "https://gyokurou.com/wp-content/uploads/2025/06/IMG_0281-e1750053479926.jpeg" },
      { name: "双葉みさと", age: "29", size: "T.163 Hカップ", img: "https://gyokurou.com/wp-content/uploads/2024/08/0caee94c3b4f867aea291425d8a876ce.jpg" },
      { name: "藤宮あいり", age: "27", size: "T.159 Fカップ", img: "https://gyokurou.com/wp-content/uploads/2024/08/12f22f7851748915924c6ee4fc4bf152-e1725090012309.jpg" },
      { name: "美風もなみ", age: "26", size: "T.154 Iカップ", img: "https://gyokurou.com/wp-content/uploads/2026/02/804fc78370eeaba1454a58f2dcfee2e6.jpg" },
      { name: "星月めい", age: "23", size: "T.164 Eカップ", img: "https://gyokurou.com/wp-content/uploads/2024/08/68e8bd80e18d16e276798978ec80411d-e1724167533193.jpg" },
      { name: "花垣えるさ", age: "26", size: "T.152 Hカップ", img: "https://gyokurou.com/wp-content/uploads/2024/09/15694b72e058918516220c16939d8e60-e1726640395204.jpg" },
      { name: "月野よる", age: "24", size: "T.152 Gカップ", img: "https://gyokurou.com/wp-content/uploads/2024/08/6aedbebea2e8590a4c408702d92f3ee9.jpg" },
      { name: "神谷こはく", age: "25", size: "T.160 Eカップ", img: "https://gyokurou.com/wp-content/uploads/2024/08/45c4b086545e197dc643f1d8fe61b529-e1724167700707.jpg" },
      { name: "山崎えりか", age: "29", size: "T.160 Fカップ", img: "https://gyokurou.com/wp-content/uploads/2025/01/e2c376a2a29ee164d0a70900a4879969-e1736521182790.jpg" },
      { name: "成瀬すみれ", age: "27", size: "T.158 Hカップ", img: "https://gyokurou.com/wp-content/uploads/2024/08/2caa7133d6658f64784478e9d632d455-e1724164668480.jpg" },
      { name: "大崎あすな", age: "20", size: "T.168 Cカップ", img: "https://gyokurou.com/wp-content/uploads/2024/08/d05e505f6c9f702da97ca0cc458a16ac-e1724166695526.jpg" },
      { name: "松原さつき", age: "26", size: "T.150 Hカップ", img: "https://gyokurou.com/wp-content/uploads/2026/01/ec61bacb89baa10975b79d64ffa1749d.jpg" },
      { name: "羽鳥ゆうこ", age: "28", size: "T.160 Fカップ", img: "https://gyokurou.com/wp-content/uploads/2024/08/a54719470317d4d462ec557126727c66-e1724165607244.jpg" },
      { name: "水嶋わかな", age: "21", size: "T.160 Eカップ", img: "https://gyokurou.com/wp-content/uploads/2025/05/IMG_2013.jpeg" },
      { name: "桃瀬みあり", age: "23", size: "T.165 Gカップ", img: "https://gyokurou.com/wp-content/uploads/2024/08/45431265c734acc601b2905d46b5691f.png" },
      { name: "星乃もも", age: "20", size: "T.150 Gカップ", img: "https://gyokurou.com/wp-content/uploads/2025/02/IMG_2465-scaled-e1740194045888.jpeg" },
      { name: "天海なな", age: "28", size: "T.160 Gカップ", img: "https://gyokurou.com/wp-content/uploads/2025/02/S__60301331_0-e1739016860903.jpg" },
      { name: "榎本いと", age: "27", size: "T.162 Bカップ", img: "https://gyokurou.com/wp-content/uploads/2025/11/abf2adbc059b4b12094400a2bc342d9f-e1762652783749.jpg" },
      { name: "辻本かの", age: "26", size: "T.155 Fカップ", img: "https://gyokurou.com/wp-content/uploads/2025/02/b1c1be6884a6e26fdaa33ae93f1769ad.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「玉楼」を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return n.includes('玉楼') || n.includes('gyokurou');
    });

    if (targetShops.length > 0) {
      for (const shop of targetShops) {
        console.log(`🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
        // 1. 店舗情報を更新
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
          console.log(`  ✅ URL・料金システム更新完了`);
        } else {
          console.error(`  ❌ 店舗情報の更新に失敗しました: ${patchRes.statusText}`);
          continue; 
        }

        // 2. キャストの更新
        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
        const dbCasts = await dbRes.json();
        
        let updateCount = 0;
        let insertCount = 0;

        const uniqueCasts = Array.from(new Map(shopData.casts.map(c => [c.name, c])).values());

        for (const cast of uniqueCasts) {
          let cleanName = cast.name.replace(/[\s　]+/g, '');
          // 今回はプロフィールに年齢やサイズを入れるため、raw_dataを利用します
          const rawData = { age: cast.age, size: cast.size };

          const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === cleanName);

          if (existing) {
            // 画像URLの更新だけでなく、raw_dataでプロフをねじ込む
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
        console.log(`  🎉 キャスト設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）\n`);
      }
      console.log(`🎊 「玉楼」の更新が完了しました！ブラウザをリロードして確認してください！`);
    } else {
      console.log("⚠️ 「玉楼」を含む店舗が見つかりませんでした。");
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
