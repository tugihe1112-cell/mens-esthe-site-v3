/**
 * 美魔女セラピー大阪 セラピスト挿入
 * https://b-majo.biz/cast/
 * 実行: node scripts/insert/insert_bimajo_therapy.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7',
  'Referer': 'https://b-majo.biz/',
};

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_umeda_bimajo_therapy';
const WEBSITE_URL = 'https://b-majo.biz';
const CAST_URL = 'https://b-majo.biz/cast/';
const SHOP_PREFIX = '美魔女セラピー 大阪 ';

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const urlPath = imageUrl.split('p=')[1]?.split('&')[0] || imageUrl;
    const ext = urlPath.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const fileName = `${therapistId}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buffer, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return publicUrl;
  } catch { return null; }
}

// 既存セラピスト削除（旧サイトのデータをクリア）
console.log('既存セラピスト削除中...');
const { error: delErr } = await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);
if (delErr) console.log('  ⚠️', delErr.message);
else console.log('  ✅ 削除完了');

// キャストページ取得
console.log(`\nキャストページ取得: ${CAST_URL}`);
const res = await fetch(CAST_URL, { headers: ua, signal: AbortSignal.timeout(15000) });
const html = await res.text();
const $ = cheerio.load(html);
console.log(`ステータス: ${res.status}, img数: ${$('img').length}`);

const therapists = [];
const seen = new Set();

// alt="美魔女セラピー 大阪 名前【よみ】" パターン
$(`img[alt^="${SHOP_PREFIX}"]`).each((_, el) => {
  const $img = $(el);
  const alt = $img.attr('alt') || '';
  // プレフィックス除去 + 【よみがな】除去
  const rawName = alt.replace(SHOP_PREFIX, '').replace(/【[^】]*】/g, '').trim();
  if (!rawName || rawName.length < 2 || rawName.length > 12) return;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(rawName)) return;
  if (seen.has(rawName)) return;
  seen.add(rawName);

  const src = $img.attr('src') || '';
  // def/con URL → そのまま使用（画像変換サーバー）
  const imgSrc = src.startsWith('http') ? src : (src.startsWith('//') ? 'https:' + src : new URL(src, WEBSITE_URL).href);
  // アイコン画像はスキップ
  if (/icon_|back_image/i.test(imgSrc)) return;

  // 親li要素からテキスト取得
  const $li = $img.closest('li');
  const text = $li.text().replace(/\s+/g, ' ').trim();
  const ageMatch = text.match(/(\d{2,3})\s*歳/) || text.match(/[（(](\d{2,3})[)）]/);
  const heightMatch = text.match(/T\.?\s*(\d{3})/) || text.match(/身長\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
  const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

  therapists.push({ name: rawName, imgSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: heightMatch ? parseInt(heightMatch[1]) : null, cup: cupMatch?.[1]?.toUpperCase() || null });
});

const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
console.log(`\n取得: ${unique.length}名`);
unique.slice(0, 5).forEach(t => console.log(`  ${t.name} (${t.age}歳, T${t.height})`));

if (unique.length === 0) {
  console.log('\n--- デバッグ ---');
  $('img').slice(0, 10).each((i, el) => {
    const $e = $(el);
    console.log(`img[${i}]: src=${($e.attr('src')||'').slice(0,80)} alt=${$e.attr('alt')||''}`);
  });
  process.exit(1);
}

// 挿入
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

// 店舗画像（OGP）
try {
  const topRes = await fetch(WEBSITE_URL, { headers: ua, signal: AbortSignal.timeout(10000) });
  const topHtml = await topRes.text();
  const ogMatch = topHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || topHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch) {
    const imgUrl = ogMatch[1].startsWith('http') ? ogMatch[1] : new URL(ogMatch[1], WEBSITE_URL).href;
    const imgRes = await fetch(imgUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (imgRes.ok) {
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const ext = imgUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
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
