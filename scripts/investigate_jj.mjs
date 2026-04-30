import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 荻窪の「メンズエステJJ」の画像設定を調査します...\n');

  const targetId = 'tokyo_suginami_ogikubo_mens_esthe_jj';

  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, image_url, raw_data')
    .eq('id', targetId);

  if (error) {
    console.error('❌ エラー:', error.message);
    return;
  }

  if (shops && shops.length > 0) {
    const shop = shops[0];
    console.log(`[店舗名] ${shop.name}`);
    console.log(`[ID] ${shop.id}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`■ 独立カラム (DB)`);
    console.log(`  image_url : ${shop.image_url || 'NULL / 空'}`);
    
    console.log(`\n■ raw_data (JSON)`);
    const raw = shop.raw_data || {};
    console.log(`  image     : ${raw.image || 'UNDEFINED / 空'}`);
    console.log(`  image_url : ${raw.image_url || 'UNDEFINED / 空'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  } else {
    console.log('⚠️ 該当する店舗が見つかりませんでした。');
  }
}
main();
