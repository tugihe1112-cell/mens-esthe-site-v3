import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const MEGURO_SHOP_ID = 'tokyo_meguro_meguro_teacher_secret';
const GOTANDA_SHOP_ID = 'tokyo_shinagawa_gotanda_teacher_secret';
const GROUP_ID = 'g_teacher_secret'; // クチコミを吸収・統合するための共通ID

async function main() {
  console.log('🚀 「女教師の秘め事」の複数エリア展開（目黒・五反田）とクチコミ吸収設定を開始します...\n');

  try {
    // 1. ベースとなる目黒店のデータを取得
    const { data: baseShop, error: baseErr } = await supabase
      .from('shops')
      .select('*')
      .eq('id', MEGURO_SHOP_ID)
      .single();
      
    if (baseErr) throw baseErr;

    // 2. 目黒店と五反田店をグループ化してUpsert（作成・更新）
    console.log('🏪 店舗データをグループ化して更新・作成中...');
    const shopsToUpsert = [
      {
        ...baseShop, // 料金システム(raw_data)やURLをそのまま引き継ぐ
        id: MEGURO_SHOP_ID,
        name: '女教師の秘め事',
        area_id: 'tokyo_meguro_meguro',
        group_id: GROUP_ID
      },
      {
        ...baseShop,
        id: GOTANDA_SHOP_ID,
        name: '女教師の秘め事',
        area_id: 'tokyo_shinagawa_gotanda',
        group_id: GROUP_ID
      }
    ];

    const { error: shopUpsertErr } = await supabase.from('shops').upsert(shopsToUpsert);
    if (shopUpsertErr) throw shopUpsertErr;
    console.log('✅ 目黒店と五反田店の店舗枠を正しく配置し、グループIDを統一しました。');

    // 3. 目黒店に登録済みのセラピスト(17名)を取得
    console.log('\n⏳ 目黒店のセラピストデータを取得中...');
    const { data: therapists, error: tErr } = await supabase
      .from('therapists')
      .select('*')
      .eq('shop_id', MEGURO_SHOP_ID);
      
    if (tErr) throw tErr;

    if (!therapists || therapists.length === 0) {
       console.log('⚠️ セラピストデータが見つかりませんでした。');
       return;
    }
    console.log(`✅ ${therapists.length}名のセラピストを取得しました。五反田店へコピーします。`);

    // 4. 五反田店の古い/重複セラピストを一旦削除（クリーンアップ）
    await supabase.from('therapists').delete().eq('shop_id', GOTANDA_SHOP_ID);

    // 5. 五反田店用にIDを書き換えて一括登録
    const gotandaTherapists = therapists.map(t => {
      return {
        id: `${GOTANDA_SHOP_ID}_${t.name}`,
        shop_id: GOTANDA_SHOP_ID,
        name: t.name,
        image_url: t.image_url,
        is_active: t.is_active,
        last_seen_at: t.last_seen_at,
        raw_data: t.raw_data
      };
    });

    const { error: insertErr } = await supabase.from('therapists').insert(gotandaTherapists);
    if (insertErr) throw insertErr;

    console.log(`\n🎉 完了！五反田店にも ${gotandaTherapists.length} 名のセラピストが完全に同期されました。`);
    console.log('ブラウザでスーパーリロード（Cmd + Shift + R）し、目黒エリア・五反田エリアの双方で正しく表示されるか確認してください！');
    
  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
