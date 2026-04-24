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
  searchKeyword: '%Sanando%',
  searchKeyword2: '%サナンド%',
  fallbackAreaId: 'tokyo_chiyoda_kanda', // 神田エリア
  shopName: 'Sanando (サナンド)',
  scheduleUrl: 'https://sanando.jp/schedule/',
  // 画像から抽出した料金システム
  priceSystem: '75min ¥12,500\n90min ¥14,500\n120min ¥18,500\n150min ¥23,500\n180min ¥29,500'
};

// HTMLから抽出したキャストデータ（全15名）
const therapistsRaw = [
  { rawName: '雫めい', tags: ['可愛い系', '聞き上手', '期待の新人', '綺麗系', '愛嬌抜群'], image: 'https://sanando.jp/wp-content/uploads/2026/04/b12f9fc40390311a7305fd55c33da61a.jpg' },
  { rawName: '黒見さぁや', tags: ['可愛い系', 'オススメ', '期待の新人', '清楚系', 'おっとり'], image: 'https://sanando.jp/wp-content/uploads/2026/04/ae46b1f460ee46f789c27b264a6cb421.jpg' },
  { rawName: '百瀬あいか', tags: ['オススメ', '綺麗系', 'グラマー', '愛嬌抜群', '一押し'], image: 'https://sanando.jp/wp-content/uploads/2026/03/ae46b1f460ee46f789c27b264a6cb421-2.jpg' },
  { rawName: '吉瀬よな', tags: ['スレンダー', '期待の新人', '綺麗系', '清楚系', '愛嬌抜群'], image: 'https://sanando.jp/wp-content/uploads/2026/03/8089e50294910c6cb163e5cb54ad137b-2.jpg' },
  { rawName: '中村りか', tags: ['妹系', '癒し系', '期待の新人', '愛嬌抜群', '可愛い系'], image: 'https://sanando.jp/wp-content/uploads/2026/02/ae46b1f460ee46f789c27b264a6cb421-2.jpg' },
  { rawName: '友江なな', tags: ['癒し系', '期待の新人', '清楚系', 'スタイル抜群', '可愛い系'], image: 'https://sanando.jp/wp-content/uploads/2026/02/ae46b1f460ee46f789c27b264a6cb421-3.jpg' },
  { rawName: '市川みなみ', tags: ['スレンダー', '清楚系', '明るい', '可愛い系'], image: 'https://sanando.jp/wp-content/uploads/2026/02/ichikawa2.jpg' },
  { rawName: '沖山みずは', tags: ['清楚系', '圧倒的人気', '可愛い系', '癒し系', 'スレンダー', 'オススメ'], image: 'https://sanando.jp/wp-content/uploads/2023/08/unnamed.jpg' },
  { rawName: '美空ひな', tags: ['清楚系', 'スタイル抜群', '癒し系', '可愛い系', 'オススメ', '人気上位'], image: 'https://sanando.jp/wp-content/uploads/2020/07/miso12-1.jpg' },
  { rawName: '桐島みき', tags: ['癒し系', '妹系', '可愛い系', 'オススメ', '愛嬌抜群'], image: 'https://sanando.jp/wp-content/uploads/2021/11/61a07dd4976c486087b84644475e881a.jpg' },
  { rawName: '美咲ゆめ', tags: ['可愛い系', '人気上位', '癒し系', '清楚系', '一押し', 'スタイル抜群'], image: 'https://sanando.jp/wp-content/uploads/2024/09/misaki2-2.jpg' },
  { rawName: '西山あやの', tags: ['人気上位', '癒し系', 'スレンダー', 'オススメ', '小柄', '優しい'], image: 'https://sanando.jp/wp-content/uploads/2022/02/NSYM.jpg' },
  { rawName: '後藤かほ', tags: ['スタイル抜群', 'オススメ', 'グラマー', '愛嬌抜群', '人気上位', 'お姉さん系'], image: 'https://sanando.jp/wp-content/uploads/2019/03/bea89b96b5dbfb8440253992e92394da.jpg' },
  { rawName: '藤田えりか', tags: ['清楚系', '可愛い系', 'オススメ', '愛嬌抜群', '明るい', '人気上位'], image: 'https://sanando.jp/wp-content/uploads/2019/09/hujita4.jpg' },
  { rawName: '尾形ゆい', tags: ['優しい', 'おっとり', '可愛い系', '癒し系', 'オススメ'], image: 'https://sanando.jp/wp-content/uploads/2022/09/ogata-3.jpg' }
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
      console.log(`✅ 既存の「サナンド」枠を発見しました。全${therapistsRaw.length}名のデータを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、神田エリアで新規IDを発行して登録します。`);
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
        raw_data: { tags: t.tags, original_name: t.rawName }
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

    console.log('\n🎉 Sanando (サナンド)のデータ登録が完全に完了しました！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
