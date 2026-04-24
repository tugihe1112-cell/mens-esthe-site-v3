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
  searchKeyword: '%アネモネ%', 
  areaId: 'tokyo_toshima_ikebukuro', // 池袋エリア
  shopName: 'Anemone (アネモネ)',
  scheduleUrl: 'https://www.ane-mones.net/schedule/',
  priceSystem: '90分 13,000円\n120分 18,000円\n150分 23,000円\n180分 28,000円\n210分 33,000円'
};

// HTMLと画像から抽出したキャストデータ
const therapistsRaw = [
  { rawName: '速水 (40歳)', tags: ['NEW'], size: 'T.162 B.84(C) W.58 H.86', image: 'https://www.ane-mones.net/images/ml_11_1_7378.jpg' },
  { rawName: '片瀬 (42歳)', tags: ['NEW'], size: 'T.155 B.84(C) W.57 H.85', image: 'https://www.ane-mones.net/images/ml_11_1_7354.jpg' },
  { rawName: '琥珀(こはく) (37歳)', tags: [], size: 'T.158 B.84(D) W.56 H.85', image: 'https://www.ane-mones.net/images/ml_11_1_7303.jpg' },
  { rawName: '永瀬 (29歳)', tags: [], size: 'T.160 B.93(H) W.60 H.89', image: 'https://www.ane-mones.net/images/ml_11_1_6740.jpg' },
  { rawName: '未波 (43歳)', tags: [], size: 'T.157 B.89(F) W.62 H.90', image: 'https://www.ane-mones.net/images/ml_11_1_6708.jpg' },
  { rawName: '青山 (37歳)', tags: [], size: 'T.159 B.84(C) W.57 H.85', image: 'https://www.ane-mones.net/images/ml_11_1_6615.jpg' },
  { rawName: '新井 (41歳)', tags: [], size: 'T.157 B.89(E) W.61 H.90', image: 'https://www.ane-mones.net/images/ml_11_1_6366.jpg' },
  { rawName: '冬月 (41歳)', tags: [], size: 'T.157 B.92(G) W.58 H.87', image: 'https://www.ane-mones.net/images/ml_11_1_5872.jpg' },
  { rawName: '直江 (43歳)', tags: [], size: 'T.156 B.86(D) W.57 H.87', image: 'https://www.ane-mones.net/images/ml_11_1_5312.jpg' },
  { rawName: '葉月 (36歳)', tags: [], size: 'T.153 B.83(C) W.57 H.84', image: 'https://www.ane-mones.net/images/ml_11_1_5265.jpg' },
  { rawName: '森本 (31歳)', tags: [], size: 'T.152 B.84(C) W.56 H.85', image: 'https://www.ane-mones.net/images/ml_11_1_5054.jpg' },
  { rawName: '加藤 (41歳)', tags: [], size: 'T.161 B.86(E) W.57 H.87', image: 'https://www.ane-mones.net/images/ml_11_1_4912.jpg' },
  { rawName: '明日花 (34歳)', tags: [], size: 'T.164 B.84(C) W.56 H.85', image: 'https://www.ane-mones.net/images/ml_11_1_4921.jpg' },
  { rawName: '響(ひびき) (35歳)', tags: [], size: 'T.154 B.88(E) W.60 H.89', image: 'https://www.ane-mones.net/images/ml_11_1_4829.jpg' },
  { rawName: '湊(みなと) (41歳)', tags: [], size: 'T.170 B.84(C) W.56 H.85', image: 'https://www.ane-mones.net/images/ml_11_1_4707.jpg' },
  { rawName: '蒼井 (36歳)', tags: [], size: 'T.148 B.86(D) W.58 H.87', image: 'https://www.ane-mones.net/images/ml_11_1_4661.jpg' },
  { rawName: '若葉 (33歳)', tags: [], size: 'T.154 B.86(D) W.57 H.87', image: 'https://www.ane-mones.net/images/ml_11_1_4465.jpg' },
  { rawName: '国仲 (33歳)', tags: [], size: 'T.151 B.87(E) W.59 H.89', image: 'https://www.ane-mones.net/images/ml_11_1_4352.jpg' },
  { rawName: '城咲 (40歳)', tags: [], size: 'T.153 B.86(D) W.58 H.87', image: 'https://www.ane-mones.net/images/ml_11_1_4051.jpg' },
  { rawName: '雪野 (35歳)', tags: [], size: 'T.153 B.87(E) W.56 H.85', image: 'https://www.ane-mones.net/images/ml_11_1_2820.jpg' },
  { rawName: '結城 (41歳)', tags: [], size: 'T.159 B.86(D) W.57 H.87', image: 'https://www.ane-mones.net/images/ml_11_1_2494.jpg' },
  { rawName: '一条 (35歳)', tags: [], size: 'T.167 B.84(C) W.57 H.85', image: 'https://www.ane-mones.net/images/ml_11_1_2543.jpg' },
  { rawName: '吉岡 (42歳)', tags: [], size: 'T.158 B.87(E) W.58 H.86', image: 'https://www.ane-mones.net/images/ml_11_1_2427.jpg' },
  { rawName: '夏目 (35歳)', tags: [], size: 'T.155 B.84(C) W.56 H.85', image: 'https://www.ane-mones.net/images/ml_11_1_2220.jpg' },
  { rawName: '美山 (35歳)', tags: [], size: 'T.153 B.85(D) W.56 H.84', image: 'https://www.ane-mones.net/images/ml_11_1_2094.jpg' },
  { rawName: '平野 (31歳)', tags: [], size: 'T.158 B.83(C) W.57 H.84', image: 'https://www.ane-mones.net/images/ml_11_1_2030.jpg' },
  { rawName: '柊(ひいらぎ) (41歳)', tags: [], size: 'T.161 B.83(C) W.56 H.84', image: 'https://www.ane-mones.net/images/ml_11_1_1754.jpg' },
  { rawName: '麻宮(あさみや) (38歳)', tags: [], size: 'T.164 B.87(D) W.58 H.86', image: 'https://www.ane-mones.net/images/ml_11_1_515.jpg' },
  { rawName: '綾瀬 (38歳)', tags: [], size: 'T.151 B.88(E) W.57 H.86', image: 'https://www.ane-mones.net/images/ml_11_1_69.jpg' },
  { rawName: '香坂 (41歳)', tags: [], size: 'T.163 B.87(D) W.57 H.85', image: 'https://www.ane-mones.net/images/ml_11_1_36.jpg' }
];

