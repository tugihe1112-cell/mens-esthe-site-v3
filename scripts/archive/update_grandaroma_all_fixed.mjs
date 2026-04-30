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
      { name: "河北はな", age: "22", size: "T.160 / B.87(D) / W.58 / H.88", img: "https://grandaromatokyo.com/images_staff/542/030816591290.jpg" },
      { name: "桐生まりあ", age: "28", size: "T.171 / B.88(E) / W.59 / H.86", img: "https://grandaromatokyo.com/images_staff/72/010620073817.jpg" },
      { name: "大城さとみ", age: "26", size: "T.171 / B.89(F) / W.58 / H.88", img: "https://grandaromatokyo.com/images_staff/547/01062007295.jpg" },
      { name: "愛白みつ", age: "29", size: "T.160 / B.88(F) / W.56 / H.87", img: "https://grandaromatokyo.com/images_staff/351/030816590388.jpg" },
      { name: "佐々木ゆい", age: "27", size: "T.165 / B.89(F) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/635/031716552921.jpg" },
      { name: "阿部ゆうか", age: "29", size: "T.165 / B.88(F) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/621/030816591743.jpg" },
      { name: "杉野なつき", age: "22", size: "T.170 / B.88(E) / W.57 / H.85", img: "https://grandaromatokyo.com/images_staff/694/020700011954.jpg" },
      { name: "西園寺うらら", age: "22", size: "T.153 / B.89(F) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/726/040611122960.jpg" },
      { name: "青葉まい", age: "27", size: "T.165 / B.90(G) / W.57 / H.90", img: "https://grandaromatokyo.com/images_staff/718/04011526489.jpg" },
      { name: "中島ゆゆ", age: "23", size: "T.165 / B.86(C) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/712/032304585521.jpg" },
      { name: "朝宮れい", age: "26", size: "T.162 / B.86(D) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/680/02210128543.jpg" },
      { name: "矢沢なな", age: "23", size: "T.159 / B.88(D) / W.58 / H.89", img: "https://grandaromatokyo.com/images_staff/707/033017323163.jpg" },
      { name: "半田ゆず", age: "27", size: "T.164 / B.88(E) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/682/033017322365.jpg" },
      { name: "桃瀬りこ", age: "21", size: "T.163 / B.88(E) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/385/03282213416.jpg" },
      { name: "楠なぎ", age: "22", size: "T.158 / B.90(G) / W.57 / H.90", img: "https://grandaromatokyo.com/images_staff/711/040316385834.jpg" },
      { name: "川崎みれい", age: "22", size: "T.156 / B.90(G) / W.57 / H.90", img: "https://grandaromatokyo.com/images_staff/632/070722523925.jpg" },
      { name: "青空つばき", age: "26", size: "T.171 / B.90(G) / W.57 / H.90", img: "https://grandaromatokyo.com/images_staff/642/082714452271.jpg" },
      { name: "七海りんか", age: "25", size: "T.157 / B.85(C) / W.58 / H.85", img: "https://grandaromatokyo.com/images_staff/681/032611465238.jpg" },
      { name: "鹿野ほまれ", age: "27", size: "T.163 / B.88(E) / W.57 / H.89", img: "https://grandaromatokyo.com/images_staff/689/032819500170.jpg" },
      { name: "蒼井せりな", age: "24", size: "T.157 / B.85(C) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/317/020719440792.jpg" },
      { name: "千歳あまね", age: "22", size: "T.164 / B.88(E) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/710/031100303290.jpg" },
      { name: "如月とあ", age: "25", size: "T.167 / B.88(E) / W.57 / H.85", img: "https://grandaromatokyo.com/images_staff/700/033017320943.jpg" },
      { name: "池尻まゆか", age: "25", size: "T.159 / B.89(F) / W.58 / H.87", img: "https://grandaromatokyo.com/images_staff/376/062119411610.jpg" },
      { name: "神楽みこと", age: "23", size: "T.165 / B.87(E) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/623/10072018085.jpg" },
      { name: "佐藤みお", age: "24", size: "T.155 / B.89(F) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/651/092811322622.jpg" },
      { name: "上原らん", age: "28", size: "T.169 / B.91(G) / W.58 / H.88", img: "https://grandaromatokyo.com/images_staff/285/020719440273.jpg" },
      { name: "古賀るみか", age: "22", size: "T.150 / B.88(F) / W.58 / H.86", img: "https://grandaromatokyo.com/images_staff/698/033017325350.jpg" },
      { name: "北山いおり", age: "28", size: "T.157 / B.88(E) / W.58 / H.90", img: "https://grandaromatokyo.com/images_staff/678/030615444133.jpg" },
      { name: "藤沢ほのか", age: "23", size: "T.164 / B.87(D) / W.58 / H.88", img: "https://grandaromatokyo.com/images_staff/577/090618481474.jpg" },
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
      { name: "浅井れいな", age: "26", size: "T.152 / B.90(G) / W.57 / H.90", img: "https://grandaromatokyo.com/images_staff/641/022101300489.jpg" },
      { name: "浜崎れいな", age: "22", size: "T.161 / B.88(E) / W.59 / H.86", img: "https://grandaromatokyo.com/images_staff/660/091016554728.jpg" },
      { name: "浜崎りく", age: "23", size: "T.172 / B.89(F) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/646/072015082944.jpg" },
      { name: "黒沢ゆき", age: "26", size: "T.160 / B.87(E) / W.58 / H.86", img: "https://grandaromatokyo.com/images_staff/644/071800372836.jpg" },
      { name: "桐谷みつり", age: "25", size: "T.165 / B.90(G) / W.57 / H.89", img: "https://grandaromatokyo.com/images_staff/671/022101302437.jpg" },
      { name: "田島みるく", age: "20", size: "T.166 / B.89(F) / W.58 / H.88", img: "https://grandaromatokyo.com/images_staff/619/070722523354.jpg" },
      { name: "朝比奈ゆな", age: "22", size: "T.157 / B.89(F) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/643/071612393747.jpg" },
      { name: "火野るる", age: "25", size: "T.155 / B.89(F) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/649/081004401458.jpg" },
      { name: "大塚もも", age: "21", size: "T.154 / B.85(C) / W.55 / H.86", img: "https://grandaromatokyo.com/images_staff/668/022101301451.jpg" },
      { name: "小春のあ", age: "20", size: "T.160 / B.90(G) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/701/022101291688.jpg" },
      { name: "渚せな", age: "25", size: "T.88 / B.154(E) / W.88 / H.57", img: "https://grandaromatokyo.com/images_staff/708/03301733381.jpg" },
      { name: "白咲ゆり", age: "24", size: "T.162 / B.88(F) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/319/061819001020.jpg" },
      { name: "如月みらい", age: "26", size: "T.157 / B.90(E) / W.60 / H.85", img: "https://grandaromatokyo.com/images_staff/70/12102353149.jpg" },
      { name: "一ノ瀬せな", age: "22", size: "T.153 / B.87(E) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/502/072717080256.jpg" },
      { name: "華宮あいの", age: "23", size: "T.169 / B.88(E) / W.58 / H.87", img: "https://grandaromatokyo.com/images_staff/394/061819042181.jpg" },
      { name: "神楽まなか", age: "28", size: "T.157 / B.87(D) / W.58 / H.88", img: "https://grandaromatokyo.com/images_staff/417/061819062271.jpg" },
      { name: "黒岩そのこ", age: "27", size: "T.160 / B.85(B) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/722/030917504556.jpg" },
      { name: "山田まこ", age: "28", size: "T.157 / B.86(C) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/721/030917394339.jpg" },
      { name: "郭わかき", age: "29", size: "T.155 / B.88(D) / W.58 / H.89", img: "https://grandaromatokyo.com/images_staff/723/031114532787.jpg" },
      { name: "巣鴨のら", age: "26", size: "T.159 / B.87(C) / W.58 / H.89", img: "https://grandaromatokyo.com/images_staff/724/031116365638.jpg" },
      { name: "飯塚ゆうき", age: "24", size: "T.170 / B.85(C) / W.58 / H.85", img: "https://grandaromatokyo.com/images_staff/688/010218462349.jpg" },
      { name: "雫あいら", age: "25", size: "T.166 / B.88(E) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/594/022302435638.jpg" },
      { name: "桜庭ののか", age: "22", size: "T.160 / B.86(C) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/699/033017332253.jpg" },
      { name: "戸田みらい", age: "18", size: "T.164 / B.90(G) / W.57 / H.89", img: "https://grandaromatokyo.com/images_staff/725/03161637377.jpg" },
      { name: "古沢さや", age: "20", size: "T.155 / B.88(F) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/664/011000450289.jpg" },
      { name: "青山みゆう", age: "26", size: "T.171 / B.87(D) / W.58 / H.87", img: "https://grandaromatokyo.com/images_staff/416/121103120053.jpg" },
      { name: "篠原なおみ", age: "27", size: "T.160 / B.91(H) / W.58 / H.90", img: "https://grandaromatokyo.com/images_staff/661/120517284273.jpg" },
      { name: "白川れな", age: "24", size: "T.165 / B.88(E) / W.58 / H.90", img: "https://grandaromatokyo.com/images_staff/403/011520424557.jpg" },
      { name: "白鳥みな", age: "20", size: "T.166 / B.85(C) / W.58 / H.84", img: "https://grandaromatokyo.com/images_staff/262/120319580395.jpg" },
      { name: "汐華なの", age: "21", size: "T.154 / B.89(F) / W.59 / H.87", img: "https://grandaromatokyo.com/images_staff/188/121218015856.jpg" },
      { name: "清水いろは", age: "24", size: "T.170 / B.86(D) / W.59 / H.87", img: "https://grandaromatokyo.com/images_staff/176/011219210058.jpg" },
      { name: "中野あきな", age: "24", size: "T.152 / B.86(C) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/571/010622203368.jpg" },
      { name: "相澤なな", age: "25", size: "T.157 / B.86(C) / W.57 / H.87", img: "https://grandaromatokyo.com/images_staff/573/070722521954.jpg" },
      { name: "柏木みう", age: "21", size: "T.157 / B.85(C) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/561/010622202626.jpg" },
      { name: "渚えみり", age: "21", size: "T.148 / B.86(D) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/300/06181858153.jpg" },
      { name: "新道まや", age: "24", size: "T.157 / B.89(E) / W.59 / H.90", img: "https://grandaromatokyo.com/images_staff/648/100718260736.jpg" },
      { name: "桃乃木りか", age: "20", size: "T.155 / B.86(D) / W.57 / H.85", img: "https://grandaromatokyo.com/images_staff/203/011219204535.jpg" },
      { name: "宍戸うみ", age: "25", size: "T.166 / B.88(F) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/622/071623571630.jpg" },
      { name: "雪乃あん", age: "25", size: "T.158 / B.86(E) / W.59 / H.85", img: "https://grandaromatokyo.com/images_staff/225/121218551846.jpg" },
      { name: "蓮水きょうこ", age: "28", size: "T.160 / B.87(F) / W.58 / H.90", img: "https://grandaromatokyo.com/images_staff/636/082718530274.jpg" },
      { name: "南野さゆり", age: "25", size: "T.155 / B.88(E) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/546/041201122916.jpg" },
      { name: "天馬ひめか", age: "23", size: "T.159 / B.92(I) / W.57 / H.90", img: "https://grandaromatokyo.com/images_staff/585/02191623551.jpg" },
      { name: "天音まひろ", age: "23", size: "T.157 / B.88(E) / W.58 / H.88", img: "https://grandaromatokyo.com/images_staff/554/052013584070.jpg" },
      { name: "岡田なち", age: "22", size: "T.162 / B.87(F) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/514/092315565468.jpg" },
      { name: "白石さくら", age: "21", size: "T.158 / B.91(G) / W.58 / H.89", img: "https://grandaromatokyo.com/images_staff/586/032317511649.jpg" },
      { name: "白石さな", age: "21", size: "T.155 / B.90(G) / W.57 / H.90", img: "https://grandaromatokyo.com/images_staff/645/07231836279.jpg" },
      { name: "滝沢らいか", age: "23", size: "T.158 / B.89(F) / W.57 / H.89", img: "https://grandaromatokyo.com/images_staff/598/041201130535.jpg" },
      { name: "水瀬れい", age: "22", size: "T.162 / B.87(D) / W.57 / H.88", img: "https://grandaromatokyo.com/images_staff/548/100616064947.jpg" },
      { name: "朝日奈のあ", age: "21", size: "T.154 / B.85(C) / W.57 / H.86", img: "https://grandaromatokyo.com/images_staff/564/041201120986.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「グランドアロマ東京」を検索し、完全なキャスト更新を実行します...\n`);

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

      // 💡 追加: 店舗の基本情報（HP、スケジュール、システム）を更新
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

      // キャストの更新処理
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
    
    console.log(`\n🎊 すべての更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
