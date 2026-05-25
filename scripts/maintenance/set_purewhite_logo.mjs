import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

const SHOP_ID = 'kyoto_senbon_sanjo_pure_white';
const IMG_URL = 'https://purewhite-aroma.com/upload/back_image/12.png';

const res = await fetch(IMG_URL, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
console.log(`status: ${res.status}, content-type: ${res.headers.get('content-type')}`);
const ct = res.headers.get('content-type') || '';
if (!ct.startsWith('image/')) { console.log('❌ 画像ではない'); process.exit(1); }
const buf = Buffer.from(await res.arrayBuffer());
console.log(`size: ${buf.length} bytes`);

const { error } = await supabase.storage.from('shop-logos').upload(`${SHOP_ID}.png`, buf, { contentType: 'image/png', upsert: true });
if (error) { console.log('❌ Upload error:', error.message); process.exit(1); }

const publicUrl = supabase.storage.from('shop-logos').getPublicUrl(`${SHOP_ID}.png`).data.publicUrl;
const { error: dbErr } = await supabase.from('shops').update({ image_url: publicUrl }).eq('id', SHOP_ID);
console.log(dbErr ? `❌ DB更新失敗` : `✅ 店舗画像設置: ${publicUrl}`);
