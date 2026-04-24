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
  // アロマリゾート または 昭和倶楽部 の両方で検索
  searchKeyword: '%アロマリゾート%', 
  searchKeyword2: '%昭和倶楽部%',
  areaId: 'tokyo_toshima_ikebukuro', // 池袋エリア
  shopName: 'アロマリゾート (旧昭和倶楽部)',
  websiteUrl: 'https://tokyo-aroma-world.jp/',
  scheduleUrl: 'https://tokyo-aroma-world.jp/schedule/',
  priceSystem: '【NEW】60分フリー限定\n10,000円\n70分フリー限定（ご予約可能）\n12,000円\n90分\n14,000円\n120分\n20,000円\n150分\n26,000円'
};

// HTMLから抽出したキャストデータ
const therapistsRaw = [
  { rawName: '花宮あまね(24)', tags: ['NEW', '声が可愛い', '癒し100％', '爆乳Iカップ', '優しいいい子'], size: 'T155 B0(I) W0 H0', catch: '可愛さと声が激カワ', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_42.jpg' },
  { rawName: '日高るい(28)', tags: ['NEW', 'ハイスペック', 'スレンダー', 'Fカップ巨乳', 'ぷるぷるリップ'], size: 'T155 B0(F) W0 H0', catch: 'S級BODY美女OLさん', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_9.jpg' },
  { rawName: '東雲まゆ(30)', tags: ['NEW', '完全未経験', 'お姉さん系', '黒髪', 'Gカップ巨乳'], size: 'T164 B0(G) W0 H0', catch: '完全業界未経験G', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_10.jpg' },
  { rawName: '観月こはる(24)', tags: ['NEW', '完全未経験', 'Hカップ巨乳', 'ぷち天然キャラ', 'スタイル抜群'], size: 'T156 B0(H) W0 H0', catch: '完全業界未経験', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_11.jpg' },
  { rawName: '大森なこ(21)', tags: ['NEW', '未経験', 'Hカップ巨乳', '可愛い', '愛嬌抜群'], size: 'T160 B0(H) W0 H0', catch: '完全業界未経験H', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_12.jpg' },
  { rawName: '斉藤ゆか(20)', tags: ['NEW', '完全未経験', '爆乳Iカップ', 'むっちり', '癒し系'], size: 'T165 B0(I) W0 H0', catch: '完全業界未経験I', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_13.jpg' },
  { rawName: '桃瀬りんか(21)', tags: ['NEW', '完全未経験', 'Hカップ巨乳', '超激レア出勤', 'イマドキ'], size: 'T161 B0(H) W0 H0', catch: '完全業界未経験21歳', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_14.jpg' },
  { rawName: '水瀬かえで(23)', tags: ['NEW', '完全未経験', '声が低い', '方言', 'シャイ'], size: 'T158 B0(E) W0 H0', catch: '完全業界未経験', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_15.jpg' },
  { rawName: '日向まいか(31)', tags: ['NEW', 'お姉さん系', '早番専属', 'セクシーオーラ', 'お色気'], size: 'T158 B0(E) W0 H0', catch: 'セクシーお姉さん', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_16.jpg' },
  { rawName: '井上りお(25)', tags: ['NEW', '完全未経験', '爆乳Iカップ', '高身長', 'レア出勤'], size: 'T167 B0(I) W0 H0', catch: '完全業界未経験I', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_17.jpg' },
  { rawName: '葉山あずさ(28)', tags: ['お姉さん系', 'むっちり', '深夜勤務', 'レア出勤'], size: 'T153 B0(E) W0 H0', catch: '濃厚施術のお姉さん', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_18.jpg' },
  { rawName: '川崎おとは(25)', tags: ['NEW', 'リピート多数', 'Hカップ巨乳', 'おもてなし', 'とてもいい子'], size: 'T158 B0(H) W0 H0', catch: '激カワHな女の子', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_19.jpg' },
  { rawName: '中村むつみ(35)', tags: ['完全未経験', 'お姉さん系', '癒しのナース', 'むっちり'], size: 'T153 B0(F) W0 H0', catch: '完全業界未経験', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_20.jpg' },
  { rawName: '一ノ瀬ねね(23)', tags: ['業界未経験', 'Gカップ巨乳', '自称変態', 'リピート多数'], size: 'T165 B0(G) W0 H0', catch: '完全業界未経験G', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_21.jpg' },
  { rawName: '成瀬ひまり(28)', tags: ['完全未経験', 'OLさん', '早番専属', '激レア出勤'], size: 'T159 B0(F) W0 H0', catch: '完全業界未経験OL', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_22.jpg' },
  { rawName: '星川ななせ(20)', tags: ['完全未経験', '本職エステ', 'ハイスペック', '可愛い'], size: 'T150 B0(G) W0 H0', catch: '完全業界未経験20歳', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_23.jpg' },
  { rawName: '佐々木えみ(37)', tags: ['お姉さん系', '業界未経験', 'スレンダー', 'OLさん'], size: 'T159 B0(F) W0 H0', catch: '完全業界未経験OL', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_24.jpg' },
  { rawName: '高田みな(30)', tags: ['ぽっちゃり', 'お姉さん系', '神出鬼没', '不思議系'], size: 'T150 B0(F) W0 H0', catch: 'むっちり癒し系', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_25.jpg' },
  { rawName: '高橋みさき(36)', tags: ['お姉さん系', 'Gカップ巨乳', 'むっちり', 'おっとり'], size: 'T158 B0(G) W0 H0', catch: '30過ぎると女は…', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_26.jpg' },
  { rawName: '有栖りず(19)', tags: ['業界未経験', '19歳最高', '小柄', 'セーラームーン'], size: 'T148 B0(G) W0 H0', catch: '完全業界未経験19歳G', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_27.jpg' },
  { rawName: '月見まい(24)', tags: ['爆乳Iカップ', '頑張り屋さん', 'ホスピタリティ', 'リピート多数'], size: 'T153 B0(I) W0 H0', catch: '爆乳Iカップ', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_28.jpg' },
  { rawName: '佐藤りな(25)', tags: ['NEW', 'Hカップ巨乳', '癒し系', 'ぷち天然', 'OLさん'], size: 'T153 B0(H) W0 H0', catch: '癒し系可愛いOLさん', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_29.jpg' },
  { rawName: '大野あん(26)', tags: ['Hカップ巨乳', '遅番深夜', 'おっとり', 'OLさん'], size: 'T165 B0(H) W0 H0', catch: '深夜の癒し系H', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_31.jpg' },
  { rawName: '小林きい(21)', tags: ['可愛い', 'Gカップ巨乳', '業界未経験', 'ナイスBODY'], size: 'T156 B0(G) W0 H0', catch: '完全業界未経験', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_32.jpg' },
  { rawName: '藤井らん(36)', tags: ['お姉さん系', 'むっちり', 'Hカップ巨乳', '気まぐれ'], size: 'T160 B0(H) W0 H0', catch: '美巨乳お姉さま', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_33.jpg' },
  { rawName: '松浦あやみ(31)', tags: ['お姉さん系', 'むっちり', '愛嬌抜群', 'イチャイチャ'], size: 'T163 B0(E) W0 H0', catch: '愛嬌抜群お姉さん', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_34.jpg' },
  { rawName: '桜木まお(49)', tags: ['熟女系', '妖艶', 'レア出勤', '大人の魅力'], size: 'T163 B0(D) W0 H0', catch: '大人の魅力満載', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_35.jpg' },
  { rawName: '百田つばさ(47)', tags: ['熟女系', '小柄', '超激レア出勤', '施術上手'], size: 'T154 B0(F) W0 H0', catch: '小柄で可愛いお姉さま', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_36.jpg' },
  { rawName: '月森あゆり(44)', tags: ['お姉さん系', 'スレンダー', '激レア出勤', 'フェザータッチ'], size: 'T166 B0(B) W0 H0', catch: 'スレンダーお姉さん', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_37.jpg' },
  { rawName: '松本るり(30)', tags: ['リアル人妻', 'お姉さん系', '超スレンダー', '激レア出勤'], size: 'T158 B0(F) W0 H0', catch: 'スレンダー美女', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_38.jpg' },
  { rawName: '春山わかな(36)', tags: ['リピート多数', 'スタイル抜群', '超天然キャラ', 'お姉さん系'], size: 'T162 B0(E) W0 H0', catch: '超人気お姉さん', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_39.jpg' },
  { rawName: '寺西あい(41)', tags: ['リアル人妻', '愛嬌抜群', 'お姉さん系', '早番レア'], size: 'T159 B0(E) W0 H0', catch: '人気の明るいレア美女', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_40.jpg' },
  { rawName: '葉月すずな(44)', tags: ['爆乳Iカップ', 'お姉さん系', '天然キャラ', 'OLさん'], size: 'T163 B0(I) W0 H0', catch: '圧巻BODY熟女', image: 'https://tokyo-aroma-world.jp/def/con?x=270&p=upload/cast/thumb_41.jpg' }
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
      console.log(`✅ 既存の「アロマリゾート(旧昭和倶楽部)」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、新規IDを発行して登録します。`);
    }

    // 2. 店舗情報の更新
    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: CONFIG.areaId,
      name: CONFIG.shopName,
      website_url: CONFIG.websiteUrl,
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
        raw_data: { tags: t.tags, size: t.size, catch_phrase: t.catch, original_name: t.rawName }
      };
    });

    console.log(`⚙️ セラピストデータ(therapists)を登録中...`);
    await supabase.from('therapists').upsert(payload);

    // 自動退店処理
    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました。`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 アロマリゾートのデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
