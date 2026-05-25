/**
 * 店舗画像一括設定スクリプト
 * website_url が設定済みで image_url が未設定の店舗に対してOGP画像を取得・設定
 * 実行: node scripts/maintenance/bulk_fix_shop_images.mjs
 * オプション: --area=osaka / --area=tokyo など絞り込み可
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const areaArg = process.argv.find(a => a.startsWith('--area='))?.split('=')[1] || null;

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

// 画像なし + website_url あり の店舗を取得
let query = supabase.from('shops')
  .select('id, name, website_url')
  .is('image_url', null)
  .not('website_url', 'is', null);

if (areaArg) query = query.ilike('id', `%${areaArg}%`);

const { data: shops, error } = await query.order('id');
if (error) { console.log('エラー:', error.message); process.exit(1); }

console.log(`対象: ${shops.length}店舗${areaArg ? ` (area=${areaArg})` : ''}\n`);

async function fetchImage(websiteUrl, shopId) {
  try {
    const res = await fetch(websiteUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const og = $('meta[property="og:image"]').attr('content');
    const twitter = $('meta[name="twitter:image"]').attr('content');
    const logoSrc = $('header img, .logo img, #logo img, .header img, #header img').first().attr('src') || '';
    const logoFull = logoSrc ? (logoSrc.startsWith('http') ? logoSrc : new URL(logoSrc, websiteUrl).href) : '';
    return og || twitter || logoFull || null;
  } catch { return null; }
}

async function uploadAndSet(shopId, imgUrl, websiteUrl) {
  try {
    const imgRes = await fetch(imgUrl, {
      headers: { ...ua, 'Referer': websiteUrl },
      signal: AbortSignal.timeout(10000),
    });
    if (!imgRes.ok) return false;
    const contentType = imgRes.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return false;
    const buf = Buffer.from(await imgRes.arrayBuffer());
    if (buf.length < 512) return false; // エラー文字列混入防止
    const ext = imgUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const fileName = `${shopId}.${safeExt}`;
    const { error } = await supabase.storage.from('shop-logos')
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) return false;
    const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(fileName);
    await supabase.from('shops').update({ image_url: publicUrl }).eq('id', shopId);
    return true;
  } catch { return false; }
}

let success = 0, noImg = 0, failed = 0;

for (const shop of shops) {
  process.stdout.write(`[${shop.id}] ${shop.name.slice(0, 20)}... `);
  const imgUrl = await fetchImage(shop.website_url, shop.id);
  if (!imgUrl) {
    console.log('❌ 画像未検出');
    noImg++;
    continue;
  }
  const ok = await uploadAndSet(shop.id, imgUrl, shop.website_url);
  if (ok) {
    console.log('✅');
    success++;
  } else {
    console.log('⚠️ アップロード失敗');
    failed++;
  }
  // レート制限対策
  await new Promise(r => setTimeout(r, 300));
}

console.log(`\n完了: ✅${success} / ❌未検出${noImg} / ⚠️失敗${failed}`);
