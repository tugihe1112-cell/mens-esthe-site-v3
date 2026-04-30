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
      searchKeywords: ['premium spa', 'プレミアムスパ', 'the premium spa'],
      website_url: "https://the-premiumspa.com/",
      schedule_url: "https://the-premiumspa.com/schedule.html",
      price_system: "80分 16,000円\n100分 20,000円\n120分 24,000円\n150分 30,000円",
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
        { name: "蜜 れあ", age: "27", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/320/stf_693191a3069e8.webp" }
      ]
    },
    {
      searchKeywords: ['grand aroma', 'グランドアロマ東京', 'グランドアロマ'],
      website_url: "https://grandaromatokyo.com/",
      schedule_url: "https://grandaromatokyo.com/schedule.php",
      price_system: "70分 19,000円\n90分 22,000円\n120分 27,000円",
      casts: [
        { name: "遠野こまち", age: "21", size: "T.148 / B.85(C) / W.58 / H.85", img: "https://grandaromatokyo.com/images_staff/735/040918160218.jpg" },
        { name: "藤井あみ", age: "21", size: "T.165 / B.88(D) / W.58 / H.89", img: "https://grandaromatokyo.com/images_staff/734/040816461274.jpg" },
        { name: "砂浜かれん", age: "24", size: "T.159 / B.159(D) / W.58 / H.90", img: "https://grandaromatokyo.com/images_staff/733/040117181891.jpg" },
        { name: "道場あおい", age: "26", size: "T.157 / B.87(D) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/732/032614190821.jpg" },
        { name: "結城ひまり", age: "27", size: "T.157 / B.85(C) / W.58 / H.85", img: "https://grandaromatokyo.com/images_staff/731/032614190498.jpg" },
        { name: "涼宮ゆら", age: "21", size: "T.160 / B.96(J) / W.59 / H.93", img: "https://grandaromatokyo.com/images_staff/730/040718561034.jpg" },
        { name: "阿久津ひびき", age: "26", size: "T.166 / B.87(D) / W.56 / H.57", img: "https://grandaromatokyo.com/images_staff/728/032814153362.jpg" },
        { name: "綾波あすか", age: "20", size: "T.159 / B.89(D) / W.58 / H.89", img: "https://grandaromatokyo.com/images_staff/727/040514363860.jpg" },
        { name: "桜井ひなの", age: "24", size: "T.162 / B.87(C) / W.56 / H.87", img: "https://grandaromatokyo.com/images_staff/720/032214335920.jpg" },
        { name: "神宮寺えれな", age: "22", size: "T.153 / B.88(D) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/719/040818424773.jpg" },
        { name: "天海りのん", age: "22", size: "T.171 / B.88(E) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/716/040913561329.jpg" },
        { name: "山岸まみ", age: "24", size: "T.166 / B.85(C) / W.58 / H.85", img: "https://grandaromatokyo.com/images_staff/196/030816583342.jpg" },
        { name: "三日月さら", age: "26", size: "T.158 / B.87(E) / W.58 / H.86", img: "https://grandaromatokyo.com/images_staff/77/020123155377.jpg" },
        { name: "西宮しおり", age: "24", size: "T.160 / B.87(D) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/410/030816493777.jpg" },
        { name: "黒崎あんな", age: "26", size: "T.157 / B.94(I) / W.59 / H.92", img: "https://grandaromatokyo.com/images_staff/390/020719432489.jpg" },
        { name: "本田さつき", age: "27", size: "T.155 / B.87(E) / W.58 / H.86", img: "https://grandaromatokyo.com/images_staff/21/040505345338.jpg" },
        { name: "松井あや", age: "26", size: "T.168 / B.86(D) / W.56 / H.86", img: "https://grandaromatokyo.com/images_staff/613/040214353190.jpg" },
        { name: "高市しずく", age: "23", size: "T.150 / B.86(D) / W.56 / H.86", img: "https://grandaromatokyo.com/images_staff/495/040112193224.jpg" },
        { name: "内海みか", age: "26", size: "T.172 / B.86(D) / W.56 / H.86", img: "https://grandaromatokyo.com/images_staff/607/060617294716.jpg" },
        { name: "河北はな", age: "22", size: "T.160 / B.87(D) / W.58 / H.88", img: "https://
cat << 'EOF' > update_premiumspa_grandaroma_page2.mjs
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
      searchKeywords: ['premium spa', 'プレミアムスパ', 'the premium spa'],
      casts: [
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
        { name: "工藤 りい", age: "24", size: "T.- / B.-", img: "https://the-premiumspa.com/data/staff/311/stf_692121b61993a.webp" }
      ]
    },
    {
      searchKeywords: ['grand aroma', 'グランドアロマ東京', 'グランドアロマ'],
      casts: [
        { name: "上島さきね", age: "28", size: "T.165 / B.86(D) / W.57 / H.84", img: "https://grandaromatokyo.com/images_staff/260/101123421024.jpg" },
        { name: "南ななせ", age: "23", size: "T.165 / B.87(E) / W.58 / H.87", img: "https://grandaromatokyo.com/images_staff/563/030816593438.jpg" },
        { name: "本郷めい", age: "24", size: "T.157 / B.88(F) / W.54 / H.86", img: "https://grandaromatokyo.com/images_staff/628/110117362176.jpg" },
        { name: "和戸川りつ", age: "24", size: "T.160 / B.89(F) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/507/020718583648.jpg" },
        { name: "狛江りあ", age: "21", size: "T.154 / B.87(D) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/544/031219232181.jpg" },
        { name: "井上りお", age: "25", size: "T.160 / B.90(G) / W.57 / H.90", img: "https://grandaromatokyo.com/images_staff/633/082604542740.jpg" },
        { name: "成宮さき", age: "23", size: "T.171 / B.84(B) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/674/012211504668.jpg" },
        { name: "清水るか", age: "21", size: "T.160 / B.86(D) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/637/072717404679.jpg" },
        { name: "天津くれは", age: "25", size: "T.163 / B.88(F) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/655/10141719259.jpg" },
        { name: "一ノ瀬えりか", age: "27", size: "T.168 / B.87(D) / W.58 / H.88", img: "https://grandaromatokyo.com/images_staff/593/011723555428.jpg" },
        { name: "桃田みさ", age: "23", size: "T.147 / B.87(D) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/704/03301732456.jpg" },
        { name: "東雲いちか", age: "21", size: "T.168 / B.90(G) / W.57 / H.91", img: "https://grandaromatokyo.com/images_staff/665/022101294373.jpg" },
        { name: "坂本みゆき", age: "25", size: "T.155 / B.87(D) / W.58 / H.88", img: "https://grandaromatokyo.com/images_staff/666/102821560647.jpg" },
        { name: "落合りな", age: "26", size: "T.155 / B.89(F) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/551/01161803076.jpg" },
        { name: "赤澤れい", age: "26", size: "T.166 / B.87(D) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/672/022101295165.jpg" },
        { name: "綾瀬はる", age: "27", size: "T.162 / B.87(D) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/677/121808293053.jpg" },
        { name: "柚木まり", age: "24", size: "T.156 / B.86(D) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/617/03152020319.jpg" },
        { name: "高橋りり", age: "20", size: "T.164 / B.91(H) / W.58 / H.90", img: "https://grandaromatokyo.com/images_staff/640/082514454041.jpg" },
        { name: "橋本あんず", age: "22", size: "T.170 / B.87(D) / W.58 / H.88", img: "https://grandaromatokyo.com/images_staff/654/120519145211.jpg" },
        { name: "中村あんな", age: "23", size: "T.155 / B.85(C) / W.57 / H.83", img: "https://grandaromatokyo.com/images_staff/40/120417384736.jpg" },
        { name: "白石まな", age: "20", size: "T.155 / B.85(C) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/670/02210130199.jpg" },
        { name: "西野みな", age: "22", size: "T.151 / B.86(D) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/686/122816134996.jpg" },
        { name: "石原なごみ", age: "24", size: "T.170 / B.87(D) / W.58 / H.88", img: "https://grandaromatokyo.com/images_staff/657/022101300984.jpg" },
        { name: "乙葉こはる", age: "26", size: "T.156 / B.85(C) / W.57 / H.83", img: "https://grandaromatokyo.com/images_staff/614/061123532674.jpg" },
        { name: "三浦りな", age: "25", size: "T.158 / B.86(C) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/553/041201121966.jpg" },
        { name: "楓ひびき", age: "25", size: "T.165 / B.87(D) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/545/10032241348.jpg" },
        { name: "江藤さな", age: "24", size: "T.167 / B.88(F) / W.57 / H.89", img: "https://grandaromatokyo.com/images_staff/590/041201115442.jpg" },
        { name: "篠崎みう", age: "24", size: "T.- / B.90(G) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/597/041201130013.jpg" },
        { name: "秋山れん", age: "24", size: "T.165 / B.88(E) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/610/061123530796.jpg" },
        { name: "松村さな", age: "26", size: "T.165 / B.87(E) / W.58 / H.87", img: "https://grandaromatokyo.com/images_staff/570/041201115952.jpg" },
        { name: "安藤くるみ", age: "23", size: "T.165 / B.87(E) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/624/061123534120.jpg" },
        { name: "月島くるみ", age: "21", size: "T.163 / B.86(C) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/562/112718520877.jpg" },
        { name: "綾瀬あやこ", age: "27", size: "T.160 / B.88(D) / W.57 / H.89", img: "https://grandaromatokyo.com/images_staff/601/04120112487.jpg" },
        { name: "涼宮みき", age: "22", size: "T.150 / B.87(D) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/603/041201303758.jpg" },
        { name: "姫乃るか", age: "24", size: "T.162 / B.88(E) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/605/050700571494.jpg" },
        { name: "山本まみ", age: "21", size: "T.165 / B.88(E) / W.57 / H.89", img: "https://grandaromatokyo.com/images_staff/638/02210129594.jpg" },
        { name: "浅井れいな", age: "26", size: "T.152 / B.90(G) / W.57 / H.90", img: "https://grandaromatokyo.com/images_staff/641/022101300489.jpg" }
      ]
    }
  ];

  try {
    console.log(`🔍 データベースから対象の2店舗を検索し、追加キャストの更新を実行します...\n`);

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
        console.log(`   🎉 追加キャスト設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
      }
    }
    
    console.log(`\n🎊 すべての店舗の更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
