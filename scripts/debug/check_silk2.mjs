import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: therapists } = await supabase.from('therapists').select('name, image_url').eq('shop_id', 'tokyo_shibuya_silk').limit(5);
for (const t of therapists) {
  console.log(`${t.name}: ${t.image_url}`);
  try {
    const res = await fetch(t.image_url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    console.log(`  → ${res.status} ${res.headers.get('content-type')}`);
  } catch (e) {
    console.log(`  → エラー: ${e.message}`);
  }
}
