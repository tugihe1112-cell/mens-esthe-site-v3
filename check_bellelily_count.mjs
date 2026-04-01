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
    console.log("🔍 ベルリリーの現在の登録人数を調査します...\n");
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*ベルリリー*&select=id,name`, { headers });
    const belleShops = await shopRes.json();

    if (!belleShops || belleShops.length === 0) {
      console.log("❌ ベルリリーの店舗が見つかりません。");
      return;
    }

    // 岡林さんからいただいた61名のリスト
    const expectedNames = [
      "千住うみ", "小泉めいさ", "天野りか", "白雪りな", "松坂ひな", "音無いちか", "水瀬あお", "川栄えま", "佐藤れいか", "鳳園うた",
      "霧島らん", "長谷川みう", "神楽あかね", "星野ゆい", "真咲ひめか", "美都なな", "白花るか", "泉えり", "斎藤ひかる", "山田もえ",
      "七瀬きらり", "川瀬あん", "美月とわ", "桜井まゆ", "一条かえで", "清水しおり", "新井ちはる", "夏目みなみ", "秋本ふう", "倉持いろは",
      "相川ゆう", "月島あかり", "一ノ瀬しずく", "沢城ちさと", "浅倉ゆり", "藤原かずは", "朝比奈まお", "桃井ななせ", "早乙女ひかり", "仲里あんず",
      "井口もも", "小枝さつき", "高田あいな", "神田すずね", "竹本ゆりな", "椎名まい", "中村さら", "佐野まりん", "雪村ひより", "鈴木あみり",
      "神崎れな", "愛瀬るな", "白河ひまり", "照井はのん", "森さくら", "日向えり", "天使かなた", "愛沢のぞみ", "天宮おと", "小林ゆん", "神谷あい"
    ];

    for (const shop of belleShops) {
      const res = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=name`, { headers });
      const therapists = await res.json();
      
      console.log(`🏥 店舗: ${shop.name}`);
      console.log(`📊 現在の登録人数: ${therapists.length}名 / 61名中`);

      if (therapists.length < 61) {
        const registeredNames = therapists.map(t => t.name);
        const missingNames = expectedNames.filter(name => !registeredNames.includes(name));
        console.log(`⚠️ 以下の ${missingNames.length}名 がデータベースに登録されていません（取得漏れ）:`);
        console.log(missingNames.join(', '));
      } else {
        console.log("✅ 61名全員が完璧に登録されています！");
      }
      console.log("--------------------------------------------------");
    }

  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
