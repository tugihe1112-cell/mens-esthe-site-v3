import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // 「新人」、全角半角スペース、カッコ（ふりがな）を削除
  return rawName.replace(/新人/g, '').replace(/（.*?）|\(.*?\)/g, '').replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%ロンド%',
  searchKeyword2: '%下弦の月%',
  fallbackAreaId: 'tokyo_chuo_ginza', // 銀座エリア
  shopName: 'ロンド 旧下弦の月 (銀座店)',
  scheduleUrl: 'https://ginza-kiwami.com/schedule.php',
  // 画像から抽出した料金システム
  priceSystem: '【通常コース】\n90分 19,000円\n120分 23,000円\n150分 27,000円'
};

// HTMLから抽出したキャストデータ（全26名）
const therapistsRaw = [
  { rawName: '新人　要（かなめ）', size: '41歳 T152 B85/D W58 H82', image: 'https://ginza-kiwami.com/images_staff/27485/041519102656.jpg' },
  { rawName: '新人　響（ひびき）', size: '39歳 T156 B86/D W57 H80', image: 'https://ginza-kiwami.com/images_staff/27484/041423114147.jpg' },
  { rawName: '新人　凉（りょう）', size: '38歳 T162 B88/G W60 H88', image: 'https://ginza-kiwami.com/images_staff/27483/04101718171.jpeg' },
  { rawName: '新人　渚（なぎさ）', size: '31歳 T163 B99/G W60 H98', image: 'https://ginza-kiwami.com/images_staff/27482/040514285860.jpg' },
  { rawName: '新人　陸（りく）', size: '33歳 T156 B84/D W57 H82', image: 'https://ginza-kiwami.com/images_staff/27481/033109302171.jpg' },
  { rawName: '桜（さくら）', size: '39歳 T162 B88/F W58 H85', image: 'https://ginza-kiwami.com/images_staff/27479/031800274780.jpg' },
  { rawName: '芹（せり）', size: '25歳 T164 B85/E W57 H80', image: 'https://ginza-kiwami.com/images_staff/27478/030318293652.jpg' },
  { rawName: '桃（もも）', size: '25歳 T163 B87/F W58 H87', image: 'https://ginza-kiwami.com/images_staff/27477/03040051357.jpg' },
  { rawName: '栞（しおり）', size: '34歳 T164 B87/E W57 H84', image: 'https://ginza-kiwami.com/images_staff/27476/022809392155.jpg' },
  { rawName: '楽（がく）', size: '38歳 T158 B86/E W59 H85', image: 'https://ginza-kiwami.com/images_staff/27475/041001011314.jpg' },
  { rawName: '唯（ゆい）', size: '39歳 T158 B91/G W60 H85', image: 'https://ginza-kiwami.com/images_staff/27474/021722390289.jpg' },
  { rawName: '灯（あかり）', size: '34歳 T158 B88/C W59 H85', image: 'https://ginza-kiwami.com/images_staff/27473/020711210079.jpg' },
  { rawName: '梓（あずさ）', size: '33歳 T153 B89/F W59 H87', image: 'https://ginza-kiwami.com/images_staff/27470/031023380444.jpg' },
  { rawName: '雪（ゆき）', size: '40歳 T162 B89/E W59 H88', image: 'https://ginza-kiwami.com/images_staff/27463/011216341634.jpg' },
  { rawName: '愛（あい）', size: '32歳 T165 B88/E W56 H85', image: 'https://ginza-kiwami.com/images_staff/27462/111820415279.jpg' },
  { rawName: '尚（なお）', size: '42歳 T161 B88/G W58 H88', image: 'https://ginza-kiwami.com/images_staff/27461/032011150850.jpeg' },
  { rawName: '紗（すず）', size: '34歳 T160 B85/E W58 H84', image: 'https://ginza-kiwami.com/images_staff/27458/111120261250.jpg' },
  { rawName: '密（みつ）', size: '42歳 T163 B86/E W59 H84', image: 'https://ginza-kiwami.com/images_staff/27457/111120421228.jpg' },
  { rawName: '汐（しお）', size: '26歳 T160 B88/F W56 H87', image: 'https://ginza-kiwami.com/images_staff/27456/022809340845.jpg' },
  { rawName: '雅（みやび）', size: '35歳 T161 B88/G W58 H87', image: 'https://ginza-kiwami.com/images_staff/27460/111820174971.jpg' },
  { rawName: '虹（にじ）', size: '39歳 T158 B88/F W59 H86', image: 'https://ginza-kiwami.com/images_staff/27455/112700584878.jpeg' },
  { rawName: '翼（つばき）', size: '38歳 T151 B85/D W57 H85', image: 'https://ginza-kiwami.com/images_staff/27453/100922300098.jpg' },
  { rawName: '仲（なか）', size: '39歳 T163 B83/C W57 H84', image: 'https://ginza-kiwami.com/images_staff/27452/12022027301.jpeg' },
  { rawName: '廉（れん）', size: '40歳 T162 B88/F W57 H87', image: 'https://ginza-kiwami.com/images_staff/27450/091716240898.jpeg' },
  { rawName: '寧（ねい）', size: '35歳 T159 B86/E W60 H85', image: 'https://ginza-kiwami.com/images_staff/27448/112714200623.jpeg' },
  { rawName: '雫（しずく）', size: '33歳 T171 B86/D W58 H85', image: 'https://ginza-kiwami.com/images_staff/27447/090915074468.jpg' },
  { rawName: '咲（さき）', size: '38歳 T160 B85/E W58 H88', image: 'https://ginza-kiwami.com/images_staff/27446/091716354489.jpeg' },
  { rawName: '宙（そら）', size: '32歳 T150 B86/E W57 H85', image: 'https://ginza-kiwami.com/images_staff/27449/091411275147.jpg' },
  { rawName: '南（みなみ）', size: '31歳 T171 B89/E W57 H88', image: 'https://ginza-kiwami.com/images_staff/27440/032118114049.jpg' },
  { rawName: '潤（じゅん）', size: '44歳 T158 B89/F W59 H89', image: 'https://ginza-kiwami.com/images_staff/27434/08111350201.jpg' },
  { rawName: '檀（だん）', size: '38歳 T169 B98/G W60 H90', image: 'https://ginza-kiwami.com/images_staff/27432/030112182842.jpeg' },
  { rawName: '怜（れい）', size: '31歳 T156 B87/E W57 H87', image: 'https://ginza-kiwami.com/images_staff/27431/040210092538.jpeg' },
  { rawName: '湊（みなと）', size: '36歳 T156 B84/D W56 H85', image: 'https://ginza-kiwami.com/images_staff/27426/101913104112.jpg' },
  { rawName: '聖（せい）', size: '40歳 T161 B89/G W60 H90', image: 'https://ginza-kiwami.com/images_staff/27425/110219284823.jpg' },
  { rawName: '暖（のん）', size: '41歳 T151 B86/E W58 H87', image: 'https://ginza-kiwami.com/images_staff/27424/030311363182.jpeg' },
  { rawName: '秋（あき）', size: '42歳 T150 B88/E W58 H88', image: 'https://ginza-kiwami.com/images_staff/27423/012310245218.jpeg' },
  { rawName: '蛍（ほたる）', size: '37歳 T160 B88/E W58 H85', image: 'https://ginza-kiwami.com/images_staff/27438/032922452664.jpg' },
  { rawName: '月（つき）', size: '42歳 T160 B88/E W60 H88', image: 'https://ginza-kiwami.com/images_staff/27315/1fcfb9f62a051795a34a658f42f81f89.jpeg' },
  { rawName: '翠（すい）', size: '26歳 B84/F W57 H85', image: 'https://ginza-kiwami.com/images_staff/27262/101810084025.jpg' },
  { rawName: '艶（えん）', size: '43歳 T158 B87/D W60 H87', image: 'https://ginza-kiwami.com/images_staff/27433/011814180425.jpg' },
  { rawName: '葵（あおい）', size: '36歳 T158 B84/D W56 H84', image: 'https://ginza-kiwami.com/images_staff/27418/09191225183.jpg' },
  { rawName: '遥（はるか）', size: '29歳 B86/E W61 H88', image: 'https://ginza-kiwami.com/images_staff/17150/c05a328cf67cb2efbf83ddaf40fa0c97.jpeg' },
  { rawName: '舞（まい）', size: '36歳 T155 B87/E W56 H86', image: 'https://ginza-kiwami.com/images_staff/27244/051912255637.jpeg' },
  { rawName: '音（おと）', size: '38歳 T164 B88/E W57 H86', image: 'https://ginza-kiwami.com/images_staff/27109/030214100693.jpg' },
  { rawName: '菫（すみれ）', size: '36歳 T160 B96/H W60 H88', image: 'https://ginza-kiwami.com/images_staff/27014/030312085164.jpeg' },
  { rawName: '樹（いつき）', size: '37歳 B90/F W58 H86', image: 'https://ginza-kiwami.com/images_staff/26652/030312015824.jpeg' },
  { rawName: '睦（むつみ）', size: '38歳 T156 B87/D W56 H86', image: 'https://ginza-kiwami.com/images_staff/26616/092500540618.jpg' },
  { rawName: '希（のぞみ）', size: '36歳 B84/D W60 H85', image: 'https://ginza-kiwami.com/images_staff/27421/122901034113.jpg' },
  { rawName: '椿（つばき）', size: '38歳 T152 B88/G W60 H86', image: 'https://ginza-kiwami.com/images_staff/26482/111510381746.jpeg' },
  { rawName: '七（なな）', size: '42歳 T165 B85/D W56 H84', image: 'https://ginza-kiwami.com/images_staff/26183/05062124257.jpeg' },
  { rawName: '巴（ともえ）', size: '48歳 T158 B87/E W58 H86', image: 'https://ginza-kiwami.com/images_staff/25351/121913381399.jpeg' },
  { rawName: '夢（ゆめ）', size: '35歳 T165 B88/E W60 H87', image: 'https://ginza-kiwami.com/images_staff/25328/032511511958.jpeg' },
  { rawName: '律（りつ）', size: '40歳 T158 B89/F W57 H88', image: 'https://ginza-kiwami.com/images_staff/25163/4429004c89268382891793dfc1e500f8.jpeg' },
  { rawName: '璃（るり）', size: '38歳 T169 B87/E W58 H88', image: 'https://ginza-kiwami.com/images_staff/25066/121809370521.jpg' },
  { rawName: '光（ひかり）', size: '35歳 T170 B87/D W58 H88', image: 'https://ginza-kiwami.com/images_staff/25006/1fb5036952b60723a5289ec1426316eb.jpg' },
  { rawName: '茜（あかね）', size: '40歳 T159 B90/G W60 H88', image: 'https://ginza-kiwami.com/images_staff/24824/103018271771.jpg' },
  { rawName: '紅（べに）', size: '44歳 B87/D W58 H88', image: 'https://ginza-kiwami.com/images_staff/24366/122901045964.jpg' },
  { rawName: 'あお', size: '29歳 T165 B84/C W55 H83', image: 'https://ginza-kiwami.com/images_staff/23716/020308474624.jpeg' },
  { rawName: '霞（かすみ）', size: '39歳 T159 B86/D W57 H85', image: 'https://ginza-kiwami.com/images_staff/23165/011715332323.jpg' },
  { rawName: '夏（なつ）', size: '28歳 T160 B85/D W56 H84', image: 'https://ginza-kiwami.com/images_staff/23441/45fdca61a2efbea0b9ce91bdfd5630b6.jpeg' },
  { rawName: '華（はな）', size: '39歳 T155 B86/C W56 H85', image: 'https://ginza-kiwami.com/images_staff/22957/031115005478.jpeg' },
  { rawName: '蘭（らん）', size: '44歳 T157 B86/D W58 H86', image: 'https://ginza-kiwami.com/images_staff/22956/110313181345.jpeg' },
  { rawName: 'そう', size: '37歳 T152 B86/D W58 H83', image: 'https://ginza-kiwami.com/images_staff/22243/030312201949.jpeg' },
  { rawName: '恵（めぐ）', size: '37歳 T164 B85/D W60 H84', image: 'https://ginza-kiwami.com/images_staff/20017/546586716ff6994046691ced8ab1935c.jpeg' },
  { rawName: '歩（あゆみ）', size: '37歳 T168 B87/E W58 H87', image: 'https://ginza-kiwami.com/images_staff/19236/110313122250.jpeg' },
  { rawName: '叶（かなえ）', size: '35歳 T158 B87/E W57 H88', image: 'https://ginza-kiwami.com/images_staff/19837/040500193885.jpg' },
  { rawName: '杏（あん）', size: '38歳 B87/ W60 H88', image: 'https://ginza-kiwami.com/images_staff/18287/091414114790.jpg' },
  { rawName: '綾（あや）', size: '38歳 T165 B91/G W58 H90', image: 'https://ginza-kiwami.com/images_staff/17146/030312334614.jpeg' },
  { rawName: '香（かおり）', size: '39歳 T162 B95/G W60 H95', image: 'https://ginza-kiwami.com/images_staff/17148/091414100215.jpg' },
  { rawName: '凛（りん）', size: '36歳 T155 B90/F W59 H86', image: 'https://ginza-kiwami.com/images_staff/17142/ea460fc7e76ca8eca4fd9024fc1a45c0.jpeg' },
  { rawName: '心（こころ）', size: '50歳 T166 B88/D W60 H84', image: 'https://ginza-kiwami.com/images_staff/23922/030312244127.jpeg' }
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
      console.log(`✅ 既存の「ロンド 旧下弦の月」枠を発見しました。全${therapistsRaw.length}名のデータを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、銀座エリアで新規IDを発行して登録します。`);
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

    console.log('\n🎉 ロンド 旧下弦の月(銀座店)のデータ登録が完全に完了しました！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
