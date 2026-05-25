/**
 * ONE time ショップ画像設定
 * 実行: node scripts/maintenance/fix_onetime_image.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { error } = await supabase.from('shops').update({
  image_url: 'https://onetime-sendai.com/upload/banner/11.jpg',
}).eq('id', 'miyagi_sendai_onetime');

if (error) console.error('❌', error.message);
else console.log('✅ ONE time image_url 設定完了');
