import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase.from('shops').select('id, name, website_url, image_url').ilike('name', '%silk%');
console.log('shops:', JSON.stringify(shops, null, 2));

if (shops?.length) {
  const ids = shops.map(s => s.id);
  const { data: therapists } = await supabase.from('therapists').select('id, name, image_url, shop_id').in('shop_id', ids);
  const withPhoto = therapists?.filter(t => t.image_url).length;
  const noPhoto = therapists?.filter(t => !t.image_url).length;
  console.log(`\nセラピスト総数: ${therapists?.length}, 写真あり: ${withPhoto}, 写真なし: ${noPhoto}`);
  console.log('写真なし一覧:');
  therapists?.filter(t => !t.image_url).forEach(t => console.log(' -', t.name, t.id));
}
