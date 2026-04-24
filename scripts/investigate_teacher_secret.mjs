import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 「女教師の秘め事」が画面に表示されない原因を調査します...\n');

  try {
    // 1. 女教師の秘め事の店舗データを取得
    const { data: targetShops, error: targetError } = await supabase
      .from('shops')
      .select('*')
      .ilike('name', '%女教師%');

    if (targetError) throw targetError;

    if (!targetShops || targetShops.length === 0) {
      console.log('🔴 【原因判明】「女教師の秘め事」の店舗データ自体がデータベースに存在しません！');
      console.log('   （店舗を新規作成するステップが実行されていないか、エラーになっていた可能性が高いです）');
      return;
    }

    console.log('✅ 店舗データは存在します。詳細を確認します:');
    targetShops.forEach(shop => {
      console.log(`📌 ID: ${shop.id}`);
      console.log(`   名前: ${shop.name}`);
      console.log(`   エリアID: ${shop.area_id === null ? 'null (これが原因かも!)' : shop.area_id}`);
      console.log(`   スケジュールURL: ${shop.schedule_url || 'なし'}`);
    });

    // 2. 正常に表示されているGRACEのデータと比較
    const { data: graceShop } = await supabase
      .from('shops')
      .select('*')
      .eq('id', 'tokyo_meguro_meguro_grace')
      .single();

    if (graceShop) {
      console.log('\n💡 【比較用】正常に表示されている「GRACE」のデータ:');
      console.log(`   エリアID: ${graceShop.area_id}`);
    }

    // 3. セラピストの登録数を確認
    for (const shop of targetShops) {
      const { data: therapists } = await supabase
        .from('therapists')
        .select('id')
        .eq('shop_id', shop.id);
      console.log(`\n👩‍🏫 ${shop.name} のセラピスト登録数: ${therapists ? therapists.length : 0}名`);
      if (therapists && therapists.length === 0) {
          console.log('   （⚠️ セラピストが0名のため、画面に表示されていない可能性があります）');
      }
    }

  } catch (err) {
    console.error('❌ エラーが発生しました:', err);
  }
}

main();
