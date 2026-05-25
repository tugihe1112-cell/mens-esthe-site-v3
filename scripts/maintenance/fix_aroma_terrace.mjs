/**
 * Aroma Terrace: website_url / shop画像 / schedule_url 設定
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const SHOP_ID = 'aichi_yabacho_aroma_terrace';
const BASE = 'https://aroma-terrace.men-este.com';
const LOGO = `${BASE}/img/logo.png`;

// ロゴ画像をStorageにアップロード
let imageUrl = LOGO;
try {
  const res = await fetch(LOGO, { headers: ua, signal: AbortSignal.timeout(10000) });
  if (res.ok) {
    const ct = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());
    if (ct.startsWith('image/') && buf.length > 512) {
      const { error } = await supabase.storage.from('shop-logos')
        .upload(`${SHOP_ID}.png`, buf, { contentType: 'image/png', upsert: true });
      if (!error) {
        imageUrl = supabase.storage.from('shop-logos').getPublicUrl(`${SHOP_ID}.png`).data.publicUrl;
      }
    }
  }
} catch {}

const { error } = await supabase.from('shops').update({
  website_url: BASE,
  image_url: imageUrl,
  schedule_url: `${BASE}/schedule.html`,
}).eq('id', SHOP_ID);

if (error) {
  console.log(`❌ 更新失敗: ${error.message}`);
} else {
  console.log(`✅ website_url: ${BASE}`);
  console.log(`✅ image_url: ${imageUrl.slice(0, 70)}`);
  console.log(`✅ schedule_url: ${BASE}/schedule.html`);
  console.log('（セラピストはJS描画のためスキップ）');
}
