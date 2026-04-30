import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: shops, error } = await supabase.from('shops').select('name, raw_data').limit(1);
  if (error || !shops || shops.length === 0) return;

  const shop = shops[0];
  console.log(`\n🔎 店舗「${shop.name}」の raw_data に存在する全てのキー名:\n`);
  
  if (shop.raw_data) {
    Object.keys(shop.raw_data).forEach(key => {
      let val = shop.raw_data[key];
      let type = Array.isArray(val) ? `配列 (${val.length}件)` : typeof val;
      console.log(` - ${key} : [${type}]`);
    });
  } else {
    console.log('raw_data は空です。');
  }
}
main();
