import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // 全角スペースや半角スペースを削除して名前を詰める
  return rawName.replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%MG%',
  searchKeyword2: '%エムジー%',
  fallbackAreaId: 'tokyo_toshima_otsuka', // 大塚エリア
  shopName: '大塚メンズエステMG',
  scheduleUrl: 'https://ootsuka-mg.com/schedule',
  // 画像から抽出した料金システム
  priceSystem: '70MIN ￥10,000\n100MIN ￥15,000\n130MIN ￥19,000\n160MIN ￥23,000'
};

// HTMLから抽出したキャストデータ（5名）
const therapistsRaw = [
  { rawName: '新山　はる', size: '26歳 150cm Icup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/3ddd61c6-d0d6-4425-d587-07042bf02200/member' },
  { rawName: '高松　ここな', size: '19歳 155cm Icup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/58cb1545-95c8-40de-214c-46538e383c00/member' },
  { rawName: '花江　めも', size: '33歳 156cm Mcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/1ae5463a-617c-4873-f0a6-f9318db90b00/member' },
  { rawName: '栗山　よしの', size: '32歳 160cm Hcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/b553b6ac-af3e-4306-8b62-0e18348c7e00/member' },
  { rawName: '山下　あゆみ', size: '29歳 162cm Fcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/fe898cfe-3c70-4c69-51ab-9c18c5d1d900/member' }
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
      .eq('area_id', CONFIG.fallbackAreaId) // 大塚エリア内で検索
      .limit(1);

    if (searchError) throw searchError;

    const targetId = (shops && shops.length > 0) ? shops[0].id : crypto.randomUUID();

    if (shops?.length > 0) {
      console.log(`✅ 既存の「大塚メンズエステMG」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、大塚エリアで新規IDを発行して登録します。`);
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

    console.log('\n🎉 大塚メンズエステMGのデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
