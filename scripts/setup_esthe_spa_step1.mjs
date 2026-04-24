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
  searchKeyword: '%Esthe Spa%',
  searchKeyword2: '%エステスパ%',
  fallbackAreaId: 'tokyo_shinagawa_meguro', // 目黒エリア
  shopName: 'Esthe Spa (エステスパ)',
  scheduleUrl: 'https://meguro-e.com/schedule.php',
  // 画像から抽出した料金システム
  priceSystem: '【19:00まで】\n70分 12,000円\n90分 15,000円\n120分 20,000円\n150分 25,000円\n180分 30,000円\n\n【19:00以降】\n70分 13,000円\n90分 16,000円\n120分 21,000円\n150分 26,000円\n180分 31,000円'
};

// HTMLから抽出したキャストデータ（全20名）
const therapistsRaw = [
  { rawName: '美沢まりな', size: '24歳 / 165cm / F', tags: ['スレンダー', 'ご奉仕タイプ', '店長おすすめ', 'リピート率高'], image: 'https://meguro-e.com/images_staff/189/04101712296.jpg' },
  { rawName: '三浦らら', size: '20歳 / 154cm / E', tags: ['スレンダー', '萌え系', '可愛い系', '小柄'], image: 'https://meguro-e.com/images_staff/190/101522584443.jpg' },
  { rawName: '南るい', size: '26歳 / 166cm / F', tags: ['スレンダー', '美人系', 'モデル級', 'バスト⤴'], image: 'https://meguro-e.com/images_staff/186/030214205498.jpg' },
  { rawName: '芹澤 みく', size: '25歳 / 155cm / E', tags: ['スレンダー', 'モデル級', '激推し', 'リピート率高'], image: 'https://meguro-e.com/images_staff/216/062312584864.jpg' },
  { rawName: '神楽 みらい', size: '24歳 / 152cm / G', tags: ['アイドル系', '小柄', 'バスト⤴', '激推し'], image: 'https://meguro-e.com/images_staff/228/042002573591.jpg' },
  { rawName: '本城 なな', size: '28歳 / 158cm / F', tags: ['スレンダー', 'テクニシャン', 'お客様満足度◎', '依存注意'], image: 'https://meguro-e.com/images_staff/212/033123222253.jpg' },
  { rawName: '岡咲 りか', size: '28歳 / 154cm / C', tags: ['スレンダー', 'アイドル系', '可愛い系', '小柄'], image: 'https://meguro-e.com/images_staff/134/040112033169.JPG' },
  { rawName: '一ノ瀬ことみ', size: '26歳 / 152cm / E', tags: ['小柄', '激推し', 'リピート率高', '依存注意'], image: 'https://meguro-e.com/images_staff/185/120118540936.jpg' },
  { rawName: '今野さくら', size: '27歳 / 153cm / E', tags: ['経験豊富', '癒し系', '可愛い系', '依存注意'], image: 'https://meguro-e.com/images_staff/231/030401095814.jpg' },
  { rawName: '白石 りお', size: '25歳 / 152cm / F', tags: ['テクニシャン', 'アイドル系', '小柄', 'リピート率高'], image: 'https://meguro-e.com/images_staff/210/031923495356.jpg' },
  { rawName: '麻乃うみ', size: '28歳 / 153cm / D', tags: ['スレンダー', '美人系', '小柄', 'リピート率高'], image: 'https://meguro-e.com/images_staff/164/101823043733.jpg' },
  { rawName: '成宮れい', size: '25歳 / 155cm / D', tags: ['スレンダー', '美人系', '小柄', '激推し'], image: 'https://meguro-e.com/images_staff/232/020713200143.jpg' },
  { rawName: '愛原るい', size: '27歳 / 161cm / D', tags: ['テクニシャン', '美人系', 'モデル級', '店長おすすめ'], image: 'https://meguro-e.com/images_staff/229/011023165479.jpg' },
  { rawName: '雪村まいか', size: '27歳 / 153cm / E', tags: ['テクニシャン', '美人系', '小柄', 'リピート率高'], image: 'https://meguro-e.com/images_staff/225/10200156406.jpg' },
  { rawName: '桃野あおい', size: '21歳 / 160cm / G', tags: ['グラマー', '癒し系', '可愛い系', 'お客様満足度◎'], image: 'https://meguro-e.com/images_staff/227/010613154073.jpg' },
  { rawName: '北原みずき', size: '25歳 / 150cm / E', tags: ['フレンドリー', '癒し系', '可愛い系', '小柄'], image: 'https://meguro-e.com/images_staff/182/022111350684.jpg' },
  { rawName: '日向ゆうか', size: '27歳 / 163cm / H', tags: ['グラマー', 'ご奉仕タイプ', 'バスト⤴', '店長おすすめ'], image: 'https://meguro-e.com/images_staff/243/041801353026.jpg' },
  { rawName: '綾波りこ', size: '24歳 / 162cm / G', tags: ['グラマー', 'ご奉仕タイプ', '萌え系', '店長おすすめ'], image: 'https://meguro-e.com/images_staff/240/031820542011.jpg' },
  { rawName: '吉川さつき', size: '27歳 / 162cm / D', tags: ['スレンダー', 'ご奉仕タイプ', '清楚系', '店長おすすめ'], image: 'https://meguro-e.com/images_staff/233/013115534996.jpg' },
  { rawName: '有村りさ', size: '26歳 / 167cm / E', tags: ['長身', 'モデル級', 'リピート率高', 'お客様満足度◎'], image: 'https://meguro-e.com/images_staff/217/121322012697.jpg' },
  { rawName: '胡蝶くれは', size: '24歳 / 148cm / E', tags: ['スレンダー', 'テクニシャン', '可愛い系', 'お客様満足度◎'], image: 'https://meguro-e.com/images_staff/237/022519481983.jpg' },
  { rawName: '森川いと', size: '25歳 / 155cm / D', tags: ['アイドル系', '可愛い系', '小柄', 'お客様満足度◎'], image: 'https://meguro-e.com/images_staff/236/021013494017.jpg' },
  { rawName: '深見あみ', size: '27歳 / 168cm / D', tags: ['穏やか', '癒し系', '長身', 'リピート率高'], image: 'https://meguro-e.com/images_staff/193/112513032990.jpg' },
  { rawName: '青山りか', size: '27歳 / 155cm / D', tags: ['経験豊富', 'ベテラン', 'スレンダー', 'ご奉仕タイプ'], image: 'https://meguro-e.com/images_staff/191/062915230526.jpg' },
  { rawName: '飛鳥らん', size: '22歳 / 152cm / D', tags: ['フレンドリー', 'アイドル系', '小柄', 'リピート率高'], image: 'https://meguro-e.com/images_staff/166/091714021385.jpg' },
  { rawName: '水瀬 まり', size: '25歳 / 156cm / D', tags: ['スレンダー', 'フレンドリー', '店長おすすめ', 'お客様満足度◎'], image: 'https://meguro-e.com/images_staff/209/012623492755.jpg' },
  { rawName: '乙葉もも', size: '30歳 / 165cm / E', tags: ['経験豊富', 'スレンダー', '清楚系', '美人系'], image: 'https://meguro-e.com/images_staff/213/102816015589.jpg' },
  { rawName: '松村みのり', size: '28歳 / 161cm / G', tags: ['グラマー', '優しい', 'バスト⤴', '激推し'], image: 'https://meguro-e.com/images_staff/221/081014364185.jpg' },
  { rawName: '天使 ゆゆ', size: '22歳 / 160cm / E', tags: ['スレンダー', 'お嬢様系', 'モデル級', 'リピート率高'], image: 'https://meguro-e.com/images_staff/155/10170046494.jpg' },
  { rawName: '月島ほたる', size: '25歳 / 153cm / E', tags: ['ご奉仕タイプ', 'アイドル系', '小柄', '店長おすすめ'], image: 'https://meguro-e.com/images_staff/198/033117003099.jpg' },
  { rawName: '榛名 あさみ', size: '29歳 / 162cm / D', tags: ['フレンドリー', 'ご奉仕タイプ', 'スタッフおすすめ', 'リピート率高'], image: 'https://meguro-e.com/images_staff/137/111520271338.JPG' },
  { rawName: '七瀬 りお', size: '24歳 / 152cm / F', tags: ['アイドル系', '小柄', 'バスト⤴', 'プレミアム'], image: 'https://meguro-e.com/images_staff/69/061917022398.jpg' },
  { rawName: '神崎まみ', size: '30歳 / 153cm / D', tags: ['経験豊富', '優しい', 'テクニシャン', 'ご奉仕タイプ'], image: 'https://meguro-e.com/images_staff/222/101415185418.jpg' },
  { rawName: '藤田えみ', size: '24歳 / 156cm / E', tags: ['スレンダー', 'フレンドリー', 'バスト⤴', '店長おすすめ'], image: 'https://meguro-e.com/images_staff/204/04111307143.jpg' },
  { rawName: '和泉 おと', size: '22歳 / 155cm / E', tags: ['優しい', 'テクニシャン', '萌え系', '癒し系'], image: 'https://meguro-e.com/images_staff/77/082413150581.jpg' },
  { rawName: '七海あおい', size: '30歳 / 164cm / E', tags: ['優しい', '癒し系', '清楚系', 'モデル級'], image: 'https://meguro-e.com/images_staff/199/071004524185.jpg' },
  { rawName: '百瀬ゆま', size: '30歳 / 152cm / F', tags: ['テクニシャン', '癒し系', 'お姉様系', '小柄'], image: 'https://meguro-e.com/images_staff/192/05101347229.jpg' },
  { rawName: '佐藤 あすか', size: '20歳 / 158cm / C', tags: ['スレンダー', '優しい', '癒し系', '清楚系'], image: 'https://meguro-e.com/images_staff/79/020920052886.jpg' },
  { rawName: '綾瀬 かのん', size: '23歳 / 152cm / F', tags: [], image: 'https://meguro-e.com/images_staff/126/021906180078.jpeg' },
  { rawName: '高梨 みゆ', size: '29歳 / 163cm / E', tags: [], image: 'https://meguro-e.com/images_staff/140/042820355123.JPG' },
  { rawName: '加藤 まなか', size: '23歳 / 153cm / C', tags: [], image: 'https://meguro-e.com/images_staff/124/081118500160.jpg' },
  { rawName: '一条 まれ', size: '28歳 / 160cm / E', tags: [], image: 'https://meguro-e.com/images_staff/135/040119504527.JPG' },
  { rawName: '結城 あい', size: '26歳 / 156cm / E', tags: [], image: 'https://meguro-e.com/images_staff/156/111617050984.jpg' },
  { rawName: '蘭華 かな', size: '30歳 / 162cm / F', tags: [], image: 'no_image' } // 後で除外
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
      console.log(`✅ 既存の「エステスパ」枠を発見しました。データを上書きします。`);
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
      const isNoImg = t.image.includes('no_image');
      
      return {
        id: `${targetId}_${clean}`,
        shop_id: targetId,
        name: clean,
        image_url: isNoImg ? null : t.image.trim(),
        is_active: true,
        last_seen_at: now,
        raw_data: { 
          tags: t.tags, 
          size: t.size,
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

    console.log('\n🎉 Esthe Spa (エステスパ)のデータ登録が完全に完了しました！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
