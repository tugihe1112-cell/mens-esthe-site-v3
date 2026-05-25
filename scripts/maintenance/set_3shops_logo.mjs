import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

const shops = [
  { id: 'hyogo_sannomiya_mrs_tenor', base: 'https://esute-tenor.net' },
  { id: 'hyogo_sannomiya_mrs_melty', base: 'https://melty-salon.com' },
  { id: 'hyogo_sannomiya_lemonade',  base: 'https://kobe-es.net' },
];

const candidates = [
  '/user/theme/set1/img/yokologo.png',
  '/user/theme/set1/img/logo.png',
  '/wcms/covers/213.jpg',
  '/wcms/covers/191.jpg',
  '/wcms/covers/200.jpg',
];

async function tryUpload(imageUrl, shopId) {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) { console.log(`  HTTP ${res.status}: ${imageUrl}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) { console.log(`  NG content-type: ${ct}`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) { console.log(`  NG size: ${buf.length}bytes`); return null; }
    console.log(`  OK: ${imageUrl} (${buf.length}bytes, ${ct})`);
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg','jpeg','png','gif','webp'].includes(ext) ? ext : 'jpg';
    const fileName = `${shopId}.${safeExt}`;
    const { error } = await supabase.storage.from('shop-logos')
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { console.log(`  Storage error: ${error.message}`); return null; }
    return supabase.storage.from('shop-logos').getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`  catch: ${e.message}`); return null; }
}

for (const shop of shops) {
  console.log(`\n=== ${shop.id} ===`);
  let done = false;
  for (const path of candidates) {
    const url = `${shop.base}${path}`;
    const stored = await tryUpload(url, shop.id);
    if (stored) {
      const { error } = await supabase.from('shops').update({ image_url: stored }).eq('id', shop.id);
      console.log(error ? `  ❌ DB更新失敗` : `  ✅ 設置: ${stored}`);
      done = true;
      break;
    }
  }
  if (!done) console.log('  ❌ 全候補失敗');
}

console.log('\n完了');
