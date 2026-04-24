import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // カッコ内のふりがな、全角半角スペースを削除
  return rawName.replace(/（.*?）|\(.*?\)/g, '').replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%Berryz Spa%',
  searchKeyword2: '%ベリーズスパ%',
  fallbackAreaId: 'osaka_osaka_umeda', // 梅田エリア
  shopName: 'Berryz Spa (ベリーズスパ)',
  scheduleUrl: 'https://berryzspa.net/%e3%82%b9%e3%82%b1%e3%82%b8%e3%83%a5%e3%83%bc%e3%83%ab/',
  // 画像から抽出した料金システム（オイルトリートメント / ヒーリングストレッチ）
  priceSystem: '【オイルトリートメント / ヒーリングストレッチ】\n60分 20,000円\n120分 25,000円\n150分 30,000円'
};

// HTMLから抽出したキャストデータ（全4名）
const therapistsRaw = [
  { rawName: '神崎みすず', size: '21歳 T153 B86(E) W58 H85', image: 'https://berryzspa.net/wp-content/uploads/2023/05/kanzaki_2.jpg' },
  { rawName: '清霞(キヨカ)', size: 'T163センチ B89(F) W59 H88', image: 'https://berryzspa.net/wp-content/uploads/2023/07/kiyoka_2.jpg' },
  { rawName: '菅原みさ', size: '23歳 T157 B84(C) W58 H83', image: 'https://berryzspa.net/wp-content/uploads/2023/05/sugawara_2.jpg' },
  { rawName: '西山　未来', size: '25歳 T162 B87(E) W56 H84', image: 'https://berryzspa.net/wp-content/uploads/2023/12/nishiyama_2.jpg' }
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
      console.log(`✅ 既存の「ベリーズスパ」枠を発見しました。全${therapistsRaw.length}名のデータを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、梅田エリアで新規IDを発行して登録します。`);
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

    console.log('\n🎉 Berryz Spa (ベリーズスパ)のデータ登録が完全に完了しました！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
