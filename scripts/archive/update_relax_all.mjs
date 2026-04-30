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

  // 更新対象の店舗IDリスト
  const targetShopIds = [
    'tokyo_minato_shinbashi_relax_tokyo',
    'tokyo_shinagawa_gotanda_relax'
  ];

  const shopDef = {
    website_url: "http://gotanda.relax.her.jp/",
    schedule_url: "http://gotanda.relax.her.jp/",
    price_system: "60分 9,000円\n90分 13,000円\n120分 17,000円\n150分 23,000円\n180分 27,000円",
    logo: "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/relax.png",
    casts: [
      { name: "さら", age: "20", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/sara.jpg" },
      { name: "ありす", age: "24", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/arisu.jpg" },
      { name: "れな", age: "22", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/rena.jpg" },
      { name: "ゆう", age: "19", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/yuu.jpg" },
      { name: "れみ", age: "21", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/remi.jpg" },
      { name: "あみ", age: "20", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/ami.jpg" },
      { name: "ふうか", age: "23", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/fuuka2.jpg" },
      { name: "のあ", age: "21", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/noa.jpg" },
      { name: "みなみ", age: "33", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/minami.jpg" },
      { name: "もも", age: "32", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/momo.jpg" },
      { name: "せいら", age: "24", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/seira.jpg" },
      { name: "まなみ", age: "28", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/manami2.jpg" },
      { name: "まみ", age: "23", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/mami.jpg" },
      { name: "ちか", age: "26", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
      { name: "ゆりか", age: "23", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/yurika.jpg" },
      { name: "いのり", age: "26", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/inori.jpg" },
      { name: "あん", age: "28", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/an.jpg" },
      { name: "あい", age: "22", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
      { name: "はる", age: "26", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
      { name: "ゆい", age: "30", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
      { name: "かこ", age: "23", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/kako.jpg" },
      { name: "さき", age: "25", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
      { name: "かおり", age: "32", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/kaori.jpg" },
      { name: "まりん", age: "21", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/marin.jpg" },
      { name: "こころ", age: "23", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
      { name: "りの", age: "23", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/rino.jpg" },
      { name: "なな", age: "33", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
      { name: "うた", age: "27", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/uta.jpg" },
      { name: "わかな", age: "23", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/wakana.jpg" },
      { name: "もか", age: "23", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/moka.jpg" },
      { name: "ひめ", age: "20", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/hime.jpg" },
      { name: "かえで", age: "32", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/kaede.jpg" },
      { name: "えりか", age: "22", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
      { name: "らん", age: "24", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
      { name: "うみ", age: "26", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/umi2.jpg" },
      { name: "こはる", age: "27", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/koharu.jpg" },
      { name: "みあ", age: "27", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/mia.jpg" },
      { name: "ひまり", age: "26", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/himari.jpg" },
      { name: "このみ", age: "25", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/konomi.jpg" },
      { name: "みき", age: "29", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/miki.jpg" },
      { name: "ことこ", age: "26", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/kotoko2.jpg" },
      { name: "かすみ", age: "25", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/kasumi.jpg" },
      { name: "りさ", age: "24", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/risa.jpg" },
      { name: "あいか", age: "26", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
      { name: "さくら", age: "28", size: "T.- / B.- / W.- / H.-", img: "http://gotanda.relax.her.jp/sakura.jpg" }
    ]
  };

  try {
    console.log(`🚀 「RELAX」関連2店舗の更新を開始します...\n`);

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

      // 2. キャストの登録・更新
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shopId}&select=id,name`, { headers });
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
          const newId = `${shopId}_${cleanName}`;
          await fetch(`${url}/rest/v1/therapists`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({
              id: newId,
              shop_id: shopId,
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
