import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const GROUP_ID = 'g_esthe_club';

// 既存のIDと新規の用賀ID
const SHOPS = {
  gakugei: 'tokyo_meguro_gakugei_daigaku_tokyo_esthe_club',
  komazawa: 'tokyo_setagaya_komazawa_daigaku_tokyo_esthe_club',
  sakura: 'tokyo_setagaya_sakurashinmachi_tokyo_esthe_club',
  yoga: 'tokyo_setagaya_yoga_tokyo_esthe_club' // 用賀は無かったので新規用
};

const THERAPISTS = [
  {
    name: '神谷のあ',
    room: '駒沢大学ルーム',
    targetShopId: SHOPS.komazawa,
    image_url: 'https://www.esthe-club.tokyo/images/mc_1_1_3140.jpg?10',
    profile: '28歳 T.164 B.85(D) W.56 H.86'
  },
  {
    name: '藤宮玲奈',
    room: '桜新町ルーム',
    targetShopId: SHOPS.sakura,
    image_url: 'https://www.esthe-club.tokyo/images/mc_1_1_2898.jpg?10',
    profile: '28歳 T.156 B.85(D) W.57 H.80'
  },
  {
    name: '佐倉ひより',
    room: '用賀ルーム',
    targetShopId: SHOPS.yoga,
    image_url: 'https://www.esthe-club.tokyo/images/mc_1_1_2948.jpeg?10',
    profile: '22歳 T.155 B.86(D) W.57 H.86'
  },
  {
    name: '春野みこ',
    room: '学芸大学ルーム',
    targetShopId: SHOPS.gakugei,
    image_url: 'https://www.esthe-club.tokyo/images/mc_1_1_3206.jpeg?10',
    profile: '27歳 T.160 B.86(D) W.57 H.85'
  }
];

async function main() {
  console.log('🚀 「東京えすてクラブ」の既存店舗統合とセラピスト再配置を開始します...\n');

  try {
    // 1. 先ほど作った仮ベース店舗を削除
    await supabase.from('shops').delete().eq('id', 'tokyo_setagaya_setagaya_esthe_club');
    
    // 2. 店舗データの更新・作成
    console.log('🏪 店舗データをグループ化して更新・作成中...');
    
    const baseShopData = {
      name: '東京えすてクラブ',
      group_id: GROUP_ID,
      schedule_url: 'https://www.esthe-club.tokyo/schedule/',
      website_url: 'https://www.esthe-club.tokyo/',
      business_hours: '20:00〜05:00',
      price_system: '90分 17,000円～',
      image_url: 'https://placehold.jp/e74c3c/ffffff/400x300.png?text=%E6%9D%B1%E4%BA%AC%E3%81%88%E3%81%99%E3%81%A6%E3%82%AF%E3%83%A9%E3%83%96'
    };

    const shopsToUpsert = [
      { ...baseShopData, id: SHOPS.gakugei, area_id: 'tokyo_meguro_gakugei', raw_data: { prefecture: '東京都', city: '目黒区', area: '学芸大学' } },
      { ...baseShopData, id: SHOPS.komazawa, area_id: 'tokyo_setagaya_komazawa', raw_data: { prefecture: '東京都', city: '世田谷区', area: '駒沢大学' } },
      { ...baseShopData, id: SHOPS.sakura, area_id: 'tokyo_setagaya_sakurashinmachi', raw_data: { prefecture: '東京都', city: '世田谷区', area: '桜新町' } },
      { ...baseShopData, id: SHOPS.yoga, area_id: 'tokyo_setagaya_yoga', raw_data: { prefecture: '東京都', city: '世田谷区', area: '用賀' } } // 新規作成
    ];

    const { error: shopUpsertErr } = await supabase.from('shops').upsert(shopsToUpsert);
    if (shopUpsertErr) throw shopUpsertErr;

    // 3. セラピストの配置
    console.log('⏳ セラピストを各ルーム（店舗）に再配置中...');
    
    // 全店舗のセラピストを一旦クリア
    await supabase.from('therapists').delete().in('shop_id', Object.values(SHOPS));

    const newTherapists = THERAPISTS.map(t => ({
      id: `${t.targetShopId}_${t.name}`,
      shop_id: t.targetShopId,
      name: t.name,
      image_url: t.image_url,
      is_active: true,
      last_seen_at: new Date().toISOString(),
      raw_data: {
        bio: `${t.profile}\n${t.room}`,
        original_name: t.name,
        room: t.room
      }
    }));

    const { error: insertError } = await supabase.from('therapists').insert(newTherapists);
    if (insertError) throw insertError;

    console.log(`\n🎉 完了！既存の3店舗の修正と「用賀」の新規追加を行い、セラピストを各店舗に配置しました。`);
    console.log('共通の group_id が設定されているため、クチコミは統合されます。');
    console.log('ブラウザでスーパーリロードしてご確認ください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
