/**
 * 店舗画像設定汎用スクリプト
 * 使い方1: node scripts/insert/fix_shop_logo.mjs <shop_id> <website_url>         # OGP/ロゴ自動検出
 * 使い方2: node scripts/insert/fix_shop_logo.mjs <shop_id> <website_url> <image_url> # 画像URL直接指定
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SHOP_ID = process.argv[2];
const WEBSITE_URL = process.argv[3];
const DIRECT_IMAGE = process.argv[4] || null;

if (!SHOP_ID || !WEBSITE_URL) {
  console.log('使い方: node scripts/insert/fix_shop_logo.mjs <shop_id> <website_url> [image_url]');
  process.exit(1);
}

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

console.log(`[${SHOP_ID}] ${WEBSITE_URL}`);

let imgUrl = DIRECT_IMAGE;

if (!imgUrl) {
  const res = await fetch(WEBSITE_URL, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);
  const og = $('meta[property="og:image"]').attr('content');
  const twitter = $('meta[name="twitter:image"]').attr('content');
  const logoSrc = $('header img, .logo img, #logo img, .header img, #header img').first().attr('src') || '';
  const logoFull = logoSrc ? (logoSrc.startsWith('http') ? logoSrc : new URL(logoSrc, WEBSITE_URL).href) : '';
  imgUrl = og || twitter || logoFull || null;
}

console.log('画像URL:', imgUrl);

if (!imgUrl) {
  console.log('❌ 画像未検出');
  process.exit(1);
}

const imgRes = await fetch(imgUrl, { headers: { ...ua, 'Referer': WEBSITE_URL }, signal: AbortSignal.timeout(10000) });
if (!imgRes.ok) { console.log('❌ 画像取得失敗:', imgRes.status); process.exit(1); }

// Content-Type が画像でなければスキップ（エラー文字列が返ってくるケースを防ぐ）
const contentType = imgRes.headers.get('content-type') || '';
if (!contentType.startsWith('image/')) {
  console.log('❌ 画像ではないレスポンス:', contentType);
  process.exit(1);
}

const buf = Buffer.from(await imgRes.arrayBuffer());

// ファイルサイズが小さすぎる場合はエラー文字列が保存されている可能性がある
if (buf.length < 512) {
  console.log('❌ ファイルサイズ異常 (', buf.length, 'bytes) — 中身:', buf.toString('utf-8').slice(0, 80));
  process.exit(1);
}

const ext = imgUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
const fileName = `${SHOP_ID}.${safeExt}`;

const { error } = await supabase.storage.from('shop-logos')
  .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
if (error) { console.log('❌ アップロードエラー:', error.message); process.exit(1); }

const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(fileName);
await supabase.from('shops').update({ image_url: publicUrl }).eq('id', SHOP_ID);
console.log('✅ 完了:', publicUrl.slice(0, 80));
