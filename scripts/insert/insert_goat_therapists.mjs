/**
 * GOAT(ゴート) セラピスト挿入 + 店舗情報更新
 * https://goat-osaka.com/cast/
 * 実行: node scripts/insert/insert_goat_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7',
};

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_umeda_goat';
const WEBSITE_URL = 'https://goat-osaka.com';
const SCHEDULE_URL = 'https://goat-osaka.com/schedule/';
const CAST_URL = 'https://goat-osaka.com/cast/';
const PRICE_SYSTEM = { "90": 19000, "120": 24000, "150": 29000, "180": 34000 };

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': ua['User-Agent'], 'Referer': WEBSITE_URL + '/' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const fileName = `${therapistId}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buffer, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return publicUrl;
  } catch { return null; }
}

// 1. 店舗情報更新
console.log(`[${SHOP_ID}] 店舗情報更新中...`);
const { error: shopErr } = await supabase.from('shops').update({
  website_url: WEBSITE_URL,
  schedule_url: SCHEDULE_URL,
  price_system: PRICE_SYSTEM,
}).eq('id', SHOP_ID);
if (shopErr) console.log(`  ⚠️ 店舗更新エラー: ${shopErr.message}`);
else console.log(`  ✅ 店舗情報更新完了`);

// 2. キャストページ取得
console.log(`\nキャストページ取得: ${CAST_URL}`);
const res = await fetch(CAST_URL, { headers: ua, signal: AbortSignal.timeout(15000) });
const html = await res.text();
const $ = cheerio.load(html);

console.log(`ステータス: ${res.status}, img数: $('img').length}`);

const therapists = [];
const seen = new Set();

// alt="G.O.A.T 名前" パターンで全キャストを取得
// 構造: <li> <div.ph><img data-p1="..."></div> <article><h3>名前(年齢)</h3><p class="body">身長 XXX cm</p></article> </li>
$('img[alt^="G.O.A.T "]').each((_, el) => {
  const $img = $(el);
  const alt = ($img.attr('alt') || '').replace(/^G\.O\.A\.T\s+/, '').trim();
  if (!alt || alt.length < 2) return;
  if (seen.has(alt)) return;
  seen.add(alt);

  // data-p1属性から完全な画像URL取得
  const imgSrc = $img.attr('data-p1') || $img.attr('src') || '';

  // li全体のテキストから年齢・身長・カップを取得
  const $li = $img.closest('li');
  const text = $li.text().replace(/\s+/g, ' ').trim();
  const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || text.match(/(\d{2,3})\s*歳/);
  const heightMatch = text.match(/身長\s*(\d{3})/) || text.match(/T\.?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
  const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

  therapists.push({
    name: alt,
    imgSrc: imgSrc.startsWith('http') ? imgSrc : (imgSrc ? new URL(imgSrc, CAST_URL).href : ''),
    age: ageMatch ? parseInt(ageMatch[1]) : null,
    height: heightMatch ? parseInt(heightMatch[1]) : null,
    cup: cupMatch?.[1]?.toUpperCase() || null
  });
});

// パターン2: wp-content画像から
if (therapists.length === 0) {
  $('img[src*="wp-content"], img[src*="upload"], img[src*="cast"], img[src*="girl"], img[src*="photo"]').each((_, el) => {
    const $img = $(el);
    const src = $img.attr('src') || '';
    if (seen.has(src) || /logo|banner|icon|bg|header|footer/i.test(src)) return;
    const alt = ($img.attr('alt') || '').trim();
    if (!alt || alt.length < 2 || !/[ぁ-んァ-ヾ一-龯]/.test(alt)) return;
    const parent = $img.closest('li, div, article, section').first();
    const text = parent.text().replace(/\s+/g, ' ').trim();
    const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || text.match(/(\d{2,3})\s*歳/);
    const heightMatch = text.match(/T\.?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);
    seen.add(src);
    const fullSrc = src.startsWith('http') ? src : new URL(src, CAST_URL).href;
    therapists.push({ name: alt, imgSrc: fullSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
  });
}

// テキストのみフォールバック
if (therapists.length === 0) {
  const matches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/g)];
  const nameSeen = new Set();
  for (const m of matches) {
    const name = m[1].trim();
    if (nameSeen.has(name) || /プレミアム|セラピー|コース|エステ|アロマ/.test(name)) continue;
    nameSeen.add(name);
    const ctx = html.slice(Math.max(0, html.indexOf(m[0]) - 100), html.indexOf(m[0]) + 200);
    const heightMatch = ctx.match(/T\.?\s*(\d{3})/) || ctx.match(/(\d{3})\s*cm/i);
    const cupMatch = ctx.match(/([A-J])\s*(?:カップ|cup)/i);
    therapists.push({ name, imgSrc: '', age: parseInt(m[2]), height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
  }
}

const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
console.log(`\n取得: ${unique.length}名`);
unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height})`));

if (unique.length === 0) {
  // HTMLの構造を出力してデバッグ
  console.log('\n--- デバッグ: 最初の1000文字 ---');
  console.log(html.slice(0, 1000));
  process.exit(1);
}

// 3. セラピスト挿入
let inserted = 0;
for (const t of unique) {
  const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
  const storedUrl = t.imgSrc ? await uploadImage(t.imgSrc, therapistId) : null;
  const { error } = await supabase.from('therapists').upsert({
    id: therapistId, shop_id: SHOP_ID, name: t.name,
    age: t.age, height: t.height, cup: t.cup,
    image_url: storedUrl || t.imgSrc || null,
  });
  if (!error) { inserted++; process.stdout.write('.'); }
  else console.log(`\n  挿入エラー: ${error.message}`);
}
console.log(`\n✅ ${inserted}名挿入完了`);

// 4. 店舗画像も設定（OGP）
try {
  const topRes = await fetch(WEBSITE_URL, { headers: ua, signal: AbortSignal.timeout(10000) });
  const topHtml = await topRes.text();
  const ogMatch = topHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || topHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch) {
    const imgUrl = ogMatch[1].startsWith('http') ? ogMatch[1] : new URL(ogMatch[1], WEBSITE_URL).href;
    // ストレージにアップロード
    const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (imgRes.ok) {
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const ext = imgUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
      const { error: upErr } = await supabase.storage.from('shop-logos')
        .upload(`${SHOP_ID}.${safeExt}`, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(`${SHOP_ID}.${safeExt}`);
        await supabase.from('shops').update({ image_url: publicUrl }).eq('id', SHOP_ID);
        console.log(`📸 店舗画像設定: ${publicUrl.slice(0, 60)}`);
      }
    }
  }
} catch (e) {
  console.log(`⚠️ 店舗画像取得失敗: ${e.message}`);
}
