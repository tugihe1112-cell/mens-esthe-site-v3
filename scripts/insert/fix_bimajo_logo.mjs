import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Referer': 'https://b-majo.biz/' };
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const res = await fetch('https://b-majo.biz', { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);
const og = $('meta[property="og:image"]').attr('content');
const logoSrc = $('header img, .logo img, #logo img').first().attr('src') || '';
const logoFull = logoSrc.startsWith('http') ? logoSrc : (logoSrc ? new URL(logoSrc, 'https://b-majo.biz').href : '');
const imgUrl = og || logoFull || null;
console.log('画像URL:', imgUrl);

if (!imgUrl) { console.log('❌ 画像未検出'); process.exit(1); }

const imgRes = await fetch(imgUrl, { headers: ua });
const buf = Buffer.from(await imgRes.arrayBuffer());
const ext = imgUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
const fileName = `osaka_umeda_bimajo_therapy.${safeExt}`;
const { error } = await supabase.storage.from('shop-logos').upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
if (error) { console.log('❌ アップロードエラー:', error.message); process.exit(1); }
const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(fileName);
await supabase.from('shops').update({ image_url: publicUrl }).eq('id', 'osaka_umeda_bimajo_therapy');
console.log('✅ 店舗画像設定完了:', publicUrl.slice(0, 80));
