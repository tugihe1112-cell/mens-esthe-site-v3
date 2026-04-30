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
      keywords: ["コル・カロリ", "コルカロリ", "cor caroli"],
      url: "https://cor-caroli.net/",
      schedule_url: "https://cor-caroli.net/schedule/",
      price_system: "70分: 16,000円 (通常 18,000円)\n90分: 18,000円 (通常 20,000円)\n120分: 23,000円 (通常 25,000円)",
      casts: [
        { name: "本郷ましろ", img: "https://cor-caroli.net/wp-content/uploads/2025/03/f80fd9ffe83ce3bbcbb316fdf7ba9c15.jpg" },
        { name: "三好えま", img: "https://cor-caroli.net/wp-content/uploads/2026/01/6c399f84adb294dbc333a1745baaa587-e1769264170831.jpg" },
        { name: "真野みこと", img: "https://cor-caroli.net/wp-content/uploads/2023/07/c40059194f158cfa4281f115757b70cc-e1688979776121.jpg" },
        { name: "如月るい", img: "https://cor-caroli.net/wp-content/uploads/2023/12/471624e6f5f0b01eb923bb64df168a8a-e1701434941763.jpg" },
        { name: "竹内まほ", img: "https://cor-caroli.net/wp-content/uploads/2025/10/f14a8387a3f69a9890bf7e326cd981e9.jpg" },
        { name: "藍乃みや", img: "https://cor-caroli.net/wp-content/uploads/2024/04/c67d07fd91a8a1bc9c353ccdb98b355d-2.jpg" },
        { name: "京野ゆずき", img: "https://cor-caroli.net/wp-content/uploads/2024/08/c67d07fd91a8a1bc9c353ccdb98b355d.jpg" },
        { name: "戸田ゆいか", img: "https://cor-caroli.net/wp-content/uploads/2026/04/IMG_9200.jpeg" },
        { name: "凪さくら", img: "https://cor-caroli.net/wp-content/uploads/2026/03/6c6abc826f7232b0b16455614e0214c3.jpg" },
        { name: "新城すずか", img: "https://cor-caroli.net/wp-content/uploads/2026/03/IMG_8137-e1774763431133.jpeg" },
        { name: "白鳥つかさ", img: "https://cor-caroli.net/wp-content/uploads/2026/03/IMG_8104-e1774171684473.jpeg" },
        { name: "月岡まひろ", img: "https://cor-caroli.net/wp-content/uploads/2026/03/IMG_8097-e1773670458457.jpeg" },
        { name: "白愛なゆ", img: "https://cor-caroli.net/wp-content/uploads/2026/03/b1194a4317ca3e52bea56085200f2bd9.jpg" },
        { name: "水川ゆら", img: "https://cor-caroli.net/wp-content/uploads/2026/03/74c34b8d910992f2020e57f9d89ec0ae.jpg" },
        { name: "花森おとは", img: "https://cor-caroli.net/wp-content/uploads/2025/03/5fed25e4eff8dd6ede1f8e4b74290a3a-e1742701334270.jpg" },
        { name: "真波ゆか", img: "https://cor-caroli.net/wp-content/uploads/2026/03/fb3cd94a5bb72a3b001fa5a355222c0f-e1774868238911.jpg" },
        { name: "水野ゆめ", img: "https://cor-caroli.net/wp-content/uploads/2024/02/c4a2985393507189be94efc6876122b7-e1708365578365.jpg" },
        { name: "霧島さゆき", img: "https://cor-caroli.net/wp-content/uploads/2025/09/64b231c402e2a5e943e67c787357b8a2.jpg" },
        { name: "美咲めいさ", img: "https://cor-caroli.net/wp-content/uploads/2025/08/IMG_6998.jpeg" },
        { name: "栗原もな", img: "https://cor-caroli.net/wp-content/uploads/2022/09/3c8dcb4999302c36306530b92ce9e5c8-e1663147735598.jpg" },
        { name: "桜木ひな", img: "https://cor-caroli.net/wp-content/uploads/2026/02/7434d7c8075fffe7576cc42161362638-e1771768647445.jpg" },
        { name: "村瀬あゆみ", img: "https://cor-caroli.net/wp-content/uploads/2026/01/c0e323fb01ca66459158d5019a3cae46.jpg" },
        { name: "夏目のん", img: "https://cor-caroli.net/wp-content/uploads/2025/06/019f2b74e40faf59344ab18ab42b3b36.jpg" },
        { name: "希波きこ", img: "https://cor-caroli.net/wp-content/uploads/2026/03/IMG_8136-e1774759568969.jpeg" }
      ]
    },
    {
      keywords: ["小悪魔スパ", "小悪魔スパトウキョウ"],
      schedule_url: "https://mens-esthe-aroma.site/schedule.html",
      price_system: "80min: 16,000円\n100min: 20,000円\n120min: 24,000円\n150min: 30,000円\n180min: 36,000円",
      casts: [
        { name: "こい(はなび)", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/12ba9e77-6c5f-46ce-9c84-b3296e2256f3.jpeg" },
        { name: "うな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/c32346e1-e150-42ff-a7a3-dbfe356fc6f4.jpeg" },
        { name: "みさき", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/c4ddcf22-9b58-4e02-a05e-2943e64c07bf.jpeg" },
        { name: "大谷みり", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/6fd74d82-fc37-4283-8f2c-000a72bb83df.JPG" },
        { name: "あいか", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/df890c56-9dba-4223-a018-4fce3443308e.jpeg" },
        { name: "ゆめか", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/91f1b395-0229-441c-a637-463f74d6cd0b.jpeg" },
        { name: "ゆの", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/958be943-16a3-4038-ace9-285af69aa7e6.jpeg" },
        { name: "佐倉みづき", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/d564a7bd-d9cc-4891-b0a6-0b138ad70326.jpeg" },
        { name: "みあ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/7bf31673-8e01-4f10-9fb0-2ac77d697990.jpeg" },
        { name: "姫乃もえ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/b932a77f-a92a-480c-b314-e060699fb52a.jpeg" },
        { name: "天使ひな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/f9cfdbea-e952-4c2d-b336-3c01a6086e1b.jpeg" },
        { name: "大川恋華", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/5b70e222-51d6-4dc8-a7db-7a024737df0e.jpeg" },
        { name: "帝玲葉", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/8e9f8619-0b77-44f2-92f1-84ed88c9455e.jpeg" },
        { name: "みいな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/644a6b6c-bfdd-4ed8-ae3c-86bfda1d4ef7.jpeg" },
        { name: "りこ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/c200cb14-0e3c-460e-b2ea-f9bab347afab.jpeg" },
        { name: "みるく", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/84f5e2a2-4d5a-44c9-9bc1-55b2e38d9e0a.jpeg" },
        { name: "ふう", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/015a7f1e-a0ad-498d-9589-6b5ad53a4c59.jpeg" },
        { name: "真田さな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/283bf5ee-8bca-4b2c-aa13-df965815e0e0.jpg" },
        { name: "める", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/bcea03e4-a7ed-4955-a924-21c925bf6545.jpeg" },
        { name: "みゆ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/39fb546a-9b04-401a-96f0-eea34398ab56.jpeg" },
        { name: "藤咲りり", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/c7926cc3-4817-466e-8e7e-f7e4c3417ba5.jpeg" },
        { name: "ももか", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/55d61dca-6104-4ad9-87ea-ec4a6220d507.jpeg" },
        { name: "さや", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/42e2ae24-8b52-4e41-995b-af11d0261ffa.jpeg" },
        { name: "かりん", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/9fe295a7-2c9d-4f2c-a3f4-fa858182f6c2.jpeg" },
        { name: "みなみ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/efcb67f0-bb13-409b-9a84-ba6a6a4958fe.jpeg" },
        { name: "ゆゆ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/4dc8a267-3fec-46f7-9813-14f0ce6d422f.jpeg" },
        { name: "ティナ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/0dd9fa56-58ca-4b65-a605-eb5502e87239.JPG" },
        { name: "ひめ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/161c83f3-2302-4672-81c9-620b07934ca2.JPG" },
        { name: "にこ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/b0bc2ac4-3a21-42f2-bb5d-0a2b8c349e49.jpeg" },
        { name: "アリス", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/274b811b-8631-4439-8ba6-44588734ac3a.jpeg" },
        { name: "白鳥さくら", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/d1a4395a-f14c-4ecb-896a-2dfed28224f1.jpeg" },
        { name: "ふりる", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/286ae8d1-d477-411f-bfb3-f7d76c4c45d9.jpeg" },
        { name: "もも", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/1b221c70-9465-4461-a068-09c8fc21a2c0.jpeg" },
        { name: "ゆりか", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/74b06ab7-95cc-4fc1-8df3-b440fa6b3043.PNG" },
        { name: "まいか", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/3e2e167c-fea3-4b07-a83c-e9cabc025e88.JPG" },
        { name: "桜井みゆ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/c10cdd2a-9ec0-455f-a4e3-cf92288596ec.jpg" },
        { name: "まむ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/649b5c1b-b103-4d7b-951c-7c5809c1f8b9.jpeg" },
        { name: "陽咲うい", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/7509e31d-6a1b-4992-b3a7-89e3d1fd9378.jpeg" },
        { name: "せな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/b1864820-7b17-4f8f-acf0-ee967f383e95.jpeg" },
        { name: "うさ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/45c33bd7-5680-4379-8d71-c8b23e22143f.jpeg" },
        { name: "ゆずは", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/56012814-b110-4969-b91a-ebbff25c9c6c.jpeg" },
        { name: "もあ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/5789a511-0b47-46c6-b42d-2569459bdc81.jpeg" },
        { name: "えま", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/a0c3f3f2-2ad0-43f7-9ea3-2162b292b0a7.jpeg" },
        { name: "美園あいら", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/bd4f9ded-0e9b-4207-8cf0-bd7d337214a4.jpg" },
        { name: "あずさ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/b6de1d04-9fc4-4ddd-a65b-58b149cb87da.jpg" },
        { name: "れむ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/bf4269e3-e93e-452d-b0e4-aa43524750fe.jpeg" },
        { name: "つばき", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/d076efef-796e-4e80-ac17-e1ca52bdbd7e.jpeg" },
        { name: "あめ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/90795286-8c43-4e2f-86a7-22d0e21ab39a.jpeg" },
        { name: "みれい", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/735115c4-5685-44e1-a10b-7b82e2b46cb7.jpeg" },
        { name: "池田あい", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/346062af-bffa-44ad-8fe9-61b16f022c2e.jpeg" },
        { name: "ゆめ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/f0b6b999-d3a2-4743-bd21-9c933a509940.JPG" },
        { name: "四谷ふたば", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/a13c6151-89ff-4baa-96ed-480e47c9a550.jpeg" },
        { name: "櫻井もも", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/87d4897b-cdfa-4e8e-84e2-6b5cd5ed4241.jfif" },
        { name: "西野りか", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/6e7733e7-f2bc-4bad-99e7-327fef3dc07d.JPG" },
        { name: "海月もね", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/1627fa89-f33e-4f4e-90f6-34e8b7326ade.jpeg" },
        { name: "雅芽衣", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/6bedaa13-855c-47ea-88e0-1300483d827d.jpeg" },
        { name: "白鳥あいか", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/17f54c87-e98e-4b4c-a480-4662e685af2b.jpg" },
        { name: "一ノ瀬まりん", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/388af099-0b63-4a6c-b83f-165b74424c15.jpg" },
        { name: "ひかり", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/0a8d19cc-93d3-48b7-8e93-c673080019c1.jpeg" },
        { name: "夕凪レイ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/8593b316-b2ac-48a0-bed1-66badd4e7a6f.jpeg" },
        { name: "天城りあん", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/b6835acf-0430-4637-ad35-0c72ac37f899.JPG" },
        { name: "渚るい", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/9234e3a1-5d02-4be0-a186-aa3bc360c12a.jpeg" },
        { name: "白雲ふわり", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/fbb47bdd-3863-4834-862a-cd5ea7b6df6f.jpg" },
        { name: "みな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/79b64c44-c25b-4aac-8893-db30085f5c43.jfif" },
        { name: "来栖もな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/b55eeb61-11fe-4871-bf49-fb477c4b25be.JPG" },
        { name: "那月れむ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/3c447165-c408-4e30-b3e2-08037e732b31.JPG" },
        { name: "平和あい", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/c5e635ca-64bd-450f-8ba4-9a732fc496fc.JPG" },
        { name: "日色りお", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/0bbb4302-cb36-4e80-adc8-9cfb4da5618d.jpeg" },
        { name: "桃瀬ゆうり", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/873ce4a6-4b4a-437d-b14d-144ec74e09b5.jfif" },
        { name: "一ノ瀬なな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/dcef32c2-7c10-4935-bfa0-acf2c561588c.jpg" },
        { name: "ほの", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/04398abc-2323-4551-bbb8-34db8551a6ec.png" },
        { name: "佐々木みみ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/43fd2363-6d0e-4009-b14e-92a432a0d345.jpeg" },
        { name: "らいあ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/2bb54f10-81f5-4f1a-9363-5293d64407a6.jpeg" },
        { name: "るな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/f7f4b8ba-8125-4c60-be04-19a126b97091.JPG" },
        { name: "いのり", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/c2923185-1c30-4ae2-8d20-dd709e364589.JPG" },
        { name: "かんな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/95c1c7b3-a6a8-4fac-869a-94b46021a0b2.JPG" },
        { name: "ひなこ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/ec8e0de2-a9ac-4c27-9efd-a0b61f4169f8.jpeg" },
        { name: "桃瀬つき", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/0555daa7-dae7-4aba-a722-422ffac8bbbb.jpg" },
        { name: "はづき", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/2b713508-744a-43c0-af1d-d6f50f4247aa.jpeg" },
        { name: "ひらり", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/ea092f30-5e16-4822-849b-eb55efee4fc7.jfif" },
        { name: "えり", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/efb30254-3526-4b70-a2f3-5c039d9c845a.jpeg" },
        { name: "かな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/56f4010b-abdc-4df9-af55-dab5c0686736.jpeg" },
        { name: "舞香", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/4834dd27-db04-4d33-b0e9-2e5f2c1d4efc.jpg" },
        { name: "こころ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/0c0ee5b4-2065-4858-88cd-39ffc25ee86e.jpeg" },
        { name: "あいす", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/c4c41d4e-a651-464a-b831-19c5aeb6f90b.jpeg" },
        { name: "なるせ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/1641a9a0-04c4-4eb4-b950-b37345916a0d.jpeg" },
        { name: "らい", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/c44f777f-5d1e-426c-846e-47265b790dd0.jpeg" },
        { name: "真波こころ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/f9b209ed-4897-43bf-a20c-dc91a357c9b8.jpeg" },
        { name: "なえ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/39911698-e431-4206-b9af-39d4c3092b24.JPG" },
        { name: "さく", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/4f3642cd-7260-4316-ae74-55df18a5b5bb.jpeg" },
        { name: "ここ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/f49cad5d-7d35-47d4-9ad2-93eee94eedc6.jpeg" },
        { name: "きらら", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/7fdbfb38-2be6-48f3-a8ad-1ad9cb49b48c.jpeg" },
        { name: "せり", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/d9802052-0024-4a75-9940-f993d76c518a.jpeg" },
        { name: "れい", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/cad7e8a8-8e8a-4437-b415-3ac88fee54f5.jpeg" },
        { name: "みりさ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/2338d13d-78ce-487d-ba32-072f26542ee3.jpeg" },
        { name: "りお", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/370c4c51-77fe-42e9-906a-ff7adf33031f.jpeg" },
        { name: "森まな", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/3fae1a3d-ac09-4948-8e4e-e91270bc2f1c.jfif" },
        { name: "七海のあ", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/554f87c1-7a79-4d92-ab7c-c7fd2b22367b.JPG" },
        { name: "ゆき", img: "https://3days-cms-bucket-prod.s3.amazonaws.com/cms-content/1028/img/1e3402b0-58e8-420e-bef9-db57abcc173c.jpg" }
      ]
    }
  ];

  try {
    for (const shop of shopsData) {
      console.log(`\n⏳ 「${shop.keywords[0]}」のスケジュール・料金・キャストデータを更新します...`);

      let targetShopId = null;
      for (const query of shop.keywords) {
        const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(query)}*&select=id,name`, { headers });
        const json = await res.json();
        if (json && json.length > 0) {
          targetShopId = json[0].id;
          break;
        }
      }

      if (!targetShopId) {
        console.log(`⚠️ 「${shop.keywords[0]}」が見つかりませんでした。`);
        continue;
      }

      const updatePayload = {
        schedule_url: shop.schedule_url,
        price_system: shop.price_system
      };
      
      // コル・カロリの場合はURLも更新
      if(shop.url) {
        updatePayload.url = shop.url;
      }

      await fetch(`${url}/rest/v1/shops?id=eq.${targetShopId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(updatePayload)
      });
      console.log(` ✅ 店舗情報の更新完了！`);

      if (shop.casts.length === 0) {
         console.log(` ℹ️ キャストデータがないためスキップします。`);
         continue;
      }

      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${targetShopId}&select=id,name,image_url`, { headers });
      const dbCasts = await dbRes.json();

      let updateCount = 0;
      let insertCount = 0;

      const uniqueCasts = Array.from(new Map(shop.casts.map(c => [c.name, c])).values());

      for (const cast of uniqueCasts) {
        const cleanName = cast.name.replace(/[\s　]+/g, '').replace(/（.*）/g, ''); 
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
          const newId = `${targetShopId}_${cleanName}`;
          await fetch(`${url}/rest/v1/therapists`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({
              id: newId,
              shop_id: targetShopId,
              name: cleanName,
              image_url: cast.img
            })
          });
          insertCount++;
        }
      }

      console.log(` 🎉 キャスト設定が完了しました！（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    }

    console.log("\n🚀 2店舗のデータ流し込みが完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
