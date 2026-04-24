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
      searchKeywords: ['aroma maison', 'アロマメゾン'],
      website_url: "https://www.aromamaison.tokyo/",
      schedule_url: "https://www.aromamaison.tokyo/schedule/",
      price_system: "70分 15,000円\n90分 18,000円\n100分 21,000円\n120分 23,000円\n150分 29,000円\n180分 35,000円",
      casts: [
        { name: "加賀屋まおり", age: "28", size: "T.157 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11326.jpg" },
        { name: "真白ゆあ", age: "25", size: "T.159 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11311.jpg" },
        { name: "杉崎あい", age: "27", size: "T.166 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11304.jpg" },
        { name: "緒方いおん", age: "28", size: "T.161 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11295.jpg" },
        { name: "中越いつき", age: "27", size: "T.154 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11280.jpg" },
        { name: "西城まな", age: "26", size: "T.167 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11262.jpg" },
        { name: "水川あすみ", age: "29", size: "T.161 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11269.jpg" },
        { name: "星月かすみ", age: "25", size: "T.151 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11234.jpg" },
        { name: "紅葉りお", age: "29", size: "T.162 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11227.jpg" },
        { name: "朝倉さやか", age: "30", size: "T.169 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10390.jpg" },
        { name: "椿いおり", age: "26", size: "T.162 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11235.jpg" },
        { name: "堤あいり", age: "28", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11192.jpg" },
        { name: "成瀬かりな", age: "26", size: "T.168 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11179.jpg" },
        { name: "木村ゆめ", age: "26", size: "T.162 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11175.jpg" },
        { name: "香月ゆうか", age: "23", size: "T.157 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11174.jpg" },
        { name: "二階堂唯", age: "29", size: "T.167 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_1399.jpg" },
        { name: "神楽ゆら", age: "23", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11160.jpg" },
        { name: "松嶋しおん", age: "28", size: "T.163 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_5271.jpg" },
        { name: "園山なな", age: "29", size: "T.168 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10826.jpg" },
        { name: "和泉しおん", age: "24", size: "T.163 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10361.jpg" },
        { name: "琵琶りさ", age: "25", size: "T.152 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10783.jpg" },
        { name: "栗原かのん", age: "26", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11090.jpg" },
        { name: "小原えみ", age: "27", size: "T.156 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_6539.jpg" },
        { name: "近藤あみん", age: "25", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_7468.jpg" },
        { name: "星咲れいか", age: "28", size: "T.160 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11159.jpg" },
        { name: "萩原みくる", age: "28", size: "T.150 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10820.jpg" },
        { name: "立華はな", age: "28", size: "T.168 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10962.jpg" },
        { name: "市川ななせ", age: "24", size: "T.170 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10973.jpg" },
        { name: "佐野エリナ", age: "27", size: "T.168 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_2919.jpg" },
        { name: "八坂さくら", age: "27", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_6757.jpg" },
        { name: "谷あいり", age: "26", size: "T.160 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_7652.jpg" },
        { name: "花形みずほ", age: "26", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10366.jpg" },
        { name: "日向りこ", age: "25", size: "T.155 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_5746.jpg" },
        { name: "巴みう", age: "26", size: "T.162 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10007.jpg" },
        { name: "松若つばさ", age: "26", size: "T.154 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10578.jpg" },
        { name: "雨宮さくら", age: "23", size: "T.155 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_6650.jpg" },
        { name: "香椎りり", age: "26", size: "T.163 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9638.jpg" },
        { name: "吉瀬れいな", age: "32", size: "T.163 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11050.jpg" },
        { name: "高槻カオリ", age: "30", size: "T.163 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10700.jpg" },
        { name: "上条ゆりあ", age: "29", size: "T.168 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10618.jpg" },
        { name: "城咲ゆめ", age: "27", size: "T.168 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11027.jpg" },
        { name: "天音りな", age: "25", size: "T.165 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_8757.jpg" },
        { name: "二宮ほたる", age: "30", size: "T.164 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10640.jpg" },
        { name: "桑澤ゆいな", age: "25", size: "T.160 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_8999.jpg" },
        { name: "葉加瀬りこ", age: "26", size: "T.160 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_6301.jpg" },
        { name: "湊もも", age: "24", size: "T.156 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_6023.jpg" },
        { name: "宮沢ゆめ", age: "28", size: "T.161 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_1493.jpg" },
        { name: "美原あゆな", age: "24", size: "T.155 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_7006.jpg" },
        { name: "神谷ゆき", age: "23", size: "T.160 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_7531.jpg" },
        { name: "鈴原りり", age: "22", size: "T.162 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_6628.jpg" },
        { name: "睦月りり", age: "29", size: "T.166 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10960.jpg" },
        { name: "三雲あきな", age: "27", size: "T.160 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10636.jpg" },
        { name: "水無月ゆな", age: "26", size: "T.168 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_8873.jpg" },
        { name: "鈴木こころ", age: "26", size: "T.155 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10146.jpg" },
        { name: "真野みつき", age: "31", size: "T.157 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10759.jpg" },
        { name: "片桐あや", age: "27", size: "T.166 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10594.jpg" },
        { name: "永井すみれ", age: "25", size: "T.160 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_7995.jpg" },
        { name: "愛乃かのん", age: "27", size: "T.150 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11146.jpg" },
        { name: "真木れいか", age: "26", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_7834.jpg" },
        { name: "皇いちか", age: "26", size: "T.156 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10983.jpg" },
        { name: "一条みさき", age: "26", size: "T.163 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10141.jpg" },
        { name: "桜坂ひめな", age: "22", size: "T.155 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9259.jpg" },
        { name: "川合るな", age: "26", size: "T.157 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10349.jpg" },
        { name: "東山れい", age: "23", size: "T.161 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10958.jpg" },
        { name: "松浦あかり", age: "25", size: "T.162 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_7246.jpeg" },
        { name: "河野みれい", age: "24", size: "T.161 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10369.jpg" },
        { name: "藤宮ゆり", age: "25", size: "T.169 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_8940.jpg" },
        { name: "紺野さや", age: "26", size: "T.157 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_1674.jpg" },
        { name: "徳永えり", age: "30", size: "T.163 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_2010.jpg" },
        { name: "黒沢ゆり", age: "26", size: "T.155 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10178.jpg" },
        { name: "水島さゆり", age: "26", size: "T.154 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9237.jpg" },
        { name: "沢尻えれな", age: "25", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_6221.jpg" },
        { name: "美園かなで", age: "26", size: "T.156 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10757.jpg" },
        { name: "佐田まりこ", age: "30", size: "T.154 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_7715.jpg" },
        { name: "大崎みつり", age: "24", size: "T.155 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10931.jpg" },
        { name: "夏川あかり", age: "28", size: "T.166 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10267.jpg" },
        { name: "綾瀬にいな", age: "26", size: "T.162 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10975.jpg" },
        { name: "美咲ゆい", age: "26", size: "T.156 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_8408.jpg" },
        { name: "要いおり", age: "24", size: "T.154 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9618.jpg" },
        { name: "夢原えり", age: "26", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11202.jpg" },
        { name: "霜月めあ", age: "25", size: "T.168 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_6341.jpg" },
        { name: "桜井りな", age: "28", size: "T.156 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_6574.jpg" },
        { name: "江口はな", age: "26", size: "T.155 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_5274.jpg" },
        { name: "赤堀いとは", age: "24", size: "T.168 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10562.jpg" },
        { name: "並木なみ", age: "27", size: "T.162 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10459.jpg" },
        { name: "花岡すみれ", age: "28", size: "T.162 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10899.jpg" },
        { name: "峰藤さくら", age: "27", size: "T.155 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_6696.jpg" },
        { name: "大久保あの", age: "27", size: "T.155 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9513.jpg" },
        { name: "愛内あい", age: "31", size: "T.155 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11088.jpg" },
        { name: "弓木ゆい", age: "23", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10579.jpg" },
        { name: "目黒あみ", age: "25", size: "T.161 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9347.jpg" },
        { name: "川崎れに", age: "27", size: "T.170 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9742.jpg" },
        { name: "宇野りら", age: "22", size: "T.160 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10930.jpg" },
        { name: "乃木あきほ", age: "27", size: "T.167 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_11008.jpg" },
        { name: "風間いちか", age: "32", size: "T.163 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9687.jpg" },
        { name: "月城さな", age: "26", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_8946.jpg" },
        { name: "赤羽りん", age: "26", size: "T.158 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9920.jpg" },
        { name: "金子さおり", age: "31", size: "T.163 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10723.jpg" },
        { name: "松田まき", age: "28", size: "T.151 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9633.jpg" },
        { name: "福沢あゆ", age: "32", size: "T.162 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9437.jpg" },
        { name: "美鈴ひとみ", age: "30", size: "T.153 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_954.jpg" },
        { name: "高島ねあ", age: "28", size: "T.157 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10650.jpg" },
        { name: "今井ありさ", age: "25", size: "T.160 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9197.jpg" },
        { name: "愛咲えなこ", age: "24", size: "T.164 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9738.jpg" },
        { name: "四月一日あきら", age: "27", size: "T.150 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_9689.jpg" },
        { name: "愛依香りん", age: "28", size: "T.161 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10843.jpg" },
        { name: "樋口つかさ", age: "28", size: "T.156 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_5132.jpg" },
        { name: "河村みお", age: "25", size: "T.164 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10772.jpg" },
        { name: "佐藤りこ", age: "25", size: "T.160 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10708.jpg" },
        { name: "長澤あさみ", age: "31", size: "T.167 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10768.jpg" },
        { name: "広末まなみ", age: "28", size: "T.160 / B.-", img: "https://www.aromamaison.tokyo/images/ml_11_1_10535.jpg" }
      ]
    },
    {
      searchKeywords: ['lumespa', 'ルメスパ', 'aroma spec'],
      website_url: "https://lumespa-tokyo.jp/",
      schedule_url: "https://lumespa-tokyo.jp/schedule",
      price_system: "60分衣装チェンジ込み♡ 14,000円\n80分衣装チェンジ込み♡ 18,000円\n100分衣装チェンジ込み♡ 22,000円\n150分衣装チェンジ込み♡ 32,000円\n200分衣装チェンジ込み♡ 41,000円",
      casts: [
        { name: "姫野ひめの", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/17/d10ac197-db72-42f0-8106-28b798dc1935.jpg" },
        { name: "上原あゆみ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/9/518cc0b1-aee0-43d6-9285-83b6e3bf3bb9.jpg" },
        { name: "鈴森ひな", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/126/810321b9-fd5e-48b1-856b-21cd2b6e2191.jpg" },
        { name: "羽柴かれん", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/18/d58936b3-895f-4e18-8e66-82e8f59d6708.jpg" },
        { name: "武田りか", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/16/d393246f-6c11-44b6-918d-c2adbb596d30.jpg" },
        { name: "愛川ゆら", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/12/e451f0b7-5447-4c09-bbc2-83d215f5a43a.jpg" },
        { name: "河井みゆ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/50/4854e767-b836-46ba-917f-3cfce280930d.jpg" },
        { name: "佐々木あい", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/8/f69c8972-e788-429b-9804-28f792b6f6b3.jpg" },
        { name: "藤沢ゆきの", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/15/bc61cb4c-7669-4fa5-8af5-72ceb2f4d8e9.jpg" },
        { name: "白雪ありす", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/123/a7cfa924-2948-457a-9d64-fe71b2f081af.jpg" },
        { name: "椎名ゆづき", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/2/2a1c528c-b156-4fe5-b6af-5635f02079a0.jpg" },
        { name: "藍山ゆりあ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/34/207355a0-ed74-479a-9391-f69a4fc291f4.jpg" },
        { name: "天野ゆい", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/1/a8d838ed-4576-47d4-9c7f-312da81662a6.jpg" },
        { name: "斉藤あすか", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/130/2cbf6eec-f66c-4f4e-ad97-ed26b8dfd5d3.jpg" },
        { name: "森野りこ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/10/7e1cd675-5309-4669-b216-267895b3ceb4.jpg" },
        { name: "綾瀬かな", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/13/15d02395-d98c-42f5-9a7b-db8924693351.jpg" },
        { name: "葉月るい", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/24/677a878f-ea1b-4410-8176-e7368afbf2b1.jpg" },
        { name: "酪農みるく", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/7/6e5fa170-a041-4a9d-8553-47c93ce2a8f2.jpg" },
        { name: "水城ひまり", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/59/51375dc3-d4de-4558-adc5-f9092b46e8cc.jpg" },
        { name: "目白ひなの", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/26/adc5e123-f7d4-4466-a2d1-2f8d857ef562.jpg" },
        { name: "川崎りな", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/107/c6b21b71-7cd2-45f4-8802-476ba1bc8cee.jpg" },
        { name: "橘ゆうか", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/63/5fda5962-05ca-480e-90ae-235cf9b1943b.jpg" },
        { name: "渚らん", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/28/764eb099-4778-41e9-8211-26678ec24532.jpg" },
        { name: "月野せな", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/21/c86d5c09-155b-436c-a388-ea47598973ae.jpg" },
        { name: "佐久間もも", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/6/0b1985ac-3806-43c3-b3ed-eefbec939dd3.jpg" },
        { name: "上野りんか", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/36/1cc228d0-7499-492e-9007-03409fc2dc03.jpg" },
        { name: "二宮さき", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/31/8ddb43fa-e974-42d2-9d22-66c792c50e17.jpg" },
        { name: "若宮かぐら", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/40/046353f0-dced-40b6-aba9-9d4ef589dce8.jpg" },
        { name: "葵ひかり", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/121/65c8d7fe-a48c-4085-8424-8dd0a1cc1fc2.jpg" },
        { name: "小町ちか", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/38/95a0d5fe-4f6c-4804-8133-ef72f70699de.jpg" },
        { name: "白石そら", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/58/b0bce02c-f3b3-40d7-b44a-a52c489c833f.jpg" },
        { name: "堤りょうこ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/49/11096050-8f37-46d7-bc10-833237d88ba7.jpg" },
        { name: "白浜みれい", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/33/0e8c7398-5428-40e5-b799-a3e8db347e41.jpg" },
        { name: "内村さやか", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/5/9d192fd6-5169-4ad2-bd18-0fcc4bf0e3d6.jpg" },
        { name: "大宮すず", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/14/deac9423-bdc9-4cfb-85d4-b319f0078e51.jpg" },
        { name: "三上ののあ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/29/36268dcd-eb0a-4eed-bcc7-3e9cf761086d.jpg" },
        { name: "一ノ瀬みな", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/109/a9112a27-9d73-4f8b-950c-aca7c8f141bf.jpg" },
        { name: "山下みよ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/110/522b2fcc-964b-475c-ae30-c9b44fcd5acb.jpg" },
        { name: "神楽みすず", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/23/686225d5-1a4d-4380-9ba5-72194fc0ec6e.jpg" },
        { name: "広瀬ひなこ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/39/2109fc58-d0f5-4682-95f7-6fdf72cc90ac.jpg" },
        { name: "城咲はる", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/115/84cfc9f5-1e85-4d37-ac78-e243bb6bc834.jpg" },
        { name: "黒木せいら", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/139/c80056ca-a12d-45fc-87c8-a81892511373.jpg" },
        { name: "伊藤みう", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/138/87b255d0-6023-48e2-be98-2d2dadcc5b5b.jpg" },
        { name: "白樺あまみ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/135/0efbe772-ad75-4fae-b2f6-97b0582d4eee.jpg" },
        { name: "愛野うの", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/136/78b82094-a303-4d5e-8db1-ab4740d61317.jpg" },
        { name: "篠原えま", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/128/b09b97c1-8318-4f53-833d-33d2cc07b463.jpg" },
        { name: "三角まある", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/127/0abe9ac0-a603-4835-a8b6-2fe2be17a8b5.jpg" },
        { name: "恋乃きらら", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/117/a41174fb-2570-4035-aca9-63c66491d516.jpg" },
        { name: "早瀬こと", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/129/9842cd70-28ff-4c88-a50b-087ae9e0b866.jpg" },
        { name: "茜りこ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/132/6b56a7a8-de0a-4f44-aa4b-1982830f4bee.jpg" },
        { name: "梅田れい", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/133/f42458b8-4b8b-4f24-98f2-ac449e13a486.jpg" },
        { name: "藤嶺りん", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/134/1cf4e0cd-31fb-48ca-a9cc-90063438eefd.jpg" },
        { name: "桜田こころ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/137/24b24f5a-bbb9-4cfe-ae7f-4dc412a81656.jpg" },
        { name: "篠木まりな", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/89/949b3381-e409-4aad-8a17-74c904c8de76.jpg" },
        { name: "山之内ゆり", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/44/9b64b764-8f6f-42e3-9081-1b3d5b8ecabd.jpg" },
        { name: "藤野なぎ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/11/b19a22a0-a7a1-42eb-9add-e9a2c299247f.jpg" },
        { name: "花梨かりな", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/32/463f7546-8e51-4f08-8031-07247018393a.jpg" },
        { name: "木下きほ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/108/59983ea6-d2d2-4f9e-ad03-9c95521bc327.jpg" },
        { name: "宮下かな", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/114/4079bff8-acf1-40f2-800d-226b25dc4c10.jpg" },
        { name: "花山ゆき", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/119/2bd7cf8b-1612-4c80-a79b-a00a9019f03e.jpg" },
        { name: "五十嵐ゆな", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/43/36d4c518-c75c-475d-b4da-7c52193a7d3f.jpg" },
        { name: "高島えり", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/37/975da93e-1775-48de-b0fb-cb3d8dd3868e.jpg" },
        { name: "山岸りな", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/20/52a00d9f-bfd4-4e19-a730-3e435e985128.jpg" },
        { name: "桜庭れいか", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/22/3f1fa778-0bad-4ee0-9d16-569af97398e6.jpg" },
        { name: "松島るか", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/118/3d781e3a-e30b-4e65-a42e-e5c90046c52b.jpg" },
        { name: "有村かのん", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/120/8eafaced-5190-4aff-8576-9387c05ad7f9.jpg" },
        { name: "藤咲かえで", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/47/725bf39b-071c-4549-9473-8b8d704a9dc4.jpg" },
        { name: "本間えも", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/25/4518bed0-9301-49e7-86e0-54e1dd7a1c27.jpg" },
        { name: "加賀あすか", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/93/0566b6b8-bd31-4467-90c2-3dc8c630b5cd.jpg" },
        { name: "天音のあ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/41/e0f8175d-f2e1-4920-98f7-d0e809b2c446.jpg" },
        { name: "柏木いく", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/27/a3b181af-6a12-4c90-b811-e71c545612dd.jpg" },
        { name: "東條ゆあ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/46/b1aef018-51c7-41a0-8b07-f0eb9ccd8064.jpg" },
        { name: "夏目まりあ", age: "-", size: "T.- / B.-", img: "https://lumespa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/125/d421d5a4-50aa-4b31-911a-a29fbb7cf7cd.jpg" }
      ]
    }
  ];

  try {
    console.log(`🔍 データベースから「Aroma Maison」と「ルメスパ」を検索し、完全な情報とキャスト更新を実行します...\n`);

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

        // 1. 店舗情報の更新
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

        // 2. キャストの登録・更新
        const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name`, { headers });
        const dbCasts = await dbRes.json();
        
        let updateCount = 0;
        let insertCount = 0;

        // 名前をキーにして重複を排除したユニークなリストを作成
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
        console.log(`   🎉 キャスト${uniqueCasts.length}名設定完了（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
      }
    }
    
    console.log(`\n🎊 すべての更新が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
