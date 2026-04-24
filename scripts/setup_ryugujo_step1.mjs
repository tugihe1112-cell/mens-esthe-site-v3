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
  searchKeyword: '%竜宮城%',
  searchKeyword2: '%百万石%',
  fallbackAreaId: 'tokyo_chuo_ningyocho', // 人形町エリア
  shopName: '竜宮城 旧百万石 (人形町店)',
  scheduleUrl: 'https://esthe-ryugujo.com/schedule/',
  priceSystem: '90分 19,000円\n120分 23,000円\n150分 27,000円'
};

// HTMLから抽出したキャストデータ（全26名、ダミー枠は除外）
const therapistsRaw = [
  { rawName: '葉月みお', size: 'AGE 39 T163 / B89(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/05/IMG_2644.jpeg' },
  { rawName: '佐伯れいか', size: 'AGE 39 T158 / B83(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/08/IMG_3009.jpeg' },
  { rawName: '夏目みゆ', size: 'AGE 35 T152 / B89(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/09/IMG_2648.jpeg' },
  { rawName: '成瀬かんな', size: 'AGE 33 T163 / B88(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/03/IMG_2701.jpeg' },
  { rawName: '神田りか', size: 'AGE 33 T155 / B87(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/06/IMG_3721.jpeg' },
  { rawName: '間宮ともか', size: 'AGE 33 T157 / B86(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/04/IMG_1035.jpeg' },
  { rawName: '滝りえ', size: 'AGE 32 T158 / B87(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/04/IMG_4318.jpeg' },
  { rawName: '我孫子まり', size: 'AGE 42 T160 / B86(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/03/IMG_3515.jpeg' },
  { rawName: '一ノ木えま', size: 'AGE 38 T168 / B90(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/07/IMG_3849.jpeg' },
  { rawName: '浅香ひな', size: 'AGE 29 T158 / B89(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/10/IMG_7323.jpeg' },
  { rawName: '真野ゆりか', size: 'AGE 45 T160 / B86(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/06/IMG_5503.jpeg' },
  { rawName: '黒崎なつみ', size: 'AGE 33 T161 / B81(B)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/10/IMG_4377.jpeg' },
  { rawName: '桃井りほ', size: 'AGE 40 T157 / B88(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/12/IMG_2376.jpeg' },
  { rawName: '森永せいか', size: 'AGE 42 T173 / B98(H)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/10/IMG_4103.jpeg' },
  { rawName: '白金あん', size: 'AGE 38 T168 / B93(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/03/IMG_9628.jpeg' },
  { rawName: '星野せり', size: 'AGE 30 T155 / B110(H)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/08/IMG_4022.jpeg' },
  { rawName: '美波ここ', size: 'AGE 28 T158 / B92(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/12/IMG_4307.jpeg' },
  { rawName: '椎名まゆこ', size: 'AGE 31 T160 / B81(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/09/IMG_2209.jpeg' },
  { rawName: '月城とわ', size: 'AGE 36 T171 / B110(I)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/05/IMG_3794.jpeg' },
  { rawName: '柚木りこ', size: 'AGE 39 T162 / B88(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/09/IMG_3085.jpeg' },
  { rawName: '真木れいな', size: 'AGE 28 T158 / B90(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/05/IMG_2691.jpeg' },
  { rawName: '天月そら', size: 'AGE 34 T162 / B92(G)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/03/IMG_9626.jpeg' },
  { rawName: '結城りな', size: 'AGE 40 T158 / B88(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/02/IMG_6451.jpeg' },
  { rawName: '中条りん', size: 'AGE 39 T171 / B90(G)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/05/IMG_2645.jpeg' },
  { rawName: '月島ゆめな', size: 'AGE 36 T152 / B93(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/03/IMG_4214.jpeg' },
  { rawName: '大谷ゆうか', size: 'AGE 36 T158 / B96(H)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/03/IMG_1113.jpeg' },
  { rawName: '伊織みずほ', size: 'AGE 40 T158 / B85(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/10/IMG_4130.jpeg' },
  { rawName: '浅川えれん', size: 'AGE 29 T170 / B105(H)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/02/IMG_5349.jpeg' },
  { rawName: '鈴野ななか', size: 'AGE 30 T156 / B87(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/06/IMG_9762.jpeg' },
  { rawName: '立花ももか', size: 'AGE 32 T153 / B87(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/12/IMG_2678.jpeg' },
  { rawName: '朝比奈さな', size: 'AGE 35 T157 / B85(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/10/IMG_2226.jpeg' },
  { rawName: '石田みのり', size: 'AGE 29 T160 / B90(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/12/IMG_4298.jpeg' },
  { rawName: '藤田ゆりあ', size: 'AGE 35 T160 / B80(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/04/IMG_3753.jpeg' },
  { rawName: '一条すみれ', size: 'AGE 34 T150 / B86(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/10/IMG_3184.jpeg' },
  { rawName: '高島みれい', size: 'AGE 31 T162 / B80(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/04/IMG_4231.jpeg' },
  { rawName: '永野ななみ', size: 'AGE 35 T151 / B83(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/01/IMG_3361.jpeg' },
  { rawName: '藤原あおい', size: 'AGE 33 T160 / B85(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/12/IMG_7214.jpeg' },
  { rawName: '篠原みおか', size: 'AGE 38 T165 / B95(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/10/IMG_6505.jpeg' },
  { rawName: '青山みさき', size: 'AGE 30 T165 / B88(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/06/IMG_2799.jpeg' },
  { rawName: '星まこ', size: 'AGE 40 T161 / B105(H)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/01/IMG_3364.jpeg' },
  { rawName: '七瀬りの', size: 'AGE 29 T160 / B88(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/07/IMG_9877.jpeg' },
  { rawName: '花尻はるな', size: 'AGE 35 T151 / B87(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/11/IMG_4285.jpeg' },
  { rawName: '松坂いろは', size: 'AGE 28 T149 / B86(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/06/IMG_2602.jpeg' },
  { rawName: '桐谷れん', size: 'AGE 28 T168 / B84(B)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/11/IMG_1745.jpeg' },
  { rawName: '影山まゆか', size: 'AGE 34 T164 / B93(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/01/IMG_3849.jpeg' },
  { rawName: '明日香るみ', size: 'AGE 30 T161 / B82(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/10/IMG_4190.jpeg' },
  { rawName: '宝生さや', size: 'AGE 34 T168 / B88(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/10/IMG_4166.jpeg' },
  { rawName: '富永みこと', size: 'AGE 34 T165 / B88(H)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/06/IMG_2682.jpeg' },
  { rawName: '朝陽せな', size: 'AGE 29 T165 / B83(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/08/IMG_3913.jpeg' },
  { rawName: '青木せりか', size: 'AGE 42 T167 / B88(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/03/IMG_2715-1.jpeg' },
  { rawName: '美咲まどか', size: 'AGE 33 T162 / B90(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/03/IMG_3825.jpeg' },
  { rawName: '黒木ゆり', size: 'AGE 30 T170 / B96(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/06/IMG_2706.jpeg' },
  { rawName: '佐々木さら', size: 'AGE 33 T155 / B94(G)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/07/IMG_4861.jpeg' },
  { rawName: '桃原むち', size: 'AGE 30 T165 / B118(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2026/01/IMG_4442.jpeg' },
  { rawName: '上原さとみ', size: 'AGE 36 T159 / B92(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2026/01/IMG_4540.jpeg' },
  { rawName: '白百合さえ', size: 'AGE 33 T162 / B90(G)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/04/IMG_5696.jpeg' },
  { rawName: '蒼井りお', size: 'AGE 33 T148 / B86(D) / W58 / H87', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/10/IMG_4070.jpeg' },
  { rawName: '沢村あやの', size: 'AGE 45 T160 / B86(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2026/02/IMG_8128.jpeg' },
  { rawName: '一ノ瀬しほ', size: 'AGE 42 T170 / B85(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/06/IMG_9722.jpeg' },
  { rawName: '木の葉から', size: 'AGE 45 T155 / B86(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2026/02/IMG_4494.jpeg' },
  { rawName: '戸村ほなみ', size: 'AGE 35 T157 / B93(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/05/IMG_3684.jpeg' },
  { rawName: '卯月ふうか', size: 'AGE 33 T157 / B83(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2026/02/IMG_4484.jpeg' },
  { rawName: '姫川りいさ', size: 'AGE 40 T157 / B98(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/07/IMG_3819.jpeg' },
  { rawName: '九条りさ', size: 'AGE 40 T161 / B85(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/09/IMG_1565.jpeg' },
  { rawName: '藤咲まや', size: 'AGE 49 T163 / B90(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/10/IMG_6682.jpeg' },
  { rawName: '秋空かすみ', size: 'AGE 38 T162 / B98(H)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/08/IMG_4970.jpeg' },
  { rawName: '中村あんじゅ', size: 'AGE 42 T162 / B92(H)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/11/IMG_4210.jpeg' },
  { rawName: '藍田もえ', size: 'AGE 36 T155 / B86(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/12/IMG_6953.jpeg' },
  { rawName: '湊咲りりな', size: 'AGE 35 T169 / B89(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/09/IMG_5634.jpeg' },
  { rawName: '綾瀬ゆうき', size: 'AGE 45 T173 / B93(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/04/IMG_3822-1.jpeg' },
  { rawName: '川島かほ', size: 'AGE 41 T160 / B90(G)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/11/IMG_4225.jpeg' },
  { rawName: '宮田ひかる', size: 'AGE 37 T165 / B83(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/06/IMG_4371.jpeg' },
  { rawName: '水嶋あやみ', size: 'AGE 36 T165 / B92(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2023/07/IMG_2815.jpeg' },
  { rawName: '妃えりか', size: 'AGE 36 T165 / B88(E)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/07/IMG_8158.jpeg' },
  { rawName: '眞杉ほの', size: 'AGE 39 T154 / B105(I)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2025/08/IMG_5056.jpeg' },
  { rawName: '愛沢きょう', size: 'AGE 28 T155 / B90(G)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2026/03/IMG_4554.jpeg' },
  { rawName: '初音ゆうり', size: 'AGE 29 T154 / B82(C)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2026/03/IMG_4511-1.jpeg' },
  { rawName: '木下ゆか', size: 'AGE 36 T161 / B85(D)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2026/03/IMG_4578.jpeg' },
  { rawName: '沢尻もも', size: 'AGE 46 T162 / B94(F)', image: 'https://esthe-ryugujo.com/wp-content/uploads/2024/11/IMG_2693.jpeg' },
  { rawName: '深川まい', size: 'AGE 30 T161 / B104(J)', image: 'https://menes-jp.com/ryugujo/wp-content/uploads/2024/01/7953BCDC-EA98-44DE-AF43-480E3BDB1B5D.jpeg' }
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
      console.log(`✅ 既存の「竜宮城」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、人形町エリアで新規IDを発行して登録します。`);
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

    console.log('\n🎉 竜宮城 旧百万石(人形町店)のデータ登録が完了しました！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
