import fs from 'fs';
import path from 'path';

async function run() {
  try {
    const therapistsPath = 'public/data/therapists.json';
    const yuruShopPath = 'public/data/tokyo/shinagawa/gotanda/yuru_spa.json';
    const menesShopPath = 'public/data/tokyo/setagaya/futakotamagawa/menes_group.json';

    console.log("🛠  最終的なデータ修復を開始します...");

    // 1. マスター図鑑 (therapists.json) を読み込む
    let allTherapists = JSON.parse(fs.readFileSync(therapistsPath, 'utf-8'));

    // 2. キャストデータの定義
    const yuruRaw = `胡桃もえ,24,162,,213_1.webp,twitter:@mo11595\n小林えま,21,150,NEW,217_1.webp,\n七瀬りさ,,166,NEW,219_1.webp,\n黒田りいさ,25,147,,212_1.webp,twitter:@riisa_2510\n泉まお,29,163,,176_1.webp,twitter:@mao_yurusup\n桜井まりな,27,160,,46_1.webp,twitter:@yuru_marina\n荒木ゆうみ,33,163,,188_1.webp,twitter:@yu__ru__y\n優木りの,27,163,,214_1.webp,\n蒼井涼子,30,157,,211_1.webp,twitter:@ryoko6786\n真白つむぎ,26,166,,203_1.webp,twitter:@JbxQoiLZnd1581\n美山りりか,24,154,,207_1.webp,twitter:@yurumiyama\n別府ゆい,29,155,,210_1.webp,twitter:@tt8nfiooaa19062\n南はな,32,153,,199_1.webp,twitter:@yuru_minami_sub\n常磐あみ,27,158,,156_1.webp,twitter:@amiyuruspa\n諸星ラム,24,164,,190_1.webp,twitter:@yurumoroboshi\n宝生かなえ,,,,196_1.webp,twitter:@kanaev_v4\n桃瀬のあ,24,160,,195_1.webp,twitter:@mms_yrsp\n蜜川かりん,26,152,,67e3486d07fe5_1.webp,twitter:@yurusupa_karin\n篠原あい,27,160,,157_1.webp,twitter:@yuru_shino\n相原みほ,28,152,,173_1.webp,twitter:@AiharaMiho_\n月葉なぎ,21,160,,161_1.webp,twitter:@yurusupa_nagi\n女神らん,30,160,,136_1.webp,twitter:@yuruspa_ran\n小桜ゆうり,27,149,,166_1.webp,twitter:@koSakuraYuyuri\n如月りよ,28,157,,205_1.webp,twitter:@riyo__esthe\n松雪ひめの,24,169,,215_1.webp,twitter:@matsuyukihimeno\n宮瀬くるみ,,,,,\n水瀬れいら,22,,,,`;
    const menesRaw = `かのん,24,156,G,NEW/スレンダー/テクニシャン/愛嬌抜群,IMG_1214.jpeg,\nのぞみ,24,153,E,NEW/おっとり/ほんわか系/癒し系,IMG_1185.jpeg,\nみく,22,163,D,NEW/おっとり/スレンダー/可愛い,IMG_1139-1-scaled.jpeg,bsky:mikuuuuuu\nもな,23,160,G,NEW/おっとり/可愛い/清楚系,IMG_1070.jpeg,twitter:@_m_o_n_a_1\nなぎ,20,155,E,NEW/ナイスBODY/可愛い/愛嬌抜群,IMG_1035.jpeg,bsky:nagi-chan7\nあかね,28,152,D,お姉さん系/小柄/愛嬌抜群,IMG_1019-scaled.jpeg,bsky:akanene0226\nなつみ,19,165,C,スタイル抜群/可愛い/愛嬌抜群,IMG_0970-scaled.jpeg,\nぴょな,22,160,C,可愛い/愛嬌抜群/素人系,IMG_0914-3-scaled.jpeg,\nうか,20,150,D,ほんわか系/可愛い/愛嬌抜群,IMG_0886-4.jpeg,\nまゆ,28,163,G,PICKUP/お姉さん系/テクニシャン/可愛い,IMG_0752-scaled.jpeg,\nりあ,25,165,E,お姉さん系/スタイル抜群/テクニシャン,IMG_0718.jpeg,\nひな,25,157,E,可愛い/愛嬌抜群/明るい,IMG_0941.jpeg,\nりん,25,160,F,お姉さん系/テクニシャン/愛嬌抜群,IMG_0617-1-scaled.jpeg,\nみれい,20,158,D,おっとり/スタイル抜群/清楚系,IMG_0591-4.jpeg,\nれな,27,167,E,お姉さん系/愛嬌抜群/清楚系,IMG_0872-1.jpeg,\nのあ,24,164,E,おっとり/お姉さん系/可愛い,IMG_0256-1.jpeg,\nしほ,25,156,D,スレンダー/テクニシャン/癒し系,IMG_0595.jpeg,\nおとは,24,155,C,スレンダー/愛嬌抜群/明るい,IMG_0239.jpeg,\nかんな,23,160,C,おっとり/可愛い/愛嬌抜群,IMG_0109-1.jpeg,\nきら,22,162,E,おっとり/可愛い/愛嬌抜群,IMG_0132.jpeg,\nえれな,27,162,H,PICKUP/お姉さん系/グラマラス/テクニシャン,IMG_0058.jpeg,\nまりあ,21,152,C,スレンダー/可愛い/愛嬌抜群,IMG_9945.jpeg,\nるな,19,150,G,ほんわか系/可愛い/愛嬌抜群,IMG_9844-1.jpeg,\nせな,28,155,D,お姉さん系/ナイスBODY/愛嬌抜群,IMG_9830.jpeg,\nみおな,22,163,C,おっとり/可愛い/愛嬌抜群,IMG_0703-1.jpeg,\nすず,25,165,C,お姉さん系/スレンダー/愛嬌抜群,IMG_0368.jpeg,\nゆみか,23,162,F,おっとり/愛嬌抜群/素人系,IMG_9590.jpeg,\nゆゆ,21,162,C,No.2/おっとり/スタイル抜群/可愛い,IMG_9608.jpeg,\nさん,25,152,F,愛嬌抜群/明るい/素人系,IMG_9461.jpeg,\nえす,20,157,D,No.1/可愛い/愛嬌抜群/癒し系,IMG_9412.jpeg,\nつばき,30,150,G,お姉さん系/テクニシャン/愛嬌抜群,IMG_9427.png,\nちょこ,28,168,D,お姉さん系/スタイル抜群/可愛い,IMG_9216.jpeg,\nかりん,23,153,D,おっとり/可愛い/妹系,IMG_9197.jpeg,\nあんな,25,160,E,ゴージャス系/ナイスBODY/聞き上手,AF0DA5B6-EC3A-486A-966B-CC5B9B229E41.jpeg,\nぷりん,21,160,D,おっとり/ほんわか系/可愛い,IMG_9092.jpeg,\nむぎ,26,162,D,お姉さん系/スタイル抜群/愛嬌抜群,IMG_9073.jpeg,\nかずは,21,163,D,ほんわか系/可愛い/愛嬌抜群,IMG_0825.jpeg,\nさば,20,155,E,ほんわか系/可愛い/愛嬌抜群,IMG_0210.jpeg,\nあん,25,160,E,お姉さん系/スタイル抜群/可愛い,IMG_9099.jpeg,\nまり,23,160,E,テクニシャン/可愛い/愛嬌抜群,IMG_9165.jpeg,\nゆう,26,158,D,お姉さん系/明るい/素人系,IMG_8631.jpeg,\nねむ,24,158,C,おっとり/スタイル抜群/素人系,IMG_8361-1.jpeg,\nりな,21,172,D,おっとり/スタイル抜群/癒し系,IMG_8297-1.jpeg,\nさんご,22,157,F,ほんわか系/可愛い/愛嬌抜群,IMG_8188-1.jpeg,\nとばり,24,155,D,おっとり/明るい/素人系,IMG_8077.jpeg,\nさら,24,159,D,お姉さん系/スタイル抜群/愛嬌抜群,IMG_7974.jpeg,\nこころ,24,149,C,おっとり/可愛い/小柄,IMG_7897.jpeg,\nるり,22,165,D,おっとり/スタイル抜群/愛嬌抜群,IMG_0981.jpeg,\nももな,23,158,D,グラマラス/テクニシャン/可愛い,IMG_7371.jpeg,\nあすか,20,159,C,スタイル抜群/スレンダー/愛嬌抜群,IMG_7282.jpeg,\nゆみ,23,158,G,おっとり/テクニシャン/ナイスBODY,IMG_7007.jpeg,\nくるみ,26,152,E,お姉さん系/スレンダー/テクニシャン,IMG_6879.jpeg,\nそら,19,158,C,おっとり/ほんわか系/可愛い,IMG_6943.jpeg,\nゆずり,23,163,F,おっとり/スタイル抜群/可愛い,IMG_6756.jpeg,\nななみ,25,169,D,お姉さん系/スタイル抜群/聞き上手,IMG_6796-2.jpeg,\nみさ,22,165,D,おっとり/ほんわか系/愛嬌抜群,IMG_0339.jpeg,\nろあ,19,160,F,スタイル抜群/可愛い/愛嬌抜群,IMG_6674.jpeg,\nまあや,19,162,H,ナイスBODY/可愛い/明るい,IMG_6667.jpeg,\nめる,21,153,D,おっとり/妹系/愛嬌抜群,IMG_6489.jpeg,\nりか,23,162,G,スタイル抜群/ナイスBODY/可愛い,IMG_6475.jpeg,\nさつき,18,153,E,おっとり/ナイスBODY/可愛い,IMG_5965-1.jpeg,\nみこ,23,156,F,ゴージャス系/テクニシャン/可愛い,IMG_5489.jpeg,\nあやか,20,157,D,おっとり/ナイスBODY/可愛い,IMG_5450.jpeg,\nさり,21,160,C,ほんわか系/愛嬌抜群/素人系,65FB6AF5-4FB9-46BD-A7B4-AF3E87D6D620.jpeg,\nあこ,23,158,C,スタイル抜群/ほんわか系/愛嬌抜群,143CF34E-1425-4822-8638-ECAB5A530951.jpeg,\nあいら,23,168,D,スタイル抜群/愛嬌抜群/素人系,35E1CB1B-7947-466C-B454-712FAF1F7797.jpeg,\nかよ,20,169,D,スタイル抜群/テクニシャン/愛嬌抜群,B804DC39-109E-4B90-B1E9-9617A878F404.jpeg,\nみづき,28,157,E,お姉さん系/テクニシャン/愛嬌抜群,04F0512A-1AC9-4172-99C0-8F29855580F5.jpeg,\nまな,23,155,D,テクニシャン/可愛い/愛嬌抜群,IMG_8822.jpeg,\nりこ,19,160,E,おっとり/スタイル抜群/可愛い,B9AD37FA-7409-4423-8AF5-180AEA722345.jpeg,\nねね,21,153,C,可愛い/妹系/小柄,B49575CA-4B4E-4B7C-988C-C6DBF09996A7.jpeg,\nことり,23,151,F,おっとり/スタイル抜群/可愛い,3B857075-11B7-418D-B687-B3796F165441.jpeg,\nかな,26,163,F,おっとり/お姉さん系/テクニシャン,79674F56-0F71-432A-A336-4B02D15FE2CA.jpeg,\nこのは,23,150,E,小柄/愛嬌抜群/明るい,3BFA9D7E-47A4-47BD-8BCC-187E442999D2.jpeg,\nもこ,23,156,C,テクニシャン/可愛い/愛嬌抜群,46A6983D-C05F-4210-84F7-703E4D71EAC8.jpeg,\nあけみ,21,160,D,スレンダー/可愛い/明るい,AA8975DE-E0A2-449B-90C9-6B25C2FC3895.jpeg,\nななこ,21,155,F,おっとり/ゴージャス系/ナイスBODY,nanako.jpg,\nほのか,23,155,D,おっとり/テクニシャン/可愛い,083D2D66-E473-4662-8A34-D737048236C2.jpeg,\nゆえ,24,160,E,お姉さん系/テクニシャン/聞き上手,EE15269F-C46F-488E-AFD9-77CBDAABCFB9.jpeg,\nちま,20,157,C,おっとり/スタイル抜群/聞き上手,90EEDE55-5E8F-4992-B4EF-A7D32F9D1B07.jpeg,\nはな,20,156,D,お姉さん系/スタイル抜群/愛嬌抜群,F8F6B885-B2BC-4F6A-9E49-F34EF5149AA7.jpeg,\nあみ,21,165,D,ゴージャス系/スタイル抜群/テクニシャン,EF942D62-EA18-426C-933A-B7FD32BA432D.jpeg,\nゆい,23,161,C,お姉さん系/スレンダー/可愛い,8830967E-32E4-406C-B5C8-FDA352E02D45.jpeg,\nもえ,23,160,D,お姉さん系/ゴージャス系/愛嬌抜群,IMG_8772.jpeg,\nじゅり,23,166,D,おっとり/ナイスBODY/ほんわか系,6C3DCCF0-E094-48C4-BB8D-F6C20AF52A14.jpeg,\nえりさ,20,150,C,おっとり/テクニシャン/小柄,B4EBDD07-E4DB-480C-9CB1-F9EB2CCEABA2.jpeg,\nさくら,22,152,E,お姉さん系/スタイル抜群/清楚系,046D41F7-A55D-443F-A5E6-3665F848E6F4.jpeg,\nめあ,20,152,D,おっとり/ほんわか系/小柄,DED0760C-1B28-4808-AAF3-4E763D27B9C8.jpeg,\nなち,23,158,C,おっとり/スタイル抜群/素人系,IMG_0775.jpeg,\nるる,22,157,C,スレンダー/テクニシャン/可愛い,0DB1804E-3D30-4476-B339-6BBF04CDBADD.jpeg,\nふうか,22,157,D,おっとり/テクニシャン/妹系,44DF3063-B2E6-4FB8-BA7D-76803D1F1BB5.jpeg,\nさな,23,156,E,おっとり/ナイスBODY/ほんわか系,IMG_7625.jpeg,\nなお,19,153,C,おっとり/ナイスBODY/ほんわか系,3F764552-DB2F-4579-94EA-68EF6372280B.jpeg,\nおと,20,156,E,ギャル系/テクニシャン/愛嬌抜群,B0B5874C-5749-4ECE-AC25-37E9DEF48C38.jpeg,\nひかり,23,153,D,テクニシャン/愛嬌抜群/明るい,hikari2.jpg,\nまどか,22,155,E,スタイル抜群/愛嬌抜群/明るい,madoka10.jpg,\nゆりあ,23,158,C,スタイル抜群/愛嬌抜群/明るい,79edf3d87b1f92bda22850444cf23567.jpg,\nみく,21,163,C,可愛い/愛嬌抜群/明るい,d0217570a6f9a1d967b0ebe7f843ecaa.jpg,\nめぐ,23,155,C,可愛い/愛嬌抜群/明るい,megu7-scaled.jpg,\nえりか,22,165,C,スタイル抜群/愛嬌抜群/明るい,erika.jpg,`;

    // ゆるスパ処理
    const yuruIds = [];
    yuruRaw.trim().split('\n').forEach(line => {
      const [name, age, T, tags, img, sns] = line.split(',');
      const id = `yuru_spa_${name}`;
      yuruIds.push(id);
      allTherapists.push({
        id, name, age, T, shop_id: "tokyo_shinagawa_gotanda_yuru_spa",
        image: img ? `https://yuru-spa.com/gotanda/therapist_img/${img}` : "",
        tags: tags ? tags.split('/') : [], sns
      });
    });

    // メンエスグループ処理
    const menesIds = [];
    menesRaw.trim().split('\n').forEach(line => {
      const [name, age, T, B, tags, img, sns] = line.split(',');
      const id = `menes_group_${name}`;
      menesIds.push(id);
      allTherapists.push({
        id, name, age, T, B, shop_id: "tokyo_setagaya_futakotamagawa_menes_group",
        image: img ? `https://www.futakotamagawa-mens-esthe.com/wp-content/uploads/2026/04/${img}` : "",
        tags: tags ? tags.split('/') : [], sns
      });
    });

    // 3. 重複を排除して保存
    const uniqueTherapists = Array.from(new Map(allTherapists.map(item => [item.id, item])).values());
    fs.writeFileSync(therapistsPath, JSON.stringify(uniqueTherapists, null, 2));
    console.log(`✅ ${therapistsPath} を更新しました。`);

    // 4. 店舗ファイルの更新 (therapistsの中身をIDの配列にする)
    const yuruShop = JSON.parse(fs.readFileSync(yuruShopPath, 'utf-8'));
    yuruShop.therapists = yuruIds;
    fs.writeFileSync(yuruShopPath, JSON.stringify(yuruShop, null, 2));
    console.log(`✅ ${yuruShopPath} を更新しました（IDリスト化）。`);

    const menesShop = JSON.parse(fs.readFileSync(menesShopPath, 'utf-8'));
    menesShop.therapists = menesIds;
    fs.writeFileSync(menesShopPath, JSON.stringify(menesShop, null, 2));
    console.log(`✅ ${menesShopPath} を更新しました（IDリスト化）。`);

    console.log("\n🚀 全てのデータ整形が完了しました！");
    console.log("👉 最後に [ npm run sync ] を実行してください。");

  } catch (e) {
    console.error("❌ エラー:", e.message);
  }
}
run();
