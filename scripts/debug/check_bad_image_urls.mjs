import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const isBadImage = (url) => {
  if (!url) return true;
  if (url.includes('shop_icon')) return true;
  const filename = url.split('/').pop().split('?')[0].toLowerCase();
  if (filename.endsWith('.svg')) return true;
  if (filename === 'logo.png' || filename === 'logo.jpg' || filename === 'logo.webp') return true;
  if (/^h+[-_.]?logo\.(png|jpg|webp)$/.test(filename)) return true;
  if (/^header[._-]logo\.(png|jpg|webp)$/.test(filename)) return true;
  if (/apple.?touch.?icon/i.test(filename)) return true;
  if (/spacer/i.test(filename)) return true;
  if (/noimage/i.test(filename)) return true;
  if (/^banner\d+x\d+/i.test(filename)) return true;
  return false;
};

const { data, error } = await supabase.from('shops').select('id, name, website_url, image_url');
if (error) { console.error(error); process.exit(1); }

const bad = data.filter(s => isBadImage(s.image_url));
console.log(`bad image 対象: ${bad.length}件`);
bad.forEach(s => {
  console.log(`${s.id}\t${s.name}\t${s.website_url || '(no URL)'}\t${s.image_url || '(null)'}`);
});
