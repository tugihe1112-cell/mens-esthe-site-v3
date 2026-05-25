/**
 * 綺麗なサロン セラピスト挿入スクリプト
 * https://kirei1212.livedoor.blog
 * 実行: node scripts/insert/insert_kirei_salon.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = '1117';
const WEBSITE_URL = 'https://kirei1212.livedoor.blog';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7',
};

function isValidName(name) {
  if (!name || name.length < 2 || name.length > 12) return false;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return false;
  if (/割引|団体|営業時間|出勤情報|イベント|スケジュール|スタッフ|フォト|ページトップ|トップへ|求人|バナー|インフォ|お知らせ|コース|料金|アクセス|プロフィール/.test(name)) return false;
  if (/\t/.test(name)) return false;
  return true;
}

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: { ...ua, 'Referer': WEBSITE_URL }, signal: AbortSignal.timeout(10000) });
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

// 店舗情報確認
const { data: shopData } = await supabase.from('shops').select('id,name,website_url').eq('id', SHOP_ID).single();
console.log(`[店舗] ${shopData?.name || SHOP_ID} (${shopData?.website_url || 'URL未設定'})`);

// livedoor ブログのセラピスト（キャスト）ページを探す
// livedoor blogはカテゴリページにキャスト情報があることが多い
const candidateUrls = [
  `${WEBSITE_URL}/archives/cast/`,
  `${WEBSITE_URL}/archives/category/cast/`,
  `${WEBSITE_URL}/cast/`,
  `${WEBSITE_URL}/staff/`,
  `${WEBSITE_URL}/therapist/`,
  WEBSITE_URL, // トップページ
];

let castHtml = '';
let castUrl = WEBSITE_URL;

for (const url of candidateUrls) {
  try {
    const r = await fetch(url, { headers: ua, signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      castHtml = await r.text();
      castUrl = url;
      console.log(`✅ 取得成功: ${url} (${castHtml.length} bytes)`);
      break;
    }
  } catch {}
}

if (!castHtml) {
  console.log('❌ サイト取得失敗');
  process.exit(1);
}

const $ = cheerio.load(castHtml);
console.log(`img数: ${$('img').length}`);

const therapists = [];
const seen = new Set();

// livedoor blog パターン: 記事ごとにキャスト情報
// 記事タイトル or 見出しに名前、本文にプロフィール

// パターン1: 記事タイトルが名前
$('article, .entry, .article').each((_, el) => {
  const $el = $(el);
  const title = $el.find('h1.entry-title, h2.entry-title, .article-title, h2, h3').first().text().trim();
  const text = $el.text().replace(/\s+/g, ' ').trim();

  const rawName = title.replace(/【[^】]*】/g, '').replace(/[「」『』]/g, '').trim();
  if (!rawName || !isValidName(rawName) || seen.has(rawName)) return;
  seen.add(rawName);

  const $img = $el.find('img').first();
  const src = $img.attr('src') || $img.attr('data-src') || '';
  const imgSrc = src.startsWith('http') ? src : (src.startsWith('//') ? 'https:' + src : src ? new URL(src, WEBSITE_URL).href : '');
  if (/banner|bnr|icon_|logo|ad_/i.test(imgSrc)) return;

  const ageMatch = text.match(/(\d{2,3})\s*歳/) || text.match(/年齢[：:]\s*(\d+)/);
  const heightMatch = text.match(/T\.?\s*(\d{3})/) || text.match(/身長[：:]\s*(\d+)/) || text.match(/(\d{3})\s*cm/i);
  const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

  therapists.push({
    name: rawName, imgSrc,
    age: ageMatch ? parseInt(ageMatch[1]) : null,
    height: heightMatch ? parseInt(heightMatch[1]) : null,
    cup: cupMatch?.[1]?.toUpperCase() || null,
  });
});

// パターン2: alt属性に名前
if (therapists.length === 0) {
  $('img').each((_, el) => {
    const $img = $(el);
    const alt = ($img.attr('alt') || '').trim();
    const src = $img.attr('src') || $img.attr('data-src') || '';
    if (!alt || /logo|banner|bnr|icon/i.test(src)) return;

    const rawName = alt.replace(/【[^】]*】/g, '').trim();
    if (!rawName || !isValidName(rawName) || seen.has(rawName)) return;
    seen.add(rawName);

    const imgSrc = src.startsWith('http') ? src : (src.startsWith('//') ? 'https:' + src : src ? new URL(src, WEBSITE_URL).href : '');
    const $parent = $img.closest('li, div, article');
    const text = $parent.text().replace(/\s+/g, ' ').trim();

    const ageMatch = text.match(/(\d{2,3})\s*歳/) || text.match(/年齢[：:]\s*(\d+)/);
    const heightMatch = text.match(/T\.?\s*(\d{3})/) || text.match(/身長[：:]\s*(\d+)/) || text.match(/(\d{3})\s*cm/i);
    const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

    therapists.push({
      name: rawName, imgSrc,
      age: ageMatch ? parseInt(ageMatch[1]) : null,
      height: heightMatch ? parseInt(heightMatch[1]) : null,
      cup: cupMatch?.[1]?.toUpperCase() || null,
    });
  });
}

console.log(`\n取得: ${therapists.length}名`);

if (therapists.length === 0) {
  console.log('\n--- デバッグ: img一覧 ---');
  $('img').slice(0, 15).each((i, el) => {
    const $e = $(el);
    console.log(`img[${i}]: src=${($e.attr('src')||'').slice(0,80)} alt=${$e.attr('alt')||''}`);
  });
  console.log('\n--- デバッグ: 記事タイトル ---');
  $('h1, h2, h3, .entry-title').slice(0, 10).each((i, el) => {
    console.log(`[${i}] ${$(el).text().trim().slice(0, 60)}`);
  });
  console.log('\n--- デバッグ: カテゴリリンク ---');
  $('a').filter((_, el) => /cast|staff|girl|therapist|キャスト|セラピスト|スタッフ/i.test($(el).attr('href') || $(el).text())).each((i, el) => {
    console.log(`[${i}] href=${$(el).attr('href')} text=${$(el).text().trim().slice(0,30)}`);
  });
  console.log('\n→ サイト構造を確認して insert_kirei_salon.mjs のセレクタを修正してください');
  process.exit(1);
}

therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height}, ${t.cup}カップ)`));

// 既存削除
console.log('\n既存セラピスト削除中...');
const { error: delErr } = await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);
if (delErr) console.log('  ⚠️', delErr.message);
else console.log('  ✅ 削除完了');

// 挿入
let inserted = 0;
for (const t of therapists) {
  const safeName = t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '');
  const therapistId = `${SHOP_ID}_${safeName}`;
  const storedUrl = t.imgSrc ? await uploadImage(t.imgSrc, therapistId) : null;
  const { error } = await supabase.from('therapists').upsert({
    id: therapistId, shop_id: SHOP_ID, name: t.name,
    age: t.age, height: t.height, cup: t.cup,
    image_url: storedUrl || t.imgSrc || null,
  });
  if (!error) { inserted++; process.stdout.write(storedUrl ? '✓' : '.'); }
  else console.log(`\n  エラー: ${error.message}`);
}
console.log(`\n✅ ${inserted}名挿入完了`);

// 店舗画像（OGP）
try {
  const topRes = await fetch(WEBSITE_URL, { headers: ua, signal: AbortSignal.timeout(10000) });
  const topHtml = await topRes.text();
  const og$ = cheerio.load(topHtml);
  const ogImg = og$('meta[property="og:image"]').attr('content');
  if (ogImg) {
    const imgUrl = ogImg.startsWith('http') ? ogImg : new URL(ogImg, WEBSITE_URL).href;
    const imgRes = await fetch(imgUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (imgRes.ok) {
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const ext = imgUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
      const { error } = await supabase.storage.from('shop-logos')
        .upload(`${SHOP_ID}.${safeExt}`, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(`${SHOP_ID}.${safeExt}`);
        await supabase.from('shops').update({ image_url: publicUrl }).eq('id', SHOP_ID);
        console.log(`📸 店舗画像: ${publicUrl.slice(0, 70)}`);
      }
    }
  }
} catch (e) { console.log(`⚠️ 店舗画像: ${e.message}`); }
