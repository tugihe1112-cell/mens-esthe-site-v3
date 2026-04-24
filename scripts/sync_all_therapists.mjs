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

  // 本物のID（先ほどの調査結果より）
  const realShowaId = "tokyo_shinagawa_oimachi_showa_refresh";
  const realGokuId = "tokyo_ota_omori_gokujou";

  // --- 昭和リフレッシュ館 全員（31名） ---
  const showaData = [
    { name: "望月みき", img: "https://pwchp.com/images_staff/156/23350/tL6IgyQe5xwDZC9.jpeg", size: "" },
    { name: "さつき", img: "https://pwchp.com/images_staff/156/23301/KpTj4regL1LAmZM.jpeg", size: "T156 B87 W60 H88" },
    { name: "楠ひまり", img: "https://pwchp.com/images_staff/156/23300/zpE70L2l8D5Z7Vv.jpeg", size: "T164 B84 W56 H82" },
    { name: "佐伯ゆうな", img: "https://pwchp.com/images_staff/156/22871/RogqOiaCzFsDLyp.jpeg", size: "T160 B82 W57 H85" },
    { name: "すみれ", img: "https://pwchp.com/images_staff/156/22731/1mY0E4lAfRs5fJq.jpeg", size: "T158 B84 W56 H81" },
    { name: "木村まり", img: "https://pwchp.com/images_staff/156/22168/FcDti6giYkrZzf3.jpeg", size: "T155 B91 W65 H91" },
    { name: "美月せりな", img: "https://pwchp.com/images_staff/156/22117/TfWq3Oxuyz3l26u.jpeg", size: "T157 B86 W57 H84" },
    { name: "桃瀬まい", img: "https://pwchp.com/images_staff/156/21894/YNzk3CHCjyKYx3v.jpeg", size: "T151 B89 W56 H88" },
    { name: "黒木綾華", img: "https://pwchp.com/images_staff/156/21498/R8OowFAjGhBUOhH.jpeg", size: "T161 B87 W59 H90" },
    { name: "北川ゆり", img: "https://pwchp.com/images_staff/156/21148/7Fcdi8ANPkarYQh.jpeg", size: "T157 B82 W59 H86" },
    { name: "日向(ひなた)ほのか", img: "https://pwchp.com/images_staff/156/20396/Eu3x3aePDEvJ9tJ.jpeg", size: "T157 B85 W59 H86" },
    { name: "優木あん", img: "https://pwchp.com/images_staff/156/20042/dXLQuOMwzA3Mtlq.jpeg", size: "T156 B89 W60 H85" },
    { name: "伊吹まいこ", img: "https://pwchp.com/images_staff/156/19926/H0pxoEFJYb6zTZb.jpeg", size: "T164 B87 W63 H90" },
    { name: "泉　瀬那", img: "https://pwchp.com/images_staff/156/19902/yrOHQhT6EYav6Xz.jpeg", size: "T156 B81 W60 H82" },
    { name: "柏木凛", img: "https://pwchp.com/images_staff/156/19579/gNz9SMeHudzaW1H.jpeg", size: "T164 B86 W61 H90" },
    { name: "目黒れな", img: "https://pwchp.com/images_staff/156/18157/up7qBh4bZbJ5Z9l.jpeg", size: "T155 B81 W58 H83" },
    { name: "長谷川えみ", img: "https://pwchp.com/images_staff/156/13959/9NnednIKUcENjPA.jpeg", size: "T156 B87 W60 H88" },
    { name: "真仲ルミ", img: "https://pwchp.com/images_staff/156/12633/koOO7cGPMV2gVX7.JPG", size: "T160 B88 W60 H87" },
    { name: "牧れいか", img: "https://pwchp.com/images_staff/156/7750/wrFSDJzFVuAYGBt.jpeg", size: "T161 B84 W58 H86" },
    { name: "リサ", img: "https://pwchp.com/images_staff/156/16297/YmwR8COY9lFDzNo.jpeg", size: "T167 B83 W61 H87" },
    { name: "白石ゆり子", img: "https://pwchp.com/images_staff/156/16191/JDqDExdpLSAHiE6.jpeg", size: "T163 B96 W61 H94" },
    { name: "及川みくる", img: "https://pwchp.com/images_staff/156/12771/VFYbJIKBPLPzdL2.jpeg", size: "T154 B95 W63 H94" },
    { name: "葵えり子", img: "https://pwchp.com/images_staff/156/10552/FDoHZ0HAF979qx0.jpeg", size: "T153 B85 W60 H86" },
    { name: "美咲まりな", img: "https://pwchp.com/images_staff/156/10471/iGbgi3gycVF5T4D.jpg", size: "T155 B87 W59 H85" },
    { name: "白鳥こはる", img: "https://pwchp.com/images_staff/156/7046/uujGRCcm17NrFUy.jpeg", size: "T160 B89 W60 H89" },
    { name: "栗山アキ", img: "https://pwchp.com/images_staff/156/9329/Cmy29AIKG1xd0OO.jpeg", size: "T150 B85 W61 H84" },
    { name: "橘花梨", img: "https://pwchp.com/images_staff/156/8327/3FEIZm0DJCE16dx.jpeg", size: "T153 B85 W61 H87" },
    { name: "中森ケイ", img: "https://pwchp.com/images_staff/156/7716/kVDVj9zjPjsmqAW.jpeg", size: "T155 B86 W60 H88" },
    { name: "森丘あみ", img: "https://pwchp.com/images_staff/156/7056/hZJ5DLek3ihWtAu.jpeg", size: "T168 B90 W61 H88" },
    { name: "七瀬みなみ", img: "https://pwchp.com/images_staff/156/6151/dFCKxMjTXCbXdDE.jpeg", size: "T158 B85 W60 H85" },
    { name: "早乙女かな", img: "https://pwchp.com/images_staff/156/16925/vimXP1BGv3YHp69.jpeg", size: "T163 B90 W60 H84" }
  ].map(t => ({ ...t, shop: realShowaId }));

  // --- GOKUJOU 極嬢 全員（44名） ---
  const gokuData = [
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
  ].map(t => ({ ...t, shop: realGokuId }));

  const allTherapists = [...showaData, ...gokuData];

  console.log(`🚀 全 ${allTherapists.length} 名のセラピストデータを完全同期中...`);
  
  let successCount = 0;
  for (const t of allTherapists) {
    const payload = {
      id: `${t.shop}_${t.name}`,
      shop_id: t.shop,
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
    
    if(res.ok) {
      successCount++;
    } else {
      console.log(`❌ 失敗: ${t.name}`, await res.text());
    }
  }

  console.log(`\n🎊 完了！${successCount} / ${allTherapists.length} 名のセラピストを確実に登録しました！`);
}

run();
