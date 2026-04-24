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

  // 更新対象の店舗IDリスト（新橋・品川両方）
  const targetShopIds = [
    'tokyo_minato_shinbashi_relax_tokyo',
    'tokyo_shinagawa_gotanda_relax'
  ];

  const shopDef = {
    website_url: "https://www.e-kimoti.net/",
    schedule_url: "https://www.e-kimoti.net/", // スケジュールも同じページでOKとのことなのでトップに設定
    price_system: "60分 9,000円\n90分 13,000円\n120分 17,000円\n150分 23,000円\n180分 27,000円",
    logo: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/relax.png",
    casts: [
      { name: "さら", age: "20", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/sara.jpg" },
      { name: "ありす", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/arisu.jpg" },
      { name: "れな", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/rena.jpg" },
      { name: "ゆう", age: "19", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/yuu.jpg" },
      { name: "れみ", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/remi.jpg" },
      { name: "あみ", age: "20", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/ami.jpg" },
      { name: "ふうか", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/fuuka2.jpg" },
      { name: "のあ", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/noa.jpg" },
      { name: "みなみ", age: "33", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/minami.jpg" },
      { name: "もも", age: "32", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/momo.jpg" },
      { name: "せいら", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/seira.jpg" },
      { name: "まなみ", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/manami2.jpg" },
      { name: "まみ", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/mami.jpg" },
      { name: "ちか", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/noimage_m.jpg" },
      { name: "ゆりか", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/yurika.jpg" },
      { name: "いのり", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/inori.jpg" },
      { name: "あん", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/an.jpg" },
      { name: "あい", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/noimage_m.jpg" },
      { name: "はる", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/noimage_m.jpg" },
      { name: "ゆい", age: "30", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/noimage_m.jpg" },
      { name: "かこ", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/kako.jpg" },
      { name: "さき", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/noimage_m.jpg" },
      { name: "かおり", age: "32", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/kaori.jpg" },
      { name: "まりん", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/marin.jpg" },
      { name: "こころ", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/noimage_m.jpg" },
      { name: "りの", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/rino.jpg" },
      { name: "なな", age: "33", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/noimage_m.jpg" },
      { name: "うた", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/uta.jpg" },
      { name: "わかな", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/wakana.jpg" },
      { name: "もか", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/moka.jpg" },
      { name: "ひめ", age: "20", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/hime.jpg" },
      { name: "かえで", age: "32", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/kaede.jpg" },
      { name: "えりか", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/noimage_m.jpg" },
      { name: "らん", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/noimage_m.jpg" },
      { name: "うみ", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/umi2.jpg" },
      { name: "こはる", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/koharu.jpg" },
      { name: "みあ", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/mia.jpg" },
      { name: "ひまり", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/himari.jpg" },
      { name: "このみ", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/konomi.jpg" },
      { name: "みき", age: "29", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/miki.jpg" },
      { name: "ことこ", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/kotoko2.jpg" },
      { name: "かすみ", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/kasumi.jpg" },
      { name: "りさ", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/risa.jpg" },
      { name: "あいか", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/noimage_m.jpg" },
      { name: "さくら", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://www.e-kimoti.net/sakura.jpg" }
    ]
  };

  try {
    console.log(`🚀 「RELAX」関連2店舗のURLとキャスト画像を修正します...\n`);

    for (const shopId of targetShopIds) {
      console.log(`\n 🏠 対象店舗: ID: ${shopId}`);

      // 1. 店舗情報の更新
      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shopId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          website_url: shopDef.website_url,
          schedule_url: shopDef.schedule_url,
          price_system: shopDef.price_system,
          image_url: shopDef.logo
        })
      });

      if (patchRes.ok) {
        console.log(`   ✅ 店舗基本情報（HP、スケジュール、システム、ロゴ）の更新完了`);
      } else {
        console.error(`   ❌ 店舗基本情報の更新失敗: ${patchRes.statusText}`);
      }

      // 2. キャストの画像URLを絶対パスに更新
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shopId}&select=id,name`, { headers });
      const dbCasts = await dbRes.json();
      
      let updateCount = 0;

      for (const cast of shopDef.casts) {
        let cleanName = cast.name.replace(/[\s　]+/g, ''); 
        const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === cleanName);

        if (existing) {
          // 画像URLを絶対パスで上書き
          await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ image_url: cast.img })
          });
          updateCount++;
        }
      }
      console.log(`   🎉 キャスト画像の絶対パスへの修正完了（${updateCount}名更新）`);
    }

    console.log(`\n🎊 すべての修正が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
