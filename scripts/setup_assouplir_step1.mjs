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
  searchKeyword: '%Assouplir%',
  searchKeyword2: '%アスプリー%',
  fallbackAreaId: 'tokyo_chiyoda_akihabara', // 秋葉原エリア
  shopName: 'Assouplir (アスプリー秋葉原店)',
  scheduleUrl: 'https://assouplir.tokyo/schedule',
  // 画像から抽出した割引適用後の料金システム
  priceSystem: '90min 12,000円\n120min 16,000円\n150min 20,000円\n180min 24,000円'
};

// HTMLから抽出したキャストデータ（16名＋ダミー）
const therapistsRaw = [
  { rawName: '大嶋ゆう', size: '49歳 158cm Fcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/5db62e65-ee9f-4052-5c33-3d0df7697c00/member' },
  { rawName: '咲真あみ', size: '47歳 157cm Ecup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/72e46bb9-4994-4248-99b3-128124e3e700/member' },
  { rawName: '上原るみ', size: '39歳 168cm Fcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/bd3f7187-af9e-4882-ae07-d1102c857f00/member' },
  { rawName: '岬ようこ', size: '43歳 155cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/16cd6dc0-5ebf-4611-cd85-1023d01e8d00/member' },
  { rawName: '松井まりこ', size: '40歳 165cm Gcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/58747d52-8374-4152-5f76-40ea805ed600/member' },
  { rawName: '森崎とうこ', size: '38歳 160cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/23f86e32-44f6-47b0-5480-c1be19cd4300/member' },
  { rawName: '瀬名あいこ', size: '45歳 162cm Fcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/b204b9d2-9051-4701-009e-79791188cb00/member' },
  { rawName: '小林ななこ', size: '47歳 166cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/94716dc6-2a95-42c8-0d3f-3c5573911200/member' },
  { rawName: '松村ことみ', size: '35歳 160cm Gcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/9d3aa38d-e683-4227-91f1-45fb431e9500/member' },
  { rawName: '星野みつき', size: '39歳 156cm Bcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/12551060-4301-4d0c-a3be-b7c3408c2e00/member' },
  { rawName: '三浦あき', size: '37歳 159cm Bcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/01e192d8-2aaa-4990-dd1b-ffe4e64cff00/member' },
  { rawName: '永浜みゆ', size: '42歳 150cm Ecup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/23c56725-1bc6-4de0-3a1d-2748f8c86800/member' },
  { rawName: '田中さとみ', size: '38歳 157cm Fcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/be66f9df-71db-4dd4-82ff-2d8e3b96ca00/member' },
  { rawName: '棚橋みどり', size: '46歳 163cm Hcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/c4424c76-5db7-4d9f-b876-2902a5219a00/member' },
  { rawName: '要ふゆみ', size: '46歳 157cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/647648b6-1551-4c77-67c4-6e8488be3200/member' },
  { rawName: '葵まゆ', size: '32歳 158cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/d7626c49-b85f-4947-2e18-64679cfe3900/member' },
  { rawName: '白石りな', size: '35歳 162cm Fcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/b421ada3-5d43-4a8d-3ee5-6d49f357ad00/member' },
  { rawName: '百瀬きょうこ', size: '41歳 163cm Hcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/76313509-8242-4e33-de35-1315800db200/member' },
  { rawName: '神楽あや', size: '37歳 163cm Hcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/bbd2da24-c53b-4bcd-4ff0-0bfca7798b00/member' },
  { rawName: '一ノ瀬なな', size: '36歳 157cm Ecup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/cb74edd1-c791-4a4f-1831-59f948db5e00/member' },
  { rawName: '新堂もも', size: '33歳 161cm Hcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/73b9bc23-5bd9-43c1-95a3-dfb2398c2300/member' },
  { rawName: '木田ゆり', size: '37歳 157cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/3674b5f3-2d76-439f-1e73-621639d31200/member' },
  { rawName: '浅井めぐみ', size: '43歳 160cm Gcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/3be6d99a-87e8-43f1-c748-c669fe365b00/member' },
  { rawName: '柳瀬いおり', size: '45歳 153cm Icup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/9896d2ef-745a-4eda-5dc1-b91373062400/member' },
  { rawName: '仲田りん', size: '40歳 168cm Hcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/cf9826d3-1677-43a1-fb89-2618cbd83b00/member' },
  { rawName: '鈴木すみれ', size: '45歳 167cm Ecup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/b6de986c-2fd7-4ed0-af53-e130f9680b00/member' },
  { rawName: '宇野じゅりな', size: '37歳 160cm Gcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/bb362738-2d85-41c5-c7fc-e44b403da100/member' },
  { rawName: '水嶋かすみ', size: '48歳 158cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/c40f4eda-fb26-4164-f162-c037d2a7cd00/member' },
  { rawName: '東條つばさ', size: '40歳 155cm Ecup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/977210f0-9f5e-4e40-94f0-ce81692fe400/member' },
  { rawName: '綾瀬みな', size: '39歳 151cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/0027b73a-d7f6-43a0-c7b1-829d85afc700/member' },
  { rawName: '篠原るい', size: '47歳 166cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/5a87b8af-6fb7-4f52-2ee6-ec5db4e66400/member' },
  { rawName: '豊田ゆい', size: '45歳 148cm Ecup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/ea7d6d1b-0a15-4abe-1c85-3cc67e696900/member' },
  { rawName: '日比さくら', size: '41歳 170cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/f0f33561-6b0b-4ad7-333d-e06d8cbe5100/member' },
  { rawName: '橘まい', size: '43歳 163cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/ec68ed05-298c-4e86-77db-291cbded6d00/member' },
  { rawName: '桐島とわこ', size: '49歳 157cm Fcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/65d79142-fad4-42c9-a80d-cdc5ac31d000/member' },
  { rawName: '小野みお', size: '39歳 163cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/b83c17ec-afca-495d-208c-1d3a5a4afb00/member' },
  { rawName: '片桐みほこ', size: '46歳 170cm Ccup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/ee70d623-deee-4370-f7a4-0b15901b2800/member' },
  { rawName: '水城はるか', size: '46歳 164cm Icup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/a2f2128d-8905-4fee-d6be-b0b6e37aac00/member' },
  { rawName: '吉川ゆかり', size: '50歳 167cm Ecup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/136b5c99-a5a6-4608-a33d-2ecc37cdaa00/member' },
  { rawName: '青山ゆう', size: '40歳 161cm Gcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/cd23c34d-d27c-4359-a5e9-53453893a200/member' },
  { rawName: '田宮あゆ', size: '42歳 154cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/969311f0-90c9-424c-fa14-25490a8e8e00/member' },
  { rawName: '岡田さき', size: '43歳 162cm Gcup', image: '//resalon.blob.core.windows.net/release/50beedb4-8f1f-4d6b-bcd5-9c81d1be27de/f26df4e2-a7f9-48ea-9bd3-d87239eb3d02.jpeg' },
  { rawName: '早坂ちか', size: '37歳 154cm Fcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/11fb6563-fdc3-4a8b-70cf-5c8fa5548700/member' },
  { rawName: '白鳥みほ', size: '48歳 159cm Fcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/5eef6516-993b-43d1-70e3-793935af0700/member' },
  { rawName: '岩永えみ', size: '31歳 154cm Dcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/c7ed7ad5-ff3f-4b88-8cf7-4234cd6cc800/member' },
  { rawName: '櫻井はる', size: '48歳 160cm Bcup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/0da075bd-6d6b-4cb2-1627-6ce09ad3f000/member' },
  { rawName: '市川すず', size: '35歳 155cm Icup', image: 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/ebff479c-2080-405b-525e-fdb7fb483800/member' },
  { rawName: 'ルームメンテナンス', size: '', image: '' } // ※除外対象
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
      console.log(`✅ 既存の「アスプリー」枠を発見しました。データを上書きします。`);
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
      .filter(t => !t.rawName.includes('ルームメンテナンス'))
      .map(t => {
        const clean = cleanseName(t.rawName);
        
        // 画像URLがプロトコル省略形(//〜)の場合は補完する
        let imageUrl = t.image?.trim() || null;
        if (imageUrl && imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        }

        return {
          id: `${targetId}_${clean}`,
          shop_id: targetId,
          name: clean,
          image_url: imageUrl,
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

    console.log('\n🎉 Assouplir(アスプリー秋葉原店)のデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
