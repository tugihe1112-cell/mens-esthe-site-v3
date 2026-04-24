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
      searchKeywords: ['aroma abc', 'アロマabc'],
      website_url: "https://a-abc.tokyo/",
      schedule_url: "https://a-abc.tokyo/schedule/",
      price_system: "70分 15,000円\n90分 17,000円\n120分 21,000円\n150分 25,000円",
      casts: [
        { name: "池田ちか", age: "22", size: "T.164 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/363_1.webp" },
        { name: "桜咲あすか", age: "22", size: "T.165 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/362_1.webp" },
        { name: "岬なほ", age: "28", size: "T.164 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/361_1.webp" },
        { name: "藤咲みち", age: "23", size: "T.160 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/360_1.webp" },
        { name: "愛葉かんな", age: "26", size: "T.153 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/358_1.webp" },
        { name: "綾瀬ひかり", age: "22", size: "T.164 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/315_1.webp" },
        { name: "田中ゆな", age: "22", size: "T.160 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/345_1.webp" },
        { name: "冬月さゆみ", age: "26", size: "T.152 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/206_1.webp" },
        { name: "鈴木くるみ", age: "28", size: "T.153 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/314_1.webp" },
        { name: "一ノ瀬しおり", age: "26", size: "T.160 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/261_1.webp" },
        { name: "南あい", age: "25", size: "T.160 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/343_1.webp" },
        { name: "神谷かほ", age: "28", size: "T.162 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/336_1.webp" },
        { name: "小桜みき", age: "27", size: "T.158 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/354_1.webp" },
        { name: "姫宮ゆず", age: "22", size: "T.158 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/127_1.webp" },
        { name: "若葉きほ", age: "25", size: "T.165 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/335_1.webp" },
        { name: "芦田まこ", age: "25", size: "T.160 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/344_1.webp" },
        { name: "宮水らん", age: "25", size: "T.158 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/342_1.webp" },
        { name: "相原みほ", age: "28", size: "T.152 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/355_1.webp" },
        { name: "立花りお", age: "25", size: "T.146 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/38_1.webp" },
        { name: "松本ゆら", age: "23", size: "T.155 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/224_1.webp" },
        { name: "白石かすみ", age: "25", size: "T.156 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/357_1.webp" },
        { name: "乙花かりん", age: "25", size: "T.155 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/353_1.webp" },
        { name: "菅原あおい", age: "27", size: "T.163 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/316_1.webp" },
        { name: "有村みお", age: "27", size: "T.162 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/313_1.webp" },
        { name: "桜波えれん", age: "25", size: "T.164 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/212_1.webp" },
        { name: "桜井こはる", age: "27", size: "T.152 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/352_1.webp" },
        { name: "春川ひな", age: "24", size: "T.155 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/326_1.webp" },
        { name: "成瀬りり", age: "25", size: "T.168 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/324_1.webp" },
        { name: "桃園れおな", age: "28", size: "T.158 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/278_1.webp" },
        { name: "朝比奈もも", age: "25", size: "T.163 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/262_1.webp" },
        { name: "広瀬あんじ", age: "21", size: "T.165 / B.- / W.- / H.-", img: "https://a-abc.tokyo/therapist_img/328_1.webp" }
      ]
    },
    {
      searchKeywords: ['anna', 'アンナ'],
      website_url: "https://www.esthe-anna.net/",
      schedule_url: "https://www.esthe-anna.net/schedule",
      price_system: "80分 17,000円(税込)\n100分 20,000円(税込)\n120分 24,000円(税込)\n140分 27,000円(税込)",
      casts: [
        { name: "吉高ゆな", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/502/8a191063-709c-4834-8578-bbab49502005.jpg" },
        { name: "大谷えみり", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/501/bdfd628f-dfeb-403a-a998-a8213c6dc389.jpg" },
        { name: "黒木えれな", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/503/34415047-8c38-4aff-aea7-61af092215e7.jpg" },
        { name: "倉科さな", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/499/c6cd8ddb-fbfe-4f76-97c9-0f9689e989f2.jpg" },
        { name: "一色なぎさ", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/498/7fc1e0e6-8740-4559-a561-221a0dfbaa8b.jpg" },
        { name: "木下美海", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/489/512f3c06-6499-49d4-94c0-dd7ba964e6a4.jpg" },
        { name: "桜井ひかり", age: "30", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/491/c187632c-224c-4782-a42b-932a6de28281.jpg" },
        { name: "乙女にこ", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/500/d263a87f-86b1-4d38-9185-26d865f52b17.jpg" },
        { name: "新井ひかる", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/assets/customer/no_image-1c3154e5017da984c1aadcc8da57071262c7af2b235179de296d3163feaa7314.jpg" },
        { name: "加藤りこ", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/478/0f89eb05-1ffc-4f0c-8717-eeb101a0c6f0.jpg" },
        { name: "碧しろな", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/338/6f52fc39-0d95-4464-89a2-f901e1be38a6.jpg" },
        { name: "鷲見えりな", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/258/1c4bc555-cc5b-4eea-9caa-73c7026498c6.jpg" },
        { name: "吉永なみ", age: "29", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/80/b2b63daf-53bb-46b7-9d48-2a2acd377565.png" },
        { name: "涼宮かりん", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/443/5a9801f2-e110-4b12-8f0b-90f4e6947abc.jpg" },
        { name: "及川かれん", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/404/ae042f78-15e6-4c0e-b495-b87d9a024078.jpg" },
        { name: "菊池らん", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/464/5ece5441-290c-40a7-8528-a00e702ec9f9.jpg" },
        { name: "天塚ひより", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/481/6e954980-6855-4ca7-ae8b-d7f28c5f06f7.jpg" },
        { name: "永倉はつね", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/291/f58ea0ec-574d-40b6-a64d-e685b87bc680.jpg" },
        { name: "湊まほ", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/496/249be952-5c10-4950-acdc-3163fc906418.jpg" },
        { name: "一花りく", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/429/d6bd27d1-19d7-4946-85a8-fee77a955a86.jpg" },
        { name: "椎名りん", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/461/6605dba9-9320-43aa-a923-11674e9a7136.jpg" },
        { name: "椿さえか", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/493/39ed9241-6c24-45cb-972a-b0c93520ddb3.jpg" },
        { name: "水トあんり", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/471/9e806998-13d5-4a74-81a9-951d0cc3d8a4.jpg" },
        { name: "小春ひな", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/488/18289d2d-371f-402c-be65-390311399f4f.jpg" },
        { name: "七瀬すず", age: "30", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/469/787df714-3f4a-453f-a851-9daa284893ca.jpg" },
        { name: "白鳥絵美留", age: "32", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/475/c021047e-40c6-4a2f-851c-9a61b887ff0f.jpg" },
        { name: "森かすみ", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/483/663bd813-4d22-4a57-b67b-2434b619213c.jpg" },
        { name: "日向あんず", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/340/1a5b1411-816d-474b-8b6d-c7ca84eff2be.jpg" },
        { name: "河瀬なつき", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/452/dfde4021-9469-4053-9789-4b5bf4d26ffc.jpg" },
        { name: "黒崎リカ", age: "32", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/207/f72ee9d7-8140-4d72-8cfa-c12f5fba06a3.jpg" },
        { name: "結城ゆうな", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/497/d7bad7b4-65b2-4087-a9f1-2b9f2bedae9c.jpg" },
        { name: "星宮いちか", age: "30", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/281/f9f6cb65-6465-4e0e-b48a-74c0cdd5f519.jpg" },
        { name: "春川なお", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/333/a75d0313-e040-4dfe-ae6e-5d35c8037fca.jpg" },
        { name: "佐々木まゆ", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/240/80172f6a-8c84-4b8d-909a-0759731471f2.jpg" },
        { name: "水川おとは", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/473/eda5d2eb-2654-4af6-9fd5-47c3150a15d1.jpg" },
        { name: "双葉あずさ", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/494/adeefcb1-271a-4395-bc43-75dfcb0c050b.jpg" },
        { name: "若葉みつき", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/474/c70a3a00-8fc8-4d75-a9a3-f20019988cfb.jpg" },
        { name: "市原ひびき", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/441/2eb065a1-0da9-4747-9fff-be956f1a3276.jpg" },
        { name: "照橋さとみ", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/142/3e92d645-c7b8-491b-98f1-fdece1767145.png" },
        { name: "鈴木まりこ", age: "32", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/412/9522b84d-e1e7-44ae-8141-25b5b64ce9d2.jpg" },
        { name: "綾瀬さら", age: "29", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/373/7af28f2a-aa46-4f34-bb50-b6c0cd50181e.jpg" },
        { name: "成瀬ゆめ", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/329/42e76ce4-d1d5-42d8-8ed2-b60325475770.jpg" },
        { name: "新垣ゆり", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/274/dd6989e5-e59b-4892-a66e-54c67325ac0d.jpg" },
        { name: "柊こころ", age: "30", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/480/cae4c373-bbf8-4942-8f2d-58a7495564f7.jpg" },
        { name: "初音りょう", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/485/84e66548-e148-4227-a759-f86f2a73357d.jpg" },
        { name: "桜ももか", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/467/7937c38a-6914-4446-889d-d47ea189376a.jpg" },
        { name: "衛藤ちはる", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/406/efd2647e-c807-4807-ba6a-13648a6e6716.jpg" },
        { name: "工藤はづき", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/279/52c15cfc-c789-420d-a1c1-4f05f5891692.jpg" },
        { name: "町田るな", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/484/7cac898b-f99d-40da-a326-bba559bd269e.jpg" },
        { name: "本田まい", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/482/c92d5942-3b45-4dd5-8194-2a760e828341.jpg" },
        { name: "新みなも", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/409/cbc7339c-fc3d-4c04-b733-7f78edb0414e.jpg" },
        { name: "雪平りの", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/479/781b43d7-373d-4f28-b889-f01fc35e2eca.jpg" },
        { name: "水原あおい", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/466/1d4c16eb-95a3-426d-a474-a80a09f4d638.jpg" },
        { name: "星乃せな", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/453/73958cf7-f4cc-4455-bbcb-3b350aad51bb.jpg" },
        { name: "上原まりん", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/81/cfeacde7-1b90-4142-a14c-e99e96cc29c2.png" },
        { name: "相澤えま", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/363/9f6e7604-6e78-494f-812e-1c34c6ce82c8.jpg" },
        { name: "越智なぎさ", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/447/20442057-3773-4aff-b37e-f2a39515f8ae.jpg" },
        { name: "小鳥遊はる", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/355/e43cf23f-0a4b-4923-918d-0cf0e8888bb6.jpg" },
        { name: "三上るな", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/458/e37db3b2-36a3-4013-8bf8-0228422feb25.jpg" },
        { name: "西園寺りお", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/427/0c8077b6-0292-491f-ab0d-594f09010bc5.jpg" },
        { name: "坂下めい", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/450/1f21c89c-cafa-4c49-b1b3-a4fcf6cf6639.jpg" },
        { name: "朝倉みちる", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/448/bc201142-3449-46b3-baa0-2ebde05b332a.jpg" },
        { name: "蛯原もも", age: "25", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/420/9d9f1a96-d638-4c70-bcdb-475c34cccf12.jpg" },
        { name: "美咲れな", age: "27", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/431/385da07f-3753-434a-9dec-9ba8b671f517.jpg" },
        { name: "三宅みずき", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/418/ac1ab178-3be7-4e9d-821a-4c4fb7d7cef2.jpg" },
        { name: "一ノ瀬みく", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/319/708858a3-17ac-4c91-b222-82ee1977ef36.jpg" },
        { name: "小澤良子", age: "30", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/208/7891c037-bbca-4adc-b9b9-bbce3c9291df.png" },
        { name: "桃瀬アイ", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/262/1eb1ecb3-be02-41a2-ae05-3ede575ee26e.jpg" },
        { name: "桜木ゆりあ", age: "23", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/139/79ca9f37-1c7b-4060-b0c3-6966da72ba6b.png" },
        { name: "小夏まいか", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/419/4ca430c4-a45a-4585-b839-8606385dfab3.jpg" },
        { name: "流川あきな", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/130/f433b86b-e7be-414e-85ac-c486966c136b.jpg" },
        { name: "胡桃るな", age: "29", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/378/0fe2f74f-5e1a-4744-bfc8-39a6b5a500c2.jpg" },
        { name: "山本じゅり", age: "30", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/39/974c18df-3712-4b37-a7dd-3be595b5aefe.png" },
        { name: "阿部みゆ", age: "30", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/417/88ec6e52-2320-4a46-90a2-22f10950bd94.jpg" },
        { name: "乃木りこ", age: "24", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/162/13f6a430-c91d-4e93-81d5-8f4734692fc3.png" },
        { name: "戸田りえ", age: "21", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/290/2acf6b60-36bb-442d-a46a-5497d84d2a48.jpg" },
        { name: "滝本みれい", age: "28", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/177/6c6597e8-8dd2-4043-9088-c0e5bbc1114f.png" },
        { name: "神崎せな", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/171/6522c5b3-775f-4b6a-9071-e56c96f85495.jpg" },
        { name: "吉川あさみ", age: "31", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/306/a00d015a-554d-4282-a302-c31146d03d39.jpg" },
        { name: "桐谷もも", age: "22", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/assets/customer/no_image-1c3154e5017da984c1aadcc8da57071262c7af2b235179de296d3163feaa7314.jpg" },
        { name: "松前みき", age: "26", size: "T.- / B.- / W.- / H.-", img: "https://anna-bucket-prod.s3-ap-northeast-1.amazonaws.com/assets/customer/no_image-1c3154e5017da984c1aadcc8da57071262c7af2b235179de296d3163feaa7314.jpg" }
      ]
    }
  ];

  try {
    console.log(`🔍 データベースから「Aroma ABC」と「ANNA」を検索し、完全な情報とキャスト更新を実行します...\n`);

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
