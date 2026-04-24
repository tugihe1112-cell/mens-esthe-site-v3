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
    // ----------------------------------------------------------------------
    // 1. GOKUJOU / HANASPA の店舗IDをすべて特定する
    // ----------------------------------------------------------------------
    console.log('🔍 1. 対象となる全店舗を検索中...');
    let shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*極嬢*&select=id`, { headers });
    let targetShops = await shopRes.json();
    
    if (!targetShops || targetShops.length === 0) {
      shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*HANASPA*&select=id`, { headers });
      targetShops = await shopRes.json();
    }

    if (!targetShops || targetShops.length === 0) {
      console.log('⚠️ 対象店舗が見つかりません。');
      return;
    }

    const shopIds = targetShops.map(s => s.id);
    console.log(`✅ ${shopIds.length}店舗を発見: ${shopIds.join(', ')}`);

    // ----------------------------------------------------------------------
    // 2. 店舗名（HANASPAへ）と URL の一括更新
    // ----------------------------------------------------------------------
    console.log('\n🚀 2. 店舗名とOfficial WebsiteのURLを更新します...');
    for (const id of shopIds) {
      await fetch(`${url}/rest/v1/shops?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: "HANASPA (ハナスパ) 旧GOKUJOU 極嬢",
          website_url: "https://esthe-hanaspa.com/"
        })
      });
    }
    console.log('✅ 店舗情報の更新完了！');

    // ----------------------------------------------------------------------
    // 3. 全店舗へ「全く同じ44名のセラピスト」を一気にコピーして紐付ける
    // ----------------------------------------------------------------------
    console.log('\n🚀 3. 発見した全店舗に対して、44名のセラピストデータを共通で登録します...');
    
    const baseTherapists = [
      { name: "篠原さやか", img: "https://imgsrv.jp/shop/135/lady/841592e319c66ed5a8.jpg", size: "31歳 T161cm B84(C)" },
      { name: "小鳥遊かんな", img: "https://imgsrv.jp/shop/135/lady/e5e8b3c77b9d13a5fe.jpg", size: "29歳 T160cm B88(E)" },
      { name: "水城りこ", img: "https://imgsrv.jp/shop/135/lady/9320729010c6ca5c6c.jpg", size: "26歳 T162cm B86(E)" },
      { name: "加賀見せな", img: "https://imgsrv.jp/shop/135/lady/60b6e231ac434e101d.jpg", size: "24歳 T165cm B82(B)" },
      { name: "淺井ゆうか", img: "https://imgsrv.jp/shop/135/lady/da2febfb1a15f79166.jpg", size: "28歳 T154cm B84(F)" },
      { name: "松井ゆりな", img: "https://imgsrv.jp/shop/135/lady/7dd22be48bcca7588a.jpg", size: "26歳 T152cm B85(D)" },
      { name: "柊らむ", img: "https://imgsrv.jp/shop/135/lady/49b7ef7ceb0b63ad90.jpg", size: "25歳 T156cm B84(C)" },
      { name: "椎名りあ", img: "https://imgsrv.jp/shop/135/lady/b55620cc27ec8b6e7c.jpg", size: "28歳 T165cm B83(C)" },
      { name: "赤木あん", img: "https://imgsrv.jp/shop/135/lady/490c33b55e3a9ba1e3.jpg", size: "21歳 T158cm B81(C)" },
      { name: "小林ゆうか", img: "https://imgsrv.jp/shop/135/lady/830d3601b08011947e.jpg", size: "28歳 T153cm B84(C)" },
      { name: "桜井らな", img: "https://imgsrv.jp/shop/135/lady/9b729589d9d11f75d0.jpg", size: "25歳 T153cm B85(D)" },
      { name: "山本るな", img: "https://imgsrv.jp/shop/135/lady/8acfe4006068e4410c.jpg", size: "29歳 T170cm B86(E)" },
      { name: "吉川めい", img: "https://imgsrv.jp/shop/135/lady/5ebb3451554759ad0a.jpg", size: "28歳 T153cm B84(D)" },
      { name: "鈴木あいり", img: "https://imgsrv.jp/shop/135/lady/730bf1a87167e69c16.jpg", size: "26歳 T150cm B83(C)" },
      { name: "皐月ゆり", img: "https://imgsrv.jp/shop/135/lady/6ca5550a79ee767638.jpg", size: "26歳 T158cm B84(D)" },
      { name: "相原なお", img: "https://imgsrv.jp/shop/135/lady/5801b0f1c9b9387e34.jpg", size: "24歳 T165cm B88(F)" },
      { name: "夢乃あいか", img: "https://imgsrv.jp/shop/135/lady/5f835598ea9b9010c6.jpg", size: "26歳 T157cm B87(F)" },
      { name: "広瀬みお", img: "https://imgsrv.jp/shop/135/lady/ee300e01d87e46b6c0.jpg", size: "25歳 T163cm B86(F)" },
      { name: "美月のあ", img: "https://imgsrv.jp/shop/135/lady/b1079f61eaf8f813a6.jpg", size: "25歳 T166cm B84(C)" },
      { name: "栗山まろん", img: "https://imgsrv.jp/shop/135/lady/ae8dc82505bbf4fac9.jpg", size: "22歳 T157cm B85(E)" },
      { name: "岡本なつき", img: "https://imgsrv.jp/shop/135/lady/1acf6d2a708982cf1f.jpg", size: "25歳 T167cm B86(E)" },
      { name: "神崎まゆ", img: "https://imgsrv.jp/shop/135/lady/423f45b4c965746977.jpg", size: "27歳 T156cm B85(D)" },
      { name: "川瀬りかこ", img: "https://imgsrv.jp/shop/135/lady/29f617be6e367e1d4d.jpg", size: "31歳 T161cm B89(H)" },
      { name: "丹羽さや", img: "https://imgsrv.jp/shop/135/lady/1d2008c2917703c1c5.jpg", size: "26歳 T156cm B84(D)" },
      { name: "神川みこ", img: "https://imgsrv.jp/shop/135/lady/fad36ce27964bf9300.jpg", size: "28歳 T158cm B83(C)" },
      { name: "上坂ゆう", img: "https://imgsrv.jp/shop/135/lady/a88158828b1959689f.jpg", size: "29歳 T150cm B85(D)" },
      { name: "篠宮れんか", img: "https://imgsrv.jp/shop/135/lady/228f6517a60037180c.jpg", size: "27歳 T163cm B83(C)" },
      { name: "堀井ちさ", img: "https://imgsrv.jp/shop/135/lady/61f876b35f153249c8.jpg", size: "30歳 T152cm B81(C)" },
      { name: "加藤れな", img: "https://imgsrv.jp/shop/135/lady/f65bcc4968fdded911.jpg", size: "34歳 T165cm B88(E)" },
      { name: "沢井さや", img: "https://imgsrv.jp/shop/135/lady/a3801018d27c06669a.jpg", size: "23歳 T160cm B84(F)" },
      { name: "猫野じゅり", img: "https://imgsrv.jp/shop/135/lady/578818f765787d43b2.jpg", size: "29歳 T164cm B86(D)" },
      { name: "愛内りん", img: "https://imgsrv.jp/shop/135/lady/b231f93fd49502b7ab.jpg", size: "28歳 T160cm B84(C)" },
      { name: "小泉あすか", img: "https://imgsrv.jp/shop/135/lady/8e251daca7a67aceeb.jpg", size: "30歳 T154cm B86(E)" },
      { name: "藤井さな", img: "https://imgsrv.jp/shop/135/lady/48417ba142872dfb40.jpg", size: "28歳 T162cm B91(F)" },
      { name: "岩花しの", img: "https://imgsrv.jp/shop/135/lady/6866c6a1c065d7645c.jpg", size: "24歳 T158cm B84(E)" },
      { name: "長谷部りな", img: "https://imgsrv.jp/shop/135/lady/f2abc1335c5d0a5307.jpg", size: "30歳 T157cm B88(F)" },
      { name: "黒田もも", img: "https://imgsrv.jp/shop/135/lady/2cefad200cc1fda746.jpg", size: "25歳 T160cm B85(E)" },
      { name: "風間あんな", img: "https://imgsrv.jp/shop/135/lady/06eff5552017470baf.jpg", size: "25歳 T155cm B84(C)" },
      { name: "安達せな", img: "https://imgsrv.jp/shop/135/lady/bfdc2c3ebce3a97cd4.jpg", size: "36歳 T170cm B100(I)" },
      { name: "江花さくら", img: "https://imgsrv.jp/shop/135/lady/ca0fc957708abfe246.jpg", size: "27歳 T157cm B84(C)" },
      { name: "松高れん", img: "https://imgsrv.jp/shop/135/lady/431948220c30e9f228.jpg", size: "24歳 T168cm B86(F)" },
      { name: "橋本あんな", img: "https://imgsrv.jp/shop/135/lady/87df42f8cebd881982.jpg", size: "30歳 T147cm B82(D)" },
      { name: "志田まい", img: "https://imgsrv.jp/shop/135/lady/483289ef6076931aec.jpg", size: "23歳 T155cm B85(D)" },
      { name: "真田ゆら", img: "https://imgsrv.jp/shop/135/lady/c328c782c1053b759f.jpg", size: "27歳 T163cm B82(C)" }
    ];

    let successCount = 0;
    for (const shopId of shopIds) {
      console.log(` 🔄 ${shopId} へ44名を登録中...`);
      for (const t of baseTherapists) {
        const payload = {
          id: `${shopId}_${t.name}`,
          shop_id: shopId,
          name: t.name,
          image_url: t.img,
          raw_data: { age: t.size.split(' ')[0] || '', size: t.size },
          is_active: true
        };

        const res = await fetch(`${url}/rest/v1/therapists`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify(payload)
        });
        if(res.ok) successCount++;
      }
    }

    console.log(`\n🎊 完璧です！全 ${shopIds.length} 店舗に、合計 ${successCount} 件（1店舗あたり44名）のセラピストを同期しました！`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
