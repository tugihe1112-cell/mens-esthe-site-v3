import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // カッコ（年齢）、新人、体験入店、スペースを全て取り除いて名前だけを抽出
  return rawName
    .replace(/\(.*?\)|（.*?）/g, '')
    .replace(/新人/g, '')
    .replace(/体験入店/g, '')
    .replace(/[\s　]/g, '')
    .trim();
}

const CONFIG = {
  searchKeyword: '%アマリリス%',
  fallbackAreaId: 'tokyo_toshima_otsuka', // 大塚エリア
  shopName: 'アマリリス',
  websiteUrl: 'https://amaryllis.ap1hp.com/',
  scheduleUrl: 'https://amaryllis.ap1hp.com/',
  // 画像から抽出した「今だけ」の割引料金システム
  priceSystem: '【アロマコース】\n70分 10,000円\n90分 12,000円\n120分 15,000円\n150分 18,000円'
};

// HTMLから抽出したキャストデータ
const therapistsRaw = [
  { rawName: 'ここみ(30)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_17112_1620095607556308.jpg' },
  { rawName: 'ゆりな(38)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_18746_1684576287532218.jpg' },
  { rawName: 'あさひ 体験入店(40)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20133_177312015453274.jpg' },
  { rawName: 'わかな(40)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_19228_1712808401471430.jpg' },
  { rawName: 'せり (37)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_18095_1657202176206322.jpg' },
  { rawName: 'るみ (42)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_19934_1742969576978668.jpg' },
  { rawName: 'いずみ(40)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_19966_1745309631422200.jpg' },
  { rawName: 'ゆの 新人(30)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20124_1770177472926061.jpg' },
  { rawName: '10時受付開始', image: '' }, // ※除外対象
  { rawName: 'よしの(34)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_12937_1733195241237768.jpg' },
  { rawName: 'のどか(38)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_17962_1650972174331151.jpg' },
  { rawName: 'まゆ (32)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_19503_1759824049641096.jpg' },
  { rawName: 'ひまり (38)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_19471_1715392391679129.jpg' },
  { rawName: 'さな(39)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_18678_1681395430892145.jpg' },
  { rawName: 'そら(37)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_19251_1747363956377300.jpg' },
  { rawName: 'みな (38)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_16357_1623229182815327.jpg' },
  { rawName: 'はるな(38)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_15762_1598784807564071.jpg' },
  { rawName: 'かえで(33)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_18285_1666345574557267.jpg' },
  { rawName: 'さよ(36)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_15919_1617549859179296.jpg' },
  { rawName: 'はずき (39)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_19850_1734923039727117.jpg' },
  { rawName: 'きよか(40)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_19038_1696237798724559.jpg' },
  { rawName: 'ちほ (32)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_19958_1745026682995718.jpg' },
  { rawName: 'すずね(43)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_17336_1644158754625876.jpg' },
  { rawName: 'けいこ(40)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_19079_1698294749355808.jpg' },
  { rawName: 'めい (32)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_19920_1740880682585515.jpg' },
  { rawName: 'かなこ(32)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_18194_1672023792525322.jpg' },
  { rawName: 'とあ 新人(39)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20039_1757672447711920.jpg' },
  { rawName: 'ことみ 新人(39)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20040_1757588123869323.jpg' },
  { rawName: 'みなみ (32)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20042_1757662723547867.jpg' },
  { rawName: 'すみれ 新人(32)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20065_1761554043301606.jpg' },
  { rawName: 'きこ 新人(32)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20101_1765969736315055.jpg' },
  { rawName: '店長より', image: '' }, // ※除外対象
  { rawName: 'あいか 新人(42)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20120_1770179573229573.jpg' },
  { rawName: 'いおり 新人(33)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20122_1770177861589767.jpg' },
  { rawName: 'なのは 新人(30)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20125_177087457157201.jpg' },
  { rawName: 'いちか 体験入店(30)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20126_1770794476816252.jpg' },
  { rawName: 'つきの 体験入店(40)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20132_1773114026809273.jpg' },
  { rawName: 'じゅり 体験入店(42)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20140_1775016648833520.jpg' },
  { rawName: 'うみか 体験入店(30)', image: 'https://aroma-tsushin.com/__admin/img_hp/staff_20142_1775016697588786.jpg' }
];

async function main() {
  console.log(`🚀 ${CONFIG.shopName}：ステップ① データ登録を開始します...\n`);
  const now = new Date().toISOString();
  
  try {
    // 1. 店舗の特定（新規または上書き）
    let { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id')
      .ilike('name', CONFIG.searchKeyword)
      .limit(1);

    if (searchError) throw searchError;

    const targetId = (shops && shops.length > 0) ? shops[0].id : crypto.randomUUID();

    if (shops?.length > 0) {
      console.log(`✅ 既存の「アマリリス」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、大塚エリアで新規IDを発行して登録します。`);
    }

    // 2. 店舗情報のUpsert
    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: CONFIG.fallbackAreaId,
      name: CONFIG.shopName,
      website_url: CONFIG.websiteUrl,
      schedule_url: CONFIG.scheduleUrl,
      price_system: CONFIG.priceSystem
    });

    // 3. キャストデータの整形とノイズ除外
    const payload = therapistsRaw
      // "店長" や "受付開始" を含むノイズデータを除外
      .filter(t => !t.rawName.includes('店長') && !t.rawName.includes('受付開始'))
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

    // キャストのUpsert実行
    console.log(`⚙️ セラピストデータ(therapists)を登録中...`);
    await supabase.from('therapists').upsert(payload);

    // 4. 自動退店処理（いなくなったキャストを非表示）
    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました（ダミー枠は除外済み）。`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 大塚アマリリスのデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
