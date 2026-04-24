import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // カッコ内の年齢・ふりがな、全角半角スペース、改行を削除
  return rawName.replace(/（.*?）|\(.*?\)/g, '').replace(/[\s　\n\r]/g, '').trim();
}

function extractAge(rawName) {
  const match = rawName.match(/\((\d+)歳\)/);
  return match ? `${match[1]}歳` : '';
}

const CONFIG = {
  searchKeyword: '%GRACE%',
  searchKeyword2: '%グレイス%',
  fallbackAreaId: 'tokyo_shinagawa_meguro', // 目黒エリア (品川区目黒駅周辺として扱う)
  shopName: 'GRACE (グレイス)',
  scheduleUrl: 'https://grace-meguro.com/schedule',
  // 画像から抽出した料金システム
  priceSystem: '60min 14,000円\n90min 18,000円\n120min 23,000円\n150min 28,000円'
};

// HTMLから抽出したキャストデータ（全20名）
const therapistsRaw = [
  { rawName: '能代 すみれ (26歳)', tags: ['新人'], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/126/56cde364-ed3c-49e0-93e2-dc17be459c7e.jpg' },
  { rawName: '一色 しずく (31歳)', tags: ['新人'], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/125/5ce24f03-b069-4d9f-8a57-64d1f6c339bd.jpg' },
  { rawName: '滝河 みおり (29歳)', tags: ['新人'], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/124/97c4c5fc-162c-4eea-9838-e01e226cbad8.jpg' },
  { rawName: '森 にき (29歳)', tags: ['新人'], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/122/633b8d94-b31a-4f6d-8299-b7fdd0a93f95.jpg' },
  { rawName: '新田 りえ (41歳)', tags: ['新人'], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/116/7e80e197-c469-478f-82b0-160a58d48778.jpg' },
  { rawName: '伊波 ひな (34歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/112/f269b76c-1176-4d3d-a957-e107c24b05a4.jpg' },
  { rawName: '新垣 マユ (27歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/97/008d987a-6866-4a30-8f0c-bf88a1e21fd2.jpg' },
  { rawName: '月野 あおい (33歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/95/91fa31f5-fedd-411c-883c-31eb8c91fa6a.jpg' },
  { rawName: '水島えみり (35歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/2/fee096bb-5266-41a0-b1bd-41da76698869.jpg' },
  { rawName: '南 ちか (27歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/6/c23fb709-1cf6-4557-a9d4-482018704cc2.jpg' },
  { rawName: '有田 カスミ (28歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/66/d6ae6796-c9e2-47e5-b585-d25dd869f285.jpg' },
  { rawName: '荒木 りな (31歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/59/13734f6f-bae7-4f05-ac18-498e262ece4a.jpg' },
  { rawName: '風間 じゅん (41歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/85/22e57519-95ed-4128-9b56-8e02b050177b.jpg' },
  { rawName: '冬月なな (33歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/17/5c9c5b23-c36a-4ddc-8cc2-ed754671d390.jpg' },
  { rawName: '岡 マルミ (36歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/84/e5ca3bca-2313-4e63-9017-cb8746c30b55.jpg' },
  { rawName: '福富 れな (39歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/113/627177de-b5cf-4e98-b9e1-7ea74fc9c701.jpg' },
  { rawName: '星 しほ (36歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/123/1e91829e-6cb6-418c-b044-1fe2c34af9ea.jpg' },
  { rawName: '高梨 みゆう (31歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/108/e81c2af0-cb0e-41b4-84ca-1f7c96114c61.jpg' },
  { rawName: '葉月 りょう (36歳)', tags: ['新人'], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/115/a2a59a2f-392c-4f51-bd0c-c348afd9c318.jpg' },
  { rawName: '小栗 あやな (35歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/83/3fe49f1f-cd62-4a2d-abf9-f58cb5ad9cbe.jpg' },
  { rawName: '一条さくら (32歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/10/81522fee-af50-4dc0-8e41-2af3eac53229.jpg' },
  { rawName: '池田 モエ (28歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/102/c2574a1c-921e-42db-b7ec-2c6404e520dc.jpg' },
  { rawName: '白石 こはる (27歳)', tags: ['新人'], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/118/b17d1ab0-380c-40f1-9464-d89e753c034c.jpg' },
  { rawName: '石原 あやか (29歳)', tags: ['新人'], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/121/f788e8cb-f736-4403-947e-b7cfa8b6d74f.jpg' },
  { rawName: '一ノ瀬 レナ (25歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/27/ec5ac018-9ec1-4b8f-b1ca-234e24fce984.jpg' },
  { rawName: '二ノ宮 あい (34歳)', tags: [], image: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/86/d2b19c1b-17ea-4855-aa68-10d4db77e611.jpg' }
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
      console.log(`✅ 既存の「グレイス」枠を発見しました。全${therapistsRaw.length}名のデータを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、目黒エリアで新規IDを発行して登録します。`);
    }

    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: CONFIG.fallbackAreaId,
      name: CONFIG.shopName,
      schedule_url: CONFIG.scheduleUrl,
      price_system: CONFIG.priceSystem
    });

    const payload = therapistsRaw.map(t => {
      const clean = cleanseName(t.rawName);
      const age = extractAge(t.rawName);
      
      let bioStr = `年齢: ${age || '非公開'}`;
      
      return {
        id: `${targetId}_${clean}`,
        shop_id: targetId,
        name: clean,
        image_url: t.image?.trim() || null,
        is_active: true,
        last_seen_at: now,
        raw_data: { 
          tags: t.tags, 
          bio: bioStr,
          original_name: t.rawName 
        }
      };
    });

    console.log(`⚙️ セラピストデータ(therapists)を登録中...`);
    await supabase.from('therapists').upsert(payload);

    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    console.log(`✅ 全 ${payload.length} 名のキャスト情報を登録・更新しました！`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 GRACE (グレイス)のデータ登録が完全に完了しました！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
