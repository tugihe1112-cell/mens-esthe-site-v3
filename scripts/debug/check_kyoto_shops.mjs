import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data } = await supabase.from('shops')
  .select('id, name, website_url, image_url, schedule_url, price_system')
  .ilike('id', 'kyoto%')
  .order('id');

console.log(`京都店舗: ${data?.length || 0}件\n`);
data?.forEach(s => {
  const hasUrl = !!s.website_url;
  const hasImg = !!s.image_url;
  const hasSched = !!s.schedule_url;
  const hasPrice = !!s.price_system;
  console.log(`[${hasUrl?'🌐':'  '}][${hasImg?'📸':'  '}][${hasSched?'📅':'  '}][${hasPrice?'💴':'  '}] ${s.id}`);
  console.log(`       ${s.name}`);
  if (s.website_url) console.log(`       ${s.website_url}`);
});
