/**
 * 「鈴川ありさ2」など番号付きの重複レコードを削除
 * 実行: node scripts/maintenance/fix_blanca_numbered.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY'));

const ids = [
  'tokyo_chuo_ginza_salon-blanca_鈴川ありさ2',
  'tokyo_chuo_nihonbashi_salon_blanca_鈴川ありさ2',
  'tokyo_shibuya_ebisu_salon_blanca_鈴川ありさ2',
  'tokyo_shibuya_yoyogi_harajuku_salon_blanca_鈴川ありさ2',
  'tokyo_shinjuku_higashishinjuku_salon_blanca_鈴川ありさ2',
  'tokyo_shinjuku_kabukicho_salon_blanca_鈴川ありさ2',
  'tokyo_shinjuku_nishishinjuku_salon_blanca_鈴川ありさ2',
  'tokyo_shinjuku_takadanobaba_salon_blanca_鈴川ありさ2',
  'tokyo_toshima_ikebukuro_salon_blanca_鈴川ありさ2',
];

for (const id of ids) {
  const { error } = await supabase.from('therapists').delete().eq('id', id);
  if (error) console.error(`❌ ${id}:`, error.message);
  else console.log(`✅ 削除: ${id}`);
}

console.log('\n完了');
