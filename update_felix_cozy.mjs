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
      searchKeywords: ['felix', 'フェリックス'],
      website_url: "https://felix-tokyo.com",
      schedule_url: "https://felix-tokyo.com/schedule",
      price_system: "70分【イエスOP不可】※極液無し: 15,000円→ 13,000円\n80分【イエスOP不可】: 16,000円→ 14,000円\n90分【イエスOP不可】: 18,000円→ 16,000円\n100分: 20,000円→ 18,000円\n120分「ユダ・イエスのみ選択可」: 24,000円→ 22,000円\n140分【イエスOPのみ選択可】: 28,000円→ 26,000円",
      casts: [
        { name: "千歳えま", age: "21", size: "T.160 / B.-(J) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775441524_1902194.jpeg" },
        { name: "七海える", age: "20", size: "T.160 / B.-(D) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753090274_5551546.png" },
        { name: "夏色あまね", age: "20", size: "T.164 / B.-(D) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753090038_6812685.png" },
        { name: "桜野すい", age: "20", size: "T.156 / B.-(E) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770103130_0678705.jpeg" },
        { name: "朝倉みなみ", age: "24", size: "T.156 / B.-(E) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771443570_8394774.jpeg" },
        { name: "橘花あん", age: "20", size: "T.164 / B.-(G) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1753093106_9794263.png" },
        { name: "咲夜りん", age: "24", size: "T.153 / B.-(H) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1768407296_6195075.jpeg" },
        { name: "姫野まどか", age: "23", size: "T.159 / B.-(G) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1765194183_3023022.jpeg" },
        { name: "花宮ユリ", age: "26", size: "T.156 / B.-(H) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767022399_4726110.jpeg" },
        { name: "桐谷ゆめ", age: "26", size: "T.154 / B.-(E) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1764438463_5578429.jpeg" },
        { name: "桜宮もも", age: "25", size: "T.150 / B.-(G) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1765970408_4140092.jpeg" },
        { name: "星街める", age: "20", size: "T.160 / B.-(E) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1772000774_1525955.jpeg" },
        { name: "神坂なごみ", age: "22", size: "T.168 / B.-(K) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771397196_1485910.jpeg" },
        { name: "鈴川さな", age: "20", size: "T.158 / B.-(H) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775441166_2762721.jpeg" },
        { name: "工藤さとみ", age: "29", size: "T.153 / B.-(G) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770104243_6116196.jpeg" },
        { name: "朝香ゆうり", age: "21", size: "T.158 / B.-(D) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1764335484_5063850.jpeg" },
        { name: "長澤あみ", age: "20", size: "T.163 / B.-(I) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1765209317_3405686.jpeg" },
        { name: "神巫ひより", age: "26", size: "T.155 / B.-(E) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1762447175_5573766.png" },
        { name: "天野りなみ", age: "25", size: "T.164 / B.-(G) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770113308_4624121.jpeg" },
        { name: "夕月りく", age: "20", size: "T.158 / B.-(G) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1774444684_4988370.jpeg" },
        { name: "神楽まひろ", age: "22", size: "T.155 / B.-(G) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1775056813_7315956.jpeg" },
        { name: "晴雲ふわり", age: "20", size: "T.160 / B.-(F) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/comingsoon.png?v=5" },
        { name: "華鳥あむ", age: "26", size: "T.155 / B.-(G) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/comingsoon.png?v=5" },
        { name: "桜井ゆいな", age: "23", size: "T.155 / B.-(H) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1759042654_5806607.jpeg" },
        { name: "瀬戸もの", age: "24", size: "T.156 / B.-(I) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773728379_0408720.jpeg" },
        { name: "水瀬のあ", age: "22", size: "T.160 / B.-(E) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1762447701_4763790.png" },
        { name: "恋華みう", age: "21", size: "T.160 / B.-(D) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1764904154_8089230.jpeg" },
        { name: "白兎みみ", age: "24", size: "T.152 / B.-(E) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771909885_8205043.jpeg" },
        { name: "成宮めい", age: "24", size: "T.160 / B.-(E) / W.- / H.-", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771402433_8578085.jpeg" }
      ]
    },
    {
      searchKeywords: ['cozy', 'コーズィー', 'コージー'],
      website_url: "https://cozy-esthetic.com/",
      schedule_url: "https://cozy-esthetic.com/schedule",
      price_system: "60分: 14,000円 ➡ 割引 12,000円\n90分: 18,000円 ➡ 割引 15,000円\n120分: 22,000円 ➡ 割引 19,000円\n150分: 27,000円 ➡ 割引 24,000円",
      casts: [
        { name: "宮近", age: "28", size: "T.155 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/eUcNWglTBEh8bU7xvlukWSAFBjU87mJZ3GBpWFOG.jpg" },
        { name: "水原", age: "29", size: "T.160 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/mdmcl1zb6IswkWjnghQRyodAWL7kOAKkHx9A4aFf.jpg" },
        { name: "黒崎", age: "32", size: "T.158 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/TKQyawujoQBtnRcPjpKox6ji4aut5mgIJ1dAX63L.jpg" },
        { name: "愛内", age: "25", size: "T.154 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/9LqeHpY5jaTHLLTZbaEm8wqeTD9rDR0CKmSMV33L.jpg" },
        { name: "沙京", age: "31", size: "T.- / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/oW7JYCGg4R0wPw3wt0OcDWDuGKW9ZlXjO0n3vAoK.jpg" },
        { name: "藍染", age: "22", size: "T.159 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/45PE4z51NmFppM9CsFiQoAkUdwnSqhFmc6hPQXFY.jpg" },
        { name: "雪森", age: "25", size: "T.155 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/mRsDgBVA2YpEx9YewyozXhBXWNsui7so1VmzXkle.jpg" },
        { name: "大城", age: "22", size: "T.163 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/wpIDuanY9muCcgO8gCO2yJPhU2ddlOV2dyRuVi19.jpg" },
        { name: "斎森", age: "25", size: "T.165 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/gL4ULlpO3gF8RWe7nvv0kE6oyr2zWN7nYzaDkHYW.jpg" },
        { name: "ひな野", age: "25", size: "T.152 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/aarIULw54Fbr5PNUJvOFulB0Yng2mYZReWUMff1c.jpg" },
        { name: "片平", age: "25", size: "T.155 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/tbTQhIAfAkgR8zQ41dxQ1d84npMnVV6kpFmNL0lf.jpg" },
        { name: "白山", age: "20", size: "T.166 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/qKTwQ99fpfJjve3f9tRYGhOVanQmpTv0nrBpI6St.jpg" },
        { name: "桃谷", age: "32", size: "T.154 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/RZdreObstQhoYD43ZFGvEIpyPuqx3xFm0ln9pXeF.jpg" },
        { name: "七峰", age: "28", size: "T.157 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/Jqv6nkIqC3Hnx6MusknZIyhKtVBw9qEyDWVjP96t.jpg" },
        { name: "内村", age: "23", size: "T.152 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/07rNQQDxuW4p4v4qmGFaYFmAicWnlyOgyZpFiJwB.jpg" },
        { name: "秋野", age: "21", size: "T.152 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/1dtjiMCD1lnvDxWT473qKCJfuwbXjYne7fguKlqR.jpg" },
        { name: "七川", age: "24", size: "T.153 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/7BXYhaf4LDuskeDDnB9IotbzkroxkjNdmEmRUe8M.jpg" },
        { name: "咲夜", age: "26", size: "T.158 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/qt5akeWqoEBKOtR3eRRfPx4Okfdoe21lxZulZ4qQ.jpg" },
        { name: "春野", age: "27", size: "T.160 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/CZU7hxQp9wQAsgy0snxtGYqCi9MovgIrXX52CfXE.jpg" },
        { name: "江間", age: "24", size: "T.160 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/vVFvtkznMHYAApnTYzJZtfvMsAscC5v91G0S0ngr.jpg" },
        { name: "白瀬", age: "23", size: "T.161 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/79APi9rYJ2mr3qIrKf4vRCXQzz7qpRPNpzt8I4Cu.jpg" },
        { name: "春田", age: "30", size: "T.153 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/uel5oZfXK3SSeOmve5wmikAQLpPaasgafVXOJA4B.jpg" },
        { name: "林原", age: "26", size: "T.164 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/kfZ14Yad8mQGYQTTFvngxupUewqC9KnlOVRCwcuj.jpg" },
        { name: "西園", age: "32", size: "T.165 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/MjeKJXlNf4lGYJ45lC2iy5g0tOvOINZTStb1JqNb.jpg" },
        { name: "柳澤", age: "24", size: "T.152 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/qBSUV0i1MfE2fC4iuPN3VMqgc8d4lOkzxX7nH49z.jpg" },
        { name: "桜庭", age: "24", size: "T.156 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/pows8H0SbcR7BrEn4U2YjIug67z4BeojF5o8jQ4x.jpg" },
        { name: "源", age: "40", size: "T.164 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/EKJOFxIztzqLJcyrK7lZxRTnBrAXdbttJRJjsxaU.jpg" },
        { name: "早見", age: "27", size: "T.153 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/2tDkkT3rDIzfXZziHf7TPhjJkGPV3pV4iuQ3Nwrb.jpg" },
        { name: "三井", age: "36", size: "T.167 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/VEHXtAf5w6Y7jyv6U8faywf6WIWj81IVk8EAbtcO.jpg" },
        { name: "永野", age: "28", size: "T.150 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/fIUIGayzf1u1DIQDRQzfoTm8kUAP31CqA3KLAarO.jpg" },
        { name: "宮田", age: "34", size: "T.158 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/8Eq0mcYRt8c7RCHAY013uH0gsM93zFbla8tvBwkq.jpg" },
        { name: "指原", age: "30", size: "T.158 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/AKAE2L1r2sPi8GzmDJ9lOZXlQv8PpoZOWMW7z388.jpg" },
        { name: "沢野", age: "44", size: "T.160 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/KXjde9ZiAEqG6u5GRMHfYYRJKsoi2Wo5ETBVuzoD.jpg" },
        { name: "大原", age: "22", size: "T.170 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/PztAyjlGUlA3Naa9da7Jd6rda4YjcQKNocoNl8M9.jpg" },
        { name: "千秋", age: "28", size: "T.153 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/ZR7KnyCClJWZ4nEPl7O0LreLWzJfc28Rb15HTzum.jpg" },
        { name: "沢木", age: "31", size: "T.165 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/TT6hzFQJXn7k7AAXZcEM5YV8x8bbCPIEuLkbZQa8.jpg" },
        { name: "平子", age: "29", size: "T.160 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/k7hTy2710HX47KIhVf5OnUL8W6iClRjP8itt82iV.jpg" },
        { name: "若葉", age: "31", size: "T.158 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/FzE256myyu9mpt25E6bFlQWMcuWN86kBWJN3Kdyg.jpg" },
        { name: "明石", age: "41", size: "T.156 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/70JlrWKU48dVdDEulrwZ4rsDbDBTBdXWaq0Fv30W.jpg" },
        { name: "大石", age: "30", size: "T.163 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/kn3MBgYxuDuoFA64xVIijRhjzsqHYWeJc1sfdQnz.jpg" },
        { name: "香月", age: "31", size: "T.161 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/hmFHAXdyTWJy4Cvve81Thr9QiySQW4JMgEVeOh3u.jpg" },
        { name: "横田", age: "40", size: "T.150 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/sfPl4McXrggYTBDB5rcCwEjWFAsf6ynNVP9v1eyj.jpg" },
        { name: "井本", age: "33", size: "T.160 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/eA87wcGzfdOK9tXb0dL2FChx5OoZ4k0xwBG2u2PE.jpg" },
        { name: "佐川", age: "24", size: "T.158 / B.- / W.- / H.-", img: "https://cozy-esthetic.com/storage/images/therapists/o1Ja8dkmkuxgyYwPKGyXG0sYDEGxombQixVnKJis.jpg" }
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
        
        // 1. 店舗情報（HP、スケジュール、システム）の更新
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

        // 2. キャストの更新
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
