import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  return rawName.replace(/NEW/g, '').replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%ar Tokyo%',
  searchKeyword2: '%アールトウキョウ%',
  fallbackAreaId: 'tokyo_chiyoda_akihabara',
  shopName: 'ar Tokyo (アールトウキョウ秋葉原)',
  scheduleUrl: 'https://www.ms-ar.tokyo/schedule/',
  priceSystem: '60分 13,000円\n70分 14,000円\n90分 17,000円\n120分 22,000円\n150分 29,000円'
};

// 全71名のキャストデータ
const baseUrl = 'https://www.ms-ar.tokyo';
const therapistsRaw = [
  { rawName: '佐藤りか', size: '35歳 T.153 B.88(G) W.56 H.88', image: `${baseUrl}/images/ml_11_1_893.jpg` },
  { rawName: '葉月めぐみ', size: '32歳 T.157 B.89(G) W.56 H.86', image: `${baseUrl}/images/ml_11_1_892.jpg` },
  { rawName: '並木じゅん', size: '45歳 T.160 B.80(C) W.60 H.85', image: `${baseUrl}/images/ml_11_1_914.jpeg` },
  { rawName: '神田ほのか', size: '45歳 T.158 B.90(H) W.61 H.88', image: `${baseUrl}/images/ml_11_1_895.jpg` },
  { rawName: '早乙女のあ', size: '40歳 T.154 B.86(F) W.54 H.85', image: `${baseUrl}/images/ml_11_1_890.jpg` },
  { rawName: '伊藤らん', size: '42歳 T.162 B.98(H) W.62 H.93', image: `${baseUrl}/images/ml_11_1_923.jpg` },
  { rawName: '桜川みな', size: '32歳 T.162 B.91(F) W.60 H.90', image: `${baseUrl}/images/ml_11_1_1513.jpg` },
  { rawName: '山口れな', size: '35歳 T.150 B.83(D) W.55 H.81', image: `${baseUrl}/images/ml_11_1_928.jpg` },
  { rawName: '本田りんか', size: '34歳 T.174 B.87(E) W.61 H.88', image: `${baseUrl}/images/ml_11_1_931.jpg` },
  { rawName: '永峰ゆず', size: '36歳 T.155 B.87(E) W.59 H.89', image: `${baseUrl}/images/ml_11_1_938.jpg` },
  { rawName: '七瀬さき', size: '30歳 T.160 B.84(E) W.59 H.85', image: `${baseUrl}/images/ml_11_1_941.jpg` },
  { rawName: '椎名さえ', size: '41歳 T.157 B.95(H) W.60 H.84', image: `${baseUrl}/images/ml_11_1_947.jpg` },
  { rawName: '小久保のりか', size: '46歳 T.161 B.99(I) W.60 H.89', image: `${baseUrl}/images/ml_11_1_986.jpeg` },
  { rawName: '宇佐美ゆりあ', size: '39歳 T.158 B.90(E) W.58 H.87', image: `${baseUrl}/images/ml_11_1_988.jpg` },
  { rawName: '白石あやの', size: '34歳 T.161 B.89(G) W.60 H.90', image: `${baseUrl}/images/ml_11_1_995.jpg` },
  { rawName: '高塚わかな', size: '40歳 T.160 B.93(H) W.60 H.89', image: `${baseUrl}/images/ml_11_1_1003.jpg` },
  { rawName: '涼風さらさ', size: '39歳 T.153 B.88(G) W.62 H.86', image: `${baseUrl}/images/ml_11_1_1015.jpeg` },
  { rawName: '武田みおり', size: '44歳 T.158 B.86(F) W.60 H.88', image: `${baseUrl}/images/ml_11_1_1018.jpg` },
  { rawName: 'ケリー', size: '40歳 T.162 B.98(H) W.61 H.100', image: `${baseUrl}/images/ml_11_1_1030.jpeg` },
  { rawName: '冬月りゆき', size: '36歳 T.168 B.84(D) W.59 H.86', image: `${baseUrl}/images/ml_11_1_1057.jpeg` },
  { rawName: '大川ゆあ', size: '39歳 T.160 B.88(E) W.61 H.90', image: `${baseUrl}/images/ml_11_1_1189.jpeg` },
  { rawName: '飛田みれい', size: '34歳 T.164 B.100(H) W.65 H.97', image: `${baseUrl}/images/ml_11_1_1391.jpg` },
  { rawName: '森しずく', size: '34歳 T.167 B.92(F) W.60 H.89', image: `${baseUrl}/images/ml_11_1_1427.jpg` },
  { rawName: '泉じゅんこ', size: '40歳 T.153 B.90(E) W.62 H.90', image: `${baseUrl}/images/ml_11_1_1462.jpeg` },
  { rawName: '橋本しおり', size: '36歳 T.156 B.87(F) W.60 H.89', image: `${baseUrl}/images/ml_11_1_935.jpg` },
  { rawName: '一ノ瀬かれん', size: '34歳 T.162 B.92(H) W.61 H.89', image: `${baseUrl}/images/ml_11_1_1768.jpg` },
  { rawName: '神崎れん', size: '44歳 T.163 B.83(D) W.59 H.82', image: `${baseUrl}/images/ml_11_1_1894.jpg` },
  { rawName: '矢部とあ', size: '44歳 T.161 B.85(E) W.59 H.86', image: `${baseUrl}/images/ml_11_1_1936.jpeg` },
  { rawName: '水戸こはる', size: '30歳 T.167 B.90(E) W.65 H.93', image: `${baseUrl}/images/ml_11_1_2122.jpg` },
  { rawName: '乙葉かな', size: '30歳 T.170 B.100(H) W.61 H.96', image: `${baseUrl}/images/ml_11_1_2083.jpeg` },
  { rawName: '平高はるき', size: '33歳 T.163 B.88(G) W.60 H.89', image: `${baseUrl}/images/ml_11_1_2192.jpeg` },
  { rawName: '三浦あおい', size: '40歳 T.150 B.86(D) W.61 H.86', image: `${baseUrl}/images/ml_11_1_2281.jpg` },
  { rawName: '柊じゅり', size: '32歳 T.157 B.82(C) W.58 H.83', image: `${baseUrl}/images/ml_11_1_2398.jpg` },
  { rawName: '羽生くるみ', size: '43歳 T.162 B.88(E) W.61 H.89', image: `${baseUrl}/images/ml_11_1_2429.jpeg` },
  { rawName: '田丸まなみ', size: '34歳 T.152 B.95(H) W.65 H.90', image: `${baseUrl}/images/ml_11_1_2600.jpg` },
  { rawName: '若葉なお', size: '35歳 T.168 B.93(F) W.66 H.90', image: `${baseUrl}/images/ml_11_1_2624.jpg` },
  { rawName: '木下ゆま', size: '35歳 T.148 B.105(I) W.69 H.89', image: `${baseUrl}/images/ml_11_1_2751.jpg` },
  { rawName: '平山ひかる', size: '42歳 T.156 B.88(E) W.59 H.86', image: `${baseUrl}/images/ml_11_1_2754.jpg` },
  { rawName: '落合れい', size: '44歳 T.164 B.84(D) W.60 H.88', image: `${baseUrl}/images/ml_11_1_2802.jpeg` },
  { rawName: '倉本けい', size: '40歳 T.161 B.94(F) W.61 H.88', image: `${baseUrl}/images/ml_11_1_926.jpg` },
  { rawName: '広瀬あまね', size: '52歳 T.150 B.98(G) W.65 H.94', image: `${baseUrl}/images/ml_11_1_2854.jpeg` },
  { rawName: '早見しおり', size: '30歳 T.160 B.84(F) W.59 H.86', image: `${baseUrl}/images/ml_11_1_2860.jpeg` },
  { rawName: '浅間あやみ', size: '30歳 T.164 B.97(G) W.62 H.95', image: `${baseUrl}/images/ml_11_1_2874.jpeg` },
  { rawName: '藤咲りあ', size: '34歳 T.156 B.89(F) W.60 H.89', image: `${baseUrl}/images/ml_11_1_3055.jpg` },
  { rawName: '木村まな', size: '34歳 T.152 B.86(F) W.58 H.88', image: `${baseUrl}/images/ml_11_1_3104.jpg` },
  { rawName: '高見澤りな', size: '49歳 T.155 B.83(C) W.58 H.78', image: `${baseUrl}/images/ml_11_1_3139.jpg` },
  { rawName: '土屋みさと', size: '31歳 T.156 B.88(F) W.58 H.86', image: `${baseUrl}/images/ml_11_1_3154.jpg` },
  { rawName: '榎本いおり', size: '43歳 T.168 B.88(C) W.58 H.89', image: `${baseUrl}/images/ml_11_1_3188.jpg` },
  { rawName: '魚谷りょう', size: '39歳 T.158 B.84(C) W.59 H.86', image: `${baseUrl}/images/ml_11_1_3203.jpeg` },
  { rawName: '菅野すずか', size: '39歳 T.170 B.98(G) W.63 H.93', image: `${baseUrl}/images/ml_11_1_3217.jpeg` },
  { rawName: '百瀬れおな', size: '32歳 T.159 B.84(E) W.59 H.86', image: `${baseUrl}/images/ml_11_1_3287.jpeg` },
  { rawName: '松浦ちさと', size: '50歳 T.156 B.88(D) W.62 H.88', image: `${baseUrl}/images/ml_11_1_1001.jpg` },
  { rawName: '田口ありさ', size: '36歳 T.160 B.95(E) W.65 H.92', image: `${baseUrl}/images/ml_11_1_3304.jpg` },
  { rawName: '遠藤ちひろ', size: '40歳 T.173 B.84(C) W.58 H.86', image: `${baseUrl}/images/ml_11_1_3316.jpeg` },
  { rawName: '清水なつき', size: '35歳 T.161 B.88(F) W.60 H.96', image: `${baseUrl}/images/ml_11_1_934.jpg` },
  { rawName: '高嶺めい', size: '36歳 T.155 B.87(D) W.56 H.88', image: `${baseUrl}/images/ml_11_1_3380.jpeg` },
  { rawName: '徳増ちえ', size: '38歳 T.158 B.88(E) W.59 H.90', image: `${baseUrl}/images/ml_11_1_3401.jpeg` },
  { rawName: '浅谷ひな', size: '32歳 T.157 B.92(H) W.59 H.86', image: `${baseUrl}/images/ml_11_1_3454.jpg` },
  { rawName: '三田まり', size: '44歳 T.166 B.102(J) W.62 H.101', image: `${baseUrl}/images/ml_11_1_3463.jpg` },
  { rawName: '石原なみこ', size: '44歳 T.154 B.84(E) W.60 H.88', image: `${baseUrl}/images/ml_11_1_3470.jpg` },
  { rawName: '星川りの', size: '30歳 T.150 B.82(D) W.58 H.84', image: `${baseUrl}/images/ml_11_1_3479.jpeg` },
  { rawName: '高橋なぎさ', size: '31歳 T.169 B.89(F) W.63 H.90', image: `${baseUrl}/images/ml_11_1_3488.jpg` },
  { rawName: '内山やよい', size: '43歳 T.150 B.87(E) W.60 H.88', image: `${baseUrl}/images/ml_11_1_3491.jpg` },
  { rawName: '松瀬みほ', size: '45歳 T.156 B.90(G) W.63 H.91', image: `${baseUrl}/images/ml_11_1_3494.jpg` },
  { rawName: '橘みらい', size: '30歳 T.160 B.95(G) W.60 H.90', image: `${baseUrl}/images/ml_11_1_3503.jpg` },
  { rawName: '河合ちあき', size: '46歳 T.162 B.89(F) W.62 H.90', image: `${baseUrl}/images/ml_11_1_3518.jpg` },
  { rawName: '黒田かおる', size: '44歳 T.163 B.89(G) W.62 H.90', image: `${baseUrl}/images/ml_11_1_3524.jpg` },
  { rawName: '野山らら', size: '47歳 T.153 B.94(F) W.66 H.94', image: `${baseUrl}/images/ml_11_1_3529.jpg` },
  { rawName: '瀬川ふみか', size: '37歳 T.165 B.95(H) W.63 H.93', image: `${baseUrl}/images/ml_11_1_3532.jpg` },
  { rawName: '時田もな', size: '33歳 T.160 B.87(F) W.60 H.88', image: `${baseUrl}/images/ml_11_1_3535.jpg` },
  { rawName: '餅田ささ', size: '31歳 T.146 B.100(I) W.68 H.98', image: `${baseUrl}/images/ml_11_1_3538.jpg` },
  { rawName: '水谷みゆ', size: '48歳 T.158 B.92(E) W.68 H.95', image: `${baseUrl}/images/ml_11_1_3833.jpg` },
  { rawName: '朝比奈えま', size: '41歳 T.158 B.87(F) W.61 H.89', image: `${baseUrl}/images/ml_11_1_3846.jpg` },
  { rawName: '藤堂あさみ', size: '46歳 T.162 B.86(D) W.60 H.88', image: `${baseUrl}/images/ml_11_1_3842.jpg` },
  { rawName: '末永りな', size: '30歳 T.160 B.85(D) W.59 H.87', image: `${baseUrl}/images/ml_11_1_3856.jpeg` },
  { rawName: '天音ゆい', size: '36歳 T.158 B.84(D) W.58 H.85', image: `${baseUrl}/images/ml_11_1_3858.jpeg` },
  { rawName: '君島しのぶ', size: '38歳 T.149 B.95(E) W.65 H.97', image: `${baseUrl}/images/ml_11_1_3861.jpeg` },
  { rawName: '安室えりか', size: '37歳 T.170 B.87(E) W.60 H.90', image: `${baseUrl}/images/ml_11_1_3862.jpeg` },
  { rawName: '芹野りさ', size: '35歳 T.148 B.81(C) W.57 H.83', image: `${baseUrl}/images/ml_11_1_3867.jpeg` },
  { rawName: '小野寺みどり', size: '45歳 T.157 B.84(E) W.57 H.83', image: `${baseUrl}/images/ml_11_1_3860.jpeg` },
  { rawName: '岩崎ともみ', size: '42歳 T.160 B.90(F) W.62 H.92', image: `${baseUrl}/images/ml_11_1_3864.jpeg` },
  { rawName: '朝霧さく', size: '45歳 T.150 B.83(D) W.59 H.81', image: `${baseUrl}/images/ml_11_1_3873.jpeg` },
  { rawName: '鎌倉せいな', size: '30歳 T.158 B.93(G) W.63 H.97', image: `${baseUrl}/images/ml_11_1_3876.jpeg` },
  { rawName: '結城らく', size: '40歳 T.159 B.98(H) W.61 H.90', image: `${baseUrl}/images/ml_11_1_3877.jpeg` },
  { rawName: '高嶋さとみ', size: '39歳 T.150 B.82(C) W.58 H.84', image: `${baseUrl}/images/ml_11_1_3884.jpeg` },
  { rawName: '朝日いろは', size: '37歳 T.165 B.89(G) W.63 H.91', image: `${baseUrl}/images/ml_11_1_3894.jpeg` },
  { rawName: '松本よしの', size: '38歳 T.157 B.93(G) W.62 H.98', image: `${baseUrl}/images/ml_11_1_3898.jpeg` },
  { rawName: '八代ゆな', size: '39歳 T.163 B.92(H) W.58 H.90', image: `${baseUrl}/images/ml_11_1_3905.jpeg` },
  { rawName: '風間りつ', size: '41歳 T.163 B.86(E) W.60 H.88', image: `${baseUrl}/images/ml_11_1_3923.jpeg` },
  { rawName: '観月かほ', size: '41歳 T.157 B.92(F) W.63 H.93', image: `${baseUrl}/images/ml_11_1_3926.jpeg` },
  { rawName: '綾瀬ひより', size: '30歳 T.157 B.88(F) W.62 H.89', image: `${baseUrl}/images/ml_11_1_3943.jpeg` },
  { rawName: '小野りおな', size: '30歳 T.150 B.95(G) W.64 H.96', image: `${baseUrl}/images/ml_11_1_3859.jpeg` },
  { rawName: '如月みお', size: '35歳 T.160 B.94(G) W.61 H.90', image: `${baseUrl}/images/ml_11_1_3940.jpeg` },
  { rawName: '西条るな', size: '47歳 T.164 B.92(G) W.63 H.93', image: `${baseUrl}/images/ml_11_1_3945.jpeg` },
  { rawName: '関野りお', size: '38歳 T.156 B.86(E) W.60 H.88', image: `${baseUrl}/images/ml_11_1_3958.jpeg` },
  { rawName: '小池ありさ', size: '32歳 T.168 B.90(H) W.63 H.91', image: `${baseUrl}/images/ml_11_1_3960.jpeg` },
  { rawName: '若狭まほ', size: '34歳 T.151 B.84(F) W.58 H.83', image: `${baseUrl}/images/ml_11_1_3962.jpeg` },
  { rawName: '斉藤なのか', size: '33歳 T.145 B.98(H) W.65 H.99', image: `${baseUrl}/images/ml_11_1_3975.jpeg` },
  { rawName: '春日りょうこ', size: '35歳 T.163 B.92(F) W.59 H.90', image: `${baseUrl}/images/ml_11_1_3982.jpeg` },
  { rawName: '白咲ねね', size: '37歳 T.158 B.88(F) W.62 H.89', image: `${baseUrl}/images/ml_11_1_3984.jpeg` },
  { rawName: '真白りん', size: '33歳 T.156 B.83(D) W.58 H.85', image: `${baseUrl}/images/ml_11_1_4018.jpeg` },
  { rawName: '白戸れみ', size: '39歳 T.163 B.95(E) W.63 H.96', image: `${baseUrl}/images/ml_11_1_4009.jpeg` },
  { rawName: '大橋りょう', size: '36歳 T.163 B.84(D) W.60 H.89', image: `${baseUrl}/images/ml_11_1_4013.jpeg` },
  { rawName: '中川つかさ', size: '36歳 T.160 B.85(E) W.60 H.88', image: `${baseUrl}/images/ml_11_1_4015.jpeg` },
  { rawName: '黒羽ゆり', size: '35歳 T.158 B.85(D) W.59 H.83', image: `${baseUrl}/images/ml_11_1_2437.jpeg` },
  { rawName: '桐島さら', size: '40歳 T.160 B.86(F) W.58 H.80', image: `${baseUrl}/images/ml_11_1_4021.jpeg` },
  { rawName: '花野井みわ', size: '39歳 T.158 B.88(D) W.62 H.86', image: `${baseUrl}/images/ml_11_1_4024.jpg` },
  { rawName: '品川ほなみ', size: '33歳 T.153 B.98(I) W.65 H.99', image: `${baseUrl}/images/ml_11_1_4026.jpeg` },
  { rawName: '南條つむぎ', size: '30歳 T.146 B.94(G) W.64 H.90', image: `${baseUrl}/images/ml_11_1_4029.jpeg` },
  { rawName: '村上ことね', size: '44歳 T.163 B.88(F) W.62 H.89', image: `${baseUrl}/images/ml_11_1_4039.jpeg` }
];

async function main() {
  console.log(`🚀 ${CONFIG.shopName}：ステップ① データ登録（最終完全版 全71名）を開始します...\n`);
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
      console.log(`✅ 既存の「ar Tokyo」枠に全71名のデータを上書き・補充します。`);
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

    console.log('\n🎉 ar Tokyo(アールトウキョウ秋葉原)のデータ登録が完全に完了しました！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
