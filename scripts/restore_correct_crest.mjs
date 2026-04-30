import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🚀 正しい方の店舗データ（荻窪）の復旧と、空データの削除を開始します...\n');
  try {
    const BAD_ID = 'tokyo_suginami_ogikubo_crest_spa_tokyo';
    const GOOD_ID = 'tokyo_suginami_ogikubo_crest';

    // 1. まず、正しい方の店舗データ（荻窪）を再作成/復旧
    console.log(`🛠️ 正しい店舗データ [${GOOD_ID}] を復旧中...`);
    const { error: insertErr } = await supabase
      .from('shops')
      .upsert({
        id: GOOD_ID,
        name: 'CREST SPA TOKYO (荻窪)',
        website_url: 'https://crestspa-tokyo.com/',
        image_url: 'https://crestspa-tokyo.com/assets/customer/logo-0386ff3dfbb2b738d87fbfc8c016a731da40fff2c9e3e23beeee2a8a75944975.png',
        area_id: 'tokyo_suginami_ogikubo'
      });
    if (insertErr) throw insertErr;

    // 2. もし間違ったID（クレストスパ）にセラピストが紐づいていれば、正しい方に移動
    console.log(`🔄 セラピストデータを正しいIDに移動中...`);
    await supabase.from('therapists').update({ shop_id: GOOD_ID }).eq('shop_id', BAD_ID);

    // 3. 空の方の店舗データを削除
    console.log(`🗑️ 空の店舗データ [${BAD_ID}] を削除中...`);
    await supabase.from('shops').delete().eq('id', BAD_ID);

    // 4. ローカルJSONの同期
    console.log('\n⏳ JSONデータを同期中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log('\n🎉 正常に復旧・整理が完了しました！');
    console.log('残った店舗:', GOOD_ID);
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
