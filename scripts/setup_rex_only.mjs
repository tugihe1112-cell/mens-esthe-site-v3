import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function cleanseName(rawName) {
  if (!rawName) return '';
  return rawName.replace(/\(.*?\)|（.*?）/g, '').trim();
}

const SHOP_NAME = 'Rex (レックス池袋店)';
const SEARCH_KEYWORD = '%Rex%';

const shopData = {
  name: SHOP_NAME,
  schedule_url: 'https://rex-luxury-salon.com/schedule',
  price_system: '【初回限定コース】\n70分 13,000円\n\n【REX LUXURYコース】\n90分 18,000円\n120分 24,000円\n150分 30,000円\n※30分毎に+6000円で何分でも可能',
  image_url: ''
};

const therapistsRaw = [
  { rawName: '三ツ谷まい (23歳)', size: 'T.164 B.86(E) W.56 H.84', tags: ['清楚系', '経験豊富', 'お姉さん系', '愛嬌◎', '女子アナ系', 'リピート率高'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/184/275261ac-a66d-4ce4-ab83-9ac68501b915.jpg' },
  { rawName: '篠宮ゆり (20歳)', size: 'T.162 B.88(E) W.52 H.80', tags: ['可愛い', '癒し系', '愛嬌◎', '女子大生系', 'アイドル系', 'スレンダー'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/183/a5357cf5-58d3-4e37-b74c-c896cf8a1fe8.jpg' },
  { rawName: '月島しずく (25歳)', size: 'T.160 B.93(J) W.60 H.88', tags: ['経験豊富', '女子アナ系', 'おすすめ', 'Iカップ', 'リピート率高', 'キャバ嬢'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/94/7978a5ca-3d8c-4442-adc7-49d25995d32c.jpg' },
  { rawName: '湊崎さやか (25歳)', size: 'T.155 B.97(J) W.60 H.85', tags: ['経験豊富', '可愛い', '愛嬌◎', 'おすすめ', 'リピート率高', '関西弁', 'Jカップ'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/4/f579b494-37bb-4af8-81e9-7e444e5fe23c.jpg' },
  { rawName: '一ノ瀬みな (23歳)', size: 'T.167 B.110(J) W.60 H.86', tags: ['No.1', 'ギャル系', '高身長', 'リピート率高', 'スレンダー', 'Jカップ'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/18/10c418cc-3b25-47ec-a40c-a94ddcb1a8ab.jpg' },
  { rawName: '九条ことね (22歳)', size: 'T.158 B.92(H) W.58 H.88', tags: ['可愛い', '愛嬌◎', '女子大生系', 'アイドル系', 'おすすめ', 'リピート率高'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/160/40227921-8e85-43ac-bbc0-44eb3d9ce54e.jpg' },
  { rawName: '早乙女りむ (23歳)', size: 'T.156 B.93(I) W.62 H.88', tags: ['新人', '未経験', '可愛い', '癒し系', 'アイドル系'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/152/571d88c6-0533-4f58-8ed4-6774f7fc7ad8.jpg' },
  { rawName: '櫻井ゆら (20歳)', size: 'T.160 B.86(E) W.58 H.83', tags: ['可愛い', '女子大生系', 'アイドル系', 'おすすめ', 'リピート率高'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/186/983d86f8-5e6e-4fde-ab57-2718b0e7b2b7.jpg' },
  { rawName: '夏目すずか (23歳)', size: 'T.161 B.84(C) W.54 H.78', tags: ['お姉さん系', 'キレイ系', '愛嬌◎', 'おすすめ', 'リピート率高'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/175/777c7fe5-d4f8-49b5-9df3-af9842c65775.jpg' },
  { rawName: '七海そら (24歳)', size: 'T.160 B.82(E) W.56 H.85', tags: ['経験豊富', '癒し系', '愛嬌◎', '女子大生系', 'スレンダー'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/44/9246ad4f-442e-4a55-8a7e-857dc6c0336f.jpg' },
  { rawName: '七瀬りせ (22歳)', size: 'T.166 B.88(F) W.58 H.84', tags: ['可愛い', '女子大生系', 'アイドル系', 'おすすめ', 'リピート率高'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/176/2f0fe00e-0b39-413a-a2ea-cca71a9fd0f6.jpg' },
  { rawName: '柊まりな (20歳)', size: 'T.158 B.86(D) W.57 H.84', tags: ['可愛い', 'ふんわり系', '癒し系', '愛嬌◎', 'アイドル系', 'おすすめ'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/165/224798d3-c9aa-4175-a7c9-322e84ff2335.jpg' },
  { rawName: '瀬戸口もも (21歳)', size: 'T.168 B.90(G) W.58 H.88', tags: ['可愛い', 'ふんわり系', 'アイドル系', 'おすすめ', '桃尻'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/173/e166e1e4-bfb6-47d7-ad26-46752b3888dd.jpg' },
  { rawName: '天使なの (23歳)', size: 'T.151 B.90(G) W.58 H.88', tags: ['新人', '可愛い', '愛嬌◎', 'アイドル系', 'おすすめ', 'リピート率高', 'キャバ嬢'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/149/9d861012-b1ad-425d-b233-35d1daa6d157.jpg' },
  { rawName: '東雲くるみ (19歳)', size: 'T.164 B.84(C) W.54 H.80', tags: ['新人', '愛嬌◎', '女子大生系', 'アイドル系', 'おすすめ'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/171/c5605770-8c0b-45f1-a564-6af8d25c560a.jpg' },
  { rawName: '雨音まゆ (20歳)', size: 'T.157 B.88(E) W.58 H.82', tags: ['未経験', '可愛い', '小柄', '愛嬌◎', 'アイドル系', 'おすすめ', 'キャバ嬢'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/167/824d3e5c-a0be-44f8-bb6c-8376c06e52ed.jpg' },
  { rawName: '白石ゆきの (26歳)', size: 'T.158 B.87(E) W.58 H.85', tags: ['経験豊富', 'お姉さん系', '愛嬌◎', 'おすすめ', 'リピート率高', 'キャバ嬢'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/169/9ee00284-0fa3-48e8-b800-c9bc8a21517d.jpg' },
  { rawName: '橘りょう (27歳)', size: 'T.160 B.85(E) W.58 H.86', tags: ['経験豊富', 'お姉さん系', '女子アナ系', 'おすすめ', 'リピート率高'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/74/44d97fe8-1e6e-4ed5-896c-f77635e731fa.jpg' },
  { rawName: '田中ぽまれ (28歳)', size: 'T.159 B.88(E) W.58 H.88', tags: ['お姉さん系', '愛嬌◎', '女子アナ系', 'おすすめ', 'リピート率高'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/155/ff8c19b7-c215-4cd0-8fcd-fc9e48701578.jpg' },
  { rawName: '水城しほ (23歳)', size: 'T.154 B.85(E) W.57 H.82', tags: ['可愛い', '愛嬌◎', 'アイドル系', 'おすすめ', 'リピート率高'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/141/53c411cb-9322-4bf8-8ac9-e5e6796ac33c.jpg' },
  { rawName: '如月ゆら (24歳)', size: 'T.160 B.92(G) W.60 H.89', tags: ['新人', '未経験', '女子アナ系', '高身長', 'キャバ嬢'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/104/1a452f6b-c4b4-44b6-9ec9-9c4dcb32bd6e.jpg' },
  { rawName: '御抹茶はんな (23歳)', size: 'T.158 B.84(C) W.57 H.84', tags: ['新人', '未経験', 'ギャル系', 'アイドル系', 'おすすめ', 'キャバ嬢'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/161/12698831-697c-49ff-b392-fbcface4fbf2.jpg' },
  { rawName: '渋谷あみ (25歳)', size: 'T.152 B.85(C) W.55 H.82', tags: ['お姉さん系', '女子アナ系', 'おすすめ', 'キャバ嬢'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/140/7262ff78-2985-4da1-9107-b6fca3b8b5f1.jpg' },
  { rawName: '篠咲いちか (24歳)', size: 'T.166 B.84(C) W.57 H.86', tags: ['No.1', '経験豊富', 'お姉さん系', 'おすすめ', '高身長', 'スレンダー', 'キャバ嬢'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/72/e796f33c-c1d9-4ae1-b470-ed3c9f59dab7.jpg' },
  { rawName: '白星のえる(国宝) (23歳)', size: 'T.151 B.92(H) W.58 H.88', tags: ['No.1', '経験豊富', '可愛い', '愛嬌◎', 'アイドル系', 'おすすめ', 'リピート率高', '元アイドル'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/153/bee2548a-6e33-4ef6-becc-5a894e99cd5f.jpg' },
  { rawName: '涼宮かれん (25歳)', size: 'T.170 B.86(F) W.60 H.89', tags: ['経験豊富', 'キレイ系', '女子アナ系', 'おすすめ', '高身長', 'リピート率高', 'スレンダー', '講師'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/86/d6e54b26-9900-4ebb-b9aa-95cf627f8de7.jpg' },
  { rawName: '美神れむ (24歳)', size: 'T.161 B.90(F) W.64 H.94', tags: ['経験豊富', '愛嬌◎', 'おすすめ', '元看護師'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/144/76c73ac6-ff99-4d6d-85c1-85963a8e6cb5.jpg' },
  { rawName: '咲妃かのん (24歳)', size: 'T.158 B.88(E) W.58 H.86', tags: ['清楚系', '経験豊富', '可愛い', '愛嬌◎', 'アイドル系', 'おすすめ'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/172/abb99c28-3709-4817-9c8d-405961ee7030.jpg' },
  { rawName: '有栖川えま (22歳)', size: 'T.158 B.85(E) W.57 H.86', tags: ['清楚系', '経験豊富', 'アイドル系', 'おすすめ'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/126/7960d63a-8cc5-412c-b4b8-ead362a8bfb7.jpg' },
  { rawName: '月野ひめか (24歳)', size: 'T.170 B.83(C) W.57 H.82', tags: ['キレイ系', '女子アナ系', 'おすすめ', '高身長', 'スレンダー'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/143/a71adbc1-b732-422c-b802-de211137b5d9.jpg' },
  { rawName: '蒼井まひろ (24歳)', size: 'T.158 B.85(D) W.58 H.83', tags: ['キレイ系', '愛嬌◎', 'OL系', 'おすすめ', 'リピート率高'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/163/c371c5db-0d9f-49e5-b055-9b1875054ea9.jpg' },
  { rawName: '黒崎りこ (23歳)', size: 'T.165 B.88(F) W.50 H.73', tags: ['未経験', 'おすすめ', 'Fカップ', '関西弁', '元アイドル'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/43/aa5eea61-a6cf-4f23-9f37-3440b6c65c3e.png' },
  { rawName: '妃乃えりな (21歳)', size: 'B.82(C) W.54 H.80', tags: ['可愛い', '愛嬌◎', '女子大生系', 'アイドル系', 'おすすめ'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/174/2688a915-550f-467b-bbdc-e2d0b2624cd1.jpg' },
  { rawName: '白咲らむ (24歳)', size: 'T.155 B.88(E) W.60 H.87', tags: ['新人', '未経験', '経験豊富', '癒し系', '愛嬌◎'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/133/0e31892b-1f05-40e1-afdc-1ff0e0d65cb0.jpg' },
  { rawName: '心愛まゆ (27歳)', size: 'T.161 B.112(K) W.60 H.90', tags: ['新人', '桃尻', 'Jカップ', 'キャバ嬢'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/80/12a92173-6839-44ee-9a57-11d9bdc158a0.jpg' },
  { rawName: '美波しおり (25歳)', size: 'B.90(G) W.58 H.88', tags: ['新人', '未経験', 'ふんわり系', '愛嬌◎', 'おすすめ'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/146/8b386ccb-16e4-4652-a285-075a5fcbe909.jpg' },
  { rawName: '浜辺りお (25歳)', size: 'T.157 B.82(E) W.56 H.84', tags: ['経験豊富', 'お姉さん系', '癒し系', 'おすすめ', 'スレンダー'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/182/a8191947-7972-47e2-84eb-e65a714a29c7.jpg' },
  { rawName: '一条ななみ (24歳)', size: 'T.164 B.88(F) W.57 H.89', tags: ['清楚系', 'お姉さん系', '愛嬌◎', 'おすすめ', 'リピート率高'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/2/b6e30132-67df-43e4-aa9c-d0238c5cc392.png' },
  { rawName: '桜咲いおり (23歳)', size: 'T.165 B.90(G) W.58 H.88', tags: ['新人', 'ギャル系', '愛嬌◎', '高身長', 'キャバ嬢'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/81/6dceca71-d863-4ada-8ee9-e6ccdc5e61ec.jpg' },
  { rawName: '北やよい (23歳)', size: 'T.160 B.88(E) W.52 H.80', tags: ['新人', 'お姉さん系', '高身長', 'スレンダー', 'キャバ嬢'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/181/de69d67f-3f62-4c3d-a28f-f6b15d9cd85b.jpg' },
  { rawName: 'ソ警部店長 (39歳)', size: 'T.175 G.1000(Z) BANANA100%', tags: ['可愛い', 'ギャル系', 'ドS', 'ゴリラ系', 'ぽっちゃり', '南斗水鳥拳'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/28/5631afcc-aa61-4acb-b025-9a2f92b54291.png' },
  { rawName: 'シークレット出勤 (24歳)', size: 'T.168', tags: [], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/151/45f76ba7-6998-4ab3-a645-0dd1a17c4c3b.jpg' },
  { rawName: '希咲まお (25歳)', size: 'T.156 B.82(E) W.56 H.84', tags: ['可愛い', '癒し系', '愛嬌◎', 'アイドル系', 'おすすめ'], image: 'https://rex-luxury-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/188/1ea8537e-b09a-444e-8d15-8eeb7c150e4b.jpg' }
];

async function main() {
  try {
    console.log(`\n==============================================`);
    console.log(`🔄 処理開始: ${SHOP_NAME}`);
    console.log(`🔍 ステップ1: 既存の枠を検索します (${SEARCH_KEYWORD})`);
    
    const { data: existingShops, error: searchError } = await supabase
      .from('shops')
      .select('id, area_id, name')
      .ilike('name', SEARCH_KEYWORD)
      .limit(1);

    if (searchError) throw searchError;

    let targetShopId;
    let targetAreaId;

    if (existingShops && existingShops.length > 0) {
      console.log(`✅ ステップ2: 既存枠を発見。IDを引き継ぎます。 -> ${existingShops[0].id}`);
      targetShopId = existingShops[0].id;
      targetAreaId = existingShops[0].area_id;
    } else {
      console.log(`⚠️ ステップ2: 既存枠なし。新規IDを発行します。`);
      targetShopId = crypto.randomUUID();
      targetAreaId = 'tokyo-ikebukuro';
    }

    console.log(`⚙️ ステップ3-A: 店舗データ(shops)を上書きします...`);
    const { error: shopUpsertError } = await supabase
      .from('shops')
      .upsert({
        id: targetShopId,
        area_id: targetAreaId,
        name: shopData.name,
        schedule_url: shopData.schedule_url,
        image_url: shopData.image_url,
        price_system: shopData.price_system
      });

    if (shopUpsertError) throw shopUpsertError;

    console.log(`⚙️ ステップ3-B: セラピストデータ(therapists)を登録します...`);
    
    const therapistsPayload = therapistsRaw
      .filter(t => !t.rawName.includes('受付時間')) 
      .map(t => {
        const cleanName = cleanseName(t.rawName);
        return {
          id: `${targetShopId}_${cleanName}`,
          shop_id: targetShopId,
          name: cleanName,
          image_url: t.image,
          raw_data: { tags: t.tags, size: t.size, original_name: t.rawName },
          is_active: true
        };
    });

    const { error: therapistUpsertError } = await supabase
      .from('therapists')
      .upsert(therapistsPayload);

    if (therapistUpsertError) throw therapistUpsertError;
    
    console.log(`✅ ${SHOP_NAME} のセラピスト ${therapistsPayload.length}件の登録完了`);
    console.log(`\n🎉🎉 処理が正常に完了しました！ 🎉🎉`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

main();
