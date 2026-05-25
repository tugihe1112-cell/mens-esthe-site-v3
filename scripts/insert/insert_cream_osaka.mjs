/**
 * C.r.e.a.m (クリーム) セラピスト挿入
 * https://cream-osaka.com/
 * 実行: node scripts/insert/insert_cream_osaka.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7',
  'Referer': 'https://cream-osaka.com/',
};

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_tanimachi9_cream';
const WEBSITE_URL = 'https://cream-osaka.com';
const CAST_URL = 'https://cream-osaka.com/therapist.html';
const SCHEDULE_URL = 'https://cream-osaka.com/schedule.html';
// 料金（通常料金ベース）
const PRICE_SYSTEM = { "90": 14000, "120": 19000, "150": 24000 };

const NOISE_WORDS = /はこちら|一覧|登録|予約|お知らせ|ランキング|エステ|アロマ|セラピー|メンズ|スパ|サロン|コース|キャンペーン|マッサージ|リラクゼーション|料金|求人|募集|公式|体入|体験入店|見習い|情報サイト|まとめ|メディア|部長|キャバ|パブ|割引|団体|バナー|こちら|サイト|ページトップ|営業時間|出勤情報|イベント|トップ$|^トップ|アクセス|情報$|スケジュール|スタッフ|フォト/i;
function isValidName(name) {
  if (!name || name.length < 2 || name.length > 12) return false;
  if (/\t/.test(name)) return false;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return false;
  if (NOISE_WORDS.test(name)) return false;
  if (/^【.*】$/.test(name)) return false;
  return true;
}

async function uploadImage(imageUrl, therapistId) {
  try {
    const cleanUrl = imageUrl.split('?')[0];
    const res = await fetch(cleanUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = cleanUrl.split('.').pop()?.toLowerCase() || 'jpg';
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
console.log('店舗情報更新中...');
const { error: shopErr } = await supabase.from('shops').update({
  website_url: WEBSITE_URL, schedule_url: SCHEDULE_URL, price_system: PRICE_SYSTEM
}).eq('id', SHOP_ID);
if (shopErr) console.log('  ⚠️', shopErr.message);
else console.log('  ✅ 完了 料金:', JSON.stringify(PRICE_SYSTEM));

// 2. セラピストページ取得
console.log(`\nセラピストページ取得: ${CAST_URL}`);
const res = await fetch(CAST_URL, { headers: ua, signal: AbortSignal.timeout(15000) });
const html = await res.text();
const $ = cheerio.load(html);
console.log(`ステータス: ${res.status}, img数: ${$('img').length}`);

const therapists = [];
const seen = new Set();

// パターン1: li/article/div構造
$('li, .cast, .therapist, .member, .staff, article').each((_, el) => {
  const $el = $(el);
  const $img = $el.find('img').first();
  const src = $img.attr('src') || $img.attr('data-src') || '';
  if (!src || /logo|banner|icon|btn|header|footer|bg/i.test(src)) return;

  const rawName = ($img.attr('alt') || $el.find('.name, h2, h3, h4, p').first().text()).trim();
  const name = rawName.replace(/さんの写真$|の写真$|ちゃんの写真$/, '').replace(/【[^】]*】/g, '').trim();
  if (!isValidName(name) || seen.has(name)) return;
  seen.add(name);

  const text = $el.text().replace(/\s+/g, ' ').trim();
  const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || text.match(/(\d{2,3})\s*歳/);
  const heightMatch = text.match(/T\.?\s*(\d{3})/) || text.match(/身長\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
  const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

  let imgSrc = src.startsWith('http') ? src : new URL(src, WEBSITE_URL).href;
  therapists.push({ name, imgSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
});

// パターン2: img alt属性
if (therapists.length === 0) {
  $('img').each((_, el) => {
    const $img = $(el);
    const src = $img.attr('src') || '';
    if (/logo|banner|icon|btn|header|footer|bg|noimage/i.test(src)) return;
    const alt = ($img.attr('alt') || '').trim();
    const name = alt.replace(/さんの写真$|の写真$/, '').replace(/【[^】]*】/g, '').trim();
    if (!isValidName(name) || seen.has(name)) return;
    seen.add(name);
    const parent = $img.closest('li, div, article').first();
    const text = parent.text().replace(/\s+/g, ' ').trim();
    const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || text.match(/(\d{2,3})\s*歳/);
    const heightMatch = text.match(/T\.?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);
    let imgSrc = src.startsWith('http') ? src : new URL(src, WEBSITE_URL).href;
    therapists.push({ name, imgSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
  });
}

// パターン3: テキストから名前(年齢)
if (therapists.length === 0) {
  const matches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[　\s][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/g)];
  for (const m of matches) {
    const name = m[1].trim();
    if (!isValidName(name) || seen.has(name)) continue;
    seen.add(name);
    const ctx = html.slice(Math.max(0, html.indexOf(m[0]) - 200), html.indexOf(m[0]) + 300);
    const heightMatch = ctx.match(/T\.?\s*(\d{3})/) || ctx.match(/(\d{3})\s*cm/i);
    const imgMatch = ctx.match(/src=["']([^"']+\.(jpg|jpeg|png|webp)[^"']*)/i);
    let imgSrc = imgMatch ? imgMatch[1] : '';
    if (imgSrc && !imgSrc.startsWith('http')) { try { imgSrc = new URL(imgSrc, WEBSITE_URL).href; } catch {} }
    therapists.push({ name, imgSrc, age: parseInt(m[2]), height: heightMatch ? parseInt(heightMatch[1]) : null, cup: null });
  }
}

const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
console.log(`\n取得: ${unique.length}名`);
unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height})`));

if (unique.length === 0) {
  console.log('\n--- デバッグ: HTML構造 ---');
  $('img').slice(0, 8).each((i, el) => {
    const $e = $(el);
    console.log(`img[${i}]: src=${($e.attr('src')||'').slice(0,70)} alt=${$e.attr('alt')||''}`);
  });
  console.log('\nHTML先頭:', html.slice(0, 1000));
  process.exit(1);
}

// 3. 挿入
let inserted = 0;
for (const t of unique) {
  const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
  const storedUrl = t.imgSrc ? await uploadImage(t.imgSrc, therapistId) : null;
  const { error } = await supabase.from('therapists').upsert({
    id: therapistId, shop_id: SHOP_ID, name: t.name, age: t.age, height: t.height, cup: t.cup,
    image_url: storedUrl || t.imgSrc || null,
  });
  if (!error) { inserted++; process.stdout.write(storedUrl ? '✓' : '.'); }
  else console.log(`\n  エラー: ${error.message}`);
}
console.log(`\n✅ ${inserted}名挿入完了`);

// 4. 店舗画像
try {
  const topRes = await fetch(WEBSITE_URL, { headers: ua, signal: AbortSignal.timeout(10000) });
  const topHtml = await topRes.text();
  const $t = cheerio.load(topHtml);
  const ogImg = $t('meta[property="og:image"]').attr('content');
  const logoSrc = $t('header img, .logo img, #logo img, .header img').first().attr('src');
  const logoUrl = ogImg || (logoSrc ? (logoSrc.startsWith('http') ? logoSrc : new URL(logoSrc, WEBSITE_URL).href) : null);
  if (logoUrl) {
    const imgRes = await fetch(logoUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (imgRes.ok) {
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
      const { error } = await supabase.storage.from('shop-logos').upload(`${SHOP_ID}.${safeExt}`, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(`${SHOP_ID}.${safeExt}`);
        await supabase.from('shops').update({ image_url: publicUrl }).eq('id', SHOP_ID);
        console.log(`📸 店舗画像: ${publicUrl.slice(0, 70)}`);
      }
    }
  }
} catch (e) { console.log(`⚠️ 店舗画像: ${e.message}`); }
