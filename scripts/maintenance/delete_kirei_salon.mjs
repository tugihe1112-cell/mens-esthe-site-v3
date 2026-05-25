/**
 * 綺麗なサロン 削除
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { error: e1 } = await supabase.from('therapists').delete().eq('shop_id', '1117');
if (e1) console.log('⚠️ therapists:', e1.message);
else console.log('✅ therapists削除完了');

const { error: e2 } = await supabase.from('shops').delete().eq('id', '1117');
if (e2) console.log('⚠️ shops:', e2.message);
else console.log('✅ shops削除完了: 綺麗なサロン');
