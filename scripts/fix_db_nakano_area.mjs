import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🚀 DB側の店舗データ（中野区）を「中野」に修正します...');

  // areaが「中野区」かつ cityも「中野区」の店舗を抽出
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, raw_data')
    .eq('raw_data->>area', '中野区')
    .eq('raw_data->>city', '中野区');

  if (error) {
    console.error('❌ エラー:', error.message);
    return;
  }

  console.log(`📊 対象店舗: ${shops.length} 件`);

  for (const shop of shops) {
    const newRawData = { ...shop.raw_data, area: '中野' };
    
    const { error: upErr } = await supabase
      .from('shops')
      .update({ raw_data: newRawData })
      .eq('id', shop.id);

    if (upErr) {
      console.error(`❌ 更新失敗 (${shop.name}):`, upErr.message);
    } else {
      console.log(`✅ 更新完了: ${shop.name}`);
    }
  }
}

main();
