import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  return rawName.replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%AROMA AMOUR%',
  searchKeyword2: '%アムール%',
  fallbackAreaId: 'tokyo_chiyoda_akihabara', // 秋葉原エリア
  shopName: 'AROMA AMOUR (秋葉原店)',
  scheduleUrl: 'https://www.akiba-amour.com/schedule/',
  priceSystem: '75分 16,000円（当日のみ・本指名不可）\n90分 20,000円\n120分 25,000円\n150分 30,000円'
};

// HTMLから抽出したキャストデータ（24名分）
const therapistsRaw = [
  { rawName: '武井りな', size: '20歳 T.158 B.84(D) W.56 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_106.jpg' },
  { rawName: '花宮さゆみ', size: '23歳 T.152 B.84(D) W.56 H.82', image: 'https://www.akiba-amour.com/images/ml_11_1_4104.jpg' },
  { rawName: '桐生はるか', size: '20歳 T.155 B.86(F) W.57 H.84', image: 'https://www.akiba-amour.com/images/ml_11_1_3780.jpg' },
  { rawName: '牧瀬あゆな', size: '24歳 T.155 B.84(E) W.57 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_7393.jpg' },
  { rawName: '姫宮りか', size: '22歳 T.156 B.86(E) W.57 H.84', image: 'https://www.akiba-amour.com/images/ml_11_1_3348.jpeg' },
  { rawName: '宮野まり', size: '26歳 T.167 B.85(D) W.56 H.82', image: 'https://www.akiba-amour.com/images/ml_11_1_5329.jpg' },
  { rawName: '南きこ', size: '26歳 T.161 B.85(D) W.57 H.84', image: 'https://www.akiba-amour.com/images/ml_11_1_5576.jpeg' },
  { rawName: '本田あかね', size: '28歳 T.157 B.83(C) W.56 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_5652.jpg' },
  { rawName: '折原のの', size: '22歳 T.157 B.84(D) W.56 H.82', image: 'https://www.akiba-amour.com/images/ml_11_1_1467.jpeg' },
  { rawName: '杉野りおん', size: '25歳 T.155 B.83(C) W.86 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_6349.jpg' },
  { rawName: '与田みな', size: '23歳 T.152 B.87(G) W.56 H.84', image: 'https://www.akiba-amour.com/images/ml_11_1_3928.jpg' },
  { rawName: '鈴原らん', size: '22歳 T.152 B.84(D) W.55 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_5210.jpg' },
  { rawName: '吉澤みずき', size: '26歳 T.163 B.85(D) W.56 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_5642.jpg' },
  { rawName: '樋口はづき', size: '22歳 T.161 B.84(E) W.56 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_3532.jpeg' },
  { rawName: '綾波めい', size: '22歳 T.150 B.85(E) W.57 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_3405.jpeg' },
  { rawName: '綿貫つばさ', size: '23歳 T.163 B.84(C) W.55 H.82', image: 'https://www.akiba-amour.com/images/ml_11_1_3572.jpeg' },
  { rawName: '結城ゆあ', size: '25歳 T.157 B.83(C) W.55 H.81', image: 'https://www.akiba-amour.com/images/ml_11_1_7377.jpg' },
  { rawName: '上原ゆみか', size: '26歳 T.155 B.84(D) W.56 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_5645.jpg' },
  { rawName: '叶まどか', size: '27歳 T.158 B.86(F) W.57 H.84', image: 'https://www.akiba-amour.com/images/ml_11_1_7308.jpg' },
  { rawName: '青野みれい', size: '25歳 T.167 B.85(D) W.56 H.84', image: 'https://www.akiba-amour.com/images/ml_11_1_7054.jpg' },
  { rawName: '若菜いお', size: '25歳 T.160 B.87(E) W.57 H.85', image: 'https://www.akiba-amour.com/images/ml_11_1_6431.jpg' },
  { rawName: '白河はすな', size: '21歳 T.164 B.85(D) W.57 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_5565.JPG' },
  { rawName: '北乃ゆうり', size: '22歳 T.163 B.85(D) W.56 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_5540.jpg' },
  { rawName: '白坂はな', size: '26歳 T.152 B.83(C) W.56 H.82', image: 'https://www.akiba-amour.com/images/ml_11_1_3298.jpeg' },
  { rawName: '堂本まな', size: '25歳 T.153 B.84(D) W.56 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_3552.jpeg' },
  { rawName: '堤ほのか', size: '24歳 T.159 B.89(G) W.56 H.85', image: 'https://www.akiba-amour.com/images/ml_11_1_3861.jpg' },
  { rawName: '白咲もえ', size: '25歳 T.160 B.86(F) W.57 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_7236.jpg' },
  { rawName: '瀬戸なずな', size: '22歳 T.153 B.84(D) W.55 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_7349.jpg' },
  { rawName: '猫又れあ', size: '24歳 T.162 B.85(E) W.55 H.82', image: 'https://www.akiba-amour.com/images/ml_11_1_7237.jpg' },
  { rawName: '篠咲りょう', size: '26歳 T.150 B.84(D) W.56 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_2090.jpeg' },
  { rawName: '苺谷えま', size: '22歳 T.156 B.85(E) W.56 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_4849.jpg' },
  { rawName: '相原まなみ', size: '22歳 T.156 B.88(F) W.57 H.86', image: 'https://www.akiba-amour.com/images/ml_11_1_641.jpeg' },
  { rawName: '睦月しの', size: '20歳 T.157 B.86(E) W.57 H.85', image: 'https://www.akiba-amour.com/images/ml_11_1_3860.jpg' },
  { rawName: '瀬名ふうか', size: '21歳 T.155 B.87(F) W.58 H.84', image: 'https://www.akiba-amour.com/images/ml_11_1_4942.jpg' },
  { rawName: '妹尾うた', size: '20歳 T.161 B.83(C) W.56 H.82', image: 'https://www.akiba-amour.com/images/ml_11_1_7405.jpg' },
  { rawName: '黒川みさ', size: '24歳 T.156 B.89(G) W.57 H.85', image: 'https://www.akiba-amour.com/images/ml_11_1_5389.jpg' },
  { rawName: '愛内ここあ', size: '20歳 T.155 B.83(D) W.56 H.81', image: 'https://www.akiba-amour.com/images/ml_11_1_5485.jpg' },
  { rawName: '氷堂なつか', size: '27歳 T.160 B.83(C) W.55 H.80', image: 'https://www.akiba-amour.com/images/ml_11_1_7385.jpg' },
  { rawName: '小町ゆの', size: '24歳 T.160 B.89(F) W.57 H.85', image: 'https://www.akiba-amour.com/images/ml_11_1_5526.jpg' },
  { rawName: '外村ゆうき', size: '26歳 T.170 B.89(F) W.57 H.85', image: 'https://www.akiba-amour.com/images/ml_11_1_5467.jpeg' },
  { rawName: '安西さおり', size: '27歳 T.162 B.91(G) W.58 H.87', image: 'https://www.akiba-amour.com/images/ml_11_1_7339.jpg' },
  { rawName: '杉浦ののか', size: '24歳 T.155 B.85(E) W.55 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_7252.jpg' },
  { rawName: '藍野ことは', size: '26歳 T.150 B.84(D) W.55 H.82', image: 'https://www.akiba-amour.com/images/ml_11_1_7256.jpg' },
  { rawName: '星川ひより', size: '20歳 T.148 B.81(C) W.55 H.80', image: 'https://www.akiba-amour.com/images/ml_11_1_3217.jpeg' },
  { rawName: '咲宮なぎ', size: '23歳 T.160 B.84(D) W.55 H.82', image: 'https://www.akiba-amour.com/images/ml_11_1_5493.jpg' },
  { rawName: '雛森みく', size: '23歳 T.163 B.85(D) W.57 H.84', image: 'https://www.akiba-amour.com/images/ml_11_1_5159.jpg' },
  { rawName: '小倉いおり', size: '25歳 T.162 B.84(D) W.56 H.82', image: 'https://www.akiba-amour.com/images/ml_11_1_7373.jpg' },
  { rawName: '宮崎ひまり', size: '21歳 T.155 B.84(D) W.55 H.82', image: 'https://www.akiba-amour.com/images/ml_11_1_5109.jpg' },
  { rawName: '大森さとみ', size: '25歳 T.161 B.84(D) W.58 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_5272.jpg' },
  { rawName: '西野あいり', size: '25歳 T.162 B.86(F) W.57 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_4223.jpg' },
  { rawName: '川越るな', size: '23歳 T.164 B.86(E) W.57 H.84', image: 'https://www.akiba-amour.com/images/ml_11_1_6404.jpg' },
  { rawName: '夏木うた', size: '24歳 T.160 B.90(G) W.57 H.86', image: 'https://www.akiba-amour.com/images/ml_11_1_4026.jpg' },
  { rawName: '天音すず', size: '22歳 T.164 B.88(F) W.57 H.85', image: 'https://www.akiba-amour.com/images/ml_11_1_1116.jpeg' },
  { rawName: '星ゆうか', size: '24歳 T.154 B.93(G) W.58 H.89', image: 'https://www.akiba-amour.com/images/ml_11_1_718.JPG' },
  { rawName: '里吉るの', size: '26歳 T.160 B.84(D) W.57 H.83', image: 'https://www.akiba-amour.com/images/ml_11_1_5569.jpg' },
  { rawName: '佐倉ゆり', size: '27歳 T.156 B.89(F) W.57 H.86', image: 'https://www.akiba-amour.com/images/ml_11_1_7476.jpg' },
  { rawName: '桜井あいか', size: '21歳 T.157 B.88(F) W.57 H.86', image: 'https://www.akiba-amour.com/images/ml_11_1_496.jpeg' },
  { rawName: '渚すずは', size: '27歳 T.162 B.89(G) W.57 H.86', image: 'https://www.akiba-amour.com/images/ml_11_1_2943.jpeg' }
];


