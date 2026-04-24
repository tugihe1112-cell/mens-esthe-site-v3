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

  const targetKeyword = "Aroma Modeste";
  const updateData = {
    schedule_url: "https://aroma-modeste.com/schedule.php",
    price_system: "90min: 17,000円\n120min: 23,000円\n150min: 28,000円\n180min: 33,000円"
  };

  // 抽出したキャストデータ88名（重複を弾く処理も入れています）
  const casts = [
    { name: "花宮りこ", img: "https://aroma-modeste.com/images/no_image.jpg" },
    { name: "綾野るな", img: "https://aroma-modeste.com/images/no_image.jpg" },
    { name: "天音らら", img: "https://admin.aroma-modeste.com/images_staff/368/033011414466.jpeg" },
    { name: "甘井ふーあ", img: "https://admin.aroma-modeste.com/images_staff/366/032617344737.jpeg" },
    { name: "桃瀬りり", img: "https://admin.aroma-modeste.com/images_staff/363/030802093781.jpeg" },
    { name: "柚木せりな", img: "https://admin.aroma-modeste.com/images_staff/362/030217070455.jpeg" },
    { name: "白川ののか", img: "https://admin.aroma-modeste.com/images_staff/361/022819064174.jpeg" },
    { name: "美月せら", img: "https://admin.aroma-modeste.com/images_staff/359/031219043548.jpeg" },
    { name: "永瀬りあ", img: "https://admin.aroma-modeste.com/images_staff/358/030613145372.jpeg" },
    { name: "天宮りのあ", img: "https://admin.aroma-modeste.com/images_staff/357/022115102383.jpeg" },
    { name: "一ノ瀬なの", img: "https://admin.aroma-modeste.com/images_staff/346/040414125553.jpeg" },
    { name: "松本ひかり", img: "https://admin.aroma-modeste.com/images_staff/345/030915243732.jpeg" },
    { name: "佐藤あり", img: "https://admin.aroma-modeste.com/images_staff/342/011118544431.jpeg" },
    { name: "徒野あさか", img: "https://admin.aroma-modeste.com/images_staff/339/122403232558.JPG" },
    { name: "本田しょうこ", img: "https://admin.aroma-modeste.com/images_staff/327/111423165752.jpeg" },
    { name: "佐伯みほ", img: "https://admin.aroma-modeste.com/images_staff/324/110903174917.jpg" },
    { name: "愛沢さら", img: "https://admin.aroma-modeste.com/images_staff/331/032115391693.jpeg" },
    { name: "花咲なごみ", img: "https://admin.aroma-modeste.com/images_staff/328/111823204612.jpeg" },
    { name: "花村りおん", img: "https://admin.aroma-modeste.com/images_staff/330/011916580068.jpeg" },
    { name: "卯月あいか", img: "https://admin.aroma-modeste.com/images_staff/326/030319513356.jpeg" },
    { name: "深澤りか", img: "https://admin.aroma-modeste.com/images_staff/321/110619291684.JPG" },
    { name: "瀬戸かの", img: "https://admin.aroma-modeste.com/images_staff/317/011522204865.jpeg" },
    { name: "西ノ谷かんな", img: "https://admin.aroma-modeste.com/images_staff/316/032911535640.jpeg" },
    { name: "内永えり", img: "https://admin.aroma-modeste.com/images_staff/313/102420595110.jpeg" },
    { name: "山下みすず", img: "https://admin.aroma-modeste.com/images_staff/311/031915165427.jpeg" },
    { name: "花山あおい", img: "https://admin.aroma-modeste.com/images_staff/310/102203445458.jpeg" },
    { name: "高城かなめ", img: "https://admin.aroma-modeste.com/images_staff/309/011522165855.jpeg" },
    { name: "氷室こゆき", img: "https://admin.aroma-modeste.com/images_staff/301/011522030190.jpeg" },
    { name: "富永みこ", img: "https://admin.aroma-modeste.com/images_staff/298/092806501452.jpeg" },
    { name: "常田ゆうな", img: "https://admin.aroma-modeste.com/images_staff/295/030514021078.jpeg" },
    { name: "杉咲みあ", img: "https://admin.aroma-modeste.com/images_staff/291/031219040465.jpeg" },
    { name: "桃井ゆるる", img: "https://admin.aroma-modeste.com/images_staff/290/011522000333.jpeg" },
    { name: "霜月はる", img: "https://admin.aroma-modeste.com/images_staff/264/102601531449.JPG" },
    { name: "月森しずか", img: "https://admin.aroma-modeste.com/images_staff/286/030818291755.jpeg" },
    { name: "豆原このみ", img: "https://admin.aroma-modeste.com/images_staff/281/111914050921.jpeg" },
    { name: "幸村ゆず", img: "https://admin.aroma-modeste.com/images_staff/83/082621313982.jpeg" },
    { name: "宮園れいな", img: "https://admin.aroma-modeste.com/images_staff/207/030716035043.jpeg" },
    { name: "日翠ちぇる", img: "https://admin.aroma-modeste.com/images_staff/210/052922061125.JPG" },
    { name: "月野むぎ", img: "https://admin.aroma-modeste.com/images_staff/240/042216280077.jpeg" },
    { name: "朝比奈こころ", img: "https://admin.aroma-modeste.com/images_staff/251/052919464177.jpg" },
    { name: "日向えま", img: "https://admin.aroma-modeste.com/images_staff/97/030914045492.jpeg" },
    { name: "星宮こつめ", img: "https://admin.aroma-modeste.com/images_staff/285/10250255558.JPG" },
    { name: "水篠はのん", img: "https://admin.aroma-modeste.com/images_staff/222/030613352141.jpeg" },
    { name: "如月つむぎ", img: "https://admin.aroma-modeste.com/images_staff/287/11191405565.jpeg" },
    { name: "綾瀬みな", img: "https://admin.aroma-modeste.com/images_staff/138/031219220151.jpeg" },
    { name: "桐森みゆな", img: "https://admin.aroma-modeste.com/images_staff/209/030714563634.jpeg" },
    { name: "神楽あお", img: "https://admin.aroma-modeste.com/images_staff/133/071521243091.jpeg" },
    { name: "望月ふたば", img: "https://admin.aroma-modeste.com/images_staff/237/06210131504.jpg" },
    { name: "渡辺みき", img: "https://admin.aroma-modeste.com/images_staff/297/110605000936.jpeg" },
    { name: "希崎ひまり", img: "https://admin.aroma-modeste.com/images_staff/102/12140118502.jpeg" },
    { name: "桜木るい", img: "https://admin.aroma-modeste.com/images_staff/204/031821550096.jpeg" },
    { name: "朝倉かな", img: "https://admin.aroma-modeste.com/images_staff/132/071614505292.jpeg" },
    { name: "乃木こはる", img: "https://admin.aroma-modeste.com/images_staff/165/08100148107.jpg" },
    { name: "小宮みくる", img: "https://admin.aroma-modeste.com/images_staff/261/06251321578.jpeg" },
    { name: "黒木りん", img: "https://admin.aroma-modeste.com/images_staff/85/102302560221.jpeg" },
    { name: "早乙女ゆの", img: "https://admin.aroma-modeste.com/images_staff/259/091303124830.jpg" },
    { name: "優木ひとみ", img: "https://admin.aroma-modeste.com/images_staff/76/072015194466.jpeg" },
    { name: "青木らん", img: "https://admin.aroma-modeste.com/images_staff/215/051823305261.jpg" },
    { name: "嗣永ひより", img: "https://admin.aroma-modeste.com/images_staff/279/111914043156.jpeg" },
    { name: "永野ゆめ", img: "https://admin.aroma-modeste.com/images_staff/201/030514291137.jpeg" },
    { name: "武れん", img: "https://admin.aroma-modeste.com/images_staff/239/071203255518.jpg" },
    { name: "桜宮もも", img: "https://admin.aroma-modeste.com/images_staff/121/121811200316.jpeg" },
    { name: "小嶋ゆり", img: "https://admin.aroma-modeste.com/images_staff/106/020422562798.jpeg" },
    { name: "小町このか", img: "https://admin.aroma-modeste.com/images_staff/189/020701454535.jpg" },
    { name: "乙葉なな", img: "https://admin.aroma-modeste.com/images_staff/180/102623414796.jpeg" },
    { name: "桜井つばさ", img: "https://admin.aroma-modeste.com/images_staff/99/120516110313.jpeg" },
    { name: "瀬名くるみ", img: "https://admin.aroma-modeste.com/images_staff/126/06090248033.jpeg" },
    { name: "茉白れな", img: "https://admin.aroma-modeste.com/images_staff/130/070101353987.jpeg" },
    { name: "石森ゆき", img: "https://admin.aroma-modeste.com/images_staff/111/032700232942.jpeg" },
    { name: "香川れい", img: "https://admin.aroma-modeste.com/images_staff/115/042419523437.jpeg" },
    { name: "野中めぐ", img: "https://admin.aroma-modeste.com/images_staff/110/032823364756.jpeg" },
    { name: "杉野はな", img: "https://admin.aroma-modeste.com/images_staff/104/020912324440.jpeg" },
    { name: "桐谷まな", img: "https://admin.aroma-modeste.com/images_staff/117/041316382786.jpeg" },
    { name: "成田みう", img: "https://admin.aroma-modeste.com/images_staff/107/022711535187.jpeg" },
    { name: "藤咲ひなの", img: "https://admin.aroma-modeste.com/images_staff/100/120622062339.jpeg" },
    { name: "七海るか", img: "https://admin.aroma-modeste.com/images_staff/98/111621254190.jpeg" },
    { name: "広瀬ほのか", img: "https://admin.aroma-modeste.com/images_staff/77/072015194466.jpeg" },
    { name: "月乃りつ", img: "https://admin.aroma-modeste.com/images_staff/90/092716185954.jpeg" },
    { name: "水樹あいな", img: "https://admin.aroma-modeste.com/images_staff/84/082901144229.jpeg" },
    { name: "篠田りお", img: "https://admin.aroma-modeste.com/images_staff/79/073118243467.jpeg" },
    { name: "姫野さくら", img: "https://admin.aroma-modeste.com/images_staff/80/080922383838.jpeg" },
    { name: "小野ちはる", img: "https://admin.aroma-modeste.com/images_staff/88/092017111471.jpeg" },
    { name: "井上ちひろ", img: "https://admin.aroma-modeste.com/images_staff/72/071520375950.jpeg" },
    { name: "滝沢しおり", img: "https://admin.aroma-modeste.com/images_staff/82/08151950574.jpeg" },
    { name: "宇野まりん", img: "https://admin.aroma-modeste.com/images_staff/69/071117004080.jpeg" },
    { name: "玉井ふみか", img: "https://admin.aroma-modeste.com/images_staff/68/081113021210.jpeg" },
    { name: "月島ゆら", img: "https://admin.aroma-modeste.com/images_staff/78/080114351769.jpeg" },
    { name: "清水まき", img: "https://admin.aroma-modeste.com/images_staff/87/10210207136.jpeg" }
  ];

  try {
    console.log(`🔍 「${targetKeyword}」の全系列店とキャストデータを更新します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent("Aroma Modeste")}*&select=id,name`, { headers });
    const shops = await res.json();

    if (shops && shops.length > 0) {
      for (const shop of shops) {
        console.log(`🏠 店舗: ${shop.name} (ID: ${shop.id}) を更新中...`);

        // 1. スケジュールとシステムを更新
        await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify(updateData)
        });

        // 重複を除去しながらキャストを登録
        const uniqueCasts = Array.from(new Map(casts.map(c => [c.name, c])).values());

        // 2. キャストの流し込み
        let insertCount = 0;
        for (const cast of uniqueCasts) {
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
      console.log("\n🎉 Aroma Modesteのすべての更新が完了しました！");
    } else {
      console.log(`⚠️ 「${targetKeyword}」に該当する店舗が見つかりませんでした。`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
