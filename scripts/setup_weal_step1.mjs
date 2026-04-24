import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // カッコ（年齢）と空白文字を取り除いて名前を詰める
  return rawName.replace(/\(.*?\)|（.*?）/g, '').replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%Weal%',
  searchKeyword2: '%ウィール%',
  fallbackAreaId: 'tokyo_chiyoda_akihabara', // 秋葉原エリア
  shopName: 'Weal (ウィール秋葉原店)',
  scheduleUrl: 'https://weal-esthe.com/schedule/',
  // 画像から抽出した割引適用後の料金システム
  priceSystem: '60分 13,000円 (仰向けのみコース/割引対象外)\n90分 15,000円\n120分 19,000円\n150分 23,000円'
};

// HTMLから抽出したキャストデータ（15名分）
const therapistsRaw = [
  { rawName: '前田しずく', size: '21歳 T153 (F)', tags: ['おっとり', 'かわいい', '業界未経験', '癒し系'], image: 'https://weal-esthe.com/wp-content/uploads/2026/04/11819_20260417024200_600_800_0.jpg' },
  { rawName: '本郷あおい', size: '24歳 T158 (E)', tags: ['おっとり', 'セクシー系', 'モデル体型', '清楚系'], image: 'https://weal-esthe.com/wp-content/uploads/2026/04/11823_20260408042922_600_800_0.jpg' },
  { rawName: '森川りの', size: '26歳 T165 (D)', tags: ['おっとり', 'お姉様系', '癒し系', '美人系'], image: 'https://weal-esthe.com/wp-content/uploads/2026/03/S__37249028_0-600x800.jpg' },
  { rawName: '森下いちか', size: '23歳 T147 (E)', tags: ['かわいい', '小柄', '照れ屋', '癒し系'], image: 'https://weal-esthe.com/wp-content/uploads/2026/02/10976_20260313171237_600_800_0.jpg' },
  { rawName: '東條みやび', size: '26歳 T160 (E)', tags: ['セクシー系', 'モデル体型', '優しい', '施術上手'], image: 'https://weal-esthe.com/wp-content/uploads/2026/02/10947_20260313171243_600_800_0.jpg' },
  { rawName: '成宮さえ', size: '25歳 T160 (F)', tags: ['かわいい', '優しい', '礼儀正しい', '色白'], image: 'https://weal-esthe.com/wp-content/uploads/2026/01/IMG_2971-450x513.jpg' },
  { rawName: '鳳城あやか', size: '25歳 T162 (E)', tags: ['かわいい', 'セクシー系', '優しい', '癒し系'], image: 'https://weal-esthe.com/wp-content/uploads/2026/01/10535_20260129222440_600_800_0.jpg' },
  { rawName: '石原めい', size: '26歳 T160 (E)', tags: ['セクシー系', '優しい', '施術上手', '清楚系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6221_20260129222550_600_800_0.jpg' },
  { rawName: '天羽ここあ', size: '22歳 T158 (G)', tags: ['かわいい', '上品', '優しい', '色白'], image: 'https://weal-esthe.com/wp-content/uploads/2025/04/7021_20260129222602_600_800_0-450x600.jpg' },
  { rawName: '天使すず', size: '24歳 T160 (D)', tags: ['かわいい', '優しい', '施術上手', '経験豊富'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6218_20260129222536_600_800_0-450x600.jpg' },
  { rawName: '那月なみ', size: '25歳 T153 (F)', tags: ['施術上手', '癒し系', '美人系', '色白'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6285_20260129222732_600_800_0-450x600.jpg' },
  { rawName: '星月ゆま', size: '25歳 T151 (F)', tags: ['セクシー系', 'モデル体型', '上品', '施術上手'], image: 'https://weal-esthe.com/wp-content/uploads/2026/03/S__110379016_0-600x783.jpg' },
  { rawName: '柚木さな', size: '27歳 T163 (E)', tags: ['かわいい', 'モデル体型', '優しい', '施術上手'], image: 'https://weal-esthe.com/wp-content/uploads/2026/03/S__65503237_0-600x800.jpg' },
  { rawName: '恋星もあ', size: '20歳 T158 (E)', tags: ['おっとり', 'かわいい', 'スレンダー', '癒し系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6462_20260129222636_600_800_0-450x600.jpg' },
  { rawName: '有栖みゆう', size: '26歳 T147 (D)', tags: ['かわいい', '優しい', '小柄', '施術上手'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6393_20260129222745_600_800_0-450x600.jpg' },
  { rawName: '花杉みなみ', size: '22歳 T158 (D)', tags: ['かわいい', 'アイドル系', '明るい', '癒し系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6381_20260129222843_600_800_0-450x600.jpg' },
  { rawName: '美幸ゆみ', size: '22歳 T160 (D)', tags: ['かわいい', 'モデル体型', '優しい', '施術上手'], image: 'https://weal-esthe.com/wp-content/uploads/2026/02/S__21086217_0-450x615.jpg' },
  { rawName: '天野さおり', size: '22歳 T158 (C)', tags: ['おとなしい', '優しい', '礼儀正しい', '美人系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6486_20260129222836_600_800_0-450x600.jpg' },
  { rawName: '夏目るな', size: '25歳 T157 (F)', tags: ['かわいい', 'セクシー系', '優しい', '癒し系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/06/7480_20260129222927_600_800_0-450x600.jpg' },
  { rawName: '鈴音りん', size: '24歳 T158 (E)', tags: ['セクシー系', '上品', '優しい', '美人系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/06/7512_20260129222911_600_800_0-450x600.jpg' },
  { rawName: '天宮いるる', size: '23歳 T157 (D)', tags: ['かわいい', 'アイドル系', 'スレンダー', '妹系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/09/8129_20260129222512_600_800_0-450x600.jpg' },
  { rawName: '高嶋りんか', size: '23歳 T164 (D)', tags: ['アイドル系', 'スレンダー', '清楚系', '美人系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/10/8193_20260129222451_600_800_0-450x600.jpg' },
  { rawName: '初音らら', size: '23歳 T148 (E)', tags: ['かわいい', '優しい', '施術上手', '明るい'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6361_20260129223013_600_800_0-450x600.jpg' },
  { rawName: '愛川みさ', size: '26歳 T152 (D)', tags: ['かわいい', '上品', '優しい', '施術上手'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6406_20260129223029_600_800_0-450x600.jpg' },
  { rawName: '櫻井あい', size: '23歳 T158 (G)', tags: ['かわいい', 'アイドル系', '清楚系', '色白'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6273_20260129222652_600_800_0-450x600.jpg' },
  { rawName: '一宮るい', size: '20歳 T163 (E)', tags: ['かわいい', 'アイドル系', '優しい', '照れ屋'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6346_20260129222626_600_800_0-450x600.jpg' },
  { rawName: '桜庭ひなの', size: '26歳 T144 (E)', tags: ['かわいい', '小柄', '施術上手', '癒し系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6241_20260129222818_600_800_0-450x600.jpg' },
  { rawName: '相沢あみ', size: '34歳 T159 (G)', tags: ['お姉様系', 'セクシー系', '清楚系', '色白'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6519_20260129223054_600_800_0-450x600.jpg' },
  { rawName: '椎名ななせ', size: '23歳 T152 (H)', tags: ['かわいい', '優しい', '癒し系', '色白'], image: 'https://weal-esthe.com/wp-content/uploads/2025/11/8606_20260129222446_600_800_0-450x600.jpg' },
  { rawName: '橘ひさき', size: '28歳 T155 (E)', tags: ['お姉様系', 'スレンダー', '優しい', '美人系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6525_20260129223107_600_800_0-450x600.jpg' },
  { rawName: '神崎にこ', size: '21歳 T157 (D)', tags: ['おとなしい', 'お嬢様系', 'モデル体型', '癒し系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6280_20260129223113_600_800_0-450x600.jpg' },
  { rawName: '岡本さや', size: '22歳 T154 (C)', tags: ['おっとり', 'かわいい', '努力家', '照れ屋'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6237_20260129223124_600_800_0-450x600.jpg' },
  { rawName: '朝比奈しお', size: '22歳 T147 (C)', tags: ['かわいい', '優しい', '小柄', '甘えん坊'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6254_20260129223131_600_800_0-450x600.jpg' },
  { rawName: '春宮ひかり', size: '21歳 T160 (C)', tags: ['おとなしい', 'アイドル系', '妹系', '高感度抜群'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6261_20260129223139_600_800_0-450x600.jpg' },
  { rawName: '茉白りね', size: '24歳 T156 (E)', tags: ['かわいい', 'セクシー系', '明るい', '美人系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6456_20260129223145_600_800_0-450x600.jpg' },
  { rawName: '二階堂ゆきの', size: '26歳 T163 (D)', tags: ['お姉様系', '上品', '優しい', '明るい'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6526_20260129223151_600_800_0-450x600.jpg' },
  { rawName: '佐藤はな', size: '23歳 T161 (G)', tags: ['おっとり', 'かわいい', '照れ屋', '色白'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6495_20260129223202_600_800_0-450x600.jpg' },
  { rawName: '青羽ゆいか', size: '23歳 T158 (E)', tags: ['かわいい', '妹系', '業界未経験', '癒し系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/02/6216_20260129223227_600_800_0-450x600.jpg' },
  { rawName: '西川ゆかり', size: '24歳 T155 (E)', tags: ['スレンダー', 'セクシー系', '清楚系', '美人系'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6268_20260129223221_600_800_0.jpg' },
  { rawName: '七海かな', size: '20歳 T158 (E)', tags: ['かわいい', 'アイドル系', '癒し系', '経験豊富'], image: 'https://weal-esthe.com/wp-content/uploads/2025/03/6484_20260129223210_600_800_0-450x600.jpg' },
  { rawName: '白波みなみ', size: '23歳 T148 (C)', tags: ['かわいい', 'セクシー系', '照れ屋', '癒し系'], image: 'https://weal-esthe.com/wp-content/themes/ultra-theme-b/assets/images/noimg.webp' },
  { rawName: '雪白かのん', size: '22歳 T159 (D)', tags: ['かわいい', 'スレンダー', '優しい', '色白'], image: 'https://weal-esthe.com/wp-content/themes/ultra-theme-b/assets/images/noimg.webp' }
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
      console.log(`✅ 既存の「ウィール」枠を発見しました。データを上書きします。`);
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
      
      // 画像URLが noimg の場合は null として扱う
      const isNoImg = t.image.includes('noimg');
      const imageUrl = isNoImg ? null : t.image.trim();
      
      return {
        id: `${targetId}_${clean}`,
        shop_id: targetId,
        name: clean,
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: { size: t.size, tags: t.tags, original_name: t.rawName }
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

    console.log('\n🎉 Weal(ウィール秋葉原店)のデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
