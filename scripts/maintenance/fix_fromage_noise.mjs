/**
 * Fromage ノイズレコード削除
 * 実行: node scripts/maintenance/fix_fromage_noise.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data, error } = await supabase.from('therapists')
  .delete()
  .eq('shop_id', 'kanagawa_kawasaki_fromage')
  .ilike('name', '%募集%');

if (error) console.log('❌', error.message);
else console.log('✅ ノイズ削除完了');

// 残り確認
const { count } = await supabase.from('therapists')
  .select('id', { count: 'exact', head: true })
  .eq('shop_id', 'kanagawa_kawasaki_fromage');
console.log(`残り: ${count}名`);
