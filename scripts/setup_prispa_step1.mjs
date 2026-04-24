import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // 全角・半角スペースを取り除いて名前を詰める
  return rawName.replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%Prispa%',
  searchKeyword2: '%プリスパ%',
  fallbackAreaId: 'tokyo_chiyoda_akihabara', // 秋葉原エリア
  shopName: 'Prispa (プリスパ)',
  scheduleUrl: 'https://prispa.net/schedule',
  // 画像から抽出したプレミアムコースの料金システム
  priceSystem: '【プレミアムコース】\n60分 15,000円\n80分 19,000円\n100分 24,000円\n150分 35,000円\n200分 45,000円'
};

// HTMLから抽出したキャストデータ（25名＋ダミー枠除外済み）
const therapistsRaw = [
  { rawName: '坂口レイ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/2/53b6103c-fceb-4cdf-8ccf-db354ca20f2e.jpg' },
  { rawName: '沢田エミ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/3/5fbe11c3-0fb3-4ab2-8546-a8f4757fabff.jpg' },
  { rawName: '双葉あかり', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/130/b3ffd9c4-1f25-482d-aeee-72c9b38620d8.jpg' },
  { rawName: '最上ありす', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/270/9a9dcd89-f28c-4614-a373-8dd0ea01e741.jpg' },
  { rawName: '蒼井まい', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/20/1410a402-3754-4588-9d7c-f5f985ea1077.jpg' },
  { rawName: '藤田こより', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/162/e68ca2c6-7c14-4afc-a134-26bebff57c80.jpg' },
  { rawName: '成瀬ひな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/154/afe249c5-2b45-441a-ab78-a8d498a1743b.jpg' },
  { rawName: '吉川まな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/5/e276205a-c3ed-4518-96cd-66bf85b2e574.jpg' },
  { rawName: '京本あんな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/318/d35ce6c1-d95c-4573-8428-774657c81ef3.jpg' },
  { rawName: '星れいか', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/300/c45c1bd5-06ad-4ad2-b8ff-bc356ef63d61.jpg' },
  { rawName: '新井ひかり', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/343/dc653b84-8ca9-47f4-9250-832dd1d6e0f2.jpg' },
  { rawName: '宮沢ゆいか', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/29/63e48b56-f90a-4d0e-adbc-daadb2fd517c.jpg' },
  { rawName: '胡桃こはる', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/160/736104ec-42d4-4dd0-82e1-13352f009284.jpg' },
  { rawName: '桃井レン', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/202/fedd387e-ad02-40b5-afbe-da78afce69b4.jpg' },
  { rawName: '月城はる', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/248/282366b8-95b5-4acd-86a9-20b87021f149.jpg' },
  { rawName: '持田めぐ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/317/92e19fd1-cbeb-433e-b08b-0bf2e642e216.jpg' },
  { rawName: '石原なな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/281/9700741e-b503-45b9-819d-d1fded2c41e6.jpg' },
  { rawName: '白雪かのん', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/375/2a7f1a03-f445-4830-bfbd-6fcd4e0766a3.jpg' },
  { rawName: '神崎るな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/169/b876d9dc-148f-493d-a4c6-1d19b774440c.jpg' },
  { rawName: '日向りこ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/224/407fb425-defa-4c58-8a7e-3f753ff48a39.jpg' },
  { rawName: '橘つばさ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/108/162bb230-b1f7-445a-a0ae-a88e1df0bd6e.jpg' },
  { rawName: '月守るる', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/394/7f99b2e3-bc8a-4c8d-ae17-b754e6a03b27.jpg' },
  { rawName: '田中れいな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/395/6774d759-b5e9-444b-9887-8311e945ff5f.jpg' },
  { rawName: '神代さな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/393/d379b8cc-7d61-4f22-ae1f-ccf104723f3c.jpg' },
  { rawName: '橋本ゆあ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/390/e20dc36c-1ab1-4571-a9b2-9638420a8ac4.jpg' },
  { rawName: '夢乃みやび', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/391/ea5f6484-122f-44c2-9ed2-09d4335c7d84.jpg' },
  { rawName: '森川ゆな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/389/dfdbb1ac-30d6-4faf-9620-adff048d68be.jpg' },
  { rawName: '麻倉よう', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/165/ce95db94-141e-49dd-add5-597df74ec021.jpg' },
  { rawName: '白鳥あめ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/222/aec7b516-0899-41bc-82e1-89ecc31aad6e.jpg' },
  { rawName: '宮下のり', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/120/eb74ef5f-5ce1-4148-b976-24f1ad3ee3ca.jpg' },
  { rawName: '三浦うみ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/337/afc62d14-5323-4e7f-aecb-154f616f4f77.jpg' },
  { rawName: '佐藤みなみ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/267/72ee5910-f909-4011-aa03-a581e5184441.jpg' },
  { rawName: '雪下るり', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/215/dae535df-f83d-41de-b30c-53425c4857e9.jpg' },
  { rawName: '白金はな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/316/bc4db136-e8cf-472e-8ac2-ba5d0163b0bb.jpg' },
  { rawName: '木村さき', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/235/1566b4a4-bbf3-437e-a7db-f287f87d716b.jpg' },
  { rawName: '香澄かりん', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/356/11299110-ff40-47fc-8792-3d7f785c2ed0.jpg' },
  { rawName: '水沢えな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/342/f69e7a5a-d933-4dc2-a48a-da546aed746a.jpg' },
  { rawName: '花沢さきの', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/376/1e400d32-d0be-41bd-a5a9-ed6482633b55.jpg' },
  { rawName: '天海こころ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/289/6d641f4d-307c-4885-bd0d-ed2a34902a8a.jpg' },
  { rawName: '百瀬りりか', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/386/2cce5bc8-8f6a-468e-9ece-637db7872374.jpg' },
  { rawName: '奏みこと', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/388/13acad91-006e-4d35-8f54-8854b87f6436.jpg' },
  { rawName: '空星みあ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/377/57219887-1ba3-42f6-8c35-42b2d608a463.jpg' },
  { rawName: '逢坂ゆず', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/341/f3ee0e0d-2b3c-4186-bd17-b59016897c06.jpg' },
  { rawName: '小鳥遊めめ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/292/1ccb3fa4-8233-4382-b2e5-3234a6ce5d20.jpg' },
  { rawName: '長谷川エマ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/243/86f02ba9-c1cc-4ed8-82bb-dfbc0995b5d4.jpg' },
  { rawName: '有松みう', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/347/10d7f7f4-23eb-49b7-b3c9-df987a2d9d57.jpg' },
  { rawName: '愛沢せな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/269/3199e40b-6b05-4bba-98eb-6bb9b15dcbc6.jpg' },
  { rawName: '織宮さくら', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/293/efc1addd-9b2b-4dad-93dd-dcbe4de4bfce.jpg' },
  { rawName: '佐伯ゆら', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/379/d9bc0f0f-74e9-4af9-a641-416f3f6cb88d.jpg' },
  { rawName: '九条いおり', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/246/dbd70da0-e62c-4eaa-9454-dbbd087d9caa.jpg' },
  { rawName: '西條なみ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/339/38a41649-03e7-4a62-8d51-de24b2966a9c.jpg' },
  { rawName: '望月ほのか', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/327/0bc72f47-ef0e-4e0f-9765-95e23efc33bc.jpg' },
  { rawName: '雪本りお', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/383/fa146c04-874b-4da7-8571-b5d0bbc24106.jpg' },
  { rawName: '山下なお', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/273/afe7d5c5-6752-405f-be05-b71e2809c159.jpg' },
  { rawName: '間宮りょう', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/139/e586a9f0-6c6e-4db6-8b91-6e4bda98f8b4.png' },
  { rawName: '白咲ゆりか', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/380/507a07f6-3bc8-4494-a5ce-3a8b543f014d.jpg' },
  { rawName: '黒崎らん', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/378/8822cf66-2085-4b9f-bc14-9f4b87e602f0.jpg' },
  { rawName: '坂本めぐみ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/290/1bbde76f-30f0-4bd7-a48c-7aae47db854f.jpg' },
  { rawName: '渚しおん', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/350/52071f38-ccfa-4241-83e7-530303584e4b.jpg' },
  { rawName: '小湊あかね', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/381/fe400e51-8e7d-46cb-ab1e-17fe5993babf.jpg' },
  { rawName: '如月えみり', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/384/02bacd9e-9e10-42c9-89f1-6cad90007eef.jpg' },
  { rawName: '杉咲ゆの', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/331/4fe659be-0133-4364-bb2a-0bf4aa5ecfb5.jpg' },
  { rawName: '未空ゆうひ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/387/0fd3e8bc-cd64-4330-b557-c003436e77d4.jpg' },
  { rawName: '星野みゆ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/179/4bbcb17d-3ebc-4c9c-a88c-f448ebfd41ca.jpg' },
  { rawName: '早乙女ちあき', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/227/ea3cf724-ff50-4c16-b20a-1caf0e4d65d9.jpg' },
  { rawName: '咲山るき', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/253/d89125d5-1903-4e32-8799-27bbc97f55c0.jpg' },
  { rawName: '青羽うた', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/185/579f01b3-3c93-4654-9140-0f0ca7dae993.jpg' },
  { rawName: '春乃あん', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/282/51993224-b4d0-4f06-a357-db5177c45d9f.jpg' },
  { rawName: '椎名もも', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/234/226e7249-3542-493b-9241-7b5b2b4647a6.jpg' },
  { rawName: '滝沢まりな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/330/575d3c3a-ec7a-4876-a832-400d72fc4bc8.jpg' },
  { rawName: '本田ねね', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/360/d91d6a99-5046-498d-988c-7fa8f63e3253.jpg' },
  { rawName: '天使ななせ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/369/99eb6dd1-d722-492a-944c-52f1ac8f2f3e.jpg' },
  { rawName: '笹木まろん', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/368/44e032aa-4bcb-42cc-9144-49902fc8c984.jpg' },
  { rawName: '夏目にな', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/239/76970692-b84e-4376-a49f-2f9e7b43b20a.jpg' },
  { rawName: '中村まき', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/261/072cfc8a-29b0-47e1-8526-968a49f325a7.jpg' },
  { rawName: '白石あすか', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/372/8055cefb-653a-4005-8019-401e67d5ce4a.jpg' },
  { rawName: '工藤あざみ', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/192/14b81c23-4fc6-4ba7-96cb-c43c7a0bc156.jpg' },
  { rawName: '真鍋まどか', image: 'https://aromalife-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/310/ebed5c2d-84e7-4354-b06d-ece72b6475fc.jpg' }
];

async function main() {
  console.log(`🚀 ${CONFIG.shopName}：ステップ① データ登録を開始します...\n`);
  const now = new Date().toISOString();
  
  try {
    let { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id')
      .or(`name.ilike.${CONFIG.searchKeyword},name.ilike.${CONFIG.searchKeyword2}`)
      .limit(1);

    if (searchError) throw searchError;

    const targetId = (shops && shops.length > 0) ? shops[0].id : crypto.randomUUID();

    if (shops?.length > 0) {
      console.log(`✅ 既存の「プリスパ」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、秋葉原エリアで新規IDを発行して登録します。`);
    }

    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: CONFIG.fallbackAreaId,
      name: CONFIG.shopName,
      schedule_url: CONFIG.scheduleUrl,
      price_system: CONFIG.priceSystem
    });

    const payload = therapistsRaw
      // 名前が「デビュー」や「新人」を含む場合は除外
      .filter(t => !t.rawName.includes('デビュー') && !t.rawName.includes('新人'))
      .map(t => {
        const clean = cleanseName(t.rawName);
        return {
          id: `${targetId}_${clean}`,
          shop_id: targetId,
          name: clean,
          image_url: t.image?.trim() || null,
          is_active: true,
          last_seen_at: now,
          raw_data: { original_name: t.rawName }
        };
      });

    console.log(`⚙️ セラピストデータ(therapists)を登録中...`);
    await supabase.from('therapists').upsert(payload);

    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました。`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 Prispa(プリスパ)のデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
