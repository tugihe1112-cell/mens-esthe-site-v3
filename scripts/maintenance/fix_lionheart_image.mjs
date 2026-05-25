import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const IMAGE_URL = 'https://pwchp.com/images_page/46/EKE2eCELgJTc0oF.jpg';
const { error } = await supabase.from('shops')
  .update({ image_url: IMAGE_URL })
  .eq('id', 'fukuoka_hakata_lion_heart');
if (!error) console.log('✅ Lion Heart shop画像更新完了:', IMAGE_URL);
else console.error('❌', error.message);
