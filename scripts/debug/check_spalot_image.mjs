import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data } = await supabase.from('shops')
  .select('id, name, image_url, website_url')
  .eq('id', 'osaka_shinosaka_spalot_mrs')
  .single();

console.log('image_url:', data?.image_url || '❌ 未設定');
console.log('website_url:', data?.website_url || '未設定');

if (data?.image_url) {
  const res = await fetch(data.image_url, { signal: AbortSignal.timeout(8000) });
  console.log('画像アクセス:', res.status, res.ok ? '✅ OK' : '❌ 取得失敗');
  console.log('Content-Type:', res.headers.get('content-type'));
}
