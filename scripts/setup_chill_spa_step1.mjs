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
  searchKeyword: '%Chill Spa%',
  searchKeyword2: '%ちるスパ%',
  fallbackAreaId: 'tokyo_chiyoda_akihabara', // 秋葉原エリア
  shopName: 'Chill Spa (ちるスパ)',
  scheduleUrl: 'https://chill-spa.com/schedule',
  // ご提示いただいた料金システム
  priceSystem: '70分 14,000円\n100分 18,000円\n130分 23,000円'
};

// HTMLから抽出したキャストデータ（8名＋ダミー枠除外済み）
const therapistsRaw = [
  { rawName: 'あいり', size: '22歳 165cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/496042b6-5af3-425b-2fec-0493e4a1ad00/member' },
  { rawName: 'あやか', size: '21歳 156cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/0e180d7e-7236-4f07-3740-5826da13b600/member' },
  { rawName: 'うみ', size: '24歳 160cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/83340384-37de-4526-4ee5-ba587e42a400/member' },
  { rawName: 'えり', size: '18歳 158cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/b596ac65-8839-4664-9370-fb53ed3b0600/member' },
  { rawName: 'かえで', size: '24歳 163cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/fea9e4ef-df10-4a00-0075-505578ec1400/member' },
  { rawName: 'こと', size: '22歳 158cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/152ff113-9518-4cfe-578c-82f24f69fa00/member' },
  { rawName: 'さな', size: '21歳 174cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/ef5edbc1-b250-4738-ddc8-21eee9b2b500/member' },
  { rawName: 'のあ', size: '21歳 147cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/316d90c3-403e-444d-4f36-8faae245a400/member' },
  { rawName: 'まゆ', size: '25歳 156cm Fcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/30f4097e-16b3-417d-d2e3-ef91976a2700/member' },
  { rawName: 'みな', size: '23歳 171cm Gcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/1da544d4-ffd3-4e07-4bcc-1cc52edd5100/member' },
  { rawName: 'みり', size: '21歳 160cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/6099a762-9f79-4d3e-7865-2c6c374f6900/member' },
  { rawName: 'もも', size: '21歳 160cm Gcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/146d310a-576e-4143-e89e-569fd7750900/member' },
  { rawName: 'らな', size: '20歳 153cm Fcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/ac6e28e3-c64e-4a20-e53d-4eb93a3faf00/member' },
  { rawName: 'かすみ', size: '20歳 153cm Bcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/1c90cc58-2dc5-4dc6-07d9-0ac3d6ba2500/member' },
  { rawName: 'さくら', size: '20歳 153cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/5d8b230d-c391-4b8a-4f7f-57bfbe629600/member' },
  { rawName: 'ひまり', size: '21歳 157cm Bcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/07cbea3a-1f08-40e8-1577-d719d1b39f00/member' },
  { rawName: 'さき', size: '20歳 162cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/91713b29-3adf-4de7-ec94-f58ce2a82200/member' },
  { rawName: 'すい', size: '24歳 154cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/eb2c134d-5f59-448a-216f-f9f489ab5e00/member' },
  { rawName: 'ひなの', size: '23歳 165cm Ecup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/d8dc0270-a775-4587-9693-4bfc476b4300/member' },
  { rawName: 'るな', size: '20歳 160cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/bd1732eb-86f0-4fab-93e2-1d6e5c1ad700/member' },
  { rawName: '◎本日営業時間', size: '', image: '' }, // ※除外対象
  { rawName: '◎営業時間のお知らせ', size: '', image: '' } // ※除外対象
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
      console.log(`✅ 既存の「ちるスパ」枠を発見しました。データを上書きします。`);
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

    // 3. キャストデータの整形とノイズ除外
    const payload = therapistsRaw
      // 名前が「◎」で始まるものはシステム枠として除外
      .filter(t => !t.rawName.startsWith('◎'))
      .map(t => {
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

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました（ダミー枠は除外済み）。`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 Chill Spa(ちるスパ)のデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
