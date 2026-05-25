/**
 * シークレットルームヒマワリ セラピスト更新
 * https://sr-himawari.com/cast/
 * 実行: node scripts/insert/insert_sr_himawari.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7',
  'Referer': 'https://sr-himawari.com/',
};

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_umeda_sr_himawari';
const CAST_URL = 'https://sr-himawari.com/cast/';
const WEBSITE_URL = 'https://sr-himawari.com';
// 料金システム（画像表示のため手動設定）
const PRICE_SYSTEM = { "70": 9000, "100": 11000, "130": 15000, "160": 20000 };

async function uploadImage(imageUrl, therapistId) {
  try {
    const cleanUrl = imageUrl.split('?')[0]; // クエリ文字列除去
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
  } catch (e) { return null; }
}

// 店舗情報更新（価格設定）
console.log('店舗情報更新中...');
const { error: shopErr } = await supabase.from('shops').update({ price_system: PRICE_SYSTEM }).eq('id', SHOP_ID);
if (shopErr) console.log('  ⚠️', shopErr.message);
else console.log('  ✅ 料金設定完了:', JSON.stringify(PRICE_SYSTEM));

// キャストページ取得
console.log(`\nキャストページ取得: ${CAST_URL}`);
const res = await fetch(CAST_URL, { headers: ua, signal: AbortSignal.timeout(15000) });
const html = await res.text();
const $ = cheerio.load(html);
console.log(`ステータス: ${res.status}, img数: ${$('img').length}`);

// 既存セラピスト取得
const { data: existing } = await supabase.from('therapists').select('id,name').eq('shop_id', SHOP_ID);
const existingMap = new Map((existing || []).map(t => [t.name.trim(), t.id]));
console.log(`既存: ${existingMap.size}名`);

const SHOP_PREFIX = 'シークレットルームヒマワリ';
const seen = new Set();
const therapists = [];

// alt="シークレットルームヒマワリ 名前" パターン
$(`img[alt^="${SHOP_PREFIX}"]`).each((_, el) => {
  const $img = $(el);
  const alt = $img.attr('alt') || '';
  const name = alt.replace(SHOP_PREFIX, '').trim();
  if (!name || name.length < 2 || name.length > 12) return;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
  if (seen.has(name)) return;
  seen.add(name);

  const src = $img.attr('src') || '';
  const imgSrc = src.startsWith('http') ? src : (src.startsWith('//') ? 'https:' + src : new URL(src, WEBSITE_URL).href);
  if (!/upload\/cast/i.test(imgSrc)) return; // キャスト画像のみ

  // 親要素からテキスト取得（年齢・身長）
  const $parent = $img.closest('li, .cast, .member, article, tr').first()
    || $img.closest('div').first();
  const text = $parent.text().replace(/\s+/g, ' ').trim();
  const ageMatch = text.match(/(\d{2,3})\s*歳/) || text.match(/[（(](\d{2,3})[)）]/) || alt.match(/(\d{2,3})/);
  const heightMatch = text.match(/T\.?\s*(\d{3})/) || text.match(/身長\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
  const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

  therapists.push({ name, imgSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
});

// パターン2: cast画像URLから直接
if (therapists.length === 0) {
  $('img[src*="upload/cast"]').each((_, el) => {
    const $img = $(el);
    const src = $img.attr('src') || '';
    const alt = ($img.attr('alt') || '').replace(SHOP_PREFIX, '').trim();
    if (!alt || alt.length < 2 || seen.has(alt)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(alt)) return;
    seen.add(alt);
    const imgSrc = src.startsWith('http') ? src : (src.startsWith('//') ? 'https:' + src : new URL(src, WEBSITE_URL).href);
    const $parent = $img.closest('li, div, article').first();
    const text = $parent.text().replace(/\s+/g, ' ').trim();
    const heightMatch = text.match(/T\.?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
    therapists.push({ name: alt, imgSrc, age: null, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: null });
  });
}

console.log(`\n取得: ${therapists.length}名`);
therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height}) ${t.imgSrc.slice(0, 60)}`));

if (therapists.length === 0) {
  console.log('\n--- デバッグ ---');
  $('img').slice(0, 10).each((_, el) => {
    const $e = $(el);
    console.log('src:', ($e.attr('src') || '').slice(0, 80), 'alt:', $e.attr('alt') || '');
  });
  process.exit(1);
}

// 既存セラピストのimage_url・身長を更新
let updated = 0, inserted = 0;
for (const t of therapists) {
  const therapistId = existingMap.get(t.name) || `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
  const storedUrl = t.imgSrc ? await uploadImage(t.imgSrc, therapistId) : null;
  const updateData = { id: therapistId, shop_id: SHOP_ID, name: t.name, age: t.age, height: t.height, cup: t.cup, image_url: storedUrl || t.imgSrc || null };
  const { error } = await supabase.from('therapists').upsert(updateData);
  if (!error) {
    if (existingMap.has(t.name)) { updated++; } else { inserted++; }
    process.stdout.write(storedUrl ? '✓' : '.');
  } else {
    console.log(`\n  エラー: ${error.message}`);
  }
}
console.log(`\n✅ 更新: ${updated}名, 新規: ${inserted}名`);
