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
      searchKeywords: ['tiger gate', 'タイガーゲート'],
      website_url: "https://www.tiger-gate.net/",
      schedule_url: "https://www.tiger-gate.net/schedule/",
      price_system: "100分 26,000円\n130分 32,000円\n160分 38,000円",
      casts: [
        { name: "小早川あゆみ", age: "32", size: "T.150 / B.90(I) / W.60 / H.84", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_161.jpg&1774717495" },
        { name: "桜木ももか", age: "33", size: "T.167 / B.88(E) / W.58 / H.89", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_22.jpg&1774717484" },
        { name: "工藤京子", age: "33", size: "T.154 / B.87(E) / W.60 / H.80", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_103.jpg&1774717481" },
        { name: "黒木さとみ", age: "34", size: "T.160 / B.84(D) / W.57 / H.85", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_146.jpg&1774717479" },
        { name: "北川きよみ", age: "27", size: "T.165 / B.88(D) / W.59 / H.85", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_167.jpg&1774717493" },
        { name: "白川ゆうか", age: "32", size: "T.168 / B.87(D) / W.59 / H.88", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_173.jpg&1774803342" },
        { name: "川上れん", age: "43", size: "T.156 / B.85(D) / W.58 / H.80", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_154.jpg&1775609626" },
        { name: "月野さら", age: "28", size: "T.163 / B.84(D) / W.54 / H.83", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_18.jpg&1774717490" },
        { name: "筧めぐみ", age: "30", size: "T.156 / B.98(H) / W.58 / H.83", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_170.jpg&1774717517" },
        { name: "釈まゆみ", age: "33", size: "T.166 / B.83(D) / W.56 / H.86", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_164.jpg&1774717519" },
        { name: "白咲美玲", age: "26", size: "T.163 / B.86(D) / W.57 / H.87", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_17.jpg&1774717498" },
        { name: "宝条おとは", age: "27", size: "T.157 / B.89(F) / W.57 / H.89", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_172.jpg&1775596052" },
        { name: "一条華", age: "32", size: "T.156 / B.86(E) / W.57 / H.87", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_31.jpg&1774717505" },
        { name: "龍崎みらい", age: "30", size: "T.167 / B.90(H) / W.60 / H.88", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_114.jpg&1774717500" },
        { name: "天乃てんか", age: "29", size: "T.165 / B.83(C) / W.56 / H.86", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_26.jpg&1774717509" },
        { name: "観月せな", age: "28", size: "T.157 / B.84(C) / W.56 / H.89", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_24.jpg&1774717512" },
        { name: "百瀬愛", age: "34", size: "T.160 / B.90(F) / W.57 / H.88", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_29.jpg&1774717533" },
        { name: "七瀬れな", age: "26", size: "T.166 / B.86(D) / W.57 / H.87", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_98.jpg&1774717514" },
        { name: "村瀬すずか", age: "26", size: "T.168 / B.83(D) / W.57 / H.85", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_171.jpg&1774717537" },
        { name: "椎名みなみ", age: "33", size: "T.158 / B.86(E) / W.59 / H.88", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_162.jpg&1774717529" },
        { name: "神楽麗", age: "27", size: "T.153 / B.85(F) / W.56 / H.84", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_174.jpg&1775713645" },
        { name: "夏海ひまり", age: "26", size: "T.155 / B.94(H) / W.60 / H.87", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_175.jpg&1775236827" },
        { name: "谷まり", age: "28", size: "T.164 / B.84(D) / W.58 / H.86", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_39.jpg&1774717531" },
        { name: "神崎りな", age: "32", size: "T.160 / B.88(F) / W.57 / H.87", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_140.jpg&1774717535" },
        { name: "虎乃もん", age: "27", size: "T.167 / B.90(E) / W.60 / H.90", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_144.jpg&1774717544" },
        { name: "月宮るり", age: "26", size: "T.156 / B.96(I) / W.58 / H.90", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_155.jpg&1774717546" },
        { name: "相沢れい", age: "31", size: "T.158 / B.87(F) / W.61 / H.80", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_165.jpg&1774717548" },
        { name: "桃田さな", age: "24", size: "T.166 / B.89(F) / W.57 / H.84", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_120.jpg&1774717551" },
        { name: "片岡まりな", age: "33", size: "T.163 / B.100(G) / W.59 / H.85", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_153.jpg&1774717553" },
        { name: "桜井りおな", age: "30", size: "T.158 / B.80(D) / W.59 / H.78", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_160.jpg&1774717556" },
        { name: "綾瀬玲奈", age: "32", size: "T.159 / B.89(F) / W.56 / H.85", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_137.jpg&1774717558" },
        { name: "吉瀬愛美", age: "32", size: "T.160 / B.89(G) / W.56 / H.86", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_119.jpg&1774717560" },
        { name: "中谷あゆ", age: "32", size: "T.150 / B.85(G) / W.60 / H.80", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_110.jpg&1774717563" },
        { name: "速水かえで", age: "33", size: "T.165 / B.89(E) / W.55 / H.88", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_19.jpg&1774717565" },
        { name: "花園れいか", age: "34", size: "T.170 / B.92(G) / W.58 / H.89", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_30.jpg&1774717567" },
        { name: "玉木しおり", age: "29", size: "T.153 / B.85(E) / W.58 / H.87", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_150.jpg&1774717569" },
        { name: "明智まどか", age: "32", size: "T.163 / B.87(E) / W.58 / H.89", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_27.jpg&1774717572" },
        { name: "松本來未", age: "31", size: "T.162 / B.89(F) / W.57 / H.85", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_148.jpg&1774717577" },
        { name: "松下心巳", age: "33", size: "T.162 / B.88(E) / W.62 / H.89", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_121.jpg&1774717579" },
        { name: "木村ありさ", age: "32", size: "T.165 / B.95(H) / W.58 / H.88", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_147.jpg&1774717582" },
        { name: "水瀬れん", age: "23", size: "T.155 / B.87(E) / W.57 / H.88", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_134.jpg&1774717584" },
        { name: "中條セイラ", age: "22", size: "T.169 / B.86(D) / W.57 / H.85", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_20.jpg&1774717587" },
        { name: "指原りか", age: "32", size: "T.153 / B.85(D) / W.55 / H.86", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_33.jpg&1774717589" },
        { name: "香澄彩名", age: "30", size: "T.153 / B.84(D) / W.61 / H.86", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_25.jpg&1774717591" },
        { name: "春風なごみ", age: "27", size: "T.168 / B.92(F) / W.58 / H.85", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_128.jpg&1774717593" },
        { name: "野々村なお", age: "26", size: "T.157 / B.97(H) / W.56 / H.87", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_16.jpg&1774717596" },
        { name: "北村れみ", age: "28", size: "T.161 / B.83(C) / W.58 / H.90", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_142.jpg&1774717598" },
        { name: "宮田くるみ", age: "27", size: "T.150 / B.90(F) / W.55 / H.87", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_34.jpg&1774717600" },
        { name: "桜ゆあ", age: "28", size: "T.173 / B.87(D) / W.55 / H.88", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_126.jpg&1774717602" },
        { name: "七緒ひかり", age: "31", size: "T.166 / B.88(D) / W.56 / H.87", img: "https://www.tiger-gate.net/def/con?x=270&p=upload/cast/thumb_42.jpg&1774717604" }
      ]
    },
    {
      searchKeywords: ['relax tokyo', 'リラックス東京'],
      website_url: "http://gotanda.relax.her.jp/",
      schedule_url: "http://gotanda.relax.her.jp/",
      price_system: "60分 9,000円\n90分 13,000円\n120分 17,000円\n150分 23,000円\n180分 27,000円",
      casts: [
        { name: "さら", age: "20", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/sara.jpg" },
        { name: "ありす", age: "24", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/arisu.jpg" },
        { name: "れな", age: "22", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/rena.jpg" },
        { name: "ゆう", age: "19", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/yuu.jpg" },
        { name: "れみ", age: "21", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/remi.jpg" },
        { name: "あみ", age: "20", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/ami.jpg" },
        { name: "ふうか", age: "23", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/fuuka2.jpg" },
        { name: "のあ", age: "21", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/noa.jpg" },
        { name: "みなみ", age: "33", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/minami.jpg" },
        { name: "もも", age: "32", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/momo.jpg" },
        { name: "せいら", age: "24", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/seira.jpg" },
        { name: "まなみ", age: "28", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/manami2.jpg" },
        { name: "まみ", age: "23", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/mami.jpg" },
        { name: "ちか", age: "26", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
        { name: "ゆりか", age: "23", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/yurika.jpg" },
        { name: "いのり", age: "26", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/inori.jpg" },
        { name: "あん", age: "28", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/an.jpg" },
        { name: "あい", age: "22", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
        { name: "はる", age: "26", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
        { name: "ゆい", age: "30", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
        { name: "かこ", age: "23", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/kako.jpg" },
        { name: "さき", age: "25", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
        { name: "かおり", age: "32", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/kaori.jpg" },
        { name: "まりん", age: "21", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/marin.jpg" },
        { name: "こころ", age: "23", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
        { name: "りの", age: "23", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/rino.jpg" },
        { name: "なな", age: "33", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
        { name: "うた", age: "27", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/uta.jpg" },
        { name: "わかな", age: "23", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/wakana.jpg" },
        { name: "もか", age: "23", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/moka.jpg" },
        { name: "ひめ", age: "20", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/hime.jpg" },
        { name: "かえで", age: "32", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/kaede.jpg" },
        { name: "えりか", age: "22", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
        { name: "らん", age: "24", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
        { name: "うみ", age: "26", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/umi2.jpg" },
        { name: "こはる", age: "27", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/koharu.jpg" },
        { name: "みあ", age: "27", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/mia.jpg" },
        { name: "ひまり", age: "26", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/himari.jpg" },
        { name: "このみ", age: "25", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/konomi.jpg" },
        { name: "みき", age: "29", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/miki.jpg" },
        { name: "ことこ", age: "26", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/kotoko2.jpg" },
        { name: "かすみ", age: "25", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/kasumi.jpg" },
        { name: "りさ", age: "24", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/risa.jpg" },
        { name: "あいか", age: "26", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/noimage_m.jpg" },
        { name: "さくら", age: "28", size: "T.- / B.-", img: "http://gotanda.relax.her.jp/sakura.jpg" }
      ]
    }
  ];

  try {
    console.log(`🔍 データベースから「TIGER GATE」と「relax tokyo」を検索し、完全な情報とキャスト更新を実行します...\n`);

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
