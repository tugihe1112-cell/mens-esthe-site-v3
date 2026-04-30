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

  // 弾く不要なキャスト名（割引情報やバナーなど）
  const ignoreNames = ["新人割", "超ゲリラ雨割！", "ゲリラ割‼︎", "お昼割", "フリー割引", "LINE予約アカウント変更"];

  // 1. Tokyo Aroma Este のデータ
  const aromaData = {
    schedule_url: "https://tokyoaroma.jp/schedule/",
    price_system: "80min: 18,000円\n100min: 20,000円\n120min: 24,000円\n150min: 30,000円\n180min: 36,000円",
    casts: [
      { name: "愛月しおん", img: "https://tokyoaroma.jp/wp-content/uploads/2023/12/IMG_5458.jpeg" },
      { name: "相田さとみ", img: "https://tokyoaroma.jp/wp-content/uploads/2026/01/IMG_9403.jpeg" },
      { name: "白咲ゆめ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/04/IMG_9592.jpeg" },
      { name: "篠田ひかる", img: "https://tokyoaroma.jp/wp-content/uploads/2023/12/IMG_5911.jpeg" },
      { name: "若葉あい", img: "https://tokyoaroma.jp/wp-content/uploads/2025/12/IMG_8653.jpeg" },
      { name: "桜木らら", img: "https://tokyoaroma.jp/wp-content/uploads/2025/09/IMG_4999.jpeg" },
      { name: "岡本かれん", img: "https://tokyoaroma.jp/wp-content/uploads/2025/08/IMG_6643.jpeg" },
      { name: "星乃かなう", img: "https://tokyoaroma.jp/wp-content/uploads/2026/02/IMG_9919.jpeg" },
      { name: "白鳥さや", img: "https://tokyoaroma.jp/wp-content/uploads/2024/10/IMG_3166.webp" },
      { name: "藤堂ゆり", img: "https://tokyoaroma.jp/wp-content/uploads/2025/03/IMG_3160.jpeg" },
      { name: "花宮るな", img: "https://tokyoaroma.jp/wp-content/uploads/2026/01/IMG_9157.jpeg" },
      { name: "白鳥みこと", img: "https://tokyoaroma.jp/wp-content/uploads/2020/03/IMG_0020.jpeg" },
      { name: "葉月らい", img: "https://tokyoaroma.jp/wp-content/uploads/2025/08/IMG_5938.jpeg" },
      { name: "西条なみ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/08/IMG_5881.jpeg" },
      { name: "水瀬のあ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/09/IMG_5806.jpeg" },
      { name: "月野しいか", img: "https://tokyoaroma.jp/wp-content/uploads/2024/08/IMG_6901.jpeg" },
      { name: "綾瀬りこ", img: "https://tokyoaroma.jp/wp-content/uploads/2024/09/IMG_8878.jpeg" },
      { name: "華月まな", img: "https://tokyoaroma.jp/wp-content/uploads/2024/09/IMG_8891-scaled.jpeg" },
      { name: "結つむぎ", img: "https://tokyoaroma.jp/wp-content/uploads/2024/11/S__13148259.jpg" },
      { name: "早瀬ゆうか", img: "https://tokyoaroma.jp/wp-content/uploads/2025/04/IMG_2281.jpeg" },
      { name: "深沢みゆ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/09/IMG_5869.jpeg" },
      { name: "神崎あすな", img: "https://tokyoaroma.jp/wp-content/uploads/2025/10/IMG_6833.jpeg" },
      { name: "花乃れんか", img: "https://tokyoaroma.jp/wp-content/uploads/2023/12/LINE_ALBUM_花乃_231230_3.jpg" },
      { name: "片瀬りんか", img: "https://tokyoaroma.jp/wp-content/uploads/2025/11/IMG_7553.jpeg" },
      { name: "涼宮あまね", img: "https://tokyoaroma.jp/wp-content/uploads/2025/12/IMG_0041.jpeg" },
      { name: "水城かえで", img: "https://tokyoaroma.jp/wp-content/uploads/2026/02/IMG_9644.jpeg" },
      { name: "柊木なな", img: "https://tokyoaroma.jp/wp-content/uploads/2026/02/IMG_9653.jpeg" },
      { name: "森咲あまね", img: "https://tokyoaroma.jp/wp-content/uploads/2026/02/IMG_9813.jpeg" },
      { name: "九条なずな", img: "https://tokyoaroma.jp/wp-content/uploads/2026/03/IMG_9829.jpeg" },
      { name: "桃瀬りぶ", img: "https://tokyoaroma.jp/wp-content/uploads/2026/03/IMG_9890.jpeg" },
      { name: "星奈すず", img: "https://tokyoaroma.jp/wp-content/uploads/2026/03/IMG_9943.jpeg" },
      { name: "蓮美まこ", img: "https://tokyoaroma.jp/wp-content/uploads/2026/03/IMG_0005.jpeg" },
      { name: "結城りん", img: "https://tokyoaroma.jp/wp-content/uploads/2026/03/IMG_0082.jpeg" },
      { name: "池田あすか", img: "https://tokyoaroma.jp/wp-content/uploads/2026/03/IMG_0063.jpeg" },
      { name: "羽野ふうな", img: "https://tokyoaroma.jp/wp-content/uploads/2026/03/IMG_0105.jpeg" },
      { name: "小沢るか", img: "https://tokyoaroma.jp/wp-content/uploads/2026/04/IMG_0097.jpeg" },
      { name: "岩崎みずき", img: "https://tokyoaroma.jp/wp-content/uploads/2025/11/IMG_7765.jpeg" },
      { name: "綾瀬ゆめ", img: "https://tokyoaroma.jp/wp-content/uploads/2026/01/IMG_9572.jpeg" },
      { name: "苺原はな", img: "https://tokyoaroma.jp/wp-content/uploads/2025/09/IMG_5849.jpeg" },
      { name: "香坂おとは", img: "https://tokyoaroma.jp/wp-content/uploads/2020/02/IMG_9936.jpeg" },
      { name: "沢口もえ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/11/IMG_7379.jpeg" },
      { name: "青葉ねね", img: "https://tokyoaroma.jp/wp-content/uploads/2020/03/IMG_9895.jpeg" },
      { name: "椎名のあ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/11/IMG_7470.jpeg" },
      { name: "川村りいな", img: "https://tokyoaroma.jp/wp-content/uploads/2025/12/IMG_8714.jpeg" },
      { name: "桜井ここな", img: "https://tokyoaroma.jp/wp-content/uploads/2025/10/IMG_6544.jpeg" },
      { name: "天使りか", img: "https://tokyoaroma.jp/wp-content/uploads/2025/11/IMG_7844.jpeg" },
      { name: "蒼井みなと", img: "https://tokyoaroma.jp/wp-content/uploads/2025/11/IMG_7863.jpeg" },
      { name: "雪乃あむ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/10/IMG_6928.jpeg" },
      { name: "姫野ゆい", img: "https://tokyoaroma.jp/wp-content/uploads/2025/10/IMG_6620.jpeg" },
      { name: "七瀬ゆあ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/08/IMG_4569.jpeg" },
      { name: "斎藤ゆう", img: "https://tokyoaroma.jp/wp-content/uploads/2025/06/IMG_0263.jpeg" },
      { name: "小林おとは", img: "https://tokyoaroma.jp/wp-content/uploads/2025/10/IMG_6557.jpeg" },
      { name: "水島わかな", img: "https://tokyoaroma.jp/wp-content/uploads/2025/09/IMG_5588.jpeg" },
      { name: "輝咲すず", img: "https://tokyoaroma.jp/wp-content/uploads/2025/08/IMG_5916.jpeg" },
      { name: "立花ゆず", img: "https://tokyoaroma.jp/wp-content/uploads/2025/09/IMG_5934.jpeg" },
      { name: "朝日奈るく", img: "https://tokyoaroma.jp/wp-content/uploads/2025/03/IMG_2321.jpeg" },
      { name: "桃奈ゆあ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/05/IMG_2960-1.jpeg" },
      { name: "紺野あや", img: "https://tokyoaroma.jp/wp-content/uploads/2024/09/IMG_9069.jpeg" },
      { name: "一女りな", img: "https://tokyoaroma.jp/wp-content/uploads/2025/07/IMG_3956.jpeg" },
      { name: "雪村まりあ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/08/IMG_4489.jpeg" },
      { name: "夏風あお", img: "https://tokyoaroma.jp/wp-content/uploads/2023/12/IMG_0120.jpeg" },
      { name: "滝沢なな", img: "https://tokyoaroma.jp/wp-content/uploads/2023/12/S__10420693_0.jpg" },
      { name: "茶屋まな", img: "https://tokyoaroma.jp/wp-content/uploads/2023/12/IMG_0653.jpeg" },
      { name: "神木みやび", img: "https://tokyoaroma.jp/wp-content/uploads/2023/12/IMG_3174.webp" },
      { name: "松村ゆあ", img: "https://tokyoaroma.jp/wp-content/uploads/2023/12/IMG_0536.jpeg" },
      { name: "大井ありな", img: "https://tokyoaroma.jp/wp-content/uploads/2023/12/1703978934919.jpg" },
      { name: "北川あかり", img: "https://tokyoaroma.jp/wp-content/uploads/2023/12/LINE_ALBUM_北川_231230_3.jpg" },
      { name: "佐久間ねね", img: "https://tokyoaroma.jp/wp-content/uploads/2024/01/佐久間１.jpg" },
      { name: "鈴宮まりん", img: "https://tokyoaroma.jp/wp-content/uploads/2024/02/鈴宮１.jpg" },
      { name: "一ノ瀬るな", img: "https://tokyoaroma.jp/wp-content/uploads/2024/02/一ノ瀬１.jpg" },
      { name: "佐藤のあ", img: "https://tokyoaroma.jp/wp-content/uploads/2024/02/IMG_0542.jpeg" },
      { name: "会津ほまれ", img: "https://tokyoaroma.jp/wp-content/uploads/2024/03/IMG_0054.jpeg" },
      { name: "もも", img: "https://tokyoaroma.jp/wp-content/uploads/2024/05/IMG_3186.jpeg" },
      { name: "月野れな", img: "https://tokyoaroma.jp/wp-content/uploads/2024/05/S__11411588_0.jpg" },
      { name: "水無月さら", img: "https://tokyoaroma.jp/wp-content/uploads/2025/02/174062908.jpg" },
      { name: "永井ありさ", img: "https://tokyoaroma.jp/wp-content/uploads/2024/06/1718480945701.jpg" },
      { name: "夏目すず", img: "https://tokyoaroma.jp/wp-content/uploads/2024/06/IMG_7068.jpeg" },
      { name: "松本きょうか", img: "https://tokyoaroma.jp/wp-content/uploads/2023/12/noimage.jpg" },
      { name: "黒木ほのか", img: "https://tokyoaroma.jp/wp-content/uploads/2024/06/IMG_7243-scaled.jpeg" },
      { name: "宮下ありさ", img: "https://tokyoaroma.jp/wp-content/uploads/2024/07/1721315832769.jpg" },
      { name: "愛沢すず", img: "https://tokyoaroma.jp/wp-content/uploads/2024/08/IMG_3180.jpeg" },
      { name: "北条ゆりあ", img: "https://tokyoaroma.jp/wp-content/uploads/2024/08/IMG_4717.jpeg" },
      { name: "野崎あんな", img: "https://tokyoaroma.jp/wp-content/uploads/2024/10/IMG_9565.jpeg" },
      { name: "永瀬えれな", img: "https://tokyoaroma.jp/wp-content/uploads/2024/11/IMG_9747.jpeg" },
      { name: "二葉かや", img: "https://tokyoaroma.jp/wp-content/uploads/2024/11/IMG_3197.webp" },
      { name: "吉沢まりな", img: "https://tokyoaroma.jp/wp-content/uploads/2025/02/17396076709841.jpg" },
      { name: "白雪ひめか", img: "https://tokyoaroma.jp/wp-content/uploads/2025/10/IMG_6433.jpeg" },
      { name: "早美こい", img: "https://tokyoaroma.jp/wp-content/uploads/2025/01/17370015161062.jpg" },
      { name: "山下かのん", img: "https://tokyoaroma.jp/wp-content/uploads/2025/02/1738691777203.jpg" },
      { name: "三ノ宮とあ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/03/IMG_3183.jpeg" },
      { name: "笹本ゆきの", img: "https://tokyoaroma.jp/wp-content/uploads/2025/05/IMG_2554.jpeg" },
      { name: "夏希ゆりあ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/05/IMG_2495.jpeg" },
      { name: "一条れいら", img: "https://tokyoaroma.jp/wp-content/uploads/2025/06/IMG_3016.jpeg" },
      { name: "有馬うみ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/07/IMG_3244.jpeg" },
      { name: "下田みお", img: "https://tokyoaroma.jp/wp-content/uploads/2025/11/IMG_7586.jpeg" },
      { name: "片岡ふうか", img: "https://tokyoaroma.jp/wp-content/uploads/2025/07/IMG_3695.jpeg" },
      { name: "平野みゆ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/07/IMG_3749.jpeg" },
      { name: "今井せいら", img: "https://tokyoaroma.jp/wp-content/uploads/2025/07/IMG_3743.jpeg" },
      { name: "有栖らむ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/07/IMG_3890.jpeg" },
      { name: "前田りん", img: "https://tokyoaroma.jp/wp-content/uploads/2025/08/IMG_4139.jpeg" },
      { name: "宮澤あんず", img: "https://tokyoaroma.jp/wp-content/uploads/2025/12/IMG_8450.jpeg" },
      { name: "坂下りこ", img: "https://tokyoaroma.jp/wp-content/uploads/2025/09/IMG_4936.jpeg" },
      { name: "高瀬かりな", img: "https://tokyoaroma.jp/wp-content/uploads/2025/09/IMG_4927.jpeg" }
    ]
  };

  // 2. 東京メンズエステ のデータ
  const menesData = {
    schedule_url: "https://tokyo-menes.com/schedule/",
    price_system: "90min: 18,000円\n120min: 23,000円\n150min: 28,000円",
    casts: [
      { name: "かりん", img: "https://tokyo-menes.com/wp-content/uploads/2025/06/2950_20250825131622_600_800_0.jpg" },
      { name: "ゆめか", img: "https://tokyo-menes.com/wp-content/uploads/2025/02/1788_20250825131630_600_800_0.jpg" },
      { name: "みる", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/HQf7sx2XyZU0L211761287480_1761287503.jpg" },
      { name: "める", img: "https://tokyo-menes.com/wp-content/uploads/2025/08/3552_20250825132303_600_800_0.jpg" },
      { name: "ちな", img: "https://tokyo-menes.com/wp-content/uploads/2025/04/S__158359558_0.jpg" },
      { name: "もか", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4888_20251121210533_600_800_0.jpg" },
      { name: "れみ", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/4412_20251108181434_600_800_0.jpg" },
      { name: "にあ", img: "https://tokyo-menes.com/wp-content/uploads/2026/02/6793_20260320001037_600_800_0.jpg" },
      { name: "にこ", img: "https://tokyo-menes.com/wp-content/uploads/2025/12/QpetVqsDp7STxVU1764923814_1764923835.jpg" },
      { name: "なぎさ", img: "https://tokyo-menes.com/wp-content/uploads/2025/08/K7WwSTGKIrD1nDd1774427033_1774427244.jpg" },
      { name: "ゆず", img: "https://tokyo-menes.com/wp-content/uploads/2025/03/2104_20250825131652_600_800_0.jpg" },
      { name: "はづき", img: "https://tokyo-menes.com/wp-content/uploads/2026/02/6741_20260228233115_600_800_0.jpg" },
      { name: "ゆり", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4981_20260204003954_600_800_0.jpg" },
      { name: "るか", img: "https://tokyo-menes.com/wp-content/uploads/2025/08/Mrd4Ou8De3KKTSq1773472631_1773472653.jpg" },
      { name: "ニカ", img: "https://tokyo-menes.com/wp-content/uploads/2025/02/1790_20250825131735_600_800_0.jpg" },
      { name: "ゆま", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/5066_20251208012859_600_800_0.jpg" },
      { name: "あんじゅ", img: "https://tokyo-menes.com/wp-content/uploads/2025/12/5154_20251208222951_600_800_0.jpg" },
      { name: "まゆ", img: "https://tokyo-menes.com/wp-content/uploads/2026/01/5685_20260201002349_600_800_0.jpg" },
      { name: "ゆい", img: "https://tokyo-menes.com/wp-content/uploads/2026/01/5782_20260208173720_600_800_0.jpg" },
      { name: "せいら", img: "https://tokyo-menes.com/wp-content/uploads/2025/12/U51YCoxLqcVhB0W1765695432_1765695455_0.jpg" },
      { name: "しき", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/4274_20251011183605_600_800_0.jpg" },
      { name: "りつ", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/nNYbr7i3rg41TvT1774554900_1774554922_0.jpg" },
      { name: "あゆか", img: "https://tokyo-menes.com/wp-content/uploads/2025/08/3SjOPxz9Qi3FqOI1756623119_1756623135.jpg" },
      { name: "まこ", img: "https://tokyo-menes.com/wp-content/uploads/2025/12/ywCzKsSpbRRVXY11767720528_1767720608.jpg" },
      { name: "まい", img: "https://tokyo-menes.com/wp-content/uploads/2026/02/6801_20260320001015_600_800_0.jpg" },
      { name: "りこ", img: "https://tokyo-menes.com/wp-content/uploads/2025/12/5125_20260323190703_600_800_0.jpg" },
      { name: "あみ", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/aXHmnxQuwXT6xtc1762769105_1762769127_0.jpg" },
      { name: "りお", img: "https://tokyo-menes.com/wp-content/uploads/2025/07/3347_20250825131703_600_800_0.jpg" },
      { name: "ゆうか", img: "https://tokyo-menes.com/wp-content/uploads/2026/01/ASr7ohNJ9NMtOLT1768192364_1768192414.jpg" },
      { name: "えま", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4715_20260204191323_600_800_1.jpg" },
      { name: "えみり", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/5002_20251208013513_600_800_0.jpg" },
      { name: "うるむ", img: "https://tokyo-menes.com/wp-content/uploads/2026/02/6786_20260306063122_600_800_0.jpg" },
      { name: "まみ", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/7029_20260320001056_600_800_0.jpg" },
      { name: "ちなみ", img: "https://tokyo-menes.com/wp-content/uploads/2026/01/5714_20260201002850_600_800_0.jpg" },
      { name: "そら", img: "https://tokyo-menes.com/wp-content/uploads/2026/02/6666_20260228081616_600_800_0.jpg" },
      { name: "しゅな", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/d0vBczWfw1M5b5y1759561818_1759561840_0.jpg" },
      { name: "のの", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/7059_20260320001200_600_800_0.jpg" },
      { name: "みく", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/7049_20260320001118_600_800_0.jpg" },
      { name: "えみ", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/5077_20251203165600_600_800_0.jpg" },
      { name: "ももか", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4654_20251102180448_600_800_0.jpg" },
      { name: "あき", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/7076_20260320001139_600_800_0.jpg" },
      { name: "さらら", img: "https://tokyo-menes.com/wp-content/uploads/2026/01/5591_20260116192221_600_800_0.jpg" },
      { name: "なお", img: "https://tokyo-menes.com/wp-content/uploads/2025/12/5304_20251228164407_600_800_0.jpg" },
      { name: "浜咲ゆき", img: "https://tokyo-menes.com/wp-content/uploads/2026/01/8Uink0q8WDxnLwj1768329602_1768329665-1.jpg" },
      { name: "るみ", img: "https://tokyo-menes.com/wp-content/uploads/2025/12/5438_20260104165451_600_800_0.jpg" },
      { name: "まいか", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4946_20251216202746_600_800_0.jpg" },
      { name: "あかね", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/4352_20251105213416_600_800_0.jpg" },
      { name: "ティナ", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4780_20251113195125_600_800_0.jpg" },
      { name: "あまね", img: "https://tokyo-menes.com/wp-content/uploads/2026/02/6276_20260208173238_600_800_0.jpg" },
      { name: "いおり", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4986_20251214161818_600_800_0.jpg" },
      { name: "なる", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/4561_20251110212628_600_800_0.jpg" },
      { name: "はな", img: "https://tokyo-menes.com/wp-content/uploads/2025/07/3275_20250825131931_600_800_0.jpg" },
      { name: "れんか", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4719_20251110211219_600_800_0.jpg" },
      { name: "きあら", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/4325_20251018154451_600_800_0.jpg" },
      { name: "らん", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4699_20251108183530_600_800_0.jpg" },
      { name: "さや", img: "https://tokyo-menes.com/wp-content/uploads/2025/08/LRauK90t77D9H2E1756544181_1756544199.jpg" },
      { name: "こはく", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/LSJ874wtWkNCX5L1762948601_1762948626_0.jpg" },
      { name: "ななみ", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/6ynLWcfLb7zjmhU1764215956_1764216014.jpg" },
      { name: "ひめの", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/4584_20251030184519_600_800_0.jpg" },
      { name: "れい", img: "https://tokyo-menes.com/wp-content/uploads/2025/02/dbed7a00a874a620ddfdcfdfd7ab52a5.jpg" },
      { name: "みな", img: "https://tokyo-menes.com/wp-content/uploads/2026/01/kXVpTCTFl7816bR1768703796_1768703815_0.jpg" },
      { name: "さき", img: "https://tokyo-menes.com/wp-content/uploads/2025/12/5421_20260104174201_600_800_0.jpg" },
      { name: "さな", img: "https://tokyo-menes.com/wp-content/uploads/2025/09/4208_20251004181941_600_800_0.jpg" },
      { name: "みるく", img: "https://tokyo-menes.com/wp-content/uploads/2025/12/CdBAvX8jUclwmHd1766381363_1766381396_0.jpg" },
      { name: "りな", img: "https://tokyo-menes.com/wp-content/uploads/2025/12/5375_20260104202150_600_800_3.jpg" },
      { name: "なこ", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4861_20251115013620_600_800_0.jpg" },
      { name: "りあ", img: "https://tokyo-menes.com/wp-content/uploads/2025/02/1789_20250825131746_600_800_0.jpg" },
      { name: "かなの", img: "https://tokyo-menes.com/wp-content/uploads/2026/02/keHTQqrt5NZd4ak1771267320_1771267450.jpg" },
      { name: "もなか", img: "https://tokyo-menes.com/wp-content/uploads/2025/12/Uqy0pmcUV6kVwUv1765437245_1765437369-1.jpg" },
      { name: "らら", img: "https://tokyo-menes.com/wp-content/uploads/2025/08/goLsWLkc8FDsYCL1756281731_1756281754_0.jpg" },
      { name: "ゆめの", img: "https://tokyo-menes.com/wp-content/uploads/2025/08/3454_20250825131942_600_800_0.jpg" },
      { name: "みれい", img: "https://tokyo-menes.com/wp-content/uploads/2025/09/4092_20250927173046_600_800_0.jpg" },
      { name: "いと", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4649_20251102150736_600_800_0.jpg" },
      { name: "かな", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/4685_20251115020349_600_800_0.jpg" },
      { name: "いぶき", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/4435_20251024170745_600_800_0.jpg" },
      { name: "あんな", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/4381_20251018164208_600_800_0.jpg" },
      { name: "さら", img: "https://tokyo-menes.com/wp-content/uploads/2025/08/S__5480459.jpg" },
      { name: "つばさ", img: "https://tokyo-menes.com/wp-content/uploads/2025/07/3219_20250825131808_600_800_0.jpg" },
      { name: "ゆう", img: "https://tokyo-menes.com/wp-content/uploads/2025/07/3155_20250825131820_600_800_0.jpg" },
      { name: "ななせ", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/4309_20251008174658_600_800_0.jpg" },
      { name: "ひかる", img: "https://tokyo-menes.com/wp-content/uploads/2025/07/3253_20250925102236_600_800_0.jpg" },
      { name: "みやび", img: "https://tokyo-menes.com/wp-content/uploads/2025/08/3510_20250825132251_600_800_0.jpg" },
      { name: "ふうか", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/4276_20251011180628_600_800_0.jpg" },
      { name: "れあ", img: "https://tokyo-menes.com/wp-content/uploads/2025/05/2818_20250825132011_600_800_0.jpg" },
      { name: "ゆあ", img: "https://tokyo-menes.com/wp-content/uploads/2025/07/bwSP6aXOHHdm70S1753957631_1753957670.jpg" },
      { name: "ねね", img: "https://tokyo-menes.com/wp-content/uploads/2025/06/PjoQrmgC3czK8zo1753170923_1753170966.jpg" },
      { name: "うみ", img: "https://tokyo-menes.com/wp-content/uploads/2025/05/2908_20250825131855_600_800_0.jpg" },
      { name: "るな", img: "https://tokyo-menes.com/wp-content/uploads/2025/02/e3VPLBlCPy2VQTE1740811858_1740811930.jpg" },
      { name: "さくら", img: "https://tokyo-menes.com/wp-content/uploads/2025/04/kbrVSo1XOfQiv1d1743654521_1743654567.jpg" },
      { name: "おと", img: "https://tokyo-menes.com/wp-content/uploads/2025/04/2204_20250825132056_600_800_0.jpg" },
      { name: "ことね", img: "https://tokyo-menes.com/wp-content/uploads/2025/05/yknHwjxzP5cQnWb1748167009_1748167039_0.jpg" },
      { name: "あかり", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/E48zH7conxEVsdV1760949853_1760949889.jpg" },
      { name: "あおば", img: "https://tokyo-menes.com/wp-content/uploads/2025/02/A0VmNOFr4UH1JD71740649713_1740649762.jpg" },
      { name: "すず", img: "https://tokyo-menes.com/wp-content/uploads/2025/02/1928_20250825132215_600_800_0.jpg" },
      { name: "きるるるありさ", img: "https://tokyo-menes.com/wp-content/uploads/2025/10/4275_20251006173449_600_800_0.jpg" },
      { name: "まひろ", img: "https://tokyo-menes.com/wp-content/uploads/2025/11/NrVIBXItWn13YDG1764321210_1764321254.jpg" },
      { name: "ましろ", img: "https://tokyo-menes.com/wp-content/uploads/2026/02/QsQoBoCPLk2KbkH1771267843_1771267870_0.jpg" },
      { name: "あさ", img: "https://tokyo-menes.com/wp-content/uploads/2025/04/2211_20250825132226_600_800_0.jpg" },
      { name: "まゆか", img: "https://tokyo-menes.com/wp-content/uploads/2026/02/muP9RdLUKYoaK0A1771595992_1771596035_0.jpg" },
      { name: "ひな", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/7173_20260323190721_600_800_0.jpg" },
      { name: "つむぎ", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/7267_20260323190741_600_800_0.jpg" },
      { name: "れいら", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/6957_20260323195707_600_800_0.jpg" },
      { name: "ゆか", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/7862_20260323195650_600_800_0.jpg" },
      { name: "まゆゆ", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/HdTROj4PrZQZtzr1774521479_1774521608.jpg" },
      { name: "ちなつ", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/8031_20260327200046_600_800_0.jpg" },
      { name: "あい", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/7990_20260327212931_600_800_0.jpg" },
      { name: "きよら", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/S__158212103_0.jpg" },
      { name: "りんご", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/8065_20260401033843_600_800_0.jpg" },
      { name: "のあ", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/8046_20260402135306_600_800_0.jpg" },
      { name: "あんり", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/8055_20260402135323_600_800_0.jpg" },
      { name: "とあ", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/2grbyHdBthrXxGV1775272055_1775272109.jpg" },
      { name: "しの", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/8034_20260326124408_600_800_0.jpg" },
      { name: "りほ", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/sHVAMLxjXJlQedF1774501287_1774501401.jpg" },
      { name: "ゆうり", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/2SvF05leGzfIqsN1774545534_1774545567.jpg" },
      { name: "まどか", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/6FLgzB1koZGjDX21774545122_1774545167.jpg" },
      { name: "あやめ", img: "https://tokyo-menes.com/wp-content/uploads/2026/03/8219_20260331194320_600_800_0.jpg" },
      { name: "みなみ", img: "https://tokyo-menes.com/wp-content/uploads/2026/04/hJiUgqG79a3ewgn1775046137_1775046146.jpg" },
      { name: "すずか", img: "https://tokyo-menes.com/wp-content/uploads/2026/04/5klUKmSogIFSVrG1775110153_1775110240.jpg" },
      { name: "いろは", img: "https://tokyo-menes.com/wp-content/uploads/2026/04/MqnlR67esACfbl41775153647_1775153685.jpg" },
      { name: "なの", img: "https://tokyo-menes.com/wp-content/uploads/2026/04/RyHHxBK79yNlNob1775187444_1775187485-1.jpg" },
      { name: "あいり", img: "https://tokyo-menes.com/wp-content/uploads/2026/04/hfL5rC48zxwkzAd1775199602_1775199607.jpg" },
      { name: "あずさ", img: "https://tokyo-menes.com/wp-content/uploads/2026/04/kXsHkia2pvwUFwX1775274282_1775274366.jpg" },
      { name: "みお", img: "https://tokyo-menes.com/wp-content/uploads/2026/04/rBtqRmWrhWyWvCx1775286413_1775286480.jpg" },
      { name: "はる", img: "https://tokyo-menes.com/wp-content/uploads/2025/08/3523_20250825132342_600_800_0.jpg" },
      { name: "れいか", img: "https://tokyo-menes.com/wp-content/uploads/2025/08/3523_20250825132342_600_800_0.jpg" }
    ]
  };

  try {
    console.log(`🔍 データベースから対象店舗を検索し、一括更新を実行します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // --- ① Tokyo Aroma Este の更新処理 ---
    console.log("========================================");
    console.log("🚀 [1/2] Tokyo Aroma Este の更新を開始します...");
    const targetAromaShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return (n.includes('tokyo') && n.includes('aroma') && !n.includes('grand')) || 
             (n.includes('東京') && n.includes('アロマ') && !n.includes('グランド')) ||
             n.includes('tokyoaroma');
    });

    if (targetAromaShops.length > 0) {
      for (const shop of targetAromaShops) {
        console.log(` 🏠 対象店舗: ${shop.name}`);
        
        // 店舗情報の更新 (url を除去)
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            schedule_url: aromaData.schedule_url,
            price_system: aromaData.price_system
          })
        });

        if (patchRes.ok) {
          console.log(`   ✅ スケジュールURL・料金システム更新完了`);
        } else {
          console.error(`   ❌ 店舗情報の更新に失敗しました: ${patchRes.statusText}`);
          continue;
        }

        // キャストの更新
        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
        const dbCasts = await dbRes.json();
        
        let updateCount = 0;
        let insertCount = 0;
        const uniqueCasts = Array.from(new Map(aromaData.casts.map(c => [c.name, c])).values());

        for (const cast of uniqueCasts) {
          const cleanName = cast.name.replace(/[\s　]+/g, '').replace(/（.*）/g, ''); 
          if (ignoreNames.includes(cleanName)) continue;

          const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '').replace(/（.*）/g, '') === cleanName);

          if (existing) {
            if (existing.image_url !== cast.img) {
              await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ image_url: cast.img })
              });
              updateCount++;
            }
          } else {
            const newId = `${shop.id}_${cleanName}`;
            await fetch(`${url}/rest/v1/therapists`, {
              method: 'POST',
              headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
              body: JSON.stringify({
                id: newId,
                shop_id: shop.id,
                name: cleanName,
                image_url: cast.img
              })
            });
            insertCount++;
          }
        }
        console.log(`   🎉 キャスト設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
      }
    } else {
      console.log(" ⚠️ Tokyo Aroma Esteの店舗が見つかりませんでした。");
    }

    // --- ② 東京メンズエステ の更新処理 ---
    console.log("\n========================================");
    console.log("🚀 [2/2] 東京メンズエステ の更新を開始します...");
    const targetMenesShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return n.includes('東京メンズエステ') || 
             n.includes('tokyomensesthe') ||
             n.includes('東京メンズ');
    });

    if (targetMenesShops.length > 0) {
      for (const shop of targetMenesShops) {
        console.log(` 🏠 対象店舗: ${shop.name}`);
        
        // 店舗情報の更新 (url を除去)
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            schedule_url: menesData.schedule_url,
            price_system: menesData.price_system
          })
        });

        if (patchRes.ok) {
          console.log(`   ✅ スケジュールURL・料金システム更新完了`);
        } else {
          console.error(`   ❌ 店舗情報の更新に失敗しました: ${patchRes.statusText}`);
          continue;
        }

        // キャストの更新
        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
        const dbCasts = await dbRes.json();
        
        let updateCount = 0;
        let insertCount = 0;
        const uniqueCasts = Array.from(new Map(menesData.casts.map(c => [c.name, c])).values());

        for (const cast of uniqueCasts) {
          const cleanName = cast.name.replace(/[\s　]+/g, '').replace(/（.*）/g, ''); 
          if (ignoreNames.includes(cleanName)) continue;

          const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '').replace(/（.*）/g, '') === cleanName);

          if (existing) {
            if (existing.image_url !== cast.img) {
              await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ image_url: cast.img })
              });
              updateCount++;
            }
          } else {
            const newId = `${shop.id}_${cleanName}`;
            await fetch(`${url}/rest/v1/therapists`, {
              method: 'POST',
              headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
              body: JSON.stringify({
                id: newId,
                shop_id: shop.id,
                name: cleanName,
                image_url: cast.img
              })
            });
            insertCount++;
          }
        }
        console.log(`   🎉 キャスト設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
      }
    } else {
      console.log(" ⚠️ 東京メンズエステの店舗が見つかりませんでした。");
    }

    console.log("\n🎊 すべての更新処理が完了しました！ブラウザをリロードして確認してください！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
