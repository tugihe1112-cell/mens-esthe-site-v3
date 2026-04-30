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
      id: "tokyo_shibuya_aroma_levante",
      schedule_url: "https://aroma-levante.com/schedule",
      price_system: "80分: 18,000円\n100分: 22,000円\n120分: 26,000円",
      casts: [
        { name: "立花さら", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767262823_9334872.png" },
        { name: "栗羽ねね", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770942653_8171143.png" },
        { name: "胡蝶あげは", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771857141_1601628.png" },
        { name: "代々木ここ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767291924_1356725.png" },
        { name: "冬月かえで", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767747710_5824287.png" },
        { name: "蜂蜜みるきー", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767262794_5997875.png" },
        { name: "星宮りあ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1772606394_3382070.png" },
        { name: "桃花あい", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1769942536_3656504.png" },
        { name: "七海ゆあ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767768893_4621453.png" },
        { name: "矢吹れい", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771856579_3700981.png" },
        { name: "近衛マリア", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771856916_9186473.png" },
        { name: "香澄くらら", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767269582_5237120.png" },
        { name: "猫宮みらい", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1766830706_6563776.png" },
        { name: "高尾なお", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767269678_0851835.png" },
        { name: "桃井ねう", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1768954801_7990338.png" },
        { name: "白石あいり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767376611_5961907.png" },
        { name: "三好えり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1768954871_3647594.png" },
        { name: "蒼井ゆり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767291963_4287776.png" },
        { name: "松本かりん", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767376640_6067338.png" },
        { name: "篠宮きらり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767291898_1095647.png" },
        { name: "水野れみ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1766706919_1118386.png" },
        { name: "甘原めい", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767376671_7991233.png" },
        { name: "南雲れい", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767376697_0220625.png" },
        { name: "望月はく", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767376728_3845040.png" },
        { name: "桜れいか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767292153_8205677.png" },
        { name: "芹沢まき", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767269710_3394190.png" },
        { name: "神崎しおり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767292120_6368461.png" },
        { name: "白椿うたの", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767270060_9019350.png" },
        { name: "真白みみ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767270030_2414483.png" },
        { name: "星野ひかり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767292001_6589040.png" },
        { name: "綾瀬ゆいな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771856653_5390314.png" },
        { name: "一ノ瀬さき", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767261537_7070433.png" },
        { name: "あのあのあ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767269992_9918958.png" },
        { name: "堀北りん", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771856492_3400903.png" },
        { name: "眞鍋あゆみ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771856861_3194576.png" },
        { name: "栗山あかね", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767261403_1534253.png" },
        { name: "柏木ゆうか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767261156_5664991.png" },
        { name: "君嶋しずく", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771856118_9212921.png" },
        { name: "桜井なぎさ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771856731_8861802.png" },
        { name: "白羽みるく", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767261274_8079094.png" },
        { name: "香坂ありさ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767260901_1746284.png" },
        { name: "紅月ひかる", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771856234_2829340.png" },
        { name: "美波にこり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767261080_5881781.png" },
        { name: "宮坂ゆき", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767260864_9608961.png" },
        { name: "小泉ゆず", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767292291_6845376.png" },
        { name: "森川はるの", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767260933_4416694.png" },
        { name: "天乃ゆら", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767261121_5059371.png" },
        { name: "一条くれは", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767260973_9336051.png" },
        { name: "涼森るい", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767261495_2206621.png" },
        { name: "桜庭ことね", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767261457_8033377.png" },
        { name: "清水あお", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771856183_5136188.png" },
        { name: "陽向ひまり", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767261198_1101421.png" },
        { name: "藤堂はずき", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767261232_7508521.png" },
        { name: "雪村ひめか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767364796_5141141.png" },
        { name: "太田ゆうな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767376778_1248354.png" },
        { name: "観月かれん", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1767376822_7921003.png" },
        { name: "窪田ふうか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1774567377_9775893.png" },
        { name: "伊織たまき", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1774188361_3346338.png" },
        { name: "白川えま", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773920849_8484749.png" },
        { name: "成田める", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773805415_4451812.png" },
        { name: "蓮花うらら", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773491911_8327161.png" },
        { name: "天宮りんか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773494312_9891263.png" },
        { name: "花井りか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773212973_7119553.png" },
        { name: "戸田まどか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773139404_2426730.png" },
        { name: "美月せな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1773150418_4007490.png" },
        { name: "小鳥遊ゆりか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1772622170_2751112.png" },
        { name: "朝比奈すず", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1772606000_6766014.png" },
        { name: "有栖もも", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771979096_0115519.png" },
        { name: "一色れな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771678456_7961559.png" },
        { name: "皇ゆのん", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771549610_8350076.png" },
        { name: "肇 こころ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771295360_9806974.png" },
        { name: "神宮寺まや", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771082722_6751301.png" },
        { name: "若菜りさ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770859118_1448322.png" },
        { name: "霧島ゆゆ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771060587_4406994.png" },
        { name: "東雲れいな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770803304_0045026.png" },
        { name: "三上りいな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770731967_4556347.png" },
        { name: "黒木ゆい", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770634733_6750158.png" },
        { name: "藤宮ういか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1770554806_7474390.png" },
        { name: "深海あくあ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1769504937_8642566.png" },
        { name: "冴木はてな", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1769506218_6382188.png" },
        { name: "柳瀬もこ", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1750407201_2943863.jpg" },
        { name: "体験入店", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1751177195_0252731.jpg" },
        { name: "体験入店2", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1771456793_6002752.jpg" },
        { name: "灰崎しゅうか", img: "https://cdn2-caskan.com/caskan/img/cast_tmb/1761203616_3525764.jpg" }
      ]
    },
    {
      id: "tokyo_shibuya_gloria",
      schedule_url: "https://esthe-gloria.com/schedule/",
      price_system: "70分: 16,000円\n90分: 20,000円\n120分: 25,000円",
      casts: [
        { name: "二階堂ひめ", img: "https://esthe-gloria.com/wp-content/uploads/2026/01/line_oa_chat_260114_134528-450x600.jpeg" },
        { name: "花園ひまり", img: "https://esthe-gloria.com/wp-content/uploads/2026/03/IMG_7868-450x673.jpeg" },
        { name: "月野はれ", img: "https://esthe-gloria.com/wp-content/uploads/2026/03/line_oa_chat_260330_204322-450x675.jpeg" },
        { name: "美月れい", img: "https://esthe-gloria.com/wp-content/uploads/2026/03/line_oa_chat_260318_165616-450x565.jpeg" },
        { name: "滝川すずは", img: "https://esthe-gloria.com/wp-content/uploads/2026/02/line_oa_chat_260227_052807.jpeg" },
        { name: "水瀬りの", img: "https://esthe-gloria.com/wp-content/uploads/2026/03/line_oa_chat_260320_210614-450x787.jpeg" },
        { name: "岩崎もね", img: "https://esthe-gloria.com/wp-content/uploads/2025/12/IMG_4117-450x525.jpeg" },
        { name: "須田すずね", img: "https://esthe-gloria.com/wp-content/uploads/2026/01/D14F0645-788E-49A2-8436-0A5F08FB1A63-450x675.jpg" },
        { name: "柳れん", img: "https://esthe-gloria.com/wp-content/uploads/2026/01/IMG_4956-450x600.webp" },
        { name: "神楽坂のあ", img: "https://esthe-gloria.com/wp-content/uploads/2025/11/IMG_2284-450x600.jpeg" },
        { name: "三田かんな", img: "https://esthe-gloria.com/wp-content/uploads/2026/01/IMG_5085.jpeg" },
        { name: "一ノ瀬れな", img: "https://esthe-gloria.com/wp-content/uploads/2026/02/IMG_6814-450x526.jpeg" },
        { name: "白石りん", img: "https://esthe-gloria.com/wp-content/uploads/2026/03/IMG_7072-450x624.jpeg" },
        { name: "春咲さくら", img: "https://esthe-gloria.com/wp-content/uploads/2026/02/505C7620-35E9-4DD9-86A5-E1626AAA2C94-450x693.jpeg" },
        { name: "篠崎まりあ", img: "https://esthe-gloria.com/wp-content/uploads/2025/09/IMG_0067-e1757271562742-450x537.jpg" },
        { name: "前田せな", img: "https://esthe-gloria.com/wp-content/uploads/2025/12/IMG_3399-450x347.jpeg" },
        { name: "橘ゆりか", img: "https://esthe-gloria.com/wp-content/uploads/2025/09/IMG_0068.jpeg" },
        { name: "小宮山ありす", img: "https://esthe-gloria.com/wp-content/uploads/2025/08/IMG_9180-450x440.jpeg" },
        { name: "戸田れいな", img: "https://esthe-gloria.com/wp-content/uploads/2026/02/IMG_5845-450x392.jpeg" },
        { name: "七ツ森みみ", img: "https://esthe-gloria.com/wp-content/uploads/2026/02/55CDBF00-D36B-4A1D-B83A-2AC1D80703DE-450x675.jpg" },
        { name: "結月かおり", img: "https://esthe-gloria.com/wp-content/uploads/2025/09/IMG_0076-450x707.jpeg" },
        { name: "涼宮えりか", img: "https://esthe-gloria.com/wp-content/uploads/2026/02/446219BF-8E72-4652-8180-86A5A112A7A6-450x564.jpeg" },
        { name: "夢野りか", img: "https://esthe-gloria.com/wp-content/uploads/2025/08/F7A5E412-90AE-4012-94D5-6BF036E95801.jpeg" },
        { name: "乃木あすか", img: "https://esthe-gloria.com/wp-content/uploads/2025/09/IMG_0055-450x449.jpeg" },
        { name: "夏目じゅん", img: "https://esthe-gloria.com/wp-content/uploads/2025/09/IMG_0062-450x485.jpeg" },
        { name: "速水ゆい", img: "https://esthe-gloria.com/wp-content/uploads/2025/12/IMG_9513-450x410.jpeg" },
        { name: "仲山みれい", img: "https://esthe-gloria.com/wp-content/uploads/2026/02/IMG_5843-450x434.jpeg" },
        { name: "白鳥らん", img: "https://esthe-gloria.com/wp-content/uploads/2025/06/mainview-450x257.jpg" }
      ]
    }
  ];

  try {
    for (const shop of shopsData) {
      console.log(`\n⏳ ${shop.id} のスケジュール・料金・キャスト写真を一括更新します...`);

      // 1. 店舗のスケジュールURLと料金システムを更新
      await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
          schedule_url: shop.schedule_url,
          price_system: shop.price_system
        })
      });
      console.log(` ✅ 店舗情報の更新完了！`);

      // 2. 現在データベースにいるキャストのリストを取得
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name,image_url`, { headers });
      const dbCasts = await dbRes.json();

      let updateCount = 0;
      let insertCount = 0;

      // 3. キャストの写真データを追加・更新
      for (const cast of shop.casts) {
        // 名前から空白を消して完全一致させる
        const cleanName = cast.name.replace(/[\s　]+/g, '');
        const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === cleanName);

        if (existing) {
          // すでにデータベースにいる場合は、画像URLが違えば更新する
          if (existing.image_url !== cast.img) {
            await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
              method: 'PATCH',
              headers: headers,
              body: JSON.stringify({ image_url: cast.img })
            });
            updateCount++;
          }
        } else {
          // データベースにいない場合は新規追加
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

      console.log(` 🎉 ${shop.id} のキャスト設定が完了しました！（新規: ${insertCount}名 / 更新: ${updateCount}名）`);
    }

    console.log("\n🚀 全てのデータ流し込みが完璧に完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
