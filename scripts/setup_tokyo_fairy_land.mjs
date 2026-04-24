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

  try {
    const shopId = "tokyo_fairy_land"; // 新規店舗の公式ID
    const brandId = "tokyo_fairy_land";

    console.log(`🚀 1. 店舗情報 [${shopId}] を登録・更新します...`);
    
    const shopPayload = {
      id: shopId,
      name: "Tokyo Fairy Land (東京フェアリーランド)",
      brand_id: brandId,
      schedule_url: "https://tokyo-fairy-land.men-este.com/schedule.html",
      price_system: "70分 16,000円\n90分 18,000円\n120分 23,000円\n150分 28,000円",
      image_url: "https://tokyo-fairy-land.men-este.com/img/logo.png" // ※後で正式なロゴURLがあれば変更してください
    };

    // 店舗のUPSERT（あれば更新、なければ追加）
    await fetch(`${url}/rest/v1/shops`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(shopPayload)
    });
    console.log('✅ 店舗情報の登録完了！');

    console.log('\n👩‍🔧 2. 抽出した58名のセラピストデータを公式ルールに従って登録します...');

    const therapists = [
      { name: "ねる", age: "23", size: "157cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/303/stf_69e071d479a84.jpg" },
      { name: "きら", age: "21", size: "155cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/304/stf_69db639bb159b.jpg" },
      { name: "みな", age: "25", size: "158cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/305/stf_69df08f4cb85c.jpg" },
      { name: "こころ", age: "26", size: "164cm/Cカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/301/stf_69dc3b0704222.jpg" },
      { name: "みさ", age: "24", size: "165cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/302/stf_69db5c8a51339.jpg" },
      { name: "とあ", age: "25", size: "155cm/Fカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/44/stf_6847cf6717951.jpg" },
      { name: "福井かの", age: "27", size: "159cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/103/stf_6847cdca37624.jpg" },
      { name: "もも", age: "23", size: "155cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/120/stf_6847cf38230bb.jpg" },
      { name: "はづき", age: "25", size: "158cm/Gカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/54/stf_6847cf0ceae34.jpg" },
      { name: "ありさ", age: "21", size: "162cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/102/stf_6847cf8e0f51d.jpg" },
      { name: "あの", age: "26", size: "162cm/Gカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/274/stf_690d8cd59fde5.jpg" },
      { name: "あい", age: "21", size: "157cm/Fカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/238/stf_687500a428674.jpg" },
      { name: "きほ", age: "20", size: "153cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/298/stf_69b68a4829c3f.jpg" },
      { name: "ゆな", age: "25", size: "156cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/284/stf_699e8d969815d.jpg" },
      { name: "みく", age: "23", size: "153cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/277/stf_69d9ad067e704.jpg" },
      { name: "しほ", age: "24", size: "160cm/Cカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/279/stf_692d33dae1b8c.jpg" },
      { name: "ひかる", age: "20", size: "158cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/259/stf_69c897ea0c72a.jpg" },
      { name: "もえ", age: "22", size: "160cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/282/stf_698306f960197.jpg" },
      { name: "ありす", age: "24", size: "155cm/Fカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/297/stf_69b8d04c78bb8.jpg" },
      { name: "ふうか", age: "21", size: "165cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/296/stf_69a66ed3d426e.jpg" },
      { name: "ふゆ", age: "24", size: "159cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/294/stf_69a8f118a09a5.jpg" },
      { name: "ひなの", age: "19", size: "156cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/299/stf_69cb241670bbc.jpg" },
      { name: "れな", age: "20", size: "155cm/Cカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/198/stf_6847c7a1aa0fe.jpg" },
      { name: "めぐ", age: "24", size: "160cm/Bカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/247/stf_69228c94eb8ed.jpg" },
      { name: "きあら", age: "22", size: "163cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/293/stf_69a13389ec49b.jpg" },
      { name: "すず", age: "24", size: "145cm/Cカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/287/stf_696993ba9b5a6.jpg" },
      { name: "ちか", age: "21", size: "158cm/Cカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/292/stf_69953da22462c.jpg" },
      { name: "しおん", age: "21", size: "157cm/Cカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/283/stf_6961faaf189f5.jpg" },
      { name: "あこ", age: "22", size: "152cm/Cカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/288/stf_6969fedd09431.jpg" },
      { name: "りりな", age: "26", size: "155cm/Cカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/269/stf_6903129a896b2.jpg" },
      { name: "みれい", age: "24", size: "163cm/Cカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/201/stf_6847cb1f4ead7.jpg" },
      { name: "みほ", age: "22", size: "152cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/233/stf_685e4a7e7ef3f.jpg" },
      { name: "ゆい", age: "20", size: "155cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/76/stf_6847cb4c33a5a.jpg" },
      { name: "まお", age: "25", size: "154cm/Fカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/207/stf_6847cc112b2f2.jpg" },
      { name: "もな", age: "22", size: "158cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/234/stf_685e4923e7df7.jpg" },
      { name: "まりん", age: "25", size: "156cm/Gカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/273/stf_69bccca66314c.jpg" },
      { name: "にな", age: "25", size: "160cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/181/stf_693fd28a9ea84.jpg" },
      { name: "みこ", age: "19", size: "156cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/216/stf_6847cd6c74065.jpg" },
      { name: "ゆか", age: "20", size: "152cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/32/stf_6847c9d99325e.jpg" },
      { name: "なる", age: "24", size: "152cm/Cカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/265/stf_6923e114409af.jpg" },
      { name: "ももな", age: "25", size: "160cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/261/stf_68ff3379aeb49.jpg" },
      { name: "つむぎ", age: "25", size: "159cm/Gカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/226/stf_6847cfdb2aa46.jpg" },
      { name: "みあ", age: "24", size: "164cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/239/stf_69dee6116e5dc.jpg" },
      { name: "かなめ", age: "25", size: "150cm/Gカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/276/stf_69193ffbe0da3.jpg" },
      { name: "せり", age: "20", size: "160cm/Bカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/275/stf_691ed85829e79.jpg" },
      { name: "宮間さき", age: "31", size: "164cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/8/stf_6847c6a862ebd.jpg" },
      { name: "るな", age: "20", size: "170cm/Cカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/291/stf_69b3ab107d2d6.jpg" },
      { name: "神楽ひまり", age: "25", size: "149cm/Fカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/16/stf_6847c421d20eb.jpg" },
      { name: "みみ", age: "20", size: "155cm/Gカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/165/stf_6847ce0054701.jpg" },
      { name: "まい", age: "26", size: "160cm/Fカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/262/stf_693e2b6ff2684.jpg" },
      { name: "まこ", age: "20", size: "165cm/Fカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/256/stf_68ba9e5d1ef37.jpg" },
      { name: "いおり", age: "25", size: "156cm/Gカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/278/stf_6983063f15979.jpg" },
      { name: "ねね", age: "22", size: "160cm/Gカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/225/stf_6847cfb370e77.jpg" },
      { name: "みう", age: "20", size: "157cm/Dカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/266/stf_69042f02e874e.jpg" },
      { name: "める", age: "25", size: "165cm/Eカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/85/stf_6847c7ec987e6.jpg" },
      { name: "りおな", age: "22", size: "152cm/Fカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/190/stf_6847ce56c626e.jpg" },
      { name: "あやみ", age: "23", size: "154cm/Gカップ", img: "https://tokyo-fairy-land.men-este.com/data/staff/152/stf_6847cb949fb6a.jpg" },
      { name: "真白あむ", age: "22", size: "", img: "https://tokyo-fairy-land.men-este.com/data/staff/223/stf_6847c678a265d.jpg" }
    ];

    let successCount = 0;
    
    for (const t of therapists) {
      // ⚠️ 公式ルール: IDは必ず「店舗ID_名前」、所属店舗も本物の店舗IDを指定する
      const payload = {
        id: `${shopId}_${t.name}`,
        shop_id: shopId, 
        name: t.name,
        image_url: t.img,
        raw_data: { age: t.age, size: t.size }, // 公式ルール: 詳細情報はraw_dataにJSONで入れる
        is_active: true
      };

      const res = await fetch(`${url}/rest/v1/therapists`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(payload)
      });
      if(res.ok) successCount++;
    }

    console.log(`\n🎊 完璧です！ Tokyo Fairy Land の店舗データと、全 ${successCount} 名のセラピストの登録が完了しました！`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
