/**
 * ANAICHI 6ルーム shop登録（areaカラムエラー修正版）
 * 実行: node scripts/maintenance/fix_anaichi_shops.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const GROUP_ID = 'g_brand_anaichi';
const SHOP_IMAGE = 'https://i.gyazo.com/43319dda885f37212cbf4198134640be.png';

const SHOPS = [
  { id: 'tokyo_setagaya_sangenjaya_anaichi', name: 'ANAICHI (三軒茶屋ルーム)', rawArea: '三軒茶屋' },
  { id: 'tokyo_meguro_nakameguro_anaichi',   name: 'ANAICHI (中目黒ルーム)',   rawArea: '中目黒' },
  { id: 'tokyo_shibuya_shibuya_anaichi',     name: 'ANAICHI (渋谷ルーム)',     rawArea: '渋谷' },
  { id: 'tokyo_shibuya_ebisu_anaichi',       name: 'ANAICHI (恵比寿ルーム)',   rawArea: '恵比寿' },
  { id: 'tokyo_chuo_ginza_anaichi',          name: 'ANAICHI (銀座ルーム)',     rawArea: '銀座' },
  { id: 'tokyo_minato_azabujuban_anaichi',   name: 'ANAICHI (麻布十番ルーム)', rawArea: '麻布十番' },
];

for (const s of SHOPS) {
  const { error } = await supabase.from('shops').upsert({
    id: s.id,
    name: s.name,
    group_id: GROUP_ID,
    website_url: 'https://www.anaichi-este.com/',
    schedule_url: 'https://www.anaichi-este.com/schedule/',
    image_url: SHOP_IMAGE,
    raw_data: { prefecture: '東京都', area: s.rawArea },
  }, { onConflict: 'id' });

  if (error) console.error(`✗ ${s.name}: ${error.message}`);
  else console.log(`✅ ${s.id}`);
}
console.log('完了');
