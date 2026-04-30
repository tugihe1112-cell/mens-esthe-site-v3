import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' };

  // 抽出・圧縮したキャストデータ
  const yuruData = `胡桃もえ,24,162,,213_1.webp,twitter:@mo11595
小林えま,21,150,NEW,217_1.webp,
七瀬りさ,,166,NEW,219_1.webp,
黒田りいさ,25,147,,212_1.webp,twitter:@riisa_2510
泉まお,29,163,,176_1.webp,twitter:@mao_yurusup
桜井まりな,27,160,,46_1.webp,twitter:@yuru_marina
荒木ゆうみ,33,163,,188_1.webp,twitter:@yu__ru__y
優木りの,27,163,,214_1.webp,
蒼井涼子,30,157,,211_1.webp,twitter:@ryoko6786
真白つむぎ,26,166,,203_1.webp,twitter:@JbxQoiLZnd1581
美山りりか,24,154,,207_1.webp,twitter:@yurumiyama
別府ゆい,29,155,,210_1.webp,twitter:@tt8nfiooaa19062
南はな,32,153,,199_1.webp,twitter:@yuru_minami_sub
常磐あみ,27,158,,156_1.webp,twitter:@amiyuruspa
諸星ラム,24,164,,190_1.webp,twitter:@yurumoroboshi
宝生かなえ,,,,196_1.webp,twitter:@kanaev_v4
桃瀬のあ,24,160,,195_1.webp,twitter:@mms_yrsp
蜜川かりん,26,152,,67e3486d07fe5_1.webp,twitter:@yurusupa_karin
篠原あい,27,160,,157_1.webp,twitter:@yuru_shino
相原みほ,28,152,,173_1.webp,twitter:@AiharaMiho_
月葉なぎ,21,160,,161_1.webp,twitter:@yurusupa_nagi
女神らん,30,160,,136_1.webp,twitter:@yuruspa_ran
小桜ゆうり,27,149,,166_1.webp,twitter:@koSakuraYuyuri
如月りよ,28,157,,205_1.webp,twitter:@riyo__esthe
松雪ひめの,24,169,,215_1.webp,twitter:@matsuyukihimeno
宮瀬くるみ,,,,,
水瀬れいら,22,,,,`;

  const menesData = `かのん,24,156,G,NEW/スレンダー/テクニシャン/愛嬌抜群,IMG_1214.jpeg,
のぞみ,24,153,E,NEW/おっとり/ほんわか系/癒し系,IMG_1185.jpeg,
みく,22,163,D,NEW/おっとり/スレンダー/可愛い,IMG_1139-1-scaled.jpeg,bsky:mikuuuuuu
もな,23,160,G,NEW/おっとり/可愛い/清楚系,IMG_1070.jpeg,twitter:@_m_o_n_a_1
なぎ,20,155,E,NEW/ナイスBODY/可愛い/愛嬌抜群,IMG_1035.jpeg,bsky:nagi-chan7
あかね,28,152,D,お姉さん系/小柄/愛嬌抜群,IMG_1019-scaled.jpeg,bsky:akanene0226
なつみ,19,165,C,スタイル抜群/可愛い/愛嬌抜群,IMG_0970-scaled.jpeg,
ぴょな,22,160,C,可愛い/愛嬌抜群/素人系,IMG_0914-3-scaled.jpeg,
うか,20,150,D,ほんわか系/可愛い/愛嬌抜群,IMG_0886-4.jpeg,
まゆ,28,163,G,PICKUP/お姉さん系/テクニシャン/可愛い,IMG_0752-scaled.jpeg,
りあ,25,165,E,お姉さん系/スタイル抜群/テクニシャン,IMG_0718.jpeg,
ひな,25,157,E,可愛い/愛嬌抜群/明るい,IMG_0941.jpeg,
りん,25,160,F,お姉さん系/テクニシャン/愛嬌抜群,IMG_0617-1-scaled.jpeg,
みれい,20,158,D,おっとり/スタイル抜群/清楚系,IMG_0591-4.jpeg,
れな,27,167,E,お姉さん系/愛嬌抜群/清楚系,IMG_0872-1.jpeg,
のあ,24,164,E,おっとり/お姉さん系/可愛い,IMG_0256-1.jpeg,
しほ,25,156,D,スレンダー/テクニシャン/癒し系,IMG_0595.jpeg,
おとは,24,155,C,スレンダー/愛嬌抜群/明るい,IMG_0239.jpeg,
かんな,23,160,C,おっとり/可愛い/愛嬌抜群,IMG_0109-1.jpeg,
きら,22,162,E,おっとり/可愛い/愛嬌抜群,IMG_0132.jpeg,
えれな,27,162,H,PICKUP/お姉さん系/グラマラス/テクニシャン,IMG_0058.jpeg,
まりあ,21,152,C,スレンダー/可愛い/愛嬌抜群,IMG_9945.jpeg,
るな,19,150,G,ほんわか系/可愛い/愛嬌抜群,IMG_9844-1.jpeg,
せな,28,155,D,お姉さん系/ナイスBODY/愛嬌抜群,IMG_9830.jpeg,
みおな,22,163,C,おっとり/可愛い/愛嬌抜群,IMG_0703-1.jpeg,
すず,25,165,C,お姉さん系/スレンダー/愛嬌抜群,IMG_0368.jpeg,
ゆみか,23,162,F,おっとり/愛嬌抜群/素人系,IMG_9590.jpeg,
ゆゆ,21,162,C,No.2/おっとり/スタイル抜群/可愛い,IMG_9608.jpeg,
さん,25,152,F,愛嬌抜群/明るい/素人系,IMG_9461.jpeg,
えす,20,157,D,No.1/可愛い/愛嬌抜群/癒し系,IMG_9412.jpeg,
つばき,30,150,G,お姉さん系/テクニシャン/愛嬌抜群,IMG_9427.png,
ちょこ,28,168,D,お姉さん系/スタイル抜群/可愛い,IMG_9216.jpeg,
かりん,23,153,D,おっとり/可愛い/妹系,IMG_9197.jpeg,
あんな,25,160,E,ゴージャス系/ナイスBODY/聞き上手,AF0DA5B6-EC3A-486A-966B-CC5B9B229E41.jpeg,
ぷりん,21,160,D,おっとり/ほんわか系/可愛い,IMG_9092.jpeg,
むぎ,26,162,D,お姉さん系/スタイル抜群/愛嬌抜群,IMG_9073.jpeg,
かずは,21,163,D,ほんわか系/可愛い/愛嬌抜群,IMG_0825.jpeg,
さば,20,155,E,ほんわか系/可愛い/愛嬌抜群,IMG_0210.jpeg,
あん,25,160,E,お姉さん系/スタイル抜群/可愛い,IMG_9099.jpeg,
まり,23,160,E,テクニシャン/可愛い/愛嬌抜群,IMG_9165.jpeg,
ゆう,26,158,D,お姉さん系/明るい/素人系,IMG_8631.jpeg,
ねむ,24,158,C,おっとり/スタイル抜群/素人系,IMG_8361-1.jpeg,
りな,21,172,D,おっとり/スタイル抜群/癒し系,IMG_8297-1.jpeg,
さんご,22,157,F,ほんわか系/可愛い/愛嬌抜群,IMG_8188-1.jpeg,
とばり,24,155,D,おっとり/明るい/素人系,IMG_8077.jpeg,
さら,24,159,D,お姉さん系/スタイル抜群/愛嬌抜群,IMG_7974.jpeg,
こころ,24,149,C,おっとり/可愛い/小柄,IMG_7897.jpeg,
るり,22,165,D,おっとり/スタイル抜群/愛嬌抜群,IMG_0981.jpeg,
ももな,23,158,D,グラマラス/テクニシャン/可愛い,IMG_7371.jpeg,
あすか,20,159,C,スタイル抜群/スレンダー/愛嬌抜群,IMG_7282.jpeg,
ゆみ,23,158,G,おっとり/テクニシャン/ナイスBODY,IMG_7007.jpeg,
くるみ,26,152,E,お姉さん系/スレンダー/テクニシャン,IMG_6879.jpeg,
そら,19,158,C,おっとり/ほんわか系/可愛い,IMG_6943.jpeg,
ゆずり,23,163,F,おっとり/スタイル抜群/可愛い,IMG_6756.jpeg,
ななみ,25,169,D,お姉さん系/スタイル抜群/聞き上手,IMG_6796-2.jpeg,
みさ,22,165,D,おっとり/ほんわか系/愛嬌抜群,IMG_0339.jpeg,
ろあ,19,160,F,スタイル抜群/可愛い/愛嬌抜群,IMG_6674.jpeg,
まあや,19,162,H,ナイスBODY/可愛い/明るい,IMG_6667.jpeg,
める,21,153,D,おっとり/妹系/愛嬌抜群,IMG_6489.jpeg,
りか,23,162,G,スタイル抜群/ナイスBODY/可愛い,IMG_6475.jpeg,
さつき,18,153,E,おっとり/ナイスBODY/可愛い,IMG_5965-1.jpeg,
みこ,23,156,F,ゴージャス系/テクニシャン/可愛い,IMG_5489.jpeg,
あやか,20,157,D,おっとり/ナイスBODY/可愛い,IMG_5450.jpeg,
さり,21,160,C,ほんわか系/愛嬌抜群/素人系,65FB6AF5-4FB9-46BD-A7B4-AF3E87D6D620.jpeg,
あこ,23,158,C,スタイル抜群/ほんわか系/愛嬌抜群,143CF34E-1425-4822-8638-ECAB5A530951.jpeg,
あいら,23,168,D,スタイル抜群/愛嬌抜群/素人系,35E1CB1B-7947-466C-B454-712FAF1F7797.jpeg,
かよ,20,169,D,スタイル抜群/テクニシャン/愛嬌抜群,B804DC39-109E-4B90-B1E9-9617A878F404.jpeg,
みづき,28,157,E,お姉さん系/テクニシャン/愛嬌抜群,04F0512A-1AC9-4172-99C0-8F29855580F5.jpeg,
まな,23,155,D,テクニシャン/可愛い/愛嬌抜群,IMG_8822.jpeg,
りこ,19,160,E,おっとり/スタイル抜群/可愛い,B9AD37FA-7409-4423-8AF5-180AEA722345.jpeg,
ねね,21,153,C,可愛い/妹系/小柄,B49575CA-4B4E-4B7C-988C-C6DBF09996A7.jpeg,
ことり,23,151,F,おっとり/スタイル抜群/可愛い,3B857075-11B7-418D-B687-B3796F165441.jpeg,
かな,26,163,F,おっとり/お姉さん系/テクニシャン,79674F56-0F71-432A-A336-4B02D15FE2CA.jpeg,
このは,23,150,E,小柄/愛嬌抜群/明るい,3BFA9D7E-47A4-47BD-8BCC-187E442999D2.jpeg,
もこ,23,156,C,テクニシャン/可愛い/愛嬌抜群,46A6983D-C05F-4210-84F7-703E4D71EAC8.jpeg,
あけみ,21,160,D,スレンダー/可愛い/明るい,AA8975DE-E0A2-449B-90C9-6B25C2FC3895.jpeg,
ななこ,21,155,F,おっとり/ゴージャス系/ナイスBODY,nanako.jpg,
ほのか,23,155,D,おっとり/テクニシャン/可愛い,083D2D66-E473-4662-8A34-D737048236C2.jpeg,
ゆえ,24,160,E,お姉さん系/テクニシャン/聞き上手,EE15269F-C46F-488E-AFD9-77CBDAABCFB9.jpeg,
ちま,20,157,C,おっとり/スタイル抜群/聞き上手,90EEDE55-5E8F-4992-B4EF-A7D32F9D1B07.jpeg,
はな,20,156,D,お姉さん系/スタイル抜群/愛嬌抜群,F8F6B885-B2BC-4F6A-9E49-F34EF5149AA7.jpeg,
あみ,21,165,D,ゴージャス系/スタイル抜群/テクニシャン,EF942D62-EA18-426C-933A-B7FD32BA432D.jpeg,
ゆい,23,161,C,お姉さん系/スレンダー/可愛い,8830967E-32E4-406C-B5C8-FDA352E02D45.jpeg,
もえ,23,160,D,お姉さん系/ゴージャス系/愛嬌抜群,IMG_8772.jpeg,
じゅり,23,166,D,おっとり/ナイスBODY/ほんわか系,6C3DCCF0-E094-48C4-BB8D-F6C20AF52A14.jpeg,
えりさ,20,150,C,おっとり/テクニシャン/小柄,B4EBDD07-E4DB-480C-9CB1-F9EB2CCEABA2.jpeg,
さくら,22,152,E,お姉さん系/スタイル抜群/清楚系,046D41F7-A55D-443F-A5E6-3665F848E6F4.jpeg,
めあ,20,152,D,おっとり/ほんわか系/小柄,DED0760C-1B28-4808-AAF3-4E763D27B9C8.jpeg,
なち,23,158,C,おっとり/スタイル抜群/素人系,IMG_0775.jpeg,
るる,22,157,C,スレンダー/テクニシャン/可愛い,0DB1804E-3D30-4476-B339-6BBF04CDBADD.jpeg,
ふうか,22,157,D,おっとり/テクニシャン/妹系,44DF3063-B2E6-4FB8-BA7D-76803D1F1BB5.jpeg,
さな,23,156,E,おっとり/ナイスBODY/ほんわか系,IMG_7625.jpeg,
なお,19,153,C,おっとり/ナイスBODY/ほんわか系,3F764552-DB2F-4579-94EA-68EF6372280B.jpeg,
おと,20,156,E,ギャル系/テクニシャン/愛嬌抜群,B0B5874C-5749-4ECE-AC25-37E9DEF48C38.jpeg,
ひかり,23,153,D,テクニシャン/愛嬌抜群/明るい,hikari2.jpg,
まどか,22,155,E,スタイル抜群/愛嬌抜群/明るい,madoka10.jpg,
ゆりあ,23,158,C,スタイル抜群/愛嬌抜群/明るい,79edf3d87b1f92bda22850444cf23567.jpg,
みく,21,163,C,可愛い/愛嬌抜群/明るい,d0217570a6f9a1d967b0ebe7f843ecaa.jpg,
めぐ,23,155,C,可愛い/愛嬌抜群/明るい,megu7-scaled.jpg,
えりか,22,165,C,スタイル抜群/愛嬌抜群/明るい,erika.jpg,`;

  const payload = [];

  // ゆるスパデータの構築
  yuruData.trim().split('\n').forEach(line => {
    const [name, age, T, tags, img, sns] = line.split(',');
    payload.push({
      id: `tokyo_shinagawa_gotanda_yuru_spa_${name}`,
      shop_id: 'tokyo_shinagawa_gotanda_yuru_spa',
      raw_data: {
        name, age, T, 
        tags: tags ? tags.split('/') : [], 
        image_url: img ? `https://yuru-spa.com/gotanda/therapist_img/${img}` : null,
        sns
      }
    });
  });

  // メンエスグループデータの構築
  menesData.trim().split('\n').forEach(line => {
    const [name, age, T, B, tags, img, sns] = line.split(',');
    payload.push({
      id: `tokyo_setagaya_futakotamagawa_menes_group_${name}`,
      shop_id: 'tokyo_setagaya_futakotamagawa_menes_group',
      raw_data: {
        name, age, T, B, 
        tags: tags ? tags.split('/') : [], 
        image_url: img ? `https://www.futakotamagawa-mens-esthe.com/wp-content/uploads/2026/04/${img}` : null, // 暫定URLパス
        sns
      }
    });
  });

  try {
    console.log(`🚀 合計 ${payload.length} 名のキャストデータの登録・更新を開始します...`);
    
    // 一括でUpsert (50件ずつ分割処理)
    const chunkSize = 50;
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      const res = await fetch(`${url}/rest/v1/therapists`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(chunk)
      });
      
      if (!res.ok) {
        console.error(`❌ ${i}件目付近でエラーが発生しました: ${res.statusText}`);
      } else {
        console.log(`   ✅ ${i + chunk.length} / ${payload.length} 件 処理完了`);
      }
    }

    console.log(`\n🎊 全キャストデータのデータベース登録が完了しました！`);
    console.log(`ブラウザをリロードして、キャスト一覧や各店舗ページに新しい女の子が表示されているかご確認ください。`);

  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
  }
}

run();
