import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // 全角・半角スペースを削除して名前を詰める
  return rawName.replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%OTONA TIC%',
  searchKeyword2: '%オトナチック%',
  fallbackAreaId: 'tokyo_toshima_ikebukuro', // 新規作成時のデフォルトエリア
  shopName: 'OTONA TIC (オトナチック)',
  scheduleUrl: 'https://www.mens-esthe-salon.net/schedule.cgi',
  // 画像から抽出した料金システム
  priceSystem: '60分 13,000円\n90分 16,000円 (割引料金: 15,000円)\n120分 20,000円 (割引料金: 19,000円)\n150分 24,000円 (割引料金: 23,000円)'
};

// HTMLから抽出したデータ（システム枠も含むが後で除外）
const therapistsRaw = [
  { rawName: '予約開始時間のお知らせ', size: '', tags: [], image: '' },
  { rawName: '極液（ごくえき）コース＆60分コース', size: '', tags: [], image: '' },
  { rawName: 'START割', size: '', tags: [], image: '' },
  { rawName: 'ブランチ割', size: '', tags: [], image: '' },
  { rawName: '夜ふかし割', size: '', tags: [], image: '' },
  { rawName: '森下　ゆうり', size: '30歳 T155', tags: ['NEW'], image: 'https://www.mens-esthe-salon.net/schedule/img/217/1_t.jpg' },
  { rawName: '川岸　はるな', size: '28歳 T165', tags: ['NEW'], image: 'https://www.mens-esthe-salon.net/schedule/img/216/1_t.jpg' },
  { rawName: '水嶋　きよみ', size: '38歳 T168', tags: ['NEW'], image: 'https://www.mens-esthe-salon.net/schedule/img/215/1_t.jpg' },
  { rawName: '西田　ひより', size: '30歳 T160', tags: ['NEW'], image: 'https://www.mens-esthe-salon.net/schedule/img/214/1_t.jpg' },
  { rawName: '梓澤　ゆう', size: '36歳 T160', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/153/1_t.jpg' },
  { rawName: '成瀬　みお', size: '37歳 T166', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/124/1_t.jpg' },
  { rawName: '今川　えみり', size: '36歳 T148', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/73/1_t.jpg' },
  { rawName: '藤崎　かおる', size: '40歳 T165', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/166/1_t.jpg' },
  { rawName: '伊吹　もえ', size: '35歳 T153', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/213/1_t.jpg' },
  { rawName: '宇佐美　はるか', size: '32歳 T155', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/134/1_t.jpg' },
  { rawName: '星野　ひとみ', size: '30歳 T162', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/147/1_t.jpg' },
  { rawName: '小林　もも', size: '33歳 T160', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/199/1_t.jpg' },
  { rawName: '夏目　らん', size: '25歳 T156', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/111/1_t.jpg' },
  { rawName: '七海　りこ', size: '30歳 T168', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/122/1_t.jpg' },
  { rawName: '岡田　ゆあ', size: '31歳 T164', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/126/1_t.jpg' },
  { rawName: '伊達　さゆり', size: '35歳 T155', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/170/1_t.jpg' },
  { rawName: '南雲　みなみ', size: '34歳 T155', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/185/1_t.jpg' },
  { rawName: '一ノ瀬　ましろ', size: '37歳 T162', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/131/1_t.jpg' },
  { rawName: '鮎浜　さと', size: '38歳 T160', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/168/1_t.jpg' },
  { rawName: '杉本　りな', size: '32歳 T160', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/191/1_t.jpg' },
  { rawName: '朝倉　まな', size: '31歳 T150', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/211/1_t.jpg' },
  { rawName: '神崎　ゆめか', size: '31歳 T159', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/197/1_t.jpg' },
  { rawName: '瀬名　かえで', size: '39歳 T163', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/157/1_t.jpg' },
  { rawName: '柏木　のぞみ', size: '38歳 T161', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/180/1_t.jpg' },
  { rawName: '雪乃　あいみ', size: '41歳 T156', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/210/1_t.jpg' },
  { rawName: '八神　まゆ', size: '39歳 T161', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/206/1_t.jpg' },
  { rawName: '高梨　あんな', size: '33歳 T163', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/209/1_t.jpg' },
  { rawName: '東城　れいか', size: '30歳 T157', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/183/1_t.jpg' },
  { rawName: '水樹　ここ', size: '36歳 T156', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/207/1_t.jpg' },
  { rawName: '森川　あけみ', size: '40歳 T151', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/212/1_t.jpg' },
  { rawName: '三上　さら', size: '37歳 T156', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/42/1_t.jpg' },
  { rawName: '椎名　まこと', size: '40歳 T155', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/160/1_t.jpg' },
  { rawName: '霧島　りん', size: '28歳 T155', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/52/1_t.jpg' },
  { rawName: '黒崎　れな', size: '29歳 T158', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/208/1_t.jpg' },
  { rawName: '中原　れい', size: '35歳 T150', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/143/1_t.jpg' },
  { rawName: '桜井　ゆめ', size: '38歳 T158', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/119/1_t.jpg' },
  { rawName: '海瀬　みどり', size: '37歳 T150', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/156/1_t.jpg' },
  { rawName: '七瀬　まろん', size: '30歳 T154', tags: [], image: 'https://www.mens-esthe-salon.net/schedule/img/98/1_t.jpg' },
  { rawName: '体験入店', size: '', tags: [], image: '' }
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
      console.log(`✅ 既存の「オトナチック」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、新規IDを発行して登録します。`);
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

    // 3. キャストデータの整形とノイズ除外
    const payload = therapistsRaw
      // "お知らせ" や "コース", "割", "体験入店" などのシステム枠を除外
      .filter(t => !t.rawName.includes('お知らせ') && !t.rawName.includes('コース') && !t.rawName.includes('割') && !t.rawName.includes('体験入店'))
      .map(t => {
        const clean = cleanseName(t.rawName);
        return {
          id: `${targetId}_${clean}`,
          shop_id: targetId,
          name: clean,
          image_url: t.image?.trim() || null,
          is_active: true,
          last_seen_at: now,
          raw_data: { tags: t.tags, size: t.size, original_name: t.rawName }
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

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました（システム枠は除外済み）。`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 オトナチックのデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
