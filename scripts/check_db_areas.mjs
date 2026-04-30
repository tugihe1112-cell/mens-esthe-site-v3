import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 問題のエリアに該当する店舗が、DB内でどう設定されているか調査します...\n');

  const targetAlphabets = [
    'tsuruga', 'ginza', '23wards', 'fuchu', 'gakugei_daigaku', 'jiyugaoka', 
    'nakameguro', 'toritsudaigaku', 'akabanebashi', 'akasaka', 'azabujuban', 
    'hamamatsucho', 'nishiazabu', 'roppongi', 'shinbashi', 'tamachi', 'toranomon'
  ];
  const targetKus = ['千種区', '目黒区', '中野区', '練馬区', '渋谷区', '品川区', '新宿区'];

  const { data: shops, error } = await supabase.from('shops').select('id, name, raw_data');
  if (error) {
    console.error('❌ DBエラー:', error.message);
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔤 【問題①】アルファベット表記の店舗が持っているDBの実際の値');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  targetAlphabets.forEach(alpha => {
    // IDにローマ字が含まれる、またはエリア情報がローマ字の店舗を抽出
    const matched = shops.filter(s => s.id.includes(alpha) || (s.raw_data && s.raw_data.area === alpha));
    
    if (matched.length > 0) {
      const dbValues = new Set();
      matched.forEach(s => {
        const raw = s.raw_data || {};
        dbValues.add(`[area: ${raw.area || '空'}, city: ${raw.city || '空'}]`);
      });
      console.log(`📍 ${alpha.padEnd(15, ' ')} (該当 ${matched.length}件) -> DB値: ${Array.from(dbValues).join(' / ')}`);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏢 【問題②】「〜区」の店舗が持っているDBの実際の値');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  targetKus.forEach(ku => {
    const matched = shops.filter(s => s.id.includes(ku) || (s.raw_data && s.raw_data.area === ku));
    if (matched.length > 0) {
      const dbValues = new Set();
      matched.forEach(s => {
        const raw = s.raw_data || {};
        dbValues.add(`[area: ${raw.area || '空'}, city: ${raw.city || '空'}]`);
      });
      console.log(`📍 ${ku.padEnd(10, ' ')} (該当 ${matched.length}件) -> DB値: ${Array.from(dbValues).join(' / ')}`);
    }
  });
}

main();
