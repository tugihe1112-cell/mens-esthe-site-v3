import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  return rawName.replace(/\(.*?\)|（.*?）/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%Eternal%', 
  searchKeyword2: '%エターナル%',
  areaId: 'tokyo_toshima_ikebukuro', // 池袋エリア
  shopName: 'Eternal (エターナル)',
  scheduleUrl: 'https://aroma-eternal.net/schedule.php',
  // 抽出した料金システム
  priceSystem: 'お試しコース 60min ￥10,000\nスタンダート 90min ￥14,000\nロング 120min ￥18,000\nVIP 150min ￥22,000'
};

// HTMLから抽出したキャストデータ（54名分）
const therapistsRaw = [
  { rawName: '芹沢 えりか', size: '25歳 161cm Ecup', image: 'https://aroma-eternal.net/thumb/20260411113034_1_1_smoll.jpg' },
  { rawName: '栗原 こなつ', size: '26歳 150cm Fcup', image: 'https://aroma-eternal.net/thumb/20260409202010_1_1_smoll.jpg' },
  { rawName: '水嶋 さき', size: '26歳 158cm Ecup', image: 'https://aroma-eternal.net/thumb/20260408124148_1_1_smoll.jpg' },
  { rawName: '小野寺 かな', size: '25歳 153cm Dcup', image: 'https://aroma-eternal.net/thumb/20260401130556_1_1_smoll.jpg' },
  { rawName: '雪乃 ひな', size: '28歳 157cm', image: 'https://aroma-eternal.net/thumb/20260317122206_1_1_smoll.jpg' },
  { rawName: '神居 まりな', size: '26歳 161cm Ccup', image: 'https://aroma-eternal.net/thumb/20260303214349_1_1_smoll.jpg' },
  { rawName: '小川 もえ', size: '23歳 152cm Ccup', image: 'https://aroma-eternal.net/thumb/20260225150938_1_1_smoll.jpg' },
  { rawName: '藤田 つむぎ', size: '23歳 154cm Dcup', image: 'https://aroma-eternal.net/thumb/20260215160105_1_1_smoll.jpg' },
  { rawName: '涼宮 りり', size: '21歳 160cm Dcup', image: 'https://aroma-eternal.net/thumb/20260209132942_1_1_smoll.jpg' },
  { rawName: '音倉 しずく', size: '22歳 160cm Ccup', image: 'https://aroma-eternal.net/thumb/20260126231147_1_1_smoll.jpg' },
  { rawName: '漆原 はな', size: '23歳 153cm Dcup', image: 'https://aroma-eternal.net/thumb/20251228110643_1_1_smoll.jpg' },
  { rawName: '水瀬 ありさ', size: '26歳 156cm Fcup', image: 'https://aroma-eternal.net/thumb/20251205175120_1_1_smoll.jpg' },
  { rawName: '有村 あめ', size: '22歳 163cm Ecup', image: 'https://aroma-eternal.net/thumb/20251125180333_1_1_smoll.jpg' },
  { rawName: '夏目 のどか', size: '25歳 164cm Fcup', image: 'https://aroma-eternal.net/thumb/20260108123850_1_1_smoll.jpg' },
  { rawName: '杜野 ゆいか', size: '27歳 158cm Ccup', image: 'https://aroma-eternal.net/thumb/20251117081910_1_1_smoll.jpg' },
  { rawName: '冬村 ねね', size: '22歳 151cm Ccup', image: 'https://aroma-eternal.net/thumb/20251116113634_1_1_smoll.jpg' },
  { rawName: '白川 みさと', size: '25歳 155cm Fcup', image: 'https://aroma-eternal.net/thumb/20251023132421_1_1_smoll.jpg' },
  { rawName: '一ノ瀬 のあ', size: '27歳 169cm Ccup', image: 'https://aroma-eternal.net/thumb/20251020213723_1_1_smoll.jpg' },
  { rawName: '指原 まゆ', size: '23歳 160cm Ccup', image: 'https://aroma-eternal.net/thumb/20251008154021_1_1_smoll.jpg' },
  { rawName: '速水 あゆみ', size: '27歳 158cm Ccup', image: 'https://aroma-eternal.net/thumb/20251004111610_1_1_smoll.jpg' },
  { rawName: '百瀬 みう', size: '26歳 164cm Ccup', image: 'https://aroma-eternal.net/thumb/20251003135129_1_1_smoll.jpg' },
  { rawName: '華井 かなの', size: '24歳 160cm Gcup', image: 'https://aroma-eternal.net/thumb/20260418214627_1_1_smoll.jpg' },
  { rawName: '長尾 ほのか', size: '26歳 160cm Dcup', image: 'https://aroma-eternal.net/thumb/20250828162908_1_1_smoll.jpg' },
  { rawName: '音梨 くるみ', size: '22歳 151cm Ecup', image: 'https://aroma-eternal.net/thumb/20250926213529_1_1_smoll.jpg' },
  { rawName: '木村 みり', size: '25歳 158cm Dcup', image: 'https://aroma-eternal.net/thumb/20250903215939_1_1_smoll.jpg' },
  { rawName: '柏木 まな', size: '27歳 160cm Ecup', image: 'https://aroma-eternal.net/thumb/20250807130912_1_1_smoll.jpg' },
  { rawName: '松村 かおり', size: '27歳 163cm Ecup', image: 'https://aroma-eternal.net/thumb/20250721221808_1_1_smoll.jpg' },
  { rawName: '橋本 みさき', size: '27歳 160cm Ccup', image: 'https://aroma-eternal.net/thumb/20250708015122_1_1_smoll.jpg' },
  { rawName: '霧島 れん', size: '26歳 169cm Ccup', image: 'https://aroma-eternal.net/thumb/20250510112612_1_1_smoll.jpg' },
  { rawName: '三橋 こころ', size: '26歳 155cm Dcup', image: 'https://aroma-eternal.net/thumb/20250416122154_1_1_smoll.jpg' },
  { rawName: '山内 あいな', size: '19歳 158cm Dcup', image: 'https://aroma-eternal.net/thumb/20250318135103_1_1_smoll.jpg' },
  { rawName: '久世 みこと', size: '25歳 158cm Fcup', image: 'https://aroma-eternal.net/thumb/20250210113644_1_1_smoll.jpg' },
  { rawName: '真鍋 あかり', size: '24歳 158cm Ccup', image: 'https://aroma-eternal.net/thumb/20250127080200_1_1_smoll.jpg' },
  { rawName: '吉沢 のあ', size: '19歳 155cm Fcup', image: 'https://aroma-eternal.net/thumb/20241128130131_1_1_smoll.jpg' },
  { rawName: '卯月 のん', size: '25歳 145cm Ccup', image: 'https://aroma-eternal.net/thumb/20241120142842_1_1_smoll.jpg' },
  { rawName: '大石 りさ', size: '28歳 163cm Ccup', image: 'https://aroma-eternal.net/thumb/20250416173401_1_1_smoll.jpg' },
  { rawName: '七尾 れい', size: '28歳 170cm Ecup', image: 'https://aroma-eternal.net/thumb/20241030140429_1_1_smoll.jpg' },
  { rawName: '鳴海 はる', size: '26歳 168cm Bcup', image: 'https://aroma-eternal.net/thumb/20241021111432_1_1_smoll.jpg' },
  { rawName: '生田 りょうか', size: '19歳 158cm Gcup', image: 'https://aroma-eternal.net/thumb/20241018102812_1_1_smoll.jpg' },
  { rawName: '向井 なつき', size: '26歳 163cm Dcup', image: 'https://aroma-eternal.net/thumb/20241020120640_1_1_smoll.jpg' },
  { rawName: '七海 るい', size: '24歳 157cm Ccup', image: 'https://aroma-eternal.net/thumb/20241005094424_1_1_smoll.jpg' },
  { rawName: '佐久間 りえ', size: '26歳 162cm Fcup', image: 'https://aroma-eternal.net/thumb/20241003110626_1_1_smoll.jpg' },
  { rawName: '伊藤 ゆき', size: '24歳 161cm Fcup', image: 'https://aroma-eternal.net/thumb/20241002151713_1_1_smoll.jpg' },
  { rawName: '伊吹 しあ', size: '24歳 160cm Dcup', image: 'https://aroma-eternal.net/thumb/20240908153800_1_1_smoll.jpg' },
  { rawName: '沢田 りいさ', size: '25歳 165cm Bcup', image: 'https://aroma-eternal.net/thumb/20241215175110_1_1_smoll.jpg' },
  { rawName: '藤野 あいか', size: '28歳 171cm Ccup', image: 'https://aroma-eternal.net/thumb/20240828185721_1_1_smoll.jpg' },
  { rawName: '石川 せりな', size: '21歳 151cm Dcup', image: 'https://aroma-eternal.net/thumb/20240729131704_1_1_smoll.jpg' },
  { rawName: '新海 れい', size: '22歳 160cm Dcup', image: 'https://aroma-eternal.net/thumb/20241016231750_1_1_smoll.jpg' },
  { rawName: '井上 まりえ', size: '24歳 155cm Ccup', image: 'https://aroma-eternal.net/thumb/20240626143706_1_1_smoll.jpg' },
  { rawName: '杉野 みお', size: '21歳 159cm Ccup', image: 'https://aroma-eternal.net/thumb/20240624095324_1_1_smoll.jpg' },
  { rawName: '西島 なぎ', size: '26歳 170cm Ccup', image: 'https://aroma-eternal.net/thumb/20240626104400_1_1_smoll.jpg' },
  { rawName: '関谷 みゆ', size: '24歳 162cm Dcup', image: 'https://aroma-eternal.net/thumb/20240520110955_1_1_smoll.jpg' },
  { rawName: '藤原 つばさ', size: '29歳 148cm Ccup', image: 'https://aroma-eternal.net/thumb/20240526073734_1_1_smoll.jpg' },
  { rawName: '吉岡 まりか', size: '28歳 160cm Ccup', image: 'https://aroma-eternal.net/thumb/20240509112404_1_1_smoll.jpg' },
  { rawName: '菊池 なな', size: '24歳 158cm Dcup', image: 'https://aroma-eternal.net/thumb/20240314221553_1_1_smoll.jpg' },
  { rawName: '高梨 あや', size: '27歳 165cm Bcup', image: 'https://aroma-eternal.net/thumb/20240226124255_1_1_smoll.jpg' },
  { rawName: '上条 もも', size: '28歳 155cm Ecup', image: 'https://aroma-eternal.net/thumb/20240309125028_1_1_smoll.jpg' },
  { rawName: '双海 まな', size: '24歳 160cm Ccup', image: 'https://aroma-eternal.net/thumb/20240109164323_1_1_smoll.jpg' },
  { rawName: '中島 みく', size: '24歳 162cm Dcup', image: 'https://aroma-eternal.net/thumb/20231206153821_1_1_smoll.jpg' },
  { rawName: '湊 さな', size: '27歳 160cm Ccup', image: 'https://aroma-eternal.net/thumb/20230519203431_1_1_smoll.jpg' },
  { rawName: '前須 あんな', size: '24歳 153cm Dcup', image: 'https://aroma-eternal.net/thumb/not_thumb.jpg' },
  { rawName: '逢沢 ゆずな', size: '25歳 162cm Ecup', image: 'https://aroma-eternal.net/thumb/20240331073310_1_1_smoll.jpg' },
  { rawName: '中原 りん', size: '25歳 154cm Ccup', image: 'https://aroma-eternal.net/thumb/20221108204618_46735sam.jpg' },
  { rawName: '仲西 あい', size: '25歳 167cm Ccup', image: 'https://aroma-eternal.net/thumb/20230501123052_1_1_smoll.jpg' },
  { rawName: '折川 みな', size: '23歳 155cm Fcup', image: 'https://aroma-eternal.net/thumb/20221022124703_44724sam.jpg' },
  { rawName: '立石 ももか', size: '23歳 153cm Bcup', image: 'https://aroma-eternal.net/thumb/20221210194904_59668sam.jpg' },
  { rawName: '倉田 さら', size: '26歳 160cm Dcup', image: 'https://aroma-eternal.net/thumb/20230409152618_1_1_smoll.jpg' },
  { rawName: '雨宮 りこ', size: '23歳 154cm', image: 'https://aroma-eternal.net/thumb/20221207173144_14455sam.jpg' },
  { rawName: '岩崎 すずね', size: '24歳 157cm Ccup', image: 'https://aroma-eternal.net/thumb/20220505213145_57199sam.jpg' },
  { rawName: '葵 ひなた', size: '25歳 155cm Ecup', image: 'https://aroma-eternal.net/thumb/20230130094210_1_1_smoll.jpg' },
  { rawName: '沙月 りな', size: '26歳 165cm Dcup', image: 'https://aroma-eternal.net/thumb/20230128151111_67873sam.jpg' },
  { rawName: '有坂 マリ', size: '28歳 155cm Fcup', image: 'https://aroma-eternal.net/thumb/20230128121102_90884sam.jpg' },
  { rawName: '川原 みなみ', size: '28歳 155cm Fcup', image: 'https://aroma-eternal.net/thumb/20230130093749_1_1_smoll.jpg' },
  { rawName: '笠原 すず', size: '20歳 155cm Fcup', image: 'https://aroma-eternal.net/thumb/20240410231251_1_1_smoll.jpg' },
  { rawName: '吹石 あおい', size: '30歳 165cm Ccup', image: 'https://aroma-eternal.net/thumb/20230130093716_1_1_smoll.jpg' },
  { rawName: '綾瀬 小春', size: '27歳 165cm Fcup', image: 'https://aroma-eternal.net/thumb/20230130093644_1_1_smoll.jpg' },
  { rawName: '藤堂 はるか', size: '25歳 160cm Ecup', image: 'https://aroma-eternal.net/thumb/20230130093523_1_1_smoll.jpg' },
  { rawName: '佐野 ふみか', size: '24歳 160cm Ccup', image: 'https://aroma-eternal.net/thumb/20230130093435_1_1_smoll.jpg' },
  { rawName: '石原 ゆな', size: '24歳 164cm Dcup', image: 'https://aroma-eternal.net/thumb/20230130093402_1_1_smoll.jpg' },
  { rawName: '中谷 杏', size: '28歳 156cm Ccup', image: 'https://aroma-eternal.net/thumb/20230130093328_1_1_smoll.jpg' },
  { rawName: '山本 さくら', size: '31歳 163cm Dcup', image: 'https://aroma-eternal.net/thumb/20260224121701_1_1_smoll.jpg' },
  { rawName: '朝倉 さえ', size: '25歳 158cm Bcup', image: 'https://aroma-eternal.net/thumb/20230130093237_1_1_smoll.jpg' }
];

async function main() {
  console.log(`🚀 ${CONFIG.shopName}：ステップ① データ登録を開始します...\n`);
  const now = new Date().toISOString();
  
  try {
    // 1. 池袋エリアで店舗を特定（新旧両方の名前で検索）
    const { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id')
      .eq('area_id', CONFIG.areaId)
      .or(`name.ilike.${CONFIG.searchKeyword},name.ilike.${CONFIG.searchKeyword2}`)
      .limit(1);

    if (searchError) throw searchError;

    const targetId = (shops && shops.length > 0) ? shops[0].id : crypto.randomUUID();

    if (shops?.length > 0) {
      console.log(`✅ 既存の「エターナル」枠を発見しました。データを上書きします。`);
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

    // 3. キャスト登録
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

    // 4. 自動退店処理
    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました。`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 エターナルのデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
