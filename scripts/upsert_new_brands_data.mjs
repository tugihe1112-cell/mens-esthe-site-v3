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

  const shops = [
    {
      id: "showa_refresh",
      name: "昭和リフレッシュ館",
      website_url: "https://showa-refresh.com/",
      schedule_url: "https://showa-refresh.com/schedule.php",
      price_system: "90分:14,000円\n120分:18,000円\n150分:23,000円\n180分:27,000円",
      brand_id: "showa_refresh"
    },
    {
      id: "gokujou",
      name: "GOKUJOU 極嬢",
      website_url: "https://esthe-hanaspa.com/",
      schedule_url: "https://esthe-hanaspa.com/schedule/",
      price_system: "60分:15,000円\n90分:19,000円\n120分:23,000円\n150分:27,000円",
      brand_id: "gokujou"
    }
  ];

  console.log('🚀 1/2: データベースへ店舗の基本情報を登録中...');
  for (const s of shops) {
    await fetch(`${url}/rest/v1/shops`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(s)
    });
  }

  // 私（AI）が先ほどのチャットのHTMLから「名前」と「画像」だけを綺麗に抽出した完成データです
  const therapists = [
    // --- 昭和リフレッシュ館（31名） ---
    { shop_id: "showa_refresh", name: "望月みき", image_url: "https://pwchp.com/images_staff/156/23350/tL6IgyQe5xwDZC9.jpeg" },
    { shop_id: "showa_refresh", name: "さつき", image_url: "https://pwchp.com/images_staff/156/23301/KpTj4regL1LAmZM.jpeg" },
    { shop_id: "showa_refresh", name: "楠ひまり", image_url: "https://pwchp.com/images_staff/156/23300/zpE70L2l8D5Z7Vv.jpeg" },
    { shop_id: "showa_refresh", name: "佐伯ゆうな", image_url: "https://pwchp.com/images_staff/156/22871/RogqOiaCzFsDLyp.jpeg" },
    { shop_id: "showa_refresh", name: "すみれ", image_url: "https://pwchp.com/images_staff/156/22731/1mY0E4lAfRs5fJq.jpeg" },
    { shop_id: "showa_refresh", name: "木村まり", image_url: "https://pwchp.com/images_staff/156/22168/FcDti6giYkrZzf3.jpeg" },
    { shop_id: "showa_refresh", name: "美月せりな", image_url: "https://pwchp.com/images_staff/156/22117/TfWq3Oxuyz3l26u.jpeg" },
    { shop_id: "showa_refresh", name: "桃瀬まい", image_url: "https://pwchp.com/images_staff/156/21894/YNzk3CHCjyKYx3v.jpeg" },
    { shop_id: "showa_refresh", name: "黒木綾華", image_url: "https://pwchp.com/images_staff/156/21498/R8OowFAjGhBUOhH.jpeg" },
    { shop_id: "showa_refresh", name: "北川ゆり", image_url: "https://pwchp.com/images_staff/156/21148/7Fcdi8ANPkarYQh.jpeg" },
    { shop_id: "showa_refresh", name: "日向(ひなた)ほのか", image_url: "https://pwchp.com/images_staff/156/20396/Eu3x3aePDEvJ9tJ.jpeg" },
    { shop_id: "showa_refresh", name: "優木あん", image_url: "https://pwchp.com/images_staff/156/20042/dXLQuOMwzA3Mtlq.jpeg" },
    { shop_id: "showa_refresh", name: "伊吹まいこ", image_url: "https://pwchp.com/images_staff/156/19926/H0pxoEFJYb6zTZb.jpeg" },
    { shop_id: "showa_refresh", name: "泉　瀬那", image_url: "https://pwchp.com/images_staff/156/19902/yrOHQhT6EYav6Xz.jpeg" },
    { shop_id: "showa_refresh", name: "柏木凛", image_url: "https://pwchp.com/images_staff/156/19579/gNz9SMeHudzaW1H.jpeg" },
    { shop_id: "showa_refresh", name: "目黒れな", image_url: "https://pwchp.com/images_staff/156/18157/up7qBh4bZbJ5Z9l.jpeg" },
    { shop_id: "showa_refresh", name: "長谷川えみ", image_url: "https://pwchp.com/images_staff/156/13959/9NnednIKUcENjPA.jpeg" },
    { shop_id: "showa_refresh", name: "真仲ルミ", image_url: "https://pwchp.com/images_staff/156/12633/koOO7cGPMV2gVX7.JPG" },
    { shop_id: "showa_refresh", name: "牧れいか", image_url: "https://pwchp.com/images_staff/156/7750/wrFSDJzFVuAYGBt.jpeg" },
    { shop_id: "showa_refresh", name: "リサ", image_url: "https://pwchp.com/images_staff/156/16297/YmwR8COY9lFDzNo.jpeg" },
    { shop_id: "showa_refresh", name: "白石ゆり子", image_url: "https://pwchp.com/images_staff/156/16191/JDqDExdpLSAHiE6.jpeg" },
    { shop_id: "showa_refresh", name: "及川みくる", image_url: "https://pwchp.com/images_staff/156/12771/VFYbJIKBPLPzdL2.jpeg" },
    { shop_id: "showa_refresh", name: "葵えり子", image_url: "https://pwchp.com/images_staff/156/10552/FDoHZ0HAF979qx0.jpeg" },
    { shop_id: "showa_refresh", name: "美咲まりな", image_url: "https://pwchp.com/images_staff/156/10471/iGbgi3gycVF5T4D.jpg" },
    { shop_id: "showa_refresh", name: "白鳥こはる", image_url: "https://pwchp.com/images_staff/156/7046/uujGRCcm17NrFUy.jpeg" },
    { shop_id: "showa_refresh", name: "栗山アキ", image_url: "https://pwchp.com/images_staff/156/9329/Cmy29AIKG1xd0OO.jpeg" },
    { shop_id: "showa_refresh", name: "橘花梨", image_url: "https://pwchp.com/images_staff/156/8327/3FEIZm0DJCE16dx.jpeg" },
    { shop_id: "showa_refresh", name: "中森ケイ", image_url: "https://pwchp.com/images_staff/156/7716/kVDVj9zjPjsmqAW.jpeg" },
    { shop_id: "showa_refresh", name: "森丘あみ", image_url: "https://pwchp.com/images_staff/156/7056/hZJ5DLek3ihWtAu.jpeg" },
    { shop_id: "showa_refresh", name: "七瀬みなみ", image_url: "https://pwchp.com/images_staff/156/6151/dFCKxMjTXCbXdDE.jpeg" },
    { shop_id: "showa_refresh", name: "早乙女かな", image_url: "https://pwchp.com/images_staff/156/16925/vimXP1BGv3YHp69.jpeg" },
    
    // --- GOKUJOU 極嬢（44名） ---
    { shop_id: "gokujou", name: "篠原さやか", image_url: "https://imgsrv.jp/shop/135/lady/841592e319c66ed5a8.jpg" },
    { shop_id: "gokujou", name: "小鳥遊かんな", image_url: "https://imgsrv.jp/shop/135/lady/e5e8b3c77b9d13a5fe.jpg" },
    { shop_id: "gokujou", name: "水城りこ", image_url: "https://imgsrv.jp/shop/135/lady/9320729010c6ca5c6c.jpg" },
    { shop_id: "gokujou", name: "加賀見せな", image_url: "https://imgsrv.jp/shop/135/lady/60b6e231ac434e101d.jpg" },
    { shop_id: "gokujou", name: "淺井ゆうか", image_url: "https://imgsrv.jp/shop/135/lady/da2febfb1a15f79166.jpg" },
    { shop_id: "gokujou", name: "松井ゆりな", image_url: "https://imgsrv.jp/shop/135/lady/7dd22be48bcca7588a.jpg" },
    { shop_id: "gokujou", name: "柊らむ", image_url: "https://imgsrv.jp/shop/135/lady/49b7ef7ceb0b63ad90.jpg" },
    { shop_id: "gokujou", name: "椎名りあ", image_url: "https://imgsrv.jp/shop/135/lady/b55620cc27ec8b6e7c.jpg" },
    { shop_id: "gokujou", name: "赤木あん", image_url: "https://imgsrv.jp/shop/135/lady/490c33b55e3a9ba1e3.jpg" },
    { shop_id: "gokujou", name: "小林ゆうか", image_url: "https://imgsrv.jp/shop/135/lady/830d3601b08011947e.jpg" },
    { shop_id: "gokujou", name: "桜井らな", image_url: "https://imgsrv.jp/shop/135/lady/9b729589d9d11f75d0.jpg" },
    { shop_id: "gokujou", name: "山本るな", image_url: "https://imgsrv.jp/shop/135/lady/8acfe4006068e4410c.jpg" },
    { shop_id: "gokujou", name: "吉川めい", image_url: "https://imgsrv.jp/shop/135/lady/5ebb3451554759ad0a.jpg" },
    { shop_id: "gokujou", name: "鈴木あいり", image_url: "https://imgsrv.jp/shop/135/lady/730bf1a87167e69c16.jpg" },
    { shop_id: "gokujou", name: "皐月ゆり", image_url: "https://imgsrv.jp/shop/135/lady/6ca5550a79ee767638.jpg" },
    { shop_id: "gokujou", name: "相原なお", image_url: "https://imgsrv.jp/shop/135/lady/5801b0f1c9b9387e34.jpg" },
    { shop_id: "gokujou", name: "夢乃あいか", image_url: "https://imgsrv.jp/shop/135/lady/5f835598ea9b9010c6.jpg" },
    { shop_id: "gokujou", name: "広瀬みお", image_url: "https://imgsrv.jp/shop/135/lady/ee300e01d87e46b6c0.jpg" },
    { shop_id: "gokujou", name: "美月のあ", image_url: "https://imgsrv.jp/shop/135/lady/b1079f61eaf8f813a6.jpg" },
    { shop_id: "gokujou", name: "栗山まろん", image_url: "https://imgsrv.jp/shop/135/lady/ae8dc82505bbf4fac9.jpg" },
    { shop_id: "gokujou", name: "岡本なつき", image_url: "https://imgsrv.jp/shop/135/lady/1acf6d2a708982cf1f.jpg" },
    { shop_id: "gokujou", name: "神崎まゆ", image_url: "https://imgsrv.jp/shop/135/lady/423f45b4c965746977.jpg" },
    { shop_id: "gokujou", name: "川瀬りかこ", image_url: "https://imgsrv.jp/shop/135/lady/29f617be6e367e1d4d.jpg" },
    { shop_id: "gokujou", name: "丹羽さや", image_url: "https://imgsrv.jp/shop/135/lady/1d2008c2917703c1c5.jpg" },
    { shop_id: "gokujou", name: "神川みこ", image_url: "https://imgsrv.jp/shop/135/lady/fad36ce27964bf9300.jpg" },
    { shop_id: "gokujou", name: "上坂ゆう", image_url: "https://imgsrv.jp/shop/135/lady/a88158828b1959689f.jpg" },
    { shop_id: "gokujou", name: "篠宮れんか", image_url: "https://imgsrv.jp/shop/135/lady/228f6517a60037180c.jpg" },
    { shop_id: "gokujou", name: "堀井ちさ", image_url: "https://imgsrv.jp/shop/135/lady/61f876b35f153249c8.jpg" },
    { shop_id: "gokujou", name: "加藤れな", image_url: "https://imgsrv.jp/shop/135/lady/f65bcc4968fdded911.jpg" },
    { shop_id: "gokujou", name: "沢井さや", image_url: "https://imgsrv.jp/shop/135/lady/a3801018d27c06669a.jpg" },
    { shop_id: "gokujou", name: "猫野じゅり", image_url: "https://imgsrv.jp/shop/135/lady/578818f765787d43b2.jpg" },
    { shop_id: "gokujou", name: "愛内りん", image_url: "https://imgsrv.jp/shop/135/lady/b231f93fd49502b7ab.jpg" },
    { shop_id: "gokujou", name: "小泉あすか", image_url: "https://imgsrv.jp/shop/135/lady/8e251daca7a67aceeb.jpg" },
    { shop_id: "gokujou", name: "藤井さな", image_url: "https://imgsrv.jp/shop/135/lady/48417ba142872dfb40.jpg" },
    { shop_id: "gokujou", name: "岩花しの", image_url: "https://imgsrv.jp/shop/135/lady/6866c6a1c065d7645c.jpg" },
    { shop_id: "gokujou", name: "長谷部りな", image_url: "https://imgsrv.jp/shop/135/lady/f2abc1335c5d0a5307.jpg" },
    { shop_id: "gokujou", name: "黒田もも", image_url: "https://imgsrv.jp/shop/135/lady/2cefad200cc1fda746.jpg" },
    { shop_id: "gokujou", name: "風間あんな", image_url: "https://imgsrv.jp/shop/135/lady/06eff5552017470baf.jpg" },
    { shop_id: "gokujou", name: "安達せな", image_url: "https://imgsrv.jp/shop/135/lady/bfdc2c3ebce3a97cd4.jpg" },
    { shop_id: "gokujou", name: "江花さくら", image_url: "https://imgsrv.jp/shop/135/lady/ca0fc957708abfe246.jpg" },
    { shop_id: "gokujou", name: "松高れん", image_url: "https://imgsrv.jp/shop/135/lady/431948220c30e9f228.jpg" },
    { shop_id: "gokujou", name: "橋本あんな", image_url: "https://imgsrv.jp/shop/135/lady/87df42f8cebd881982.jpg" },
    { shop_id: "gokujou", name: "志田まい", image_url: "https://imgsrv.jp/shop/135/lady/483289ef6076931aec.jpg" },
    { shop_id: "gokujou", name: "真田ゆら", image_url: "https://imgsrv.jp/shop/135/lady/c328c782c1053b759f.jpg" }
  ];

  console.log(`🚀 2/2: ${therapists.length}名のセラピストをデータベースへ流し込みます...`);
  
  let successCount = 0;
  for (const t of therapists) {
    const res = await fetch(`${url}/rest/v1/therapists`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(t)
    });
    if(res.ok) successCount++;
  }

  console.log(`\n🎊 完璧です！店舗情報と、合計 ${successCount} 名のセラピストの自動登録が完了しました。`);
}

run();
