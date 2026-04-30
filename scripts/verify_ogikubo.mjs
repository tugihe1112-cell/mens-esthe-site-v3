import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const OGIKUBO_SHOP_ID = 'tokyo_suginami_ogikubo_yorimichi';

async function main() {
  console.log('🔍 「よりみち 荻窪」の登録状況を確認します...\n');

  try {
    // 1. 店舗の確認
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('id, name')
      .eq('id', OGIKUBO_SHOP_ID)
      .single();

    if (shopErr) {
      console.log('❌ 荻窪の店舗データが見つかりません。');
    } else {
      console.log(`✅ 店舗: ${shop.name} (${shop.id})`);
    }

    // 2. セラピストの確認
    const { data: therapists, count, error: theraErr } = await supabase
      .from('therapists')
      .select('name', { count: 'exact' })
      .eq('shop_id', OGIKUBO_SHOP_ID);

    if (theraErr) throw theraErr;

    console.log(`\n✅ 紐づいているセラピスト: 合計 ${count} 名`);
    
    if (count > 0) {
      console.log('--- 登録されているセラピスト一覧 ---');
      therapists.forEach(t => console.log(` - ${t.name}`));
    }

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
