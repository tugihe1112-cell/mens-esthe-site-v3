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

  const shopData = {
    website_url: "https://dejavu-tokyo.net/",
    schedule_url: "https://dejavu-tokyo.net/schedule",
    price_system: "70分: 16,000円\n090分: 18,000円\n120分: 24,000円\n150分: 30,000円\n180分: 36,000円",
    casts: [
      { name: "桜井あみ", age: "22", size: "T.156 / B.85(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/598/raw_598.jpeg" },
      { name: "秦野もね", age: "23", size: "T.157 / B.85(D) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/597/raw_597.jpeg" },
      { name: "木下もえみ", age: "19", size: "T.151 / B.89(F) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/592/raw_592.jpeg" },
      { name: "天野みれい", age: "20", size: "T.165 / B.87(E) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/589/raw_589.jpeg" },
      { name: "日向あむ", age: "24", size: "T.151 / B.86(D) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/587/raw_587.jpeg" },
      { name: "恵のん", age: "25", size: "T.160 / B.90(G) / W.56 / H.87", img: "https://dejavu-tokyo.net/photos/585/raw_585.jpg" },
      { name: "相澤かすみ", age: "25", size: "T.159 / B.87(E) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/583/raw_583.jpg" },
      { name: "高宮つき", age: "23", size: "T.156 / B.86(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/582/raw_582.jpeg" },
      { name: "海風あいら", age: "26", size: "T.163 / B.88(E) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/581/raw_581.jpeg" },
      { name: "岸谷るか", age: "23", size: "T.156 / B.90(F) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/580/raw_580.jpg" },
      { name: "天宮みゆ", age: "27", size: "T.165 / B.88(F) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/579/raw_579.jpeg" },
      { name: "七道くう", age: "21", size: "T.150 / B.85(C) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/577/raw_577.jpeg" },
      { name: "結城める", age: "25", size: "T.153 / B.86(E) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/574/raw_574.jpg" },
      { name: "立花ひより", age: "26", size: "T.156 / B.90(G) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/571/raw_571.jpeg" },
      { name: "七瀬らな", age: "20", size: "T.160 / B.86(E) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/570/raw_570.jpg" },
      { name: "山下あいか", age: "26", size: "T.170 / B.90(G) / W.56 / H.87", img: "https://dejavu-tokyo.net/photos/569/raw_569.jpeg" },
      { name: "白鳥いずみ", age: "26", size: "T.170 / B.88(F) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/566/raw_566.jpg" },
      { name: "佐々木ゆきな", age: "24", size: "T.158 / B.86(E) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/565/raw_565.jpg" },
      { name: "芹沢りお", age: "24", size: "T.155 / B.85(C) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/564/raw_564.jpg" },
      { name: "咲野みこ", age: "20", size: "T.155 / B.86(E) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/563/raw_563.jpg" },
      { name: "安藤みな", age: "24", size: "T.165 / B.88(F) / W.54 / H.85", img: "https://dejavu-tokyo.net/photos/562/raw_562.jpg" },
      { name: "有栖せりか", age: "25", size: "T.158 / B.88(F) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/561/raw_561.jpg" },
      { name: "神宮寺うるは", age: "21", size: "T.160 / B.84(C) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/560/raw_560.jpeg" },
      { name: "天音みさき", age: "23", size: "T.155 / B.86(E) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/559/raw_559.jpg" },
      { name: "瀬尾まりか", age: "27", size: "T.157 / B.86(E) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/558/raw_558.jpg" },
      { name: "吉田まよ", age: "25", size: "T.160 / B.86(E) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/557/raw_557.jpg" },
      { name: "南れいこ", age: "28", size: "T.170 / B.92(H) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/554/raw_554.jpeg" },
      { name: "山下なのか", age: "22", size: "T.152 / B.86(D) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/553/raw_553.jpeg" },
      { name: "小野寺りりこ", age: "29", size: "T.165 / B.86(D) / W.56 / H.85", img: "https://dejavu-tokyo.net/photos/552/raw_552.jpg" },
      { name: "白河さらら", age: "21", size: "T.166 / B.85(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/551/raw_551.jpeg" },
      { name: "南雲あいみ", age: "23", size: "T.168 / B.88(F) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/549/raw_549.jpg" },
      { name: "水瀬せいら", age: "25", size: "T.160 / B.88(E) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/548/raw_548.jpg" },
      { name: "泉あこ", age: "28", size: "T.156 / B.86(D) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/545/raw_545.jpg" },
      { name: "白鳥ここは", age: "20", size: "T.160 / B.85(C) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/542/raw_542.jpeg" },
      { name: "飯田こはる", age: "21", size: "T.163 / B.85(C) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/541/raw_541.jpeg" },
      { name: "岸辺ゆうり", age: "32", size: "T.155 / B.92(G) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/540/raw_540.jpeg" },
      { name: "観月りょう", age: "26", size: "T.156 / B.85(C) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/539/raw_539.jpeg" },
      { name: "及川ふゆ", age: "26", size: "T.158 / B.86(D) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/538/raw_538.jpg" },
      { name: "折原らん", age: "25", size: "T.167 / B.85(D) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/537/raw_537.jpeg" },
      { name: "佐藤あや", age: "26", size: "T.168 / B.88(E) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/535/raw_535.jpeg" },
      { name: "華月ゆずか", age: "27", size: "T.156 / B.85(C) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/534/raw_534.jpg" },
      { name: "花沢こころ", age: "20", size: "T.154 / B.85(C) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/533/raw_533.jpeg" },
      { name: "えま", age: "20", size: "T.162 / B.87(E) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/531/raw_531.jpeg" },
      { name: "深山あさみ", age: "24", size: "T.167 / B.88(F) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/526/raw_526.jpeg" },
      { name: "椿れい", age: "23", size: "T.162 / B.86(C) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/525/raw_525.jpeg" },
      { name: "愛須りか", age: "25", size: "T.158 / B.90(H) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/523/raw_523.jpeg" },
      { name: "のん", age: "20", size: "T.158 / B.86(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/517/raw_517.jpeg" },
      { name: "藤咲あすか", age: "26", size: "T.156 / B.92(H) / W.56 / H.87", img: "https://dejavu-tokyo.net/photos/515/raw_515.jpeg" },
      { name: "秋山こゆき", age: "26", size: "T.162 / B.86(D) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/513/raw_513.jpeg" },
      { name: "浅田まみ", age: "26", size: "T.163 / B.87(D) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/512/raw_512.jpeg" },
      { name: "大澤さや", age: "23", size: "T.154 / B.87(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/511/raw_511.jpeg" },
      { name: "小川えり", age: "20", size: "T.163 / B.86(D) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/510/raw_510.jpeg" },
      { name: "大島まいか", age: "23", size: "T.150 / B.85(C) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/508/raw_508.jpeg" },
      { name: "白咲みさ", age: "21", size: "T.155 / B.84(D) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/503/raw_503.jpeg" },
      { name: "黒江あいこ", age: "22", size: "T.155 / B.88(F) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/498/raw_498.jpeg" },
      { name: "ひとみ", age: "23", size: "T.157 / B.88(E) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/497/raw_497.jpeg" },
      { name: "滝本いぶき", age: "20", size: "T.160 / B.85(C) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/494/raw_494.jpeg" },
      { name: "白石うた", age: "23", size: "T.173 / B.87(D) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/493/raw_493.jpeg" },
      { name: "伊藤あおい", age: "23", size: "T.168 / B.86(C) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/492/raw_492.jpg" },
      { name: "南野さわ", age: "26", size: "T.160 / B.85(C) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/491/raw_491.jpeg" },
      { name: "箱崎あや", age: "20", size: "T.158 / B.85(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/490/raw_490.jpeg" },
      { name: "長谷りおな", age: "24", size: "T.158 / B.85(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/488/raw_488.jpeg" },
      { name: "一宮すい", age: "22", size: "T.160 / B.86(F) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/486/raw_486.jpeg" },
      { name: "椎名すみれ", age: "24", size: "T.154 / B.85(C) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/485/raw_485.jpg" },
      { name: "白石らん", age: "27", size: "T.168 / B.86(C) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/484/raw_484.jpg" },
      { name: "白峰ひらり", age: "25", size: "T.153 / B.86(E) / W.53 / H.84", img: "https://dejavu-tokyo.net/photos/482/raw_482.jpeg" },
      { name: "立石ゆいな", age: "21", size: "T.167 / B.90(F) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/474/raw_474.jpg" },
      { name: "澤井まな", age: "25", size: "T.158 / B.85(D) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/471/raw_471.jpg" },
      { name: "篠宮ひなた", age: "22", size: "T.158 / B.88(F) / W.54 / H.85", img: "https://dejavu-tokyo.net/photos/470/raw_470.jpg" },
      { name: "倉木ちなつ", age: "22", size: "T.163 / B.88(E) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/466/raw_466.jpeg" },
      { name: "堤沢こと", age: "24", size: "T.156 / B.87(E) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/464/raw_464.jpeg" },
      { name: "てぃな", age: "23", size: "T.166 / B.86(E) / W.54 / H.85", img: "https://dejavu-tokyo.net/photos/463/raw_463.jpeg" },
      { name: "川添りな", age: "26", size: "T.157 / B.86(E) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/458/raw_458.jpg" },
      { name: "田中さら", age: "27", size: "T.155 / B.85(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/457/raw_457.jpeg" },
      { name: "春野ゆづき", age: "27", size: "T.165 / B.88(F) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/455/raw_455.jpg" },
      { name: "杉本みいな", age: "26", size: "T.166 / B.96(H) / W.55 / H.87", img: "https://dejavu-tokyo.net/photos/452/raw_452.jpeg" },
      { name: "近藤せいら", age: "22", size: "T.166 / B.88(F) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/449/raw_449.jpeg" },
      { name: "早瀬のぞみ", age: "21", size: "T.166 / B.86(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/443/raw_443.jpg" },
      { name: "三谷しずく", age: "23", size: "T.160 / B.86(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/437/raw_437.jpeg" },
      { name: "三宅すず", age: "23", size: "T.165 / B.90(F) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/435/raw_435.jpg" },
      { name: "大橋さら", age: "20", size: "T.148 / B.86(E) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/427/raw_427.jpeg" },
      { name: "龍宮れいな", age: "24", size: "T.164 / B.87(F) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/423/raw_423.jpeg" },
      { name: "北野もえか", age: "21", size: "T.158 / B.56(C) / W.54 / H.85", img: "https://dejavu-tokyo.net/photos/418/raw_418.jpeg" },
      { name: "工藤さつき", age: "27", size: "T.167 / B.92(G) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/415/raw_415.jpeg" },
      { name: "奥田ゆの", age: "25", size: "T.165 / B.85(C) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/414/raw_414.jpeg" },
      { name: "北川れん", age: "21", size: "T.163 / B.86(D) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/413/raw_413.jpeg" },
      { name: "木村ひなみ", age: "21", size: "T.165 / B.87(E) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/412/raw_412.jpg" },
      { name: "桃沢るる", age: "21", size: "T.155 / B.85(C) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/409/raw_409.jpeg" },
      { name: "月島あかり", age: "33", size: "T.168 / B.88(F) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/404/raw_404.jpeg" },
      { name: "川添みさき", age: "22", size: "T.153 / B.86(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/397/raw_397.jpg" },
      { name: "楠本ゆうき", age: "20", size: "T.165 / B.90(F) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/396/raw_396.jpg" },
      { name: "白雪ゆあ", age: "23", size: "T.157 / B.88(F) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/388/raw_388.jpg" },
      { name: "黒川さや", age: "29", size: "T.161 / B.88(F) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/386/raw_386.jpg" },
      { name: "小西まあみ", age: "18", size: "T.154 / B.85(D) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/385/raw_385.jpeg" },
      { name: "山城もえ", age: "19", size: "T.155 / B.85(D) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/398/raw_398.jpg" },
      { name: "滝沢さくら", age: "18", size: "T.154 / B.86(E) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/374/raw_374.jpg" },
      { name: "竹内もえ", age: "21", size: "T.155 / B.93(I) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/373/raw_373.jpeg" },
      { name: "向日葵なつほ", age: "27", size: "T.160 / B.86(D) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/371/raw_371.jpg" },
      { name: "一ノ瀬みやび", age: "21", size: "T.168 / B.85(C) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/368/raw_368.jpeg" },
      { name: "水瀬ことは", age: "22", size: "T.160 / B.86(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/375/raw_375.jpg" },
      { name: "近藤りり", age: "23", size: "T.158 / B.88(G) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/312/raw_312.jpg" },
      { name: "西田はるか", age: "20", size: "T.160 / B.86(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/309/raw_309.jpg" },
      { name: "稲本ゆり", age: "20", size: "T.160 / B.87(E) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/307/raw_307.jpg" },
      { name: "松村さき", age: "19", size: "T.162 / B.85(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/305/raw_305.jpg" },
      { name: "木村のえ", age: "21", size: "T.156 / B.84(C) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/304/raw_304.jpg" },
      { name: "秋元しゅうか", age: "23", size: "T.161 / B.85(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/301/raw_301.jpg" },
      { name: "吉川もえの", age: "20", size: "T.158 / B.90(G) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/298/raw_298.jpg" },
      { name: "一条みなみ", age: "23", size: "T.165 / B.86(E) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/310/raw_310.jpeg" },
      { name: "瀬戸めあり", age: "22", size: "T.156 / B.88(G) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/292/raw_292.jpg" },
      { name: "谷あすか", age: "25", size: "T.161 / B.86(E) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/295/raw_295.jpg" },
      { name: "喜多川あん", age: "26", size: "T.158 / B.86(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/294/raw_294.jpg" },
      { name: "杉本もな", age: "19", size: "T.157 / B.85(C) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/299/raw_299.jpeg" },
      { name: "真白るな", age: "23", size: "T.168 / B.85(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/287/raw_287.jpg" },
      { name: "飯島ひかる", age: "25", size: "T.155 / B.85(D) / W.56 / H.84", img: "https://dejavu-tokyo.net/photos/286/raw_286.jpg" },
      { name: "坂下ゆずか", age: "27", size: "T.163 / B.86(D) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/282/raw_282.jpg" },
      { name: "木下れい", age: "26", size: "T.163 / B.86(D) / W.56 / H.85", img: "https://dejavu-tokyo.net/photos/279/raw_279.jpg" },
      { name: "近藤なぎ", age: "19", size: "T.160 / B.86(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/277/raw_277.jpg" },
      { name: "三谷ゆう", age: "22", size: "T.168 / B.86(D) / W.56 / H.85", img: "https://dejavu-tokyo.net/photos/276/raw_276.jpg" },
      { name: "福田ゆな", age: "23", size: "T.156 / B.86(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/271/raw_271.jpg" },
      { name: "成田あゆみ", age: "24", size: "T.160 / B.86(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/268/raw_268.jpg" },
      { name: "井上みお", age: "20", size: "T.154 / B.85(C) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/264/raw_264.jpg" },
      { name: "永野きほ", age: "19", size: "T.156 / B.86(D) / W.56 / H.85", img: "https://dejavu-tokyo.net/photos/263/raw_263.jpg" },
      { name: "葉月ゆりな", age: "26", size: "T.168 / B.85(C) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/260/raw_260.jpg" },
      { name: "工藤せな", age: "20", size: "T.153 / B.83(C) / W.54 / H.82", img: "https://dejavu-tokyo.net/photos/259/raw_259.jpg" },
      { name: "一ノ瀬もも", age: "19", size: "T.150 / B.88(G) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/258/raw_258.jpg" },
      { name: "有村しほ", age: "26", size: "T.163 / B.88(F) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/256/raw_256.jpg" },
      { name: "楠木りこ", age: "21", size: "T.160 / B.90(G) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/248/raw_248.jpg" },
      { name: "松浦かえで", age: "28", size: "T.158 / B.86(E) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/245/raw_245.jpg" },
      { name: "津代ここ", age: "24", size: "T.163 / B.86(D) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/242/raw_242.jpg" },
      { name: "佐野まい", age: "26", size: "T.163 / B.85(C) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/241/raw_241.jpg" },
      { name: "桜井かれん", age: "19", size: "T.160 / B.86(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/239/raw_239.jpg" },
      { name: "朝比奈まり", age: "28", size: "T.157 / B.92(H) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/238/raw_238.jpg" },
      { name: "栗山にいな", age: "19", size: "T.168 / B.90(G) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/237/raw_237.jpg" },
      { name: "和泉まや", age: "24", size: "T.156 / B.85(C) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/232/raw_232.jpg" },
      { name: "星野れな", age: "23", size: "T.166 / B.85(C) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/229/raw_229.jpg" },
      { name: "伊藤まりん", age: "20", size: "T.158 / B.86(D) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/228/raw_228.jpg" },
      { name: "山本ひな", age: "18", size: "T.156 / B.86(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/227/raw_227.jpg" },
      { name: "新田そら", age: "21", size: "T.155 / B.84(C) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/225/raw_225.jpg" },
      { name: "茉白うる", age: "21", size: "T.165 / B.85(D) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/224/raw_224.jpg" },
      { name: "白咲まや", age: "23", size: "T.153 / B.86(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/215/raw_215.jpg" },
      { name: "矢田くるみ", age: "23", size: "T.168 / B.86(C) / W.56 / H.85", img: "https://dejavu-tokyo.net/photos/211/raw_211.jpg" },
      { name: "三井りん", age: "25", size: "T.165 / B.92(H) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/201/raw_201.jpg" },
      { name: "宮下なぎ", age: "25", size: "T.158 / B.85(C) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/199/raw_199.jpeg" },
      { name: "木下みいあ", age: "20", size: "T.157 / B.84(C) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/197/raw_197.jpg" },
      { name: "田辺せんり", age: "26", size: "T.158 / B.85(C) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/195/raw_195.jpg" },
      { name: "美波あずさ", age: "22", size: "T.156 / B.86(D) / W.56 / H.85", img: "https://dejavu-tokyo.net/photos/191/raw_191.jpg" },
      { name: "倉田ゆず", age: "25", size: "T.168 / B.90(G) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/188/raw_188.jpg" },
      { name: "谷口ゆあ", age: "20", size: "T.167 / B.90(H) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/183/raw_183.jpg" },
      { name: "日野原みさと", age: "20", size: "T.164 / B.85(C) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/179/raw_179.jpg" },
      { name: "広瀬ひまり", age: "20", size: "T.165 / B.85(C) / W.54 / H.85", img: "https://dejavu-tokyo.net/photos/178/raw_178.jpg" },
      { name: "須藤さえ", age: "25", size: "T.158 / B.86(E) / W.54 / H.85", img: "https://dejavu-tokyo.net/photos/175/raw_175.jpg" },
      { name: "橋本まなみ", age: "23", size: "T.163 / B.92(H) / W.55 / H.86", img: "https://dejavu-tokyo.net/photos/173/raw_173.jpg" },
      { name: "白石きょうか", age: "21", size: "T.158 / B.86(E) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/174/raw_174.jpg" },
      { name: "石原さな", age: "25", size: "T.162 / B.90(G) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/171/raw_171.jpg" },
      { name: "成瀬めい", age: "21", size: "T.160 / B.86(E) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/169/raw_169.jpg" },
      { name: "上条ゆな", age: "21", size: "T.157 / B.86(C) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/167/raw_167.jpg" },
      { name: "高畑まりあ", age: "23", size: "T.165 / B.93(H) / W.56 / H.88", img: "https://dejavu-tokyo.net/photos/166/raw_166.jpg" },
      { name: "葉山かおり", age: "21", size: "T.158 / B.86(C) / W.54 / H.85", img: "https://dejavu-tokyo.net/photos/146/raw_146.jpg" },
      { name: "木崎まどか", age: "20", size: "T.155 / B.85(C) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/137/raw_137.jpg" },
      { name: "平田ゆうな", age: "26", size: "T.155 / B.92(H) / W.57 / H.87", img: "https://dejavu-tokyo.net/photos/118/raw_118.jpg" },
      { name: "高橋ほのか", age: "26", size: "T.160 / B.85(C) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/117/raw_117.jpg" },
      { name: "白石あや", age: "25", size: "T.166 / B.90(F) / W.56 / H.86", img: "https://dejavu-tokyo.net/photos/115/raw_115.jpg" },
      { name: "蒼井はな", age: "21", size: "T.165 / B.85(C) / W.53 / H.84", img: "https://dejavu-tokyo.net/photos/126/raw_126.jpg" },
      { name: "美咲ありさ", age: "21", size: "T.158 / B.84(C) / W.52 / H.83", img: "https://dejavu-tokyo.net/photos/136/raw_136.jpg" },
      { name: "香坂ゆず", age: "20", size: "T.154 / B.84(C) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/79/raw_79.jpg" },
      { name: "清水まほ", age: "22", size: "T.165 / B.86(D) / W.55 / H.85", img: "https://dejavu-tokyo.net/photos/78/raw_78.jpg" },
      { name: "白崎るな", age: "25", size: "T.160 / B.84(C) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/125/raw_125.jpg" },
      { name: "市原いと", age: "23", size: "T.168 / B.85/ W.54 / H.84", img: "https://dejavu-tokyo.net/photos/8/raw_8.jpg" },
      { name: "成瀬もも", age: "19", size: "T.158 / B.84(C) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/11/raw_11.jpg" },
      { name: "結城あい", age: "19", size: "T.163 / B.90(F) / W.54 / H.85", img: "https://dejavu-tokyo.net/photos/14/raw_14.jpg" },
      { name: "鈴村まり", age: "25", size: "T.158 / B.86(D) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/17/raw_17.jpg" },
      { name: "橘ましろ", age: "20", size: "T.160 / B.85(C) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/2/raw_2.jpg" },
      { name: "北条ゆい", age: "26", size: "T.154 / B.90(G) / W.56 / H.84", img: "https://dejavu-tokyo.net/photos/24/raw_24.jpg" },
      { name: "堀越ゆり", age: "24", size: "T.154 / B.83(E) / W.54 / H.83", img: "https://dejavu-tokyo.net/photos/25/raw_25.jpg" },
      { name: "長谷川みら", age: "25", size: "T.162 / B.85(C) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/3/raw_3.jpg" },
      { name: "一咲かんな", age: "21", size: "T.155 / B.84(D) / W.52 / H.83", img: "https://dejavu-tokyo.net/photos/28/raw_28.jpg" },
      { name: "夢乃らん", age: "19", size: "T.153 / B.86(E) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/32/raw_32.jpg" },
      { name: "明神みやび", age: "23", size: "T.157 / B.85(D) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/34/raw_34.jpg" },
      { name: "真鍋しゅり", age: "19", size: "T.164 / B.84(C) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/36/raw_36.jpg" },
      { name: "一ノ瀬りこ", age: "20", size: "T.166 / B.85(D) / W.55 / H.84", img: "https://dejavu-tokyo.net/photos/39/raw_39.jpg" },
      { name: "橋本れな", age: "21", size: "T.156 / B.86(E) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/43/raw_43.jpg" },
      { name: "七海せな", age: "23", size: "T.164 / B.85(D) / W.52 / H.83", img: "https://dejavu-tokyo.net/photos/44/raw_44.jpg" },
      { name: "白坂はな", age: "19", size: "T.155 / B.86(F) / W.54 / H.84", img: "https://dejavu-tokyo.net/photos/45/raw_45.jpg" },
      { name: "望月ゆうみ", age: "21", size: "T.158 / B.84(C) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/46/raw_46.jpg" },
      { name: "加藤あいり", age: "22", size: "T.156 / B.84(E) / W.53 / H.83", img: "https://dejavu-tokyo.net/photos/48/raw_48.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから「Dejavu TOKYO」を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // 「dejavu」「デジャヴ」が含まれる店舗を抽出
    const targetShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return n.includes('dejavu') || n.includes('デジャヴ');
    });

    if (targetShops.length > 0) {
      for (const shop of targetShops) {
        console.log(`🏠 対象店舗: ${shop.name} (ID: ${shop.id})`);
        
        // 1. ホームページURL、スケジュールURL、料金システムを更新
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            website_url: shopData.website_url,
            schedule_url: shopData.schedule_url,
            price_system: shopData.price_system
          })
        });

        if (patchRes.ok) {
          console.log(`  ✅ ホームページ・スケジュールURL・料金システム更新完了`);
        } else {
          console.error(`  ❌ 店舗情報の更新に失敗しました: ${patchRes.statusText}`);
          continue; 
        }

        // 2. キャストの更新
        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
        const dbCasts = await dbRes.json();
        
        let updateCount = 0;
        let insertCount = 0;

        const uniqueCasts = Array.from(new Map(shopData.casts.map(c => [c.name, c])).values());

        for (const cast of uniqueCasts) {
          // 余計な空白を消す
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
        console.log(`  🎉 キャスト設定完了（新規: ${insertCount}名 / 画像・プロフ更新: ${updateCount}名）\n`);
      }
      console.log(`🎊 「Dejavu TOKYO」の更新が完了しました！ブラウザをリロードして確認してください！`);
    } else {
      console.log("⚠️ 「Dejavu TOKYO」を含む店舗が見つかりませんでした。");
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
