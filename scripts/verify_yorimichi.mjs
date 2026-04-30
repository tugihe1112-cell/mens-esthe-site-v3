import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 「よりみち (Yorimichi)」の登録状況を確認します...\n');

  try {
    // 1. locations.js の確認
    const locFile = path.resolve('src/data/locations.js');
    if (fs.existsSync(locFile)) {
      const locData = fs.readFileSync(locFile, 'utf8');
      
      const areas = ['吉祥寺', '荻窪', '赤羽'];
      areas.forEach(area => {
        if (locData.includes(area)) {
           console.log(`✅ locations.js に「${area}」が存在します。`);
        } else {
           console.log(`❌ locations.js に「${area}」が存在しません。`);
        }
      });
    }

    console.log('\n--------------------------------------------------\n');

    // 2. 店舗データの確認
    const { data: shops, error: shopErr } = await supabase
      .from('shops')
      .select('id, name, area_id')
      .ilike('name', '%Yorimichi%');

    if (shopErr) throw shopErr;

    if (shops && shops.length > 0) {
      console.log(`✅ DB店舗データが見つかりました（${shops.length}店舗）:`);
      
      for (const shop of shops) {
        console.log(`\n   店舗名: ${shop.name}`);
        console.log(`   - ID: ${shop.id}`);
        console.log(`   - 登録エリア: ${shop.area_id}`);
        
        // 3. セラピストデータの確認
        const { count, error: theraErr } = await supabase
          .from('therapists')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id);

        if (theraErr) throw theraErr;
        console.log(`   - 紐づいているセラピスト数: ${count} 名`);
      }
    } else {
      console.log('❌ DBに「よりみち (Yorimichi)」の店舗が見つかりませんでした。先ほどのスクリプトが未実行か、エラーで止まっています。');
    }

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