async function main() {
  console.log(`🚀 ${CONFIG.shopName}：ステップ① データ登録を開始します...\n`);
  const now = new Date().toISOString();
  
  try {
    // 1. 池袋エリアで店舗を特定（重複防止）
    const { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id')
      .eq('area_id', CONFIG.areaId)
      .ilike('name', CONFIG.searchKeyword)
      .limit(1);

    if (searchError) throw searchError;

    const targetId = (shops && shops.length > 0) ? shops[0].id : crypto.randomUUID();

    if (shops?.length > 0) {
      console.log(`✅ 既存の「アネモネ」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、新規IDを発行して登録します。`);
    }

    // 2. 店舗情報の更新
    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: CONFIG.areaId,
      name: CONFIG.shopName,
      schedule_url: CONFIG.scheduleUrl,
      price_system: CONFIG.priceSystem
    });

    // 3. キャスト登録（自動退店処理付き）
    const payload = therapistsRaw.map(t => {
      const clean = cleanseName(t.rawName);
      return {
        id: `${targetId}_${clean}`,
        shop_id: targetId,
        name: clean,
        image_url: t.image?.trim() || null,
        is_active: true,
        last_seen_at: now,
        raw_data: { tags: t.tags, size: t.size, original_name: t.rawName }
      };
    });

    console.log(`⚙️ セラピストデータ(therapists)を登録中...`);
    await supabase.from('therapists').upsert(payload);

    // 退店処理（前回いたけど今回いなかったキャストを非表示化）
    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました。`);
    if (inactives?.length > 0) {
      console.log(`📉 ${inactives.length}名のステータスを退店(inactive)に変更しました。`);
    }

    console.log('\n🎉 アネモネのデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお送りください！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
