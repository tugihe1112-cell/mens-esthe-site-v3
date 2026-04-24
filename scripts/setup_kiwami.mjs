import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 【公式】名前クレンジング関数
function cleanseName(rawName) {
  if (!rawName) return '';
  return rawName.replace(/\(.*?\)|（.*?）/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%KIWAMI%', // 「美・セラ極」や「KIWAMI」で検索
  fallbackAreaId: 'tokyo_toshima_ikebukuro', // ※新規の場合の仮エリア（必要に応じて変更してください）
  shopName: '美・セラ極～KIWAMI～',
  scheduleUrl: 'https://b-s-kiwami.com/schedule',
  priceSystem: '90分 ¥15,000\n120分 ¥20,000\n150分 ¥25,000\n180分 ¥30,000',
  imageUrl: null // ロゴ画像があれば後で設定
};

// HTMLから解析・抽出したキャストデータ
const therapistsRaw = [
  { rawName: '市川(いちかわ) (36歳)', tags: ['NEW'], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/100/229217db-882f-4354-a8b2-3ecb81ed2e48.jpg' },
  { rawName: '光井(みつい) (40歳)', tags: ['NEW'], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/99/bba63593-5e98-4a9f-a9c1-2076d3f444f2.jpg' },
  { rawName: '藤原(ふじわら) (35歳)', tags: ['NEW'], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/98/a43d4269-2989-46b4-988a-e10d0f995aa8.jpg' },
  { rawName: '波野(なみの) (38歳)', tags: ['NEW'], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/97/f2a42772-c42a-415d-bbdf-bc11f0d174d4.jpg' },
  { rawName: '菅原(すがわら) (33歳)', tags: ['NEW'], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/96/4b851a70-9520-4ee7-a37d-b9dfb55a57ef.jpg' },
  { rawName: '高石(たかいし) (42歳)', tags: ['NEW'], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/95/118f43ab-a0de-47e1-a152-95b99f7ec218.jpg' },
  { rawName: '柏木(かしわぎ) (39歳)', tags: ['NEW'], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/92/6a760c9d-aa9c-4fb2-b0cb-ba7915f3e727.jpg' },
  { rawName: '水野(みずの) (33歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/91/a5d3bdfc-889a-42b9-b7bf-93b95c0d5c87.jpg' },
  { rawName: '一条(いちじょう) (39歳)', tags: ['NEW'], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/89/4eb0d300-040c-4373-8675-0c276a32b0a3.jpg' },
  { rawName: '阿部(あべ) (38歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/88/a8eceffb-60ae-48dc-947c-f3caaa934c0b.jpg' },
  { rawName: '伊織(いおり) (34歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/85/088da93c-78e9-4997-868b-c38ebd60927b.jpg' },
  { rawName: '馬場(ばば) (38歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/84/47290579-f98d-4a4f-9515-f5fd49e6e640.jpg' },
  { rawName: '椎名(しいな) (38歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/83/353e7a84-c317-453f-b032-aa76c8b86606.jpg' },
  { rawName: '瀬戸(せと) (38歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/78/8efc1c2f-bd76-47e1-987a-23390287acf3.jpg' },
  { rawName: '篠崎(しのざき) (34歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/76/16845046-8ac3-4d8d-9a87-44df2a765c70.jpg' },
  { rawName: '西田(にしだ) (37歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/75/3eb4f22d-103b-4d73-a21c-5f1598a3c1c2.jpg' },
  { rawName: '上杉(うえすぎ) (43歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/71/0a070eab-869b-4877-975a-9cc6052d1963.jpg' },
  { rawName: '相沢(あいざわ) (36歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/70/26fc2dc6-5e11-48fb-96af-62fce0f620b4.jpg' },
  { rawName: '千歳(ちとせ) (35歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/68/18927169-6a39-42af-aa50-23176e82348e.jpg' },
  { rawName: '藤井(ふじい) (37歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/67/753d0d93-8cea-441c-96f6-f1b24546baf8.jpg' },
  { rawName: '鈴木(すずき) (34歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/56/63c8a10a-f8d1-4d4c-958e-8ffcd4397755.jpg' },
  { rawName: '美咲(みさき) (36歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/69/e16e9679-5c56-432f-a153-405c94d34db6.jpg' },
  { rawName: '目黒(めぐろ) (37歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/45/6e585c86-e540-477d-bbe2-34bd3eda9ee4.jpg' },
  { rawName: '森下(もりした) (44歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/53/4f86f683-f3dd-4bf6-bd42-b1c79af92d17.jpg' },
  { rawName: '要(かなめ) (42歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/60/75f13fda-2eaf-46e7-b662-746ebf064e4a.jpg' },
  { rawName: '東(あずま) (38歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/46/a547d059-51e7-4274-b8a2-c4fb28ac9055.jpg' },
  { rawName: '浅倉(あさくら) (38歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/44/b6006202-293d-4e01-8314-0e87214b1d0f.jpg' },
  { rawName: '栗林(くりばやし) (42歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/13/48e84a1a-f556-42f0-bffd-43b4d3ca1f70.jpg' },
  { rawName: '宮脇(みやわき) (40歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/17/51ea83db-7f9a-4d03-9409-f53decdb36b5.jpg' },
  { rawName: '星(ほし) (36歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/11/9871139b-3ff9-413d-91b3-b2f6e9b22237.jpg' },
  { rawName: '雅(みやび) (46歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/9/39ce2bfd-2747-46b0-89cd-c64667cc1fb6.jpg' },
  { rawName: '桜井(さくらい) (39歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/27/44f96882-35f9-43e9-bf8d-1bc2a1add50c.jpg' },
  { rawName: '高山(たかやま) (35歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/23/f029eb3d-1786-4740-979e-5d44e894c477.jpg' },
  { rawName: '藤咲(ふじさき) (41歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/22/179bd22d-ac27-4a8c-a37d-05df6e7c8ba3.jpg' },
  { rawName: '神田(かんだ) (39歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/35/c008d0a0-8130-4bf8-89f7-1289fcd625c8.jpg' },
  { rawName: '桐島(きりしま) (46歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/33/346be6be-b526-4de3-8f3e-e1b9ee15b805.jpg' },
  { rawName: '蒼井(あおい) (43歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/37/726ef5a2-d151-4495-9d77-1e6e4c724345.jpg' },
  { rawName: '天海(あまみ) (44歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/38/eef5456b-d101-419d-9c4d-011ad6dda1d9.jpg' },
  { rawName: '春田(はるた) (36歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/39/4fcaec0c-6e54-478e-afa5-d34a3e580c69.jpg' },
  { rawName: '叶(かのう) (43歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/40/42cbc278-d3d0-4e1c-b10e-e723c9087146.jpg' },
  { rawName: '体験記事 (40歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/7/b66704ac-9df3-41a2-a9b2-c7e72025ce07.jpg' }, // ※後で除外処理されます
  { rawName: '巣鴨ブラウン (50歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/2/4476ac9b-eed7-4873-a762-3236cdf64bdc.jpg' },
  { rawName: '巣鴨ホワイト (50歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/3/0438f7bd-53e1-42b5-bd28-39aad3e793e1.jpg' },
  { rawName: '赤羽グリーン (50歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/4/6c2cf0f5-97b1-4924-9a70-37651bd2b681.jpg' },
  { rawName: '赤羽オレンジ (50歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/5/470be742-2f54-447b-9795-0921097a2efb.jpg' },
  { rawName: '駒込シルバー (50歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/6/c3e411d2-957d-478b-a3d2-e527b7990fdf.jpg' },
  { rawName: '池袋ブルー (50歳)', tags: [], image: 'https://kiwami-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/52/83816739-0fb3-41da-abfb-7b7181f4b25f.jpg' }
];

async function syncData() {
  console.log(`\n▶️ 処理開始: ${CONFIG.shopName}`);
  
  try {
    // 1. 既存チェック（分裂防止）
    const { data: existing, error: searchError } = await supabase
      .from('shops')
      .select('id, area_id')
      .or(`name.ilike.${CONFIG.searchKeyword},name.ilike.%極%`)
      .limit(1);
    
    if (searchError) throw searchError;

    const targetId = existing?.[0]?.id || crypto.randomUUID();
    const areaId = existing?.[0]?.area_id || CONFIG.fallbackAreaId;
    const now = new Date().toISOString();

    if (existing?.length > 0) {
      console.log(`✅ 既存店舗を発見: ID ${targetId}`);
    } else {
      console.warn(`⚠️ 新規店舗として登録します (エリア: ${areaId})`);
    }

    // 2. 店舗情報のUpsert
    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: areaId,
      name: CONFIG.shopName,
      schedule_url: CONFIG.scheduleUrl,
      price_system: CONFIG.priceSystem,
      image_url: CONFIG.imageUrl
    });

    // 3. キャストデータの整形（「体験記事」などのノイズはここで排除）
    const payload = therapistsRaw
      .filter(t => !t.rawName.includes('体験記事')) // 人間ではないレコードを除外
      .map(t => {
        const clean = cleanseName(t.rawName);
        return {
          id: `${targetId}_${clean}`,
          shop_id: targetId,
          name: clean,
          image_url: t.image?.trim() || null,
          is_active: true,
          last_seen_at: now,
          raw_data: { tags: t.tags, original_name: t.rawName }
        };
    });

    // 4. キャストのUpsert実行
    console.log(`⚙️ セラピストデータ(therapists)を登録中...`);
    const { error: upsertError } = await supabase.from('therapists').upsert(payload);
    if (upsertError) throw upsertError;
    console.log(`✅ ${payload.length} 名のキャストを更新しました。`);

    // 5. 自動退店処理（論理削除）
    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    if (inactives?.length > 0) {
      console.log(`📉 退店処理実行: 今回取得できなかった ${inactives.length}名 を非アクティブ化しました。`);
    }

    console.log(`\n🎉 処理が正常に完了しました！`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

syncData();
