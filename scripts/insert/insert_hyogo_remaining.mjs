/**
 * 兵庫 残り2店舗 セラピスト挿入
 * - 神戸エスリノ: /girl ページ、alt="名前(読み)" 形式
 * - ミセスムーンR: /gals/ ページ、wcms構造を個別解析
 *
 * 実行: node scripts/insert/insert_hyogo_remaining.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7',
};

async function fetchHtml(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

function extractHeight(text) {
  const m = text.match(/(\d{3})\s*cm/i) || text.match(/T(\d{3})/i) || text.match(/身長[：:]?\s*(\d{3})/);
  return m ? parseInt(m[1]) : null;
}

function extractCup(text) {
  const m = text.match(/([A-Kａ-ｋ])\s*[カカップcup]/i) || text.match(/カップ\s*([A-Kａ-ｋ])/i);
  if (!m) return null;
  const c = m[1].toUpperCase();
  return /^[A-K]$/.test(c) ? c : null;
}

function isValidName(name) {
  if (!name || name.length < 2 || name.length > 10) return false;
  if (/^\d+$/.test(name)) return false;
  if (/スタッフ|セラピスト|在籍|詳細|NEW|TOP|人気|おすすめ|一覧|予約|電話|メンズ|エステ|三宮|神戸/.test(name)) return false;
  return true;
}

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 512) return null;
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg','jpeg','png','gif','webp'].includes(ext) ? ext : 'jpg';
    const fileName = `${therapistId}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buffer, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return publicUrl;
  } catch { return null; }
}

// ============================================================
// 神戸エスリノ
// ============================================================
console.log('=== 神戸エスリノ (eslino-kobe.com/girl) ===');
const ESLINO_ID = 'hyogo_ninomiya_eslino';
const eslinoGirlHtml = await fetchHtml('https://eslino-kobe.com/girl').catch(e => { console.log('取得失敗:', e.message); return ''; });

const eslinoTherapists = [];
if (eslinoGirlHtml) {
  const $ = cheerio.load(eslinoGirlHtml);
  $('img[alt]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || $(el).attr('data-src') || '';

    // alt形式: "名前(よみ)" または "名前（よみ）"
    const nameMatch = alt.match(/^([ぁ-んァ-ヾ一-龯々]{2,8})[（(]/);
    if (!nameMatch) return;
    const name = nameMatch[1];
    if (!isValidName(name)) return;

    // 親要素のテキストから年齢・スペックを取得
    const parent = $(el).closest('li, div, article');
    const text = parent.text().replace(/\s+/g, ' ').trim();
    const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || alt.match(/\d{2,3}/);
    const age = ageMatch ? parseInt(ageMatch[1]) : null;

    const fullSrc = src.startsWith('http') ? src : (src ? new URL(src, 'https://eslino-kobe.com/').href : '');

    // 重複チェック（名前ベース）
    if (eslinoTherapists.some(t => t.name === name)) return;
    eslinoTherapists.push({ name, age, height: extractHeight(text), cup: extractCup(text), imgSrc: fullSrc });
  });

  // フォールバック: /profile?lid=xxx リンクから個別取得（件数が少ない場合）
  if (eslinoTherapists.length < 3) {
    console.log('直接画像パース不足 → プロフィールリンクから取得試行');
    const profileLinks = new Set();
    $('a[href*="/profile"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('lid=')) profileLinks.add(href.startsWith('http') ? href : `https://eslino-kobe.com${href}`);
    });
    console.log(`プロフィールリンク: ${profileLinks.size}件`);

    for (const profileUrl of [...profileLinks].slice(0, 30)) {
      try {
        const profHtml = await fetchHtml(profileUrl);
        const $p = cheerio.load(profHtml);
        const nameEl = $p('h1, h2, .name, .cast-name').first().text().trim();
        const nameMatch2 = nameEl.match(/([ぁ-んァ-ヾ一-龯々]{2,8})/);
        if (!nameMatch2) continue;
        const name = nameMatch2[1];
        if (!isValidName(name) || eslinoTherapists.some(t => t.name === name)) continue;
        const profText = $p('body').text().replace(/\s+/g, ' ');
        const ageMatch2 = profText.match(/[（(年齢](\d{2,3})[)）歳]/);
        const imgSrc = $p('img[src*="/photos/"]').first().attr('src') || '';
        const fullSrc2 = imgSrc.startsWith('http') ? imgSrc : `https://eslino-kobe.com${imgSrc}`;
        eslinoTherapists.push({
          name,
          age: ageMatch2 ? parseInt(ageMatch2[1]) : null,
          height: extractHeight(profText),
          cup: extractCup(profText),
          imgSrc: fullSrc2,
        });
        process.stdout.write('.');
      } catch {}
    }
    console.log('');
  }
}

console.log(`  取得: ${eslinoTherapists.length}名`);
eslinoTherapists.slice(0, 5).forEach(t => console.log(`    ${t.name} (${t.age}歳) ${t.imgSrc ? '📷' : ''}`));
if (eslinoTherapists.length > 5) console.log(`    ...他${eslinoTherapists.length - 5}名`);

if (!DRY_RUN && eslinoTherapists.length > 0) {
  let inserted = 0;
  for (const t of eslinoTherapists) {
    const therapistId = `${ESLINO_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const imgUrl = t.imgSrc && t.imgSrc.startsWith('http') ? t.imgSrc : null;
    const storedUrl = imgUrl ? await uploadImage(imgUrl, therapistId) : null;
    const { error } = await supabase.from('therapists').upsert({
      id: therapistId, shop_id: ESLINO_ID, name: t.name,
      age: t.age, height: t.height, cup: t.cup,
      image_url: storedUrl || imgUrl || null,
    });
    if (!error) inserted++;
  }
  console.log(`  ✅ 挿入: ${inserted}/${eslinoTherapists.length}名`);
} else if (DRY_RUN) {
  console.log('  [DRY RUN]');
}

// ============================================================
// ミセスムーンR
// ============================================================
console.log('\n=== ミセスムーンR (/gals/) ===');
const MOON_ID = 'hyogo_kobe_mrs_moon';
const moonGalsHtml = await fetchHtml('https://moor-kobe.jp/gals/').catch(e => { console.log('取得失敗:', e.message); return ''; });

const moonTherapists = [];
if (moonGalsHtml) {
  const $ = cheerio.load(moonGalsHtml);

  // 構造確認
  console.log('  ページ内img数:', $('img').length);
  console.log('  wcms/covers img数:', $('img[src*="wcms/covers"]').length);

  // wcmsのコアパターン: .cast_profile, .gal_info, li.gal_item など
  const blockSelectors = [
    '.gal_item', '.cast_item', '.girl_item',
    'li:has(img[src*="wcms/covers"])',
    'div:has(img[src*="wcms/covers"])',
    '.member', '.cast_block',
  ];

  for (const sel of blockSelectors) {
    const found = $(sel);
    if (found.length > 0) {
      console.log(`  セレクタ "${sel}": ${found.length}件`);
      found.each((_, el) => {
        const $el = $(el);
        const img = $el.find('img').first();
        const rawSrc = img.attr('src') || '';
        const rawAlt = img.attr('alt') || '';
        const text = $el.text().replace(/\s+/g, ' ').trim().slice(0, 200);
        const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || rawAlt.match(/[（(](\d{2,3})[)）]/);
        const nameMatch = rawAlt.match(/^([ぁ-んァ-ヾ一-龯々]{2,8})/)
          || $el.find('.name,.cast-name,h3,h4').first().text().match(/([ぁ-んァ-ヾ一-龯々]{2,8})/);
        if (!nameMatch) return;
        const name = nameMatch[1];
        if (!isValidName(name) || moonTherapists.some(t => t.name === name)) return;
        const fullSrc = rawSrc ? (rawSrc.startsWith('http') ? rawSrc : new URL(rawSrc, 'https://moor-kobe.jp/').href) : '';
        moonTherapists.push({ name, age: ageMatch ? parseInt(ageMatch[1]) : null, height: extractHeight(text), cup: extractCup(text), imgSrc: fullSrc });
      });
      if (moonTherapists.length > 0) break;
    }
  }

  // フォールバック: alt属性から直接パース
  if (moonTherapists.length === 0) {
    console.log('  → フォールバック: img[alt]から直接パース');
    $('img[alt]').each((_, el) => {
      const alt = $(el).attr('alt') || '';
      const src = $(el).attr('src') || '';
      const nameMatch = alt.match(/^([ぁ-んァ-ヾ一-龯々]{2,8})/);
      if (!nameMatch) return;
      const name = nameMatch[1];
      if (!isValidName(name) || moonTherapists.some(t => t.name === name)) return;
      const parent = $(el).closest('li, div, article');
      const text = parent.text().replace(/\s+/g, ' ').trim();
      const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || alt.match(/[（(](\d{2,3})[)）]/);
      const fullSrc = src ? (src.startsWith('http') ? src : new URL(src, 'https://moor-kobe.jp/').href) : '';
      moonTherapists.push({ name, age: ageMatch ? parseInt(ageMatch[1]) : null, height: extractHeight(text), cup: extractCup(text), imgSrc: fullSrc });
    });
  }

  // テキストのみ最終フォールバック
  if (moonTherapists.length === 0) {
    console.log('  → テキストパターンでフォールバック');
    const allHtml = moonGalsHtml;
    const nameMatches = [...allHtml.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/g)];
    const seen = new Set();
    for (const m of nameMatches) {
      const name = m[1].trim();
      if (seen.has(name) || !isValidName(name)) continue;
      seen.add(name);
      const ctx = allHtml.slice(Math.max(0, allHtml.indexOf(m[0]) - 100), allHtml.indexOf(m[0]) + 200);
      moonTherapists.push({ name, imgSrc: '', age: parseInt(m[2]), height: extractHeight(ctx), cup: extractCup(ctx) });
    }
  }

  // デバッグ: /gals/ ページのHTML構造を一部表示
  if (moonTherapists.length === 0) {
    console.log('\n  ★ /gals/ HTML構造 (先頭2000文字):');
    console.log(moonGalsHtml.slice(0, 2000));
  }
}

console.log(`  取得: ${moonTherapists.length}名`);
moonTherapists.slice(0, 5).forEach(t => console.log(`    ${t.name} (${t.age}歳) ${t.imgSrc ? '📷' : ''}`));
if (moonTherapists.length > 5) console.log(`    ...他${moonTherapists.length - 5}名`);

if (!DRY_RUN && moonTherapists.length > 0) {
  let inserted = 0;
  for (const t of moonTherapists) {
    const therapistId = `${MOON_ID}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
    const imgUrl = t.imgSrc && t.imgSrc.startsWith('http') ? t.imgSrc : null;
    const storedUrl = imgUrl ? await uploadImage(imgUrl, therapistId) : null;
    const { error } = await supabase.from('therapists').upsert({
      id: therapistId, shop_id: MOON_ID, name: t.name,
      age: t.age, height: t.height, cup: t.cup,
      image_url: storedUrl || imgUrl || null,
    });
    if (!error) inserted++;
  }
  console.log(`  ✅ 挿入: ${inserted}/${moonTherapists.length}名`);
} else if (DRY_RUN) {
  console.log('  [DRY RUN]');
} else {
  console.log('  ⚠️ 0名 → 手動確認が必要');
}

console.log('\n完了');
