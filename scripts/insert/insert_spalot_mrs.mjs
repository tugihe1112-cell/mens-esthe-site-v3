/**
 * SPALOT.Mrs セラピスト挿入スクリプト
 * https://spalot-mrs.com/girllist
 * 実行: node scripts/insert/insert_spalot_mrs.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_shinosaka_spalot_mrs';
const WEBSITE_URL = 'https://spalot-mrs.com';
const CAST_URL = 'https://spalot-mrs.com/girllist';
const SCHEDULE_URL = 'https://spalot-mrs.com/daysche';
const PRICE = { "90": 14000, "120": 18000, "150": 23000, "180": 27000 };

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7',
};

// 名前バリデーション
function isValidName(name) {
  if (!name || name.length < 2 || name.length > 12) return false;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return false;
  if (/割引|団体|営業時間|出勤情報|イベント|スケジュール|スタッフ|フォト|ページトップ|トップへ|求人|バナー|インフォ|お知らせ/.test(name)) return false;
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

// 店舗情報更新
console.log('店舗情報更新中...');
const { error: shopErr } = await supabase.from('shops').update({
  website_url: WEBSITE_URL,
  schedule_url: SCHEDULE_URL,
  price_system: PRICE,
}).eq('id', SHOP_ID);
if (shopErr) console.log('⚠️ 店舗更新エラー:', shopErr.message);
else console.log('✅ 店舗情報更新完了');

// キャストページ取得
console.log(`\nキャストページ取得: ${CAST_URL}`);
const res = await fetch(CAST_URL, { headers: ua, signal: AbortSignal.timeout(15000) });
const html = await res.text();
const $ = cheerio.load(html);
console.log(`ステータス: ${res.status}, img数: ${$('img').length}`);

const therapists = [];
const seen = new Set();

// SPALOT.Mrs パターン: alt="愛-あい-" or alt="-美波-みなみ" or alt="明日花-あすか-"
// /pic/girl/ パスの画像のみ対象
$('img[src*="/pic/girl/"]').each((_, el) => {
  const $img = $(el);
  const alt = ($img.attr('alt') || '').trim();
  const src = $img.attr('src') || '';

  // alt から漢字名を抽出: "愛-あい-" → "愛" / "-美波-みなみ" → "美波"
  // パターン: 漢字部分とよみがな部分がハイフンで区切られている
  const nameMatch = alt.match(/^([^-\s]{1,10})-/) || alt.match(/-([^-\s]{1,10})-/);
  const rawName = nameMatch ? nameMatch[1].trim() : '';

  if (!rawName || !isValidName(rawName) || seen.has(rawName)) return;
  // 会社名っぽいものを除外
  if (/スパロット|ミセス|SPALOT/i.test(rawName)) return;
  seen.add(rawName);

  const imgSrc = src.startsWith('http') ? src : new URL(src, WEBSITE_URL).href;

  // 親要素からテキスト取得（年齢・身長があれば）
  const $parent = $img.closest('li, div, article, section');
  const text = $parent.text().replace(/\s+/g, ' ').trim();
  const ageMatch = text.match(/(\d{2,3})\s*歳/) || text.match(/[（(](\d{2,3})[)）]/);
  const heightMatch = text.match(/T\.?\s*(\d{3})/) || text.match(/身長\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i);
  const cupMatch = text.match(/([A-J])\s*(?:カップ|cup)/i);

  therapists.push({
    name: rawName, imgSrc,
    age: ageMatch ? parseInt(ageMatch[1]) : null,
    height: heightMatch ? parseInt(heightMatch[1]) : null,
    cup: cupMatch?.[1]?.toUpperCase() || null,
  });
});

console.log(`\n取得: ${therapists.length}名`);

if (therapists.length === 0) {
  console.log('\n--- デバッグ: img一覧 ---');
  $('img').slice(0, 15).each((i, el) => {
    const $e = $(el);
    console.log(`img[${i}]: src=${($e.attr('src')||'').slice(0,80)} alt=${$e.attr('alt')||''}`);
  });
  console.log('\n--- デバッグ: テキスト含むブロック ---');
  $('li, div, article').filter((_, el) => {
    const t = $(el).text().trim();
    return t.length > 2 && t.length < 50 && /[ぁ-んァ-ヾ一-龯]/.test(t);
  }).slice(0, 10).each((i, el) => {
    console.log(`[${i}] <${el.name} class="${$(el).attr('class')||''}"> ${$(el).text().replace(/\s+/g,' ').trim().slice(0,60)}`);
  });
  console.log('\n→ サイト構造を確認して insert_spalot_mrs.mjs のセレクタを修正してください');
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
  const therapistId = `${SHOP_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
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