async function main() {
  console.log(`🚀 ${CONFIG.shopName}：ステップ① データ登録を開始します...\n`);
  const now = new Date().toISOString();
  
  try {
    // 1. 店舗の特定（新規または上書き）
    let { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id')
      .or(`name.ilike.${CONFIG.searchKeyword},name.ilike.${CONFIG.searchKeyword2}`)
      .limit(1);

    if (searchError) throw searchError;

    const targetId = (shops && shops.length > 0) ? shops[0].id : crypto.randomUUID();

    if (shops?.length > 0) {
      console.log(`✅ 既存の「アムール」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、秋葉原エリアで新規IDを発行して登録します。`);
    }

    // 2. 店舗情報のUpsert
    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: CONFIG.fallbackAreaId,
      name: CONFIG.shopName,
      schedule_url: CONFIG.scheduleUrl,
      price_system: CONFIG.priceSystem
    });

    // 3. キャストデータの整形
    const payload = therapistsRaw.map(t => {
      const clean = cleanseName(t.rawName);
      
      return {
        id: `${targetId}_${clean}`,
        shop_id: targetId,
        name: clean,
        image_url: t.image?.trim() || null,
        is_active: true,
        last_seen_at: now,
        raw_data: { size: t.size, original_name: t.rawName }
      };
    });

    // キャストのUpsert実行
    console.log(`⚙️ セラピストデータ(therapists)を登録中...`);
    await supabase.from('therapists').upsert(payload);

    // 4. 自動退店処理（いなくなったキャストを非表示）
    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました。`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 AROMA AMOUR (秋葉原店)のデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
