import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 「RED RIBBON (レッドリボン)」の登録状況を確認します...\n');

  try {
    // 1. locations.js の確認
    const locFile = path.resolve('src/data/locations.js');
    if (fs.existsSync(locFile)) {
      const locData = fs.readFileSync(locFile, 'utf8');
      const nakanoMatch = locData.match(/"中野区":\s*\[.*?\]/);
      if (nakanoMatch) {
        console.log(`✅ locations.js エリアマスター:\n   ${nakanoMatch[0]}`);
      } else {
        console.log('❌ locations.js に「中野区」が見つかりません。');
      }
    }

    console.log('\n--------------------------------------------------\n');

    // 2. 店舗データの確認
    const { data: shops, error: shopErr } = await supabase
      .from('shops')
      .select('id, name, area_id, raw_data')
      .ilike('name', '%RED RIBBON%');

    if (shopErr) throw shopErr;

    if (shops && shops.length > 0) {
      const shop = shops[0];
      console.log(`✅ DB店舗データ: ${shop.name}`);
      console.log(`   - ID: ${shop.id}`);
      console.log(`   - エリア: ${shop.area_id}`);
      console.log(`   - 料金システム登録数: ${shop.raw_data?.system?.length || 0}コース`);
      
      // 3. セラピストデータの確認
      const { count, error: theraErr } = await supabase
        .from('therapists')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id);

      if (theraErr) throw theraErr;

      console.log(`\n✅ 登録セラピスト数: ${count} 名`);

      if (count > 0) {
        const { data: samples } = await supabase
          .from('therapists')
          .select('name')
          .eq('shop_id', shop.id)
          .limit(5);
        console.log(`   (登録例: ${samples.map(s => s.name).join(', ')} ...etc)`);
      }

    } else {
      console.log('❌ DBに「RED RIBBON」が見つかりませんでした。先ほどの登録スクリプトが未実行か、失敗しています。');
    }

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
