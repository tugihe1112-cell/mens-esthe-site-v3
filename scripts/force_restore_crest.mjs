import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🚀 CREST SPA TOKYO の強制復旧を開始します...\n');
  try {
    const SHOP_ID = 'tokyo_suginami_ogikubo_crest';
    
    console.log('1. データベースへ店舗情報を登録中...');
    const { error: insertErr } = await supabase
      .from('shops')
      .upsert({
        id: SHOP_ID,
        name: 'CREST SPA TOKYO (荻窪)',
        website_url: 'https://crestspa-tokyo.com/',
        image_url: 'https://crestspa-tokyo.com/assets/customer/logo-0386ff3dfbb2b738d87fbfc8c016a731da40fff2c9e3e23beeee2a8a75944975.png',
        area_id: 'tokyo_suginami_ogikubo'
      });

    if (insertErr) {
      console.error('❌ データベース登録エラー（必須項目が足りない可能性があります）:', insertErr.message);
      return;
    }
    console.log('✅ データベース登録成功');

    console.log('\n2. 画面反映のためローカルJSONを更新中...');
    const { data: allShops, error: fetchErr } = await supabase.from('shops').select('*');
    if (fetchErr) throw fetchErr;

    let updatedCount = 0;
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
        console.log(`✅ ${p} を更新しました。`);
        updatedCount++;
      }
    });

    if (updatedCount === 0) {
      console.log('⚠️ shops.json が見つかりませんでしたが、データベースには登録されています。');
    }

    console.log('\n🎉 復旧処理が完了しました！ブラウザをリロードして確認してください。');
  } catch (e) {
    console.error('❌ 予期せぬエラー:', e.message);
  }
}
main();
