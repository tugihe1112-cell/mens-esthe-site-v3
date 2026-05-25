import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_umeda_bellmadonna';

// セラピスト削除
const { error: e1, count: c1 } = await supabase.from('therapists').delete().eq('shop_id', SHOP_ID).select('id', { count: 'exact', head: true });
if (e1) console.log('therapists削除エラー:', e1.message);
else console.log('therapists削除完了');

// 店舗削除
const { error: e2 } = await supabase.from('shops').delete().eq('id', SHOP_ID);
if (e2) console.log('shops削除エラー:', e2.message);
else console.log('shops削除完了:', SHOP_ID);
