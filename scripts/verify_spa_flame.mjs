import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 「スパフレイム (Spa Flame)」と「高円寺」の状況を確認します...\n');

  try {
    // 1. locations.js の確認
    const locFile = path.resolve('src/data/locations.js');
    if (fs.existsSync(locFile)) {
      const locData = fs.readFileSync(locFile, 'utf8');
      
      const suginamiMatch = locData.match(/"杉並区":\s*\[.*?\]/);
      if (suginamiMatch) {
        console.log(`✅ locations.js 杉並区: ${suginamiMatch[0]}`);
      } else {
        console.log('❌ locations.js に「杉並区」が定義されていません。');
      }

      if (locData.includes('高円寺')) {
         console.log('✅ locations.js に「高円寺」が存在します。');
      } else {
         console.log('❌ locations.js に「高円寺」が存在しません。');
      }
    }

    console.log('\n--------------------------------------------------\n');

    // 2. 店舗データの確認
    const { data: shops, error: shopErr } = await supabase
      .from('shops')
      .select('id, name, area_id')
      .ilike('name', '%Spa Flame%');

    if (shopErr) throw shopErr;

    if (shops && shops.length > 0) {
      const shop = shops[0];
      console.log(`✅ DB店舗データ: ${shop.name}`);
      console.log(`   - 現在のID: ${shop.id}`);
      console.log(`   - 登録エリア: ${shop.area_id} (※現在ここが間違っています)`);
      
      // 3. セラピストデータの確認
      const { count, error: theraErr } = await supabase
        .from('therapists')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id);

      if (theraErr) throw theraErr;
      console.log(`\n✅ 紐づいているセラピスト数: ${count} 名`);

    } else {
      console.log('❌ DBに「Spa Flame」が見つかりませんでした。');
    }

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
