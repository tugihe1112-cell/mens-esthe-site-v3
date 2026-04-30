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

  // 誤爆した店舗のID
  const targetShopId = 'tokyo_shinjuku_shinjuku_natural_organic_spa';

  // 誤登録された55名のキャスト名
  const wrongCastNames = [
    "水野まほ", "夏目ゆうか", "武内ちひろ", "成美ありさ", "白咲みゆ", "工藤ひなの", "華月さくら", "夢乃りり", "逢沢きらり", "瀬戸あすか",
    "永野りおん", "双葉ゆめ", "三上にこ", "佐藤じゅり", "三吉るな", "佐々木ゆいな", "百音らむ", "白花あや", "森野いちご", "七瀬おと",
    "篠田さな", "南ゆな", "天音ここ", "小川まなみ", "山本ひめの", "吉乃ちゆ", "柚木あまね", "桜庭ふうか", "椿えりか", "柊いおり",
    "折本なごみ", "湊まお", "椎名えみり", "白雪愛", "神城りん", "壱宮りあ", "松田あん", "谷村あいり", "桃羽めあ", "長岡わかな",
    "月野のぞみ", "如月なお", "立花もも", "長谷川なつみ", "星野ななこ", "神楽こはく", "神崎ゆり", "河本りお", "桐谷れいみ", "西野ひめか",
    "福原みつき", "松坂れある", "天羽なつね", "大榎ねね", "姫崎いちか"
  ];

  try {
    console.log(`🧹 誤爆した「Natural Organic Spa」のデータ復旧を開始します...\n`);

    // 1. 店舗情報（URL・システム）のリセット
    const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${targetShopId}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ website_url: null, schedule_url: null, price_system: null })
    });

    if (patchRes.ok) {
      console.log(`   ✅ 店舗情報（URL・料金システム）をリセットしました。`);
    } else {
      console.error(`   ❌ 店舗情報の更新失敗: ${patchRes.statusText}`);
    }

    // 2. 誤登録されたキャストの削除
    const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${targetShopId}&select=id,name`, { headers });
    const dbCasts = await dbRes.json();

    let deletedCount = 0;
    for (const cast of dbCasts) {
      if (wrongCastNames.includes(cast.name)) {
        await fetch(`${url}/rest/v1/therapists?id=eq.${cast.id}`, {
          method: 'DELETE',
          headers: headers
        });
        deletedCount++;
      }
    }
    console.log(`   🗑️ 誤登録されたキャストを ${deletedCount} 名削除しました。`);

    console.log(`\n🎊 復旧作業が完了しました。二度手間を取らせてしまい本当に申し訳ありません！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
