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

  const shopDef = {
    searchKeywords: ['premium spa', 'プレミアムスパ', 'the premium spa'],
    website_url: "https://the-premiumspa.com/",
    schedule_url: "https://the-premiumspa.com/schedule.html",
    price_system: "お試し 80分コース 16,000円\n通常 100分コース 20,000円\nロングコース 120分 24,000円\nExecutiveコース 150分 30,000円",
    casts: [
      { name: "朝比奈 こはる", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/304/stf_69bd3d0392c68.webp" },
      { name: "小鳥遊 みさ", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/319/stf_6950a06372fa9.webp" },
      { name: "徳川 るい", age: "28", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/401/stf_69c2a91906394.webp" },
      { name: "水原 るう", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/264/stf_690b63d48a6ce.webp" },
      { name: "東條 なな", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/141/stf_698ebd61cd973.webp" },
      { name: "桃山 あい", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/323/stf_69bba13320bd3.webp" },
      { name: "港 える", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/397/stf_69cbbb8760e23.webp" },
      { name: "倉島 きょうこ", age: "27", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/266/stf_6958ddf115f87.webp" },
      { name: "桜 なみ", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/290/stf_67d7f35ac5763.webp" },
      { name: "氷室 かえで", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/403/stf_69ae874e854cf.webp" },
      { name: "大谷 ひな", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/404/stf_69cd5577a11ba.webp" },
      { name: "小野寺 ゆき", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/409/stf_69b7ef20e34d8.webp" },
      { name: "楪 まりさ", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/402/stf_69a43897b8ab7.webp" },
      { name: "篠宮 さら", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/395/stf_69a8798964742.webp" },
      { name: "月島 なつき", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/177/stf_661f40e42178a.webp" },
      { name: "朝倉 べに", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/305/stf_6881a2b6aae06.webp" },
      { name: "夜空 ゆり", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/244/stf_69d64dd61141f.webp" },
      { name: "北原 かのん", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/317/stf_6958d89cbd867.webp" },
      { name: "西野 ゆい", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/287/stf_695e48893c5ae.webp" },
      { name: "水川 みお", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/324/stf_6988b446caf7d.webp" },
      { name: "立花 あおい", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/23/stf_69c748d801238.webp" },
      { name: "天宮 れいか", age: "28", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/299/stf_68ea8727cbc4f.webp" },
      { name: "愛咲 りあ", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/399/stf_69d4371542094.webp" },
      { name: "蜜 れあ", age: "27", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/320/stf_693191a3069e8.webp" },
      { name: "愛月 えり", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/302/stf_685e9cbf1e999.webp" },
      { name: "柚木 みく", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/408/stf_69b6fb1129b7e.webp" },
      { name: "水野 こころ", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/262/stf_66ec337004fd7.webp" },
      { name: "真白 ここ", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/172/stf_661f40d448b02.webp" },
      { name: "黒木 りさ", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/411/stf_69d37ad219389.webp" },
      { name: "風美 るる", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/240/stf_6958d8a87fbe3.webp" },
      { name: "萩原 きほ", age: "28", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/398/stf_69819698e6cf3.webp" },
      { name: "華月 りの", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/407/stf_69b7ef1df1250.webp" },
      { name: "渡辺 きょうか", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/405/stf_69ad92f6cb3b9.webp" },
      { name: "泉 りえ", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/322/stf_69357dab61c02.webp" },
      { name: "桜野 らら", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/406/stf_69b47a4592358.webp" },
      { name: "辻 いちか", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/166/stf_685f8b9d5e920.webp" },
      { name: "桜井 蓮", age: "28", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/167/stf_661f40c51b3ae.webp" },
      { name: "姫乃 みる", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/410/stf_69bd65693f983.webp" },
      { name: "如月 あつき", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/318/stf_69a79d0a3e658.webp" },
      { name: "七海 りり", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/306/stf_6898a819deb3b.webp" },
      { name: "夏崎 ひすい", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/303/stf_6958ddedf1ce1.webp" },
      { name: "三上 ほの", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/143/stf_67b179325e674.webp" },
      { name: "天音 のの", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/298/stf_692134e3832dc.webp" },
      { name: "夜桜 ゆら", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/301/stf_69888d1dc4a47.webp" },
      { name: "畑 たまき", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/276/stf_67547e3739786.webp" },
      { name: "西 ふうか", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/400/stf_69a982f40e99b.webp" },
      { name: "石川 らん", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/178/stf_661f40e734812.webp" },
      { name: "天月 かれん", age: "28", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/36/stf_66e138e3037e2.webp" },
      { name: "絢瀬みずき", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/32/stf_661f41542d054.webp" },
      { name: "篠咲 いおり", age: "27", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/118/stf_66e138dfd3e6a.webp" },
      { name: "園田 なぎ", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/314/stf_698add7e9ca5c.webp" },
      { name: "香椎 レイラ", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/321/stf_69542d5563721.webp" },
      { name: "桐谷 みなみ", age: "28", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/326/stf_694b4ae16ae33.webp" },
      { name: "杉本 しおり", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/258/stf_695515b8c45f1.webp" },
      { name: "宮本 あゆな", age: "27", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/307/stf_68a2de040bffd.webp" },
      { name: "今井 こなつ", age: "27", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/288/stf_6846b3bc7dac5.webp" },
      { name: "工藤 りい", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/311/stf_692121b61993a.webp" },
      { name: "白鳥 みこと", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/308/stf_68b14b8e7eb2c.webp" },
      { name: "東雲 あん", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/310/stf_68cd7c891838d.webp" },
      { name: "美月 せな", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/270/stf_69407cfdc1392.webp" },
      { name: "黒瀧 めみ", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/291/stf_68749904c2797.webp" },
      { name: "椿 ねね", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/297/stf_684861c34efe5.webp" },
      { name: "瀬上 れいな", age: "27", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/286/stf_687062e705cc9.webp" },
      { name: "青木 よつば", age: "30", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/293/stf_68feb5bb62825.webp" },
      { name: "田中 みな", age: "27", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/249/stf_676d5d32959ed.webp" },
      { name: "一条 あや", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/254/stf_67fc051fce9c3.webp" },
      { name: "片瀬 ゆず", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/250/stf_67625cdf33c72.webp" },
      { name: "水無瀬 えりか", age: "20", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/174/stf_68842fbeb30dd.webp" },
      { name: "神楽 ひな", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/243/stf_6738cdc4dd6e4.webp" },
      { name: "一ノ瀬 ゆめ", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/173/stf_661f40d764a65.webp" },
      { name: "白石 さな", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/247/stf_6666eb914d160.webp" },
      { name: "道枝 ノア", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/170/stf_661f40ce22102.webp" },
      { name: "夏美 なつみ", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/275/stf_6755b1bade074.webp" },
      { name: "渋谷 えな", age: "20", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/261/stf_66faa2be1193d.webp" },
      { name: "小峰 のぞみ", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/153/stf_66201ff6088b5.webp" },
      { name: "鳳 うらら", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/142/stf_661f409f9546d.webp" },
      { name: "星 あいか", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/253/stf_668667c4b48c5.webp" },
      { name: "本田 えみり", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/164/stf_661f40bb51436.webp" },
      { name: "菊池 ひなみ", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/179/stf_661f40ea544fe.webp" },
      { name: "七瀬 ゆあ", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/190/stf_661f410f87d8b.webp" },
      { name: "日向 はな", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/184/stf_661f40f969c39.webp" },
      { name: "黒沢 みりあ", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/185/stf_661f40fca0fdc.webp" },
      { name: "望月 まな", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/191/stf_661f411292523.webp" },
      { name: "妃 りか", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/218/stf_662ba9770588e.webp" },
      { name: "桃瀬 はるか", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/197/stf_661f412576f2d.webp" },
      { name: "柊 ふゆか", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/200/stf_661f412ece0e7.webp" },
      { name: "九条 りな", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/199/stf_661f412bbb800.webp" },
      { name: "有栖 りこ", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/198/stf_661f41288ad7b.webp" },
      { name: "二ノ宮 もえ", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/201/stf_661f41321130e.webp" },
      { name: "楠 みう", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/205/stf_661fc7a9612bc.webp" },
      { name: "椿 あんな", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/202/stf_661f41352686a.webp" },
      { name: "桃乃木 もも", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/206/stf_661fc7ac7fd01.webp" },
      { name: "美咲 せら", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/269/stf_672d8b90b2b3d.webp" },
      { name: "永瀬 もな", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/207/stf_661f41447f4c6.webp" },
      { name: "渚 りお", age: "23", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/214/stf_661f41627f687.webp" },
      { name: "真島 ちゃみ", age: "27", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/213/stf_661f415f447cf.webp" },
      { name: "南 えま", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/208/stf_668a8eb80d1f7.webp" },
      { name: "中村 あすか", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/210/stf_661f414d953c3.webp" },
      { name: "大倉 さいか", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/211/stf_661f41592c14d.webp" },
      { name: "三井 セイラ", age: "20", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/209/stf_661f414abe553.webp" },
      { name: "神城 美奈", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/216/stf_66257a079f30a.webp" },
      { name: "花咲 ねね", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/217/stf_661f416b45003.webp" },
      { name: "板野 みゆう", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/219/stf_661f41715e815.webp" },
      { name: "椎名 ゆりか", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/220/stf_661f4174723b4.webp" },
      { name: "音羽 こころ", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/222/stf_661f417acca0e.webp" },
      { name: "恵南 みかな", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/224/stf_661f4180ee5ec.webp" },
      { name: "結城 れみ", age: "26", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/225/stf_661f418409429.webp" },
      { name: "月白 みやび", age: "22", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/227/stf_661f418a0458d.webp" },
      { name: "宝 ののん", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/226/stf_661f418743138.webp" },
      { name: "真琴 きき", age: "21", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/280/stf_677bc326927e7.webp" },
      { name: "美咲 せな", age: "25", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/203/stf_661fc7a654a27.webp" }
    ]
  };

  try {
    console.log(`🔍 データベースから「THE PREMIUM SPA」を検索し、完全な情報とキャスト更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return shopDef.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
    });

    if (targetShops.length === 0) {
      console.log(`⚠️ 店舗が見つかりませんでした。スキップします。`);
      return;
    }

    for (const shop of targetShops) {
      console.log(`\n 🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);

      // 1. 店舗の基本情報（HP、スケジュール、システム）を更新
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
        console.log(`   ✅ 店舗基本情報（HP、スケジュール、システム）の更新完了`);
      } else {
        console.error(`   ❌ 店舗基本情報の更新失敗: ${patchRes.statusText}`);
      }

      // 2. キャスト111名の登録・更新処理
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name`, { headers });
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
      console.log(`   🎉 キャスト完全設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    }
    
    console.log(`\n🎊 THE PREMIUM SPAのすべての更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
