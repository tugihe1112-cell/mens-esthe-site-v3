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

  const shopsData = [
    {
      searchKeywords: ['be-majo', 'ビマージョ', 'bemajo'],
      website_url: "https://esthe-bemajo.net/",
      schedule_url: "https://esthe-bemajo.net/schedule.php",
      price_system: "90分 13,000円\n120分 16,000円\n150分 20,000円\n180分 25,000円",
      casts: [
        { name: "ましろ", age: "42", size: "T.154 / Fカップ", img: "https://esthe-bemajo.net/images_staff/337/022617360751.jpg" },
        { name: "ひびき", age: "39", size: "T.159 / Fカップ", img: "https://esthe-bemajo.net/images_staff/342/033010195136.jpg" },
        { name: "ちさと", age: "39", size: "T.158 / Hカップ", img: "https://esthe-bemajo.net/images_staff/341/030818004417.jpg" },
        { name: "みづき", age: "46", size: "T.157 / Dカップ", img: "https://esthe-bemajo.net/images_staff/332/110616415259.jpg" },
        { name: "りさこ", age: "45", size: "T.157 / Cカップ", img: "https://esthe-bemajo.net/images_staff/333/111915111670.jpg" },
        { name: "あい", age: "39", size: "T.156 / Dカップ", img: "https://esthe-bemajo.net/images_staff/340/020317392495.jpg" },
        { name: "しほ", age: "35", size: "T.156 / Gカップ", img: "https://esthe-bemajo.net/images_staff/137/011515312011.JPG" },
        { name: "うた", age: "43", size: "T.160 / Cカップ", img: "https://esthe-bemajo.net/images_staff/150/021202171184.jpg" },
        { name: "あおの", age: "38", size: "T.154 / Dカップ", img: "https://esthe-bemajo.net/images_staff/331/110521045675.jpg" },
        { name: "まな", age: "40", size: "T.153 / Cカップ", img: "https://esthe-bemajo.net/images_staff/307/102414204018.jpg" },
        { name: "みつ", age: "44", size: "T.163 / Dカップ", img: "https://esthe-bemajo.net/images_staff/198/021514234767.jpg" },
        { name: "みお", age: "37", size: "T.157 / Dカップ", img: "https://esthe-bemajo.net/images_staff/181/041314533941.jpg" },
        { name: "ひなた", age: "38", size: "T.163 / Dカップ", img: "https://esthe-bemajo.net/images_staff/135/121909430375.jpg" },
        { name: "せりな", age: "35", size: "T.167 / Eカップ", img: "https://esthe-bemajo.net/images_staff/320/030310581483.jpg" },
        { name: "かなで", age: "33", size: "T.166 / Eカップ", img: "https://esthe-bemajo.net/images_staff/265/031715162695.jpg" },
        { name: "ともみ", age: "42", size: "T.158 / Gカップ", img: "https://esthe-bemajo.net/images_staff/278/061200572350.jpg" },
        { name: "ちか", age: "41", size: "T.168 / Bカップ", img: "https://esthe-bemajo.net/images_staff/117/020911573240.jpg" },
        { name: "しおり", age: "43", size: "T.160 / Eカップ", img: "https://esthe-bemajo.net/images_staff/311/062115182084.jpg" },
        { name: "なな", age: "40", size: "T.160 / Eカップ", img: "https://esthe-bemajo.net/images_staff/128/021112595652.jpg" },
        { name: "りょうこ", age: "40", size: "T.156 / Cカップ", img: "https://esthe-bemajo.net/images_staff/83/040616104692.jpg" },
        { name: "ふじこ", age: "33", size: "T.160 / Fカップ", img: "https://esthe-bemajo.net/images_staff/324/042616511914.jpg" },
        { name: "じゅん", age: "46", size: "T.154 / Gカップ", img: "https://esthe-bemajo.net/images_staff/318/050918095519.jpg" },
        { name: "さやか", age: "34", size: "T.168 / Gカップ", img: "https://esthe-bemajo.net/images_staff/312/071310162764.jpg" },
        { name: "ゆか", age: "44", size: "T.160 / Eカップ", img: "https://esthe-bemajo.net/images_staff/303/04161810562.jpg" },
        { name: "ゆみ", age: "41", size: "T.152 / Kカップ", img: "https://esthe-bemajo.net/images_staff/121/012700230556.jpg" },
        { name: "みさき", age: "41", size: "T.157 / Dカップ", img: "https://esthe-bemajo.net/images_staff/304/042610331748.jpg" },
        { name: "ますみ", age: "45", size: "T.157 / Fカップ", img: "https://esthe-bemajo.net/images_staff/258/033017305975.jpg" },
        { name: "ももか", age: "40", size: "T.145 / Cカップ", img: "https://esthe-bemajo.net/images_staff/119/013004262729.jpg" },
        { name: "あき", age: "37", size: "T.158 / Fカップ", img: "https://esthe-bemajo.net/images_staff/290/083015490848.jpg" },
        { name: "いと", age: "45", size: "T.151 / Dカップ", img: "https://esthe-bemajo.net/images_staff/207/041920154153.jpg" },
        { name: "ななこ", age: "38", size: "T.154 / Eカップ", img: "https://esthe-bemajo.net/images_staff/201/021316505264.jpg" },
        { name: "えれな", age: "42", size: "T.160 / Gカップ", img: "https://esthe-bemajo.net/images_staff/252/011220304710.jpg" },
        { name: "みなみ", age: "43", size: "T.150 / Eカップ", img: "https://esthe-bemajo.net/images_staff/253/111813034653.jpg" },
        { name: "よしの", age: "39", size: "T.160 / Hカップ", img: "https://esthe-bemajo.net/images_staff/251/120417020093.JPG" },
        { name: "あやね", age: "36", size: "T.160 / Dカップ", img: "https://esthe-bemajo.net/images_staff/172/05291758199.jpg" }
      ]
    },
    {
      // THE★GIN 市ヶ谷店 
      searchKeywords: ['za-gin', 'ザギン', 'the gin'],
      website_url: "https://za-gin.com/",
      schedule_url: "https://za-gin.com/weekly/",
      price_system: "90分 19,000円\n120分 25,000円\n150分 31,000円\n180分 37,000円",
      casts: [
        { name: "友田もな", age: "31", size: "T.155", img: "https://za-gin.com/wp-content/uploads/友田もな1-e1774327153614-600x600.jpg" },
        { name: "佐倉ひとえ", age: "25", size: "T.168", img: "https://za-gin.com/wp-content/uploads/佐倉ひとえ1-600x600.jpg" },
        { name: "赤尾みのん", age: "30", size: "T.158", img: "https://za-gin.com/wp-content/uploads/赤尾みのん1-600x600.jpg" },
        { name: "有栖のあ", age: "29", size: "T.164", img: "https://za-gin.com/wp-content/uploads/有栖のあ①-600x600.jpg" },
        { name: "麻宮りかこ", age: "29", size: "T.170", img: "https://za-gin.com/wp-content/uploads/麻宮りかこ1-600x600.jpg" },
        { name: "渋沢ゆりこ", age: "25", size: "T.167", img: "https://za-gin.com/wp-content/uploads/渋沢ゆりこ1-600x600.jpg" },
        { name: "翡翠よもぎ", age: "28", size: "T.160", img: "https://za-gin.com/wp-content/uploads/翡翠よもぎ1-600x600.jpg" },
        { name: "仙崎るな", age: "23", size: "T.168", img: "https://za-gin.com/wp-content/uploads/仙崎るな1-600x600.jpg" },
        { name: "立花こころ", age: "25", size: "T.157", img: "https://za-gin.com/wp-content/uploads/立花こころ1-600x600.jpg" },
        { name: "白鳥りおな", age: "31", size: "T.162", img: "https://za-gin.com/wp-content/uploads/白鳥りおな①-600x600.jpg" },
        { name: "二ノ宮かおり", age: "30", size: "T.162", img: "https://za-gin.com/wp-content/uploads/二ノ宮かおり1-600x600.jpg" },
        { name: "石川まりあ", age: "30", size: "T.160", img: "https://za-gin.com/wp-content/uploads/石川まりあ①-1-600x600.jpg" },
        { name: "谷原みやび", age: "27", size: "T.152", img: "https://za-gin.com/wp-content/uploads/谷原みやび1-e1771214078847-600x600.jpg" },
        { name: "萩原じゅり", age: "28", size: "T.150", img: "https://za-gin.com/wp-content/uploads/萩原じゅり①-600x600.jpg" },
        { name: "福原みらい", age: "24", size: "T.165", img: "https://za-gin.com/wp-content/uploads/福原みらい①-600x600.jpg" },
        { name: "高田しほ", age: "30", size: "T.155", img: "https://za-gin.com/wp-content/uploads/高田しほ12-600x600.jpg" },
        { name: "加瀬きよ", age: "29", size: "T.165", img: "https://za-gin.com/wp-content/uploads/加瀬きよ_1-600x600.jpg" },
        { name: "凪良ゆきの", age: "29", size: "T.160", img: "https://za-gin.com/wp-content/uploads/凪良ゆきの①-600x600.jpg" },
        { name: "武井まゆり", age: "26", size: "T.162", img: "https://za-gin.com/wp-content/uploads/武井まゆり1-600x600.jpg" },
        { name: "東雲ふうか", age: "24", size: "T.156", img: "https://za-gin.com/wp-content/uploads/東雲ふうか①-600x600.jpg" },
        { name: "富田かおる", age: "26", size: "T.155", img: "https://za-gin.com/wp-content/uploads/富田かおる①-600x600.jpg" },
        { name: "雪村まりか", age: "28", size: "T.166", img: "https://za-gin.com/wp-content/uploads/雪村まりか①-600x600.jpg" },
        { name: "羽鳥さえ", age: "25", size: "T.151", img: "https://za-gin.com/wp-content/uploads/羽鳥さえ１-600x600.jpg" },
        { name: "小柳さき", age: "28", size: "T.156", img: "https://za-gin.com/wp-content/uploads/小柳さき①-600x600.jpg" },
        { name: "広瀬まゆ", age: "25", size: "T.155", img: "https://za-gin.com/wp-content/uploads/広瀬まゆ1-600x600.jpg" },
        { name: "水瀬まひる", age: "26", size: "T.162", img: "https://za-gin.com/wp-content/uploads/水瀬まひる①-600x600.jpg" },
        { name: "酒井りお", age: "24", size: "T.156", img: "https://za-gin.com/wp-content/uploads/酒井りお1-600x600.jpg" },
        { name: "菊川もえか", age: "32", size: "T.153", img: "https://za-gin.com/wp-content/uploads/菊川もえか1-600x600.jpg" }
      ]
    }
  ];

  try {
    console.log(`🔍 データベースから対象の2店舗を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    for (const shopDef of shopsData) {
      console.log(`\n===========================================`);
      console.log(`▶ 処理開始: 【 ${shopDef.searchKeywords[0]} 】関連`);
      
      const targetShops = allShops.filter(shop => {
        const n = shop.name.toLowerCase();
        return shopDef.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
      });

      if (targetShops.length === 0) {
        console.log(`⚠️ 店舗が見つかりませんでした。スキップします。`);
        continue;
      }

      for (const shop of targetShops) {
        console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
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
          console.log(`   ✅ 店舗基本情報の更新完了`);
        } else {
          console.error(`   ❌ 店舗基本情報の更新失敗: ${patchRes.statusText}`);
        }

        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
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
        console.log(`   🎉 キャスト設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
      }
    }
    
    console.log(`\n🎊 すべての店舗の更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
