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
      searchKeywords: ['lynx', 'リンクス'],
      website_url: "https://esthe-lynx-shinjuku.com/",
      schedule_url: "https://esthe-lynx-shinjuku.com/schedule/",
      price_system: "80分: 15,400円(税込)\n90分: 17,600円(税込)\n120分: 24,200円(税込)\n150分: 30,800円(税込)",
      casts: [
        { name: "神楽のあ", age: "21", size: "T.162 / B.101(I) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1420-20260406045109" },
        { name: "一条えりな", age: "21", size: "T.160 / B.85(E) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1419-20260404074354" },
        { name: "沖野ゆめ", age: "24", size: "T.162 / B.87(E) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1418-20260404023251.jpg" },
        { name: "福本りむ", age: "22", size: "T.161 / B.93(G) / W.56 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1417-20260403011203" },
        { name: "佐藤おさき", age: "18", size: "T.165 / B.81(B) / W.55 / H.80", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1416-20260331051913.jpg" },
        { name: "雪乃ゆな", age: "20", size: "T.166 / B.94(G) / W.56 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1415-20260328125549" },
        { name: "中条るか", age: "21", size: "T.174 / B.89(D) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1414-20260330061149.jpg" },
        { name: "高野めろん", age: "29", size: "T.155 / B.86(E) / W.58 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1413-20260326065550.jpg" },
        { name: "伊藤りな", age: "20", size: "T.165 / B.86(E) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1412-20260331044716.jpg" },
        { name: "小春ゆみ", age: "20", size: "T.151 / B.82(C) / W.56 / H.81", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1411-20260324070953.jpg" },
        { name: "和実うた", age: "20", size: "T.158 / B.92(G) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1410-20260326071648.jpg" },
        { name: "蓮見るあ", age: "23", size: "T.163 / B.99(I) / W.57 / H.89", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1409-20260321023036.jpg" },
        { name: "木下かなめ", age: "19", size: "T.160 / B.84(D) / W.57 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1408-20260320043758.jpg" },
        { name: "甘宮める", age: "20", size: "T.152 / B.85(D) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1407-20260320100816.jpg" },
        { name: "藤田ことね", age: "22", size: "T.163 / B.90(G) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1406-20260318093251.jpg" },
        { name: "天川らな", age: "20", size: "T.159 / B.96(H) / W.58 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1405-20260318014327.jpg" },
        { name: "早見りおん", age: "21", size: "T.164 / B.95(H) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1404-20260328011903.jpg" },
        { name: "雫れもん", age: "20", size: "T.165 / B.87(E) / W.56 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1401-20260310103611.jpg" },
        { name: "山田のの", age: "22", size: "T.157 / B.87(E) / W.54 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1397-20260305071346.jpg" },
        { name: "桜庭うる", age: "23", size: "T.160 / B.92(G) / W.56 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1400-20260318114812.jpg" },
        { name: "豊田ノア", age: "20", size: "T.161 / B.85(E) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1399-20260311101149.jpg" },
        { name: "藤咲みれい", age: "18", size: "T.158 / B.85(D) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1398-20260305112427.jpg" },
        { name: "羽月れん", age: "23", size: "T.167 / B.84(D) / W.57 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1396-20260303043341.jpg" },
        { name: "星宮ゆめ", age: "18", size: "T.155 / B.87(E) / W.57 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1394-20260301032752.jpg" },
        { name: "杉本ゆり", age: "21", size: "T.151 / B.84(D) / W.57 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1395-20260301032644.jpg" },
        { name: "神楽ひめか", age: "21", size: "T.158 / B.89(F) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1393-20260227034354" },
        { name: "百瀬こなん", age: "22", size: "T.153 / B.87(E) / W.56 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1392-20260302023701" },
        { name: "立花あい", age: "20", size: "T.159 / B.89(F) / W.55 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1391-20260226042610.jpg" },
        { name: "牧村りあな", age: "22", size: "T.153 / B.102(K) / W.60 / H.90", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1389-20260401100209.jpg" },
        { name: "相馬らん", age: "22", size: "T.150 / B.98(I) / W.59 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1386-20260218113923.jpg" },
        { name: "霞ハニ", age: "23", size: "T.158 / B.86(D) / W.55 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1383-20260220051322.jpg" },
        { name: "結城さくな", age: "22", size: "T.160 / B.110(J) / W.64 / H.94", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1381-20260220032303.jpg" },
        { name: "春風たまき", age: "20", size: "T.160 / B.88(F) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1385-20260306081017" },
        { name: "岩田さくら", age: "18", size: "T.155 / B.88(E) / W.55 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1382-20260213052313" },
        { name: "水瀬あいら", age: "21", size: "T.168 / B.86(E) / W.57 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1380-20260210062937.jpg" },
        { name: "佐久間みゆう", age: "20", size: "T.152 / B.82(C) / W.57 / H.81", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1378-20260203024907.jpg" },
        { name: "朝比奈みずき", age: "22", size: "T.150 / B.96(H) / W.59 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1376-20260131103924.jpg" },
        { name: "白井れな", age: "19", size: "T.159 / B.86(E) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1375-20260128032501.jpg" },
        { name: "望月のえる", age: "22", size: "T.162 / B.92(G) / W.57 / H.89", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1374-20260120033043.jpg" },
        { name: "野比かな", age: "20", size: "T.165 / B.87(D) / W.55 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1373-20260119074102" },
        { name: "高村あおい", age: "22", size: "T.170 / B.86(E) / W.57 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1372-20260118123529.jpg" },
        { name: "秋月ことね", age: "23", size: "T.147 / B.84(C) / W.57 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1371-20260117043755" },
        { name: "天羽りこ", age: "20", size: "T.148 / B.88(F) / W.56 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1370-20260122085452.jpg" },
        { name: "江口ゆうこ", age: "24", size: "T.165 / B.84(D) / W.55 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1368-20260106101041.jpg" },
        { name: "月宮のあ", age: "21", size: "T.163 / B.85(D) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1363-20251225014426.jpg" },
        { name: "華瀬もも", age: "21", size: "T.150 / B.87(E) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1360-20260112064910" },
        { name: "結城あすな", age: "24", size: "T.162 / B.87(E) / W.56 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1358-20251220065336" },
        { name: "指原まお", age: "24", size: "T.155 / B.86(D) / W.56 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1355-20251215031208" },
        { name: "藤見ひめ", age: "22", size: "T.166 / B.87(E) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1354-20251210025351.jpg" },
        { name: "瀬奈ゆゆ", age: "21", size: "T.161 / B.88(F) / W.58 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1353-20251209061930.jpg" },
        { name: "七海ゆん", age: "20", size: "T.158 / B.83(C) / W.56 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1351-20251207032558.jpg" },
        { name: "生田みく", age: "20", size: "T.158 / B.84(D) / W.55 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1350-20251206102909.jpg" },
        { name: "雪野ねむ", age: "19", size: "T.156 / B.88(F) / W.54 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1348-20251205064348.jpg" },
        { name: "神田このみ", age: "22", size: "T.164 / B.83(C) / W.57 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1347-20260130102225.jpg" },
        { name: "星川つむぎ", age: "24", size: "T.148 / B.90(G) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1346-20251203030441.jpg" },
        { name: "天使れい", age: "20", size: "T.159 / B.86(E) / W.56 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1345-20260215012006.jpg" },
        { name: "姫崎みに", age: "19", size: "T.148 / B.88(F) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1343-20260207113333.jpg" },
        { name: "荒牧りりあ", age: "18", size: "T.150 / B.84(D) / W.53 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1333-20260115063629" },
        { name: "音羽すず", age: "19", size: "T.164 / B.85(D) / W.53 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1331-20251109010841.jpg" },
        { name: "萌木リリカ", age: "19", size: "T.145 / B.102(K) / W.60 / H.90", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1342-20251120073555.jpg" },
        { name: "橘れいか", age: "24", size: "T.161 / B.85(D) / W.55 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1341-20251120023822.jpg" },
        { name: "南まき", age: "21", size: "T.157 / B.87(E) / W.55 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1340-20251130052558.jpg" },
        { name: "中野まいか", age: "22", size: "T.158 / B.94(H) / W.60 / H.89", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1338-20251118124054.jpg" },
        { name: "有馬みお", age: "22", size: "T.163 / B.86(E) / W.56 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/978-20251127072908.jpg" },
        { name: "星乃宮あいり", age: "20", size: "T.157 / B.94(H) / W.58 / H.89", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1336-20260201071101.jpg" },
        { name: "鳴海あお", age: "23", size: "T.156 / B.95(I) / W.58 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1337-20251121092140.jpg" },
        { name: "永月ことり", age: "19", size: "T.158 / B.93(G) / W.58 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1334-20251111100152.jpg" },
        { name: "福岡みな", age: "22", size: "T.152 / B.86(F) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1330-20251105031011.jpg" },
        { name: "結乃ゆの", age: "21", size: "T.148 / B.88(E) / W.56 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1325-20260317082312.jpg" },
        { name: "相見りこ", age: "27", size: "T.145 / B.85(D) / W.58 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1324-20251028051742.jpg" },
        { name: "春原ののん", age: "23", size: "T.161 / B.91(G) / W.56 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1323-20251022124901.jpg" },
        { name: "松本さり", age: "23", size: "T.161 / B.86(D) / W.58 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1322-20251020025510.jpg" },
        { name: "華宮りりな", age: "20", size: "T.158 / B.89(F) / W.57 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1321-20251221073305.jpg" },
        { name: "美咲めい", age: "21", size: "T.164 / B.89(F) / W.56 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1319-20251031080511" },
        { name: "大久保あい", age: "20", size: "T.157 / B.89(F) / W.59 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1318-20251021075530.jpg" },
        { name: "天音かるあ", age: "25", size: "T.160 / B.99(I) / W.59 / H.90", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1316-20251017065104.jpg" },
        { name: "柏木みる", age: "21", size: "T.160 / B.85(E) / W.54 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1313-20250927041501" },
        { name: "早瀬るか", age: "20", size: "T.165 / B.89(F) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1311-20250924115620.jpg" },
        { name: "一条ゆりさ", age: "24", size: "T.168 / B.88(F) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1310-20251120030647.jpg" },
        { name: "宇野のぞみ", age: "23", size: "T.160 / B.91(G) / W.59 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1307-20250920022705.jpg" },
        { name: "雪乃ちあ", age: "18", size: "T.157 / B.87(F) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1306-20250919065528.jpg" },
        { name: "音嶋りな", age: "22", size: "T.158 / B.99(H) / W.59 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1305-20250919032548.jpg" },
        { name: "恋瀬るん", age: "19", size: "T.160 / B.83(C) / W.54 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1304-20250918064104.jpg" },
        { name: "藤森はる", age: "20", size: "T.153 / B.89(F) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1301-20250914062903.jpg" },
        { name: "中条こころ", age: "21", size: "T.158 / B.90(F) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1300-20260114071822.jpg" },
        { name: "大咲まみ", age: "25", size: "T.154 / B.93(G) / W.59 / H.90", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1299-20250929042355.jpg" },
        { name: "葉月ゆあ", age: "21", size: "T.158 / B.85(E) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1298-20250904051638.jpg" },
        { name: "藤原はづき", age: "23", size: "T.156 / B.84(D) / W.55 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1296-20250915023655.jpg" },
        { name: "浅倉こと", age: "25", size: "T.156 / B.88(F) / W.58 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1295-20250917121105.jpg" },
        { name: "暁美ほむら", age: "20", size: "T.154 / B.97(H) / W.59 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1294-20250901044806.jpg" },
        { name: "秋山ゆう", age: "22", size: "T.155 / B.86(E) / W.57 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1292-20250829122927.jpg" },
        { name: "小金沢くるす", age: "21", size: "T.155 / B.88(F) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1291-20251017120118.jpg" },
        { name: "明日香らら", age: "22", size: "T.153 / B.84(C) / W.57 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1290-20250825050315.jpg" },
        { name: "谷口ひかり", age: "20", size: "T.152 / B.94(G) / W.62 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1289-20250823030537.jpg" },
        { name: "琥珀りり", age: "20", size: "T.154 / B.85(D) / W.56 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1286-20250818041741.jpg" },
        { name: "花園あかり", age: "18", size: "T.153 / B.88(F) / W.58 / H.89", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1281-20250814034728.jpg" },
        { name: "愛原いろは", age: "20", size: "T.163 / B.88(F) / W.59 / H.89", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1280-20251219080812.jpg" },
        { name: "猫塚なつは", age: "23", size: "T.150 / B.88(F) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1278-20250816123603.jpg" },
        { name: "海風はんな", age: "23", size: "T.162 / B.85(D) / W.55 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1277-20251114082406.jpg" },
        { name: "神園みゆ", age: "19", size: "T.166 / B.88(F) / W.57 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1276-20250807034508.jpg" },
        { name: "森咲あん", age: "21", size: "T.158 / B.86(E) / W.54 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1274-20250903012724.jpg" },
        { name: "小鳥遊りん", age: "23", size: "T.156 / B.83(B) / W.56 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1273-20250829015942.jpg" },
        { name: "月乃あやか", age: "24", size: "T.154 / B.85(D) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1271-20250725111155.jpg" },
        { name: "高橋なぎさ", age: "18", size: "T.155 / B.85(D) / W.54 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1268-20250718012143.jpg" },
        { name: "青羽ひより", age: "20", size: "T.166 / B.85(D) / W.55 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1267-20250711070337.jpg" },
        { name: "夢野れな", age: "24", size: "T.155 / B.96(I) / W.57 / H.89", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1265-20250709044050.jpg" },
        { name: "相沢あも", age: "23", size: "T.152 / B.102(H) / W.60 / H.90", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1262-20251101030040" },
        { name: "宮野さくら", age: "24", size: "T.153 / B.86(E) / W.58 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1256-20250628085421.jpg" },
        { name: "氷室れいか", age: "18", size: "T.165 / B.82(C) / W.57 / H.81", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1241-20250613053829.jpg" },
        { name: "夏目ましろ", age: "25", size: "T.166 / B.88(F) / W.59 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1239-20250906013231.jpg" },
        { name: "結木やや", age: "22", size: "T.160 / B.86(E) / W.57 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1228-20250620073646.jpg" },
        { name: "佐々木りか", age: "23", size: "T.158 / B.85(D) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1222-20250714034502.jpg" },
        { name: "白咲まあり", age: "20", size: "T.150 / B.86(E) / W.56 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1213-20251106070626.jpg" },
        { name: "森永ぷりん", age: "20", size: "T.168 / B.103(J) / W.60 / H.94", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1208-20251203095844.jpg" },
        { name: "羽田さら", age: "21", size: "T.161 / B.85(D) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1207-20250623040101.jpg" },
        { name: "水原まいか", age: "20", size: "T.158 / B.84(D) / W.55 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1200-20250427062444.jpg" },
        { name: "姫乃つき", age: "23", size: "T.155 / B.87(E) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1198-20250425112734.jpg" },
        { name: "海瀬るり", age: "20", size: "T.163 / B.84(C) / W.56 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1189-20250415085031.jpg" },
        { name: "椎名りゆ", age: "21", size: "T.164 / B.82(C) / W.57 / H.81", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1185-20250421041317.jpg" },
        { name: "火野れい", age: "23", size: "T.157 / B.88(F) / W.55 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1183-20250624031445" },
        { name: "有馬れみ", age: "22", size: "T.154 / B.93(G) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1181-20250409063250.jpg" },
        { name: "姫咲ふゆか", age: "20", size: "T.162 / B.92(G) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1178-20250514075304.jpg" },
        { name: "白石ゆいか", age: "23", size: "T.150 / B.83(C) / W.56 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1176-20251203092633.jpg" },
        { name: "椿りの", age: "23", size: "T.163 / B.84(D) / W.56 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1172-20251119041525.jpg" },
        { name: "長浜もえ", age: "23", size: "T.163 / B.95(H) / W.58 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1163-20250318035703.jpg" },
        { name: "石辺めい", age: "22", size: "T.148 / B.89(F) / W.59 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1162-20250609032412.jpg" },
        { name: "橘さな", age: "23", size: "T.167 / B.87(E) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1161-20250314103356.jpg" },
        { name: "朝葉うみ", age: "25", size: "T.156 / B.100(I) / W.57 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1149-20250306042627.jpg" },
        { name: "岸川める", age: "24", size: "T.152 / B.84(D) / W.57 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1143-20250224024731.jpg" },
        { name: "水瀬のあ", age: "20", size: "T.157 / B.83(C) / W.57 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1140-20250616030006.jpg" },
        { name: "美郷ゆうあ", age: "20", size: "T.160 / B.83(C) / W.56 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1133-20250213073746.jpg" },
        { name: "稲葉みな", age: "22", size: "T.148 / B.82(B) / W.52 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1127-20250208023018.jpg" },
        { name: "藤崎えりさ", age: "30", size: "T.170 / B.92(G) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1121-20250203062807.jpg" },
        { name: "関あかね", age: "22", size: "T.163 / B.88(E) / W.55 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1120-20250130020137" },
        { name: "半田ゆな", age: "22", size: "T.161 / B.89(F) / W.56 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1119-20250125063722.jpg" },
        { name: "前原しおり", age: "23", size: "T.152 / B.87(E) / W.57 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1113-20260115095029.jpg" },
        { name: "関口あみな", age: "22", size: "T.163 / B.88(F) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1109-20251101015105" },
        { name: "中島みかな", age: "19", size: "T.157 / B.86(E) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1106-20250609034923.jpg" },
        { name: "姫乃りん", age: "19", size: "T.155 / B.84(C) / W.54 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1101-20241226121246.jpg" },
        { name: "桐谷みれい", age: "26", size: "T.160 / B.91(G) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1099-20250727054130.jpg" },
        { name: "宮本りこ", age: "22", size: "T.160 / B.90(F) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1098-20250711121904.jpg" },
        { name: "苺みあ", age: "18", size: "T.148 / B.82(B) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1097-20250106035501.jpg" },
        { name: "香山ねむり", age: "22", size: "T.157 / B.92(G) / W.59 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1095-20251008060434.jpg" },
        { name: "槙野ゆき", age: "23", size: "T.150 / B.89(F) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1093-20241213103103.jpg" },
        { name: "井上らむ", age: "19", size: "T.163 / B.93(G) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1090-20241211104954.jpg" },
        { name: "藤堂みれい", age: "19", size: "T.166 / B.85(D) / W.58 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1089-20241211123133.jpg" },
        { name: "園田りや", age: "22", size: "T.158 / B.85(E) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1083-20251016091300.jpg" },
        { name: "柊木なずな", age: "23", size: "T.154 / B.96(G) / W.59 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1075-20250728071420.jpg" },
        { name: "中山たまご", age: "21", size: "T.147 / B.90(F) / W.57 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1071-20251101013850" },
        { name: "藤原みゆか", age: "21", size: "T.159 / B.84(D) / W.57 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1070-20241114102935.jpg" },
        { name: "桃倉あめ", age: "18", size: "T.157 / B.84(C) / W.54 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1068-20251227012815.jpg" },
        { name: "花織ことの", age: "19", size: "T.157 / B.84(C) / W.54 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1067-20251117051310" },
        { name: "植村みずき", age: "22", size: "T.158 / B.86(E) / W.57 / H.89", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1066-20241113085555.jpg" },
        { name: "一条るり", age: "18", size: "T.166 / B.83(C) / W.57 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1045-20241018031738.jpg" },
        { name: "綾瀬ゆめか", age: "18", size: "T.148 / B.88(F) / W.54 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1020-20260122073940" },
        { name: "海月うい", age: "20", size: "T.160 / B.82(B) / W.53 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1017-20260113055834" },
        { name: "白雪まい", age: "21", size: "T.159 / B.87(E) / W.57 / H.89", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1011-20251101023852" },
        { name: "中嶋みり", age: "20", size: "T.158 / B.88(F) / W.57 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1008-20240909091604.jpg" },
        { name: "黒崎てぃな", age: "20", size: "T.158 / B.92(G) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/1003-20240907071355.jpg" },
        { name: "一色ゆうか", age: "18", size: "T.158 / B.83(C) / W.57 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/868-20240929081300.jpg" },
        { name: "中川くれは", age: "20", size: "T.148 / B.88(F) / W.57 / H.89", img: "https://admin.esthe-lynx-ikebukuro.com/photos/990-20250609113652.jpg" },
        { name: "式波あおい", age: "23", size: "T.155 / B.102(I) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/979-20250827014635.jpg" },
        { name: "天使しの", age: "18", size: "T.158 / B.85(E) / W.55 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/976-20240722061524.jpg" },
        { name: "宝鐘れむ", age: "18", size: "T.158 / B.95(H) / W.58 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/975-20250609030813.jpg" },
        { name: "加藤みなみ", age: "22", size: "T.158 / B.85(D) / W.57 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/985-20260123051228.jpg" },
        { name: "天神えま", age: "20", size: "T.152 / B.85(D) / W.55 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/970-20250609050345.jpg" },
        { name: "七瀬かずは", age: "23", size: "T.153 / B.99(H) / W.59 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/960-20250609025044.jpg" },
        { name: "春花ひなの", age: "18", size: "T.164 / B.85(D) / W.58 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/939-20250814065907.jpg" },
        { name: "成瀬もな", age: "21", size: "T.160 / B.87(E) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/930-20251009115806.jpg" },
        { name: "丸山ゆい", age: "22", size: "T.158 / B.101(K) / W.58 / H.95", img: "https://admin.esthe-lynx-ikebukuro.com/photos/915-20250929025158.jpg" },
        { name: "桜井あや", age: "22", size: "T.176 / B.86(C) / W.60 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/902-20240412024400.jpg" },
        { name: "目黒ゆら", age: "22", size: "T.161 / B.88(F) / W.56 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/890-20251105083459.jpg" },
        { name: "双葉ゆに", age: "21", size: "T.162 / B.87(E) / W.54 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/855-20250608042259.jpg" },
        { name: "大内にこ", age: "21", size: "T.163 / B.87(F) / W.52 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/830-20251031085629" },
        { name: "青田みのり", age: "22", size: "T.165 / B.86(E) / W.56 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/810-20250608040114.jpg" },
        { name: "小澤ことは", age: "20", size: "T.155 / B.88(F) / W.57 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/785-20250608035900.jpg" },
        { name: "西園寺うらら", age: "23", size: "T.175 / B.83(D) / W.57 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/776-20251124012959.jpg" },
        { name: "安野ありか", age: "21", size: "T.157 / B.82(B) / W.55 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/764-20231129035404.jpg" },
        { name: "猫宮ひなこ", age: "22", size: "T.158 / B.92(G) / W.58 / H.90", img: "https://admin.esthe-lynx-ikebukuro.com/photos/715-20231105011217.jpg" },
        { name: "姫野みあ", age: "19", size: "T.160 / B.91(G) / W.55 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/710-20231214060419.jpg" },
        { name: "雪城ほのか", age: "20", size: "T.164 / B.91(F) / W.54 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/682-20251002075548.jpg" },
        { name: "新田りり", age: "18", size: "T.163 / B.85(D) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/668-20230914033939.jpg" },
        { name: "月城まな", age: "24", size: "T.165 / B.88(F) / W.58 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/638-20260114060359.jpg" },
        { name: "中村こはる", age: "18", size: "T.156 / B.82(C) / W.57 / H.81", img: "https://admin.esthe-lynx-ikebukuro.com/photos/626-20251110021623" },
        { name: "夏目にの", age: "20", size: "T.150 / B.81(B) / W.56 / H.80", img: "https://admin.esthe-lynx-ikebukuro.com/photos/606-20230726114900.jpg" },
        { name: "西野あやみ", age: "22", size: "T.154 / B.90(F) / W.57 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/605-20250625024223.jpg" },
        { name: "水月さい", age: "23", size: "T.162 / B.83(C) / W.58 / H.82", img: "https://admin.esthe-lynx-ikebukuro.com/photos/598-20241211123632.jpg" },
        { name: "一ノ瀬まゆ", age: "21", size: "T.165 / B.90(F) / W.57 / H.85", img: "https://admin.esthe-lynx-ikebukuro.com/photos/568-20250607022519.jpg" },
        { name: "野々原ちか", age: "21", size: "T.153 / B.82(B) / W.56 / H.84", img: "https://admin.esthe-lynx-ikebukuro.com/photos/566-20250809123619.jpg" },
        { name: "日向ほの", age: "23", size: "T.156 / B.87(D) / W.58 / H.83", img: "https://admin.esthe-lynx-ikebukuro.com/photos/544-20251102090645" },
        { name: "桜ここ", age: "18", size: "T.164 / B.85(D) / W.58 / H.86", img: "https://admin.esthe-lynx-ikebukuro.com/photos/300-20251112014307.jpg" },
        { name: "如月あすか", age: "23", size: "T.158 / B.83(C) / W.57 / H.87", img: "https://admin.esthe-lynx-ikebukuro.com/photos/277-20241219034138.jpg" },
        { name: "浦瀬もも", age: "22", size: "T.150 / B.92(G) / W.58 / H.88", img: "https://admin.esthe-lynx-ikebukuro.com/photos/74-20250607020611.jpg" },
        { name: "荻野まなみ", age: "20", size: "T.152 / B.91(F) / W.57 / H.89", img: "https://admin.esthe-lynx-ikebukuro.com/photos/346-20221113015024.jpg" }
      ]
    },
    {
      searchKeywords: ['evergreen', 'エバーグリーン'],
      website_url: "https://www.ever-green.tokyo",
      schedule_url: "https://www.ever-green.tokyo/schedule/",
      price_system: "◆グリーン・コース\n90分: 15,000円\n120分: 18,000円\n150分: 22,000円",
      casts: [
        { name: "樋口", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_2054.jpg" },
        { name: "上原", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_9421.jpg" },
        { name: "大森", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_9396.jpg" },
        { name: "青葉", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_9227.jpg" },
        { name: "津島", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_9093.jpg" },
        { name: "坂口", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_9363.jpg" },
        { name: "日高", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_9067.jpg" },
        { name: "小西", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_8936.jpg" },
        { name: "中野", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_8690.jpg" },
        { name: "佐々木", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_8788.jpg" },
        { name: "進藤", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_5966.jpg" },
        { name: "朝比奈", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_4732.jpg" },
        { name: "花咲", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_2055.jpg" },
        { name: "三浦", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_5248.jpg" },
        { name: "橋本", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_7972.jpg" },
        { name: "松原", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_6840.jpg" },
        { name: "真矢", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_8977.jpg" },
        { name: "鈴木", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_2060.jpg" },
        { name: "矢沢", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_8043.jpg" },
        { name: "蓮美", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_3595.jpg" },
        { name: "北村", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_3785.jpg" },
        { name: "保田", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_4773.jpg" },
        { name: "川上", age: "-", size: "-", img: "https://www.ever-green.tokyo/images/mc_1_1_2063.jpg" }
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
