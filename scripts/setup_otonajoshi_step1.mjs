import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // 「(43歳)」などの年齢表記を取り除いて名前だけにする
  return rawName.replace(/\(.*?\)|（.*?）/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%おとな女子%',
  fallbackAreaId: 'tokyo_toshima_ikebukuro', // 新規作成時のデフォルトエリア
  shopName: 'おとな女子',
  websiteUrl: 'http://men-esthe.net',
  scheduleUrl: 'http://men-esthe.net/schedule/',
  // 画像から抽出した料金システム（割引後の適用価格を採用）
  priceSystem: '【スタンダードリンパコース】\n90分 15,000円\n120分 19,000円\n150分 23,000円\n\n【リッチリンパコース】\n90分 17,000円\n120分 21,000円\n150分 25,000円'
};

// HTMLから抽出したキャストデータ（29名）
const therapistsRaw = [
  { rawName: 'もか(43歳)', size: 'T160 B88(E) W57 H89', image: 'http://men-esthe.net/wp-content/uploads/2026/04/IMG_4223-e1776270213626.jpeg' },
  { rawName: 'しおん(37歳)', size: 'T160 B86(D) W56 H85', image: 'http://men-esthe.net/wp-content/uploads/2026/03/IMG_4135-e1772690125160.jpeg' },
  { rawName: 'みずほ(37歳)', size: 'T160 B85(D) W56 H86', image: 'http://men-esthe.net/wp-content/uploads/2026/03/IMG_4118-e1772301319194.jpeg' },
  { rawName: 'りほ(35歳)', size: 'T164 B85(D) W56 H86', image: 'http://men-esthe.net/wp-content/uploads/2026/02/IMG_4102-e1771730922597.jpeg' },
  { rawName: 'れい(31歳)', size: 'T166 B87(F) W56 H85', image: 'http://men-esthe.net/wp-content/uploads/2026/02/IMG_4070-e1770540425382.jpeg' },
  { rawName: 'きょうか(45歳)', size: 'T168 B94(E) W57 H90', image: 'http://men-esthe.net/wp-content/uploads/2026/01/IMG_4006-e1768524914692.jpeg' },
  { rawName: 'むぎ(39歳)', size: 'T157 B94(G) W56 H90', image: 'http://men-esthe.net/wp-content/uploads/2026/03/IMG_8259-e1774001196973.jpeg' },
  { rawName: 'まこと(38歳)', size: 'T164 B104(H) W58 H99', image: 'http://men-esthe.net/wp-content/uploads/2025/11/IMG_3829-e1763904462208.jpg' },
  { rawName: 'うの(33歳)', size: 'T166 B87(D) W56 H88', image: 'http://men-esthe.net/wp-content/uploads/2026/02/IMG_4092-e1771598379762.jpeg' },
  { rawName: 'ななこ(37歳)', size: 'T159 B85(C) W56 H86', image: 'http://men-esthe.net/wp-content/uploads/2025/11/nnl01-e1762690322106.jpg' },
  { rawName: 'まあや(34歳)', size: 'T170 B86(D) W56 H88', image: 'http://men-esthe.net/wp-content/uploads/2025/11/maay1-e1762329219934.jpg' },
  { rawName: 'せいな(30歳)', size: 'T163 B83(C) W56 H85', image: 'http://men-esthe.net/wp-content/uploads/2025/10/IMG_3683-e1760531553729.jpeg' },
  { rawName: 'みち(31歳)', size: 'T162 B84(C) W56 H86', image: 'http://men-esthe.net/wp-content/uploads/2025/08/michi001-e1754315670623.jpg' },
  { rawName: 'あの(41歳)', size: 'T164 B86(D) W57 H89', image: 'http://men-esthe.net/wp-content/uploads/2025/10/IMG_3664-e1759419284425.jpg' },
  { rawName: 'もね(33歳)', size: 'T165 B85(C) W56 H88', image: 'http://men-esthe.net/wp-content/uploads/2026/03/IMG_8262-e1774185728952.jpeg' },
  { rawName: 'かえで(38歳)', size: 'T160 B91(E) W58 H90', image: 'http://men-esthe.net/wp-content/uploads/2025/11/kede1-e1763283123152.jpg' },
  { rawName: 'ひより(45歳)', size: 'T167 B87(F) W57 H92', image: 'http://men-esthe.net/wp-content/uploads/2022/11/hiyori005.jpg' },
  { rawName: 'みゆう(29歳)', size: 'T165 B84(C) W55 H86', image: 'http://men-esthe.net/wp-content/uploads/2023/11/IMG_1905-e1699509854731.jpeg' },
  { rawName: 'かずは(35歳)', size: 'T156 B88(F) W56 H89', image: 'http://men-esthe.net/wp-content/uploads/2025/02/kzh0001-e1740332491158.jpg' },
  { rawName: 'めぐみ(37歳)', size: 'T158 B81(D) W55 H82', image: 'http://men-esthe.net/wp-content/uploads/2025/11/mgmi1-e1763283112311.jpg' },
  { rawName: 'れみ(36歳)', size: 'T160 B83(C) W56 H86', image: 'http://men-esthe.net/wp-content/uploads/2024/06/rmx-e1719174545216.jpg' },
  { rawName: 'らん(34歳)', size: 'T165 B91(G) W57 H90', image: 'http://men-esthe.net/wp-content/uploads/2025/11/rn1-e1763283087782.jpg' },
  { rawName: 'まゆ(32歳)', size: 'T154 B82(C) W56 H80', image: 'http://men-esthe.net/wp-content/uploads/2025/06/mayu001.jpg' },
  { rawName: 'ひかる(38歳)', size: 'T160 B87(D) W56 H86', image: 'http://men-esthe.net/wp-content/uploads/2023/11/IMG_1903-e1699510579214.jpeg' },
  { rawName: 'あんな(37歳)', size: 'T171 B88(E) W57 H89', image: 'http://men-esthe.net/wp-content/uploads/2025/05/anna05-e1748610428203.jpg' },
  { rawName: 'あやか(37歳)', size: 'T165 B81(C) W56 H83', image: 'http://men-esthe.net/wp-content/uploads/2024/06/ayk001-e1719174467478.jpg' },
  { rawName: 'えり(36歳)', size: 'T160 B87(D) W58 H87', image: 'http://men-esthe.net/wp-content/uploads/2021/12/eri01.jpg' },
  { rawName: 'ありす(32歳)', size: 'T159 B99(I) W57 H86', image: 'http://men-esthe.net/wp-content/uploads/2025/10/IMG_3694-e1760882533929.jpeg' },
  { rawName: 'みやび(29歳)', size: 'T158 B83(C) W56 H84', image: 'http://men-esthe.net/wp-content/uploads/2023/03/miyabi02.jpg' }
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
      console.log(`✅ 既存の「おとな女子」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、新規IDを発行して登録します。`);
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

    console.log('\n🎉 おとな女子のデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
