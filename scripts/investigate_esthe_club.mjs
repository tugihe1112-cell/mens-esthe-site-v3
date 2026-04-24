import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 【調査】「東京えすてクラブ」が表示されない原因を確認します...\n');

  try {
    // 1. 正常に表示されている店舗（GRACE）のデータを取得
    const { data: validShop, error: validErr } = await supabase
      .from('shops')
      .select('*')
      .eq('id', 'tokyo_meguro_meguro_grace')
      .single();

    if (validErr) throw new Error(`GRACEの取得エラー: ${validErr.message}`);

    // 2. 登録した「東京えすてクラブ」のデータを取得
    const { data: estheClubShops, error: estheClubErr } = await supabase
      .from('shops')
      .select('*')
      .ilike('name', '%東京えすてクラブ%');

    if (estheClubErr) throw new Error(`東京えすてクラブの取得エラー: ${estheClubErr.message}`);

    if (!estheClubShops || estheClubShops.length === 0) {
      console.log('🔴 「東京えすてクラブ」の店舗データ自体が存在しません。');
      return;
    }

    console.log(`✅ ${estheClubShops.length}件の「東京えすてクラブ」データを確認しました。\n`);

    // 3. データの比較と出力
    for (const shop of estheClubShops) {
      console.log(`▼ ID: ${shop.id} のデータチェック`);
      console.log(`  - area_id: ${shop.area_id}`);
      console.log(`  - group_id: ${shop.group_id}`);
      console.log(`  - image_url: ${shop.image_url ? 'あり' : 'null (⚠️表示NGの原因になり得ます)'}`);
      console.log(`  - business_hours: ${shop.business_hours}`);
      console.log(`  - price_system: ${shop.price_system}`);
      
      const raw = shop.raw_data || {};
      console.log('  - raw_data内のエリア情報:');
      console.log(`    prefecture: ${raw.prefecture || '未設定'}`);
      console.log(`    city: ${raw.city || '未設定'}`);
      console.log(`    area: ${raw.area || '未設定'}`);
      
      // セラピスト数チェック
      const { data: therapists } = await supabase
        .from('therapists')
        .select('id')
        .eq('shop_id', shop.id);
      console.log(`  - セラピスト登録数: ${therapists ? therapists.length : 0}名`);
      
      console.log('--------------------------------------------------');
    }

  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}

main();
