import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'hyogo_kobe_mrs_moon';

// ルーム料金をメイン設定
const PRICE_SYSTEM = {
  "70": 10000,
  "100": 13000,
  "130": 17000,
  "180": 25000,
};

const { error } = await supabase.from('shops')
  .update({ price_system: PRICE_SYSTEM })
  .eq('id', SHOP_ID);

console.log(error ? `❌ 失敗: ${error.message}` : `✅ price_system設定完了: ${JSON.stringify(PRICE_SYSTEM)}`);
