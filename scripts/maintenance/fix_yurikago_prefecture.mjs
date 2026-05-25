import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'shiga_otsu_station_yurikago';

// 現在のraw_dataを確認
const { data } = await supabase.from('shops').select('id, name, raw_data').eq('id', SHOP_ID).single();
console.log('現在のraw_data:');
console.log(JSON.stringify(data?.raw_data, null, 2));

// raw_dataのprefecture/city/areaを京都に修正
const updated = {
  ...data.raw_data,
  prefecture: '京都府',
  city: '京都市',
  area: '四条西洞院',
};

const { error } = await supabase.from('shops').update({ raw_data: updated }).eq('id', SHOP_ID);
console.log(error ? `❌ 更新失敗: ${error.message}` : `✅ prefecture → 京都府 / city → 京都市 / area → 四条西洞院`);
