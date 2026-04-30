import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

  const targetKeyword = "Aroma Blossom";
  const targetLogoUrl = "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Aroma%20Blossom.png";
  const targetScheduleUrl = "https://aroma-blossom.com/schedule/";

  // 抽出したキャストデータ（一部 placeholder 画像も含まれますが、サイトの仕様通りに登録します）
  const casts = [
    { name: "田中みか", img: "https://aroma-blossom.com/wp-content/uploads/2024/01/アロマブラッサム写真準備中800×600.jpg" },
    { name: "川口りえ", img: "https://aroma-blossom.com/wp-content/uploads/2024/01/アロマブラッサム写真準備中800×600.jpg" },
    { name: "有村つむぎ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/100.jpg" },
    { name: "月城ひなの", img: "https://aroma-blossom.com/wp-content/uploads/2024/01/アロマブラッサム写真準備中800×600.jpg" },
    { name: "間宮はすみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-95.jpg" },
    { name: "水瀬さえ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/cut_600_800_01-2.jpg" },
    { name: "野乃かおり", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-75.jpg" },
    { name: "君島ゆりか", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_05-2.jpg" },
    { name: "藤咲もえか", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-72.jpg" },
    { name: "星崎あおい", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_new.jpg" },
    { name: "中村あみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-85.jpg" },
    { name: "藤原よしの", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-76.jpg" },
    { name: "井川れみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-67.jpg" },
    { name: "綾瀬ゆら", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-79.jpg" },
    { name: "林みみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-83.jpg" },
    { name: "神谷ましろ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-82.jpg" },
    { name: "綾崎あい", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-70.jpg" },
    { name: "森みう", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-80.jpg" },
    { name: "村瀬かな", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-68.jpg" },
    { name: "叶れん", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-78.jpg" },
    { name: "天音かな", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-75.jpg" },
    { name: "橋本かな", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-92.jpg" },
    { name: "安藤すず", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-72.jpg" },
    { name: "永作かのん", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-70.jpg" },
    { name: "新山かなこ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-68.jpg" },
    { name: "紫音ほたる", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-67.jpg" },
    { name: "金子りおな", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-56.jpg" },
    { name: "長澤ありな", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-65.jpg" },
    { name: "涼風りょう", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-59.jpg" },
    { name: "早坂ゆきの", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_03-20.jpg" },
    { name: "花宮つやか", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-43.jpg" },
    { name: "夢野さき", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-55.jpg" },
    { name: "高尾わか", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_05-1.jpg" },
    { name: "森田あや", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-40.jpg" },
    { name: "瀧本みさお", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-56.jpg" },
    { name: "七咲れいあ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-50.jpg" },
    { name: "中谷みゆき", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-48.jpg" },
    { name: "吉木ゆか", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-57.jpg" },
    { name: "牧野るみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-46.jpg" },
    { name: "藤村まお", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-35.jpg" },
    { name: "姫川ななこ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-38.jpg" },
    { name: "羽鳥りこ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-40.jpg" },
    { name: "月音きょうか", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-31.jpg" },
    { name: "星宮ひかり", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-41.jpg" },
    { name: "小泉ゆき", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-37.jpg" },
    { name: "樋口さや", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-32.jpg" },
    { name: "田村あさみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-76.jpg" },
    { name: "光月みあ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-33.jpg" },
    { name: "広田ちはる", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-23-1.jpg" },
    { name: "小林まりな", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-26.jpg" },
    { name: "愛野ここ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-27.jpg" },
    { name: "九条みな", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-23.jpg" },
    { name: "柊木ありす", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-24.jpg" },
    { name: "葉山みれい", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_04-2.jpg" },
    { name: "満島めい", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-22.jpg" },
    { name: "加藤なぎさ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-59.jpg" },
    { name: "大城あずみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-32.jpg" },
    { name: "観月まな", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-12.jpg" },
    { name: "東條ゆい", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-15.jpg" },
    { name: "浅香らら", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-16.jpg" },
    { name: "内田もえ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-14.jpg" },
    { name: "如月ゆな", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-15.jpg" },
    { name: "星ななみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-8.jpg" },
    { name: "日比谷まほ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-12.jpg" },
    { name: "一ノ瀬あやめ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-4.jpg" },
    { name: "黒崎えりか", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_04-3.jpg" },
    { name: "工藤みゆ", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-9.jpg" },
    { name: "雪野しずく", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-5.jpg" },
    { name: "平野るか", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-1.jpg" },
    { name: "徳永ふうか", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_01-2.jpg" },
    { name: "綾森ちか", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_03-3.jpg" },
    { name: "月見もも", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02.jpg" },
    { name: "黒川あかり", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_04-9.jpg" },
    { name: "高木わかな", img: "https://aroma-blossom.com/wp-content/uploads/2019/09/600_800_02-10.jpg" },
    { name: "三花えれな", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_私服02.jpg" },
    { name: "神楽こころ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-86.jpg" },
    { name: "河合まゆか", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-96.jpg" },
    { name: "水野みわ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-85.jpg" },
    { name: "西りのん", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-78.jpg" },
    { name: "川瀬れいさ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_05-7.jpg" },
    { name: "椎名あずさ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-76.jpg" },
    { name: "岩谷えりな", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-71.jpg" },
    { name: "七瀬つばさ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_05-2.jpg" },
    { name: "清水のぞみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-72.jpg" },
    { name: "大島えみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_02-67.jpg" },
    { name: "今井あんな", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-64.jpg" },
    { name: "夏川くるみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-65.jpg" },
    { name: "七海もあ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_03-71.jpg" },
    { name: "宮本りんか", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_03-48.jpg" },
    { name: "野崎るな", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-54.jpg" },
    { name: "篠崎せいら", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_011-2.jpg" },
    { name: "久遠みかこ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_02-54.jpg" },
    { name: "白川れな", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-52.jpg" },
    { name: "桜羽れいな", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_04-8.jpg" },
    { name: "上川ほのか", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_011.jpg" },
    { name: "大谷りん", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_0111.jpg" },
    { name: "白石あゆみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_0333.jpg" },
    { name: "泉けい", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_02-42.jpg" },
    { name: "三雲ゆかり", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_02-41.jpg" },
    { name: "石原ちなつ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-38.jpg" },
    { name: "永瀬しほ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-36.jpg" },
    { name: "大沢すみれ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_02-37.jpg" },
    { name: "吉田なるみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-33.jpg" },
    { name: "桃瀬りの", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_03-22.jpg" },
    { name: "土屋まゆみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-26.jpg" },
    { name: "佐倉はる", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_03-20.jpg" },
    { name: "倉木はるか", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-25.jpg" },
    { name: "月野そら", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_02-23.jpg" },
    { name: "木ノ下あいり", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-20.jpg" },
    { name: "我妻ゆり", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-24.jpg" },
    { name: "来栖ななこ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-23.jpg" },
    { name: "三井くるみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-17.jpg" },
    { name: "本城あいか", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_02-19.jpg" },
    { name: "星みれな", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-12.jpg" },
    { name: "坂井のあ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-14.jpg" },
    { name: "松原ほなみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_03-10.jpg" },
    { name: "舞川なこ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-11.jpg" },
    { name: "北宮ゆうこ", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-9.jpg" },
    { name: "桜井ゆり", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_01-12-1.jpg" },
    { name: "秋月いろは", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_03-4.jpg" },
    { name: "山田あん", img: "https://aroma-blossom.com/wp-content/uploads/2019/08/600_800_03.jpg" },
    { name: "宝来ゆずき", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_03-110.jpg" },
    { name: "立川ゆい", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_04-38.jpg" },
    { name: "小春ひより", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01_2.jpg" },
    { name: "小宮山いおり", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_033.jpg" },
    { name: "樋口のどか", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-124.jpg" },
    { name: "瀬奈ももえ", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-123.jpg" },
    { name: "矢沢あかね", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/01.jpg" },
    { name: "三上ゆうな", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-109.jpg" },
    { name: "中条かれん", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-106.jpg" },
    { name: "片瀬あおい", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-114.jpg" },
    { name: "森咲えみり", img: "https://aroma-blossom.com/wp-content/uploads/2023/05/600_800_01-15.jpg" },
    { name: "深澤はるな", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-104.jpg" },
    { name: "葉月かすみ", img: "https://aroma-blossom.com/wp-content/uploads/2023/05/600_800_04.jpg" },
    { name: "桜井さやか", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-107.jpg" },
    { name: "染谷あやみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_04-36.jpg" },
    { name: "夏目かなこ", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_03-95.jpg" },
    { name: "畑中あんり", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-99.jpg" },
    { name: "鷹宮しずか", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_03-93.jpg" },
    { name: "笹木まり", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-131.jpg" },
    { name: "竹石しおり", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_03-81.jpg" },
    { name: "平井まお", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_05-15.jpg" },
    { name: "白雪ゆま", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-122.jpg" },
    { name: "相川りん", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_03_6.jpg" },
    { name: "真田ゆあ", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-78.jpg" },
    { name: "浅野りほ", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-73.jpg" },
    { name: "真嶋りな", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_09-1.jpg" },
    { name: "橘みさと", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-77.jpg" },
    { name: "近藤えま", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_03-66.jpg" },
    { name: "愛沢こう", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_023.jpg" },
    { name: "寺崎ひより", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-75.jpg" },
    { name: "麻生なな", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-67.jpg" },
    { name: "広瀬みなみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-60.jpg" },
    { name: "白咲ねね", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-61.jpg" },
    { name: "高岡ゆき", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-63.jpg" },
    { name: "福原あいみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-51.jpg" },
    { name: "加美野きい", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-53.jpg" },
    { name: "高倉みゆう", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-56.jpg" },
    { name: "杉本らん", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_03-48.jpg" },
    { name: "石井さな", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_03-44.jpg" },
    { name: "綾野にいな", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/926CD0BC-08C3-4FD0-A37C-A21DFA870843-1.jpeg" },
    { name: "野本りの", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-46.jpg" },
    { name: "百瀬つきの", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-47.jpg" },
    { name: "椿ゆりな", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-45.jpg" },
    { name: "赤坂みのり", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-29.jpg" },
    { name: "岸れいか", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-19.jpg" },
    { name: "川原あやの", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-18.jpg" },
    { name: "鶴城ななえ", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_01-15.jpg" },
    { name: "竹内さゆり", img: "https://aroma-blossom.com/wp-content/uploads/2022/04/600_800_02.jpg" },
    { name: "長富ともみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-14.jpg" },
    { name: "香川なつき", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-11.jpg" },
    { name: "瀬名みゆ", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-10.jpg" },
    { name: "藤崎りこ", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-11.jpg" },
    { name: "西山みく", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-7.jpg" },
    { name: "北川ゆうか", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02_1.jpg" },
    { name: "梨本めい", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_02-4.jpg" },
    { name: "乙葉めぐみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_02-43.jpg" },
    { name: "水沢さおり", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_02-26.jpg" },
    { name: "三浦もも", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/白モザ_600_800_02.jpg" },
    { name: "栗山さくら", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_03-31.jpg" },
    { name: "美月まいか", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_01-18.jpg" },
    { name: "向井ひなた", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_01-12.jpg" },
    { name: "奥山いちか", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_01-10.jpg" },
    { name: "吉永まゆ", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_00.jpg" },
    { name: "宝生しおん", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_01-11.jpg" },
    { name: "春乃はな", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_02_c.jpg" },
    { name: "香月りさ", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_02-6.jpg" },
    { name: "松沢しの", img: "https://aroma-blossom.com/wp-content/uploads/2021/09/600_800_02.jpg" },
    { name: "安仁屋うみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_01-5.jpg" },
    { name: "白井りお", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_02-1.jpg" },
    { name: "佐野つぐみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_03-71.jpg" },
    { name: "蒼井まや", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_01-56.jpg" },
    { name: "麻実れお", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_03-56.jpg" },
    { name: "川瀬しほ", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_04-30.jpg" },
    { name: "望月まりあ", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_03-53.jpg" },
    { name: "二宮かえで", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_02-51.jpg" },
    { name: "森下ちとせ", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_01-39.jpg" },
    { name: "北条りいさ", img: "https://aroma-blossom.com/wp-content/uploads/2021/12/600_800_09.jpg" },
    { name: "結城まい", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_08.jpg" },
    { name: "高梨あやか", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_03-30.jpg" },
    { name: "水谷あいり", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_01-32.jpg" },
    { name: "青木たかこ", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_03-27.jpg" },
    { name: "新美みな", img: "https://aroma-blossom.com/wp-content/uploads/2020/09/600_800_02_7.jpg" },
    { name: "春畑ゆめか", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_04_1-1.jpg" },
    { name: "瀬戸みなみ", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_04-6.jpg" },
    { name: "藤木れい", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_07-6.jpg" },
    { name: "小山ゆわ", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/asdf-1.jpg" },
    { name: "黒田ゆいか", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_06-5.jpg" },
    { name: "柏木ゆう", img: "https://aroma-blossom.com/wp-content/uploads/2019/05/600_800_01-37.jpg" },
    { name: "藤ちなつ", img: "https://aroma-blossom.com/wp-content/uploads/2018/07/300_400_01.jpg" },
    { name: "南あや", img: "https://aroma-blossom.com/wp-content/uploads/2019/07/600_800_01-1.jpg" },
    { name: "風間さら", img: "https://aroma-blossom.com/wp-content/uploads/2018/04/ehw.jpg" },
    { name: "酒井れな", img: "https://aroma-blossom.com/wp-content/uploads/2019/06/600_800_03-18.jpg" }
  ];

  try {
    console.log(`🔍 「${targetKeyword}」の全系列店とキャストデータを更新します...\n`);

    // 1. 全系列店を検索
    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(targetKeyword)}*&select=id,name`, { headers });
    const shops = await res.json();

    if (shops && shops.length > 0) {
      for (const shop of shops) {
        console.log(`🏠 店舗: ${shop.name} (ID: ${shop.id}) を更新中...`);

        // 店舗情報の更新（ロゴ・スケジュールURL）
        await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            image_url: targetLogoUrl,
            schedule_url: targetScheduleUrl
          })
        });

        // 2. キャストの流し込み（全213名）
        let insertCount = 0;
        for (const cast of casts) {
          const newId = `${shop.id}_${cast.name.replace(/[\s　]+/g, '')}`;
          const castPayload = {
            id: newId,
            shop_id: shop.id,
            name: cast.name,
            image_url: cast.img
          };

          const castRes = await fetch(`${url}/rest/v1/therapists`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify(castPayload)
          });
          if (castRes.ok) insertCount++;
        }
        console.log(` ✅ ${shop.name} の設定完了！（キャスト ${insertCount}名 登録）`);
      }
      console.log("\n🎉 全ての更新が完了しました！ブラウザをリロードして確認してください！");
    } else {
      console.log(`⚠️ 「${targetKeyword}」に該当する店舗が見つかりませんでした。`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
