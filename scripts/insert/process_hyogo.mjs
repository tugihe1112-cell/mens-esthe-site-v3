/**
 * 兵庫店舗 処理スクリプト
 * 1. セラピスト自動挿入 (auto_process_all_remaining と同じロジック)
 * 2. 店舗画像 設置
 * 3. price_system / schedule_url 更新
 * 
 * 実行: node scripts/insert/process_hyogo.mjs [--dry-run]
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7',
};

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);
const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

// ============================================================
// ユーティリティ
// ============================================================

async function fetchHtml(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

function extractHeight(text) {
  const m = text.match(/(\d{3})\s*cm/i) || text.match(/T(\d{3})/i);
  return m ? parseInt(m[1]) : null;
}

function extractCup(text) {
  const m = text.match(/([A-Kａ-ｋ][カカップcup]{0,3})/i);
  if (!m) return null;
  const c = m[1][0].toUpperCase();
  return /^[A-K]$/.test(c) ? c : null;
}

function isValidName(name) {
  if (!name || name.length < 2 || name.length > 10) return false;
  if (/^\d+$/.test(name)) return false;
  if (/スタッフ|スタッフ紹介|セラピスト|在籍|詳細|NEW|new|TOP|人気|おすすめ/.test(name)) return false;
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
    const fileName = `${therapistId}.${ext}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return publicUrl;
  } catch { return null; }
}

async function uploadShopLogo(imageUrl, shopId) {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) { console.log(`  店舗画像NG: ${contentType} ${imageUrl}`); return null; }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 512) { console.log(`  店舗画像NG: ファイルサイズ小 ${buffer.length} bytes`); return null; }
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeId = shopId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeId}.${ext}`;
    const { error } = await supabase.storage.from('shop-logos')
      .upload(fileName, buffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(fileName);
    return publicUrl;
  } catch (e) { console.log(`  店舗画像エラー: ${e.message}`); return null; }
}

function findOgpImage(html, siteUrl) {
  const $ = cheerio.load(html);
  const ogImg = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content');
  if (ogImg) {
    try { return ogImg.startsWith('http') ? ogImg : new URL(ogImg, siteUrl).href; } catch {}
  }
  // ロゴ画像を探す
  const logoSelectors = ['img.logo', 'img[class*="logo"]', 'img[src*="logo"]', '#header img', '.header img'];
  for (const sel of logoSelectors) {
    const src = $(sel).first().attr('src');
    if (src) {
      try { return src.startsWith('http') ? src : new URL(src, siteUrl).href; } catch {}
    }
  }
  return null;
}

function findScheduleUrl(html, siteUrl) {
  const $ = cheerio.load(html);
  const candidates = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/schedule|timetable|シフト|出勤|スケジュール|勤務|カレンダー/i.test(href + text)) {
      try {
        const abs = href.startsWith('http') ? href : new URL(href, siteUrl).href;
        if (abs.startsWith(new URL(siteUrl).origin)) candidates.push(abs);
      } catch {}
    }
  });
  return [...new Set(candidates)][0] || null;
}

// ============================================================
// CMS別スクレイパー (auto_process_all_remaining からコピー)
// ============================================================

async function parseCaskan(html, baseUrl) {
  const $ = cheerio.load(html);
  const therapists = [];
  $('li:has(img[src*="caskan/img/cast_tmb"])').each((_, el) => {
    const $el = $(el);
    const img = $el.find('img').first();
    const rawSrc = img.attr('src') || '';
    const rawAlt = img.attr('alt') || '';
    const text = $el.text().replace(/\s+/g, ' ').trim();
    const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || rawAlt.match(/[（(](\d{2,3})[)）]/);
    const nameMatch = rawAlt.match(/^([ぁ-んァ-ヾ一-龯]{2,8})/) || text.match(/^([ぁ-んァ-ヾ一-龯]{2,8})/);
    if (!nameMatch) return;
    const name = nameMatch[1];
    if (!isValidName(name)) return;
    const src = rawSrc.startsWith('http') ? rawSrc : new URL(rawSrc, baseUrl).href;
    therapists.push({ name, imgSrc: src, age: ageMatch ? parseInt(ageMatch[1]) : null, height: extractHeight(text), cup: extractCup(text) });
  });
  return therapists;
}

async function parse3days(html, baseUrl) {
  const $ = cheerio.load(html);
  const therapists = [];
  const castUrl = (() => {
    let u = null;
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (/cast|girl|lady|staff/i.test(href)) {
        try { u = href.startsWith('http') ? href : new URL(href, baseUrl).href; return false; } catch {}
      }
    });
    return u;
  })();
  const targetHtml = castUrl ? await fetchHtml(castUrl).catch(() => html) : html;
  const $t = cheerio.load(targetHtml);
  $t('div.cast-block, li.cast-item, div[class*="cast"], div[class*="girl"]').each((_, el) => {
    const $el = $t(el);
    const img = $el.find('img').first();
    const rawSrc = img.attr('src') || img.attr('data-src') || '';
    const rawAlt = img.attr('alt') || '';
    const text = $el.text().replace(/\s+/g, ' ').trim();
    const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || rawAlt.match(/[（(](\d{2,3})[)）]/);
    const nameMatch = rawAlt.match(/^([ぁ-んァ-ヾ一-龯]{2,8})/) || text.match(/^([ぁ-んァ-ヾ一-龯]{2,8})/);
    if (!nameMatch) return;
    const name = nameMatch[1];
    if (!isValidName(name)) return;
    const src = rawSrc.startsWith('http') ? rawSrc : (rawSrc ? new URL(rawSrc, castUrl || baseUrl).href : '');
    therapists.push({ name, imgSrc: src, age: ageMatch ? parseInt(ageMatch[1]) : null, height: extractHeight(text), cup: extractCup(text) });
  });
  return therapists;
}

async function parseMenEs(html, baseUrl) {
  const $ = cheerio.load(html);
  const therapists = [];
  $('div.cast_list li, ul.cast li').each((_, el) => {
    const $el = $(el);
    const img = $el.find('img').first();
    const rawSrc = img.attr('src') || '';
    const rawAlt = img.attr('alt') || '';
    const text = $el.text().replace(/\s+/g, ' ').trim();
    const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || rawAlt.match(/[（(](\d{2,3})[)）]/);
    const nameMatch = rawAlt.match(/^([ぁ-んァ-ヾ一-龯]{2,8})/) || text.match(/^([ぁ-んァ-ヾ一-龯]{2,8})/);
    if (!nameMatch) return;
    const name = nameMatch[1];
    if (!isValidName(name)) return;
    const src = rawSrc.startsWith('http') ? rawSrc : new URL(rawSrc, baseUrl).href;
    therapists.push({ name, imgSrc: src, age: ageMatch ? parseInt(ageMatch[1]) : null, height: extractHeight(text), cup: extractCup(text) });
  });
  return therapists;
}

async function parseWordPress(html, baseUrl) {
  const $ = cheerio.load(html);
  const therapists = [];
  let castUrl = null;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (/cast|girl|staff|セラピスト|在籍/i.test(href) && !castUrl) {
      try {
        const abs = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        if (abs.includes(new URL(baseUrl).hostname)) { castUrl = abs; return false; }
      } catch {}
    }
  });
  const targetHtml = castUrl ? await fetchHtml(castUrl).catch(() => html) : html;
  const $t = cheerio.load(targetHtml);
  $t('article, .entry, .post, div[class*="cast"], div[class*="staff"], div[class*="girl"], li[class*="cast"]').each((_, el) => {
    const $el = $t(el);
    const img = $el.find('img').first();
    const rawSrc = img.attr('src') || img.attr('data-src') || '';
    const rawAlt = img.attr('alt') || '';
    const text = $el.text().replace(/\s+/g, ' ').trim().slice(0, 300);
    const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || rawAlt.match(/[（(](\d{2,3})[)）]/);
    if (!ageMatch && !text.match(/[ぁ-んァ-ヾ一-龯]{2,}/)) return;
    const nameMatch = rawAlt.match(/^([ぁ-んァ-ヾ一-龯]{2,8})/) || $el.find('h2,h3,h4,.name,.cast-name').first().text().match(/([ぁ-んァ-ヾ一-龯]{2,8})/);
    if (!nameMatch) return;
    const name = nameMatch[1];
    if (!isValidName(name)) return;
    const src = rawSrc ? (rawSrc.startsWith('http') ? rawSrc : new URL(rawSrc, castUrl || baseUrl).href) : '';
    therapists.push({ name, imgSrc: src, age: ageMatch ? parseInt(ageMatch[1]) : null, height: extractHeight(text), cup: extractCup(text) });
  });
  return therapists;
}

async function parseWcms(html, baseUrl) {
  const $ = cheerio.load(html);
  const therapists = [];
  $('div.member_info, li.member_item, div[class*="cast_profile"]').each((_, el) => {
    const $el = $(el);
    const img = $el.find('img').first();
    const rawAlt = img.attr('alt') || '';
    const text = $el.text().replace(/\s+/g, ' ').trim();
    const ageMatch = text.match(/[（(](\d{2,3})[)）]/);
    const nameMatch = rawAlt.match(/^([ぁ-んァ-ヾ一-龯]{2,8})/) || text.match(/^([ぁ-んァ-ヾ一-龯]{2,8})/);
    if (!nameMatch) return;
    const name = nameMatch[1];
    if (!isValidName(name)) return;
    therapists.push({ name, imgSrc: '', age: ageMatch ? parseInt(ageMatch[1]) : null, height: extractHeight(text), cup: extractCup(text) });
  });
  return therapists;
}

async function parseGeneric(html, baseUrl) {
  const $ = cheerio.load(html);
  const therapists = [];
  let castUrl = null;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text();
    if (/cast|girl|staff|セラピスト|在籍|lady|member/i.test(href + text) && !castUrl) {
      try {
        const abs = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        if (abs.includes(new URL(baseUrl).hostname)) { castUrl = abs; return false; }
      } catch {}
    }
  });
  const targetHtml = castUrl ? await fetchHtml(castUrl).catch(() => html) : html;
  const targetBase = castUrl || baseUrl;
  const $t = cheerio.load(targetHtml);

  $t('img[alt]').each((_, el) => {
    const src = $t(el).attr('src') || $t(el).attr('data-src') || '';
    const rawAlt = $t(el).attr('alt') || '';
    const parent = $t(el).parent();
    const text = parent.text().replace(/\s+/g, ' ').trim();
    const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || rawAlt.match(/[（(](\d{2,3})[)）]/);
    if (!ageMatch && !text.match(/[ぁ-んァ-ヾ一-龯]{2,}/)) return;
    const nameMatch = rawAlt.match(/^([ぁ-んァ-ヾ一-龯]{2,8})/);
    if (!nameMatch) return;
    const name = nameMatch[1];
    if (!isValidName(name)) return;
    const fullSrc = src.startsWith('http') ? src : new URL(src, targetBase).href;
    therapists.push({ name, imgSrc: fullSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: extractHeight(text), cup: extractCup(text) });
  });

  // テキストのみフォールバック
  if (therapists.length === 0) {
    const allHtml = targetHtml;
    const nameMatches = [...allHtml.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/g)];
    const seen = new Set();
    for (const m of nameMatches) {
      const name = m[1].trim();
      if (seen.has(name) || !isValidName(name)) continue;
      seen.add(name);
      const ctx = allHtml.slice(Math.max(0, allHtml.indexOf(m[0]) - 100), allHtml.indexOf(m[0]) + 200);
      therapists.push({ name, imgSrc: '', age: parseInt(m[2]), height: extractHeight(ctx), cup: extractCup(ctx) });
    }
  }
  return therapists;
}

// ============================================================
// メイン処理
// ============================================================

const { data: hyogoShops } = await supabase.from('shops')
  .select('id, name, website_url, schedule_url, price_system')
  .ilike('id', 'hyogo%')
  .not('website_url', 'is', null)
  .order('id');

console.log(`兵庫 website_url あり: ${hyogoShops?.length || 0}件\n`);

for (const shop of (hyogoShops || [])) {
  console.log(`\n========================================`);
  console.log(`店舗: ${shop.id}`);
  console.log(`名前: ${shop.name}`);
  console.log(`URL:  ${shop.website_url}`);

  // セラピスト数確認
  const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id);
  if (count > 0) {
    console.log(`  → セラピスト既存: ${count}名 → スキップ`);
    continue;
  }

  try {
    const siteUrl = shop.website_url;
    const html = await fetchHtml(siteUrl);

    // CMS判定
    const cms = html.includes('caskan') ? 'caskan'
      : html.includes('3days') ? '3days'
      : html.includes('men-es.jp') ? 'men-es'
      : html.includes('wp-content') ? 'wordpress'
      : html.includes('wcms') ? 'wcms'
      : 'generic';
    console.log(`  CMS: ${cms}`);

    let therapists = [];
    try {
      if (cms === 'caskan') therapists = await parseCaskan(html, siteUrl);
      else if (cms === '3days') therapists = await parse3days(html, siteUrl);
      else if (cms === 'men-es') therapists = await parseMenEs(html, siteUrl);
      else if (cms === 'wordpress') therapists = await parseWordPress(html, siteUrl);
      else if (cms === 'wcms') therapists = await parseWcms(html, siteUrl);
      else therapists = await parseGeneric(html, siteUrl);
    } catch (e) {
      console.log(`  スクレイプエラー: ${e.message}`);
    }

    const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
    console.log(`  セラピスト取得: ${unique.length}名`);
    if (unique.length > 0) {
      unique.slice(0, 5).forEach(t => console.log(`    ${t.name} (${t.age}歳)`));
      if (unique.length > 5) console.log(`    ...他${unique.length - 5}名`);
    }

    // 店舗画像
    const logoUrl = findOgpImage(html, siteUrl);
    if (logoUrl) console.log(`  店舗画像候補: ${logoUrl}`);

    // スケジュールURL
    const scheduleUrl = findScheduleUrl(html, siteUrl) || shop.schedule_url;
    if (scheduleUrl) console.log(`  スケジュールURL: ${scheduleUrl}`);

    if (DRY_RUN) {
      console.log(`  [DRY RUN] スキップ`);
      continue;
    }

    if (unique.length === 0) {
      console.log('  ⚠️ 0名 → セラピスト挿入スキップ');
    } else {
      // セラピスト挿入
      let inserted = 0;
      for (const t of unique) {
        const therapistId = `${shop.id}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿ぁ-ん]/g, '')}`;
        const imgUrl = t.imgSrc ? (t.imgSrc.startsWith('http') ? t.imgSrc : null) : null;
        const storedUrl = (imgUrl && cms !== 'wcms') ? await uploadImage(imgUrl, therapistId) : null;
        const { error } = await supabase.from('therapists').upsert({
          id: therapistId, shop_id: shop.id, name: t.name,
          age: t.age, height: t.height, cup: t.cup,
          image_url: storedUrl || imgUrl || null,
        });
        if (!error) inserted++;
      }
      console.log(`  ✅ セラピスト挿入: ${inserted}/${unique.length}名`);
    }

    // 店舗画像をアップロード
    if (logoUrl) {
      const storedLogoUrl = await uploadShopLogo(logoUrl, shop.id);
      if (storedLogoUrl) {
        const { error: imgErr } = await supabase.from('shops').update({ image_url: storedLogoUrl }).eq('id', shop.id);
        console.log(imgErr ? `  ❌ 店舗画像更新失敗: ${imgErr.message}` : `  ✅ 店舗画像設置: ${storedLogoUrl}`);
      } else {
        console.log('  ⚠️ 店舗画像アップロード失敗');
      }
    }

    // schedule_url 更新
    if (scheduleUrl && !shop.schedule_url) {
      const { error: schErr } = await supabase.from('shops').update({ schedule_url: scheduleUrl }).eq('id', shop.id);
      console.log(schErr ? `  ❌ schedule_url更新失敗` : `  ✅ schedule_url設定: ${scheduleUrl}`);
    }

  } catch (e) {
    console.log(`  ❌ 処理エラー: ${e.message}`);
  }
}

console.log('\n========================================');
console.log('完了');
