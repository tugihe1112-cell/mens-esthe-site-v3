/**
 * 全エリア 未処理店舗 一括自動処理
 * URLが同じ店舗は1回スクレイプ → 全店舗に共有挿入
 * 実行: node scripts/insert/auto_process_all_remaining.mjs [--area=tokyo] [--dry-run]
 *
 * オプション:
 *   --area=tokyo   指定エリアのみ処理 (osaka, kanagawa, miyagi, saitama, kyoto, shiga, shizuoka, tokyo)
 *   --dry-run      実際には挿入せず取得件数のみ表示
 *   --limit=50     処理する最大URL数
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const AREA_FILTER = args.find(a => a.startsWith('--area='))?.split('=')[1] || null;
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '9999');

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
const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

// ============================================================
// ユーティリティ
// ============================================================
function normalizeSize(s) {
  if (!s) return null;
  return String(s).normalize('NFKC').toUpperCase();
}
function extractCup(text) {
  const n = normalizeSize(text);
  const m = n?.match(/([A-J])(?:CUP|カップ)/i);
  return m ? m[1].toUpperCase() : null;
}
function extractAge(text) {
  const m = text.match(/(\d{2,3})\s*歳/) || text.match(/age[\s.:]*(\d{2,3})/i) || text.match(/[（(](\d{2,3})[)）]/);
  return m ? parseInt(m[1]) : null;
}
function extractHeight(text) {
  const m = text.match(/T[．.:]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i) || text.match(/身長[\s:：]*(\d{3})/);
  return m ? parseInt(m[1]) : null;
}

// 名前らしいか判定
const NOISE_WORDS = /はこちら|一覧|登録|予約|お知らせ|分割|ランキング|デリバリー|エステ|アロマ|セラピー|セラピスト|メンズ|スパ|サロン|コース|キャンペーン|プレミアム|フット|マッサージ|ケア|リラクゼーション|ご予約|お問い合わせ|アクセス|価格|料金|求人|募集|施術|公式|ルーム|ポリシー|プライバシー|インフォ|info|会社|法人|copyright|all rights|体入|体験入店|見習い|情報サイト|ナビ$|まとめ|メディア|コチラ|こちら|バナー|部長|キャバ|パブ|ポータル|専門サイト|営業時間|出勤情報|イベント|トップ$|^トップ|割引|団体|情報$|^情報|スケジュール|スタッフ|フォト/i;
function isValidName(name) {
  if (!name || name.length < 2 || name.length > 12) return false;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return false;
  if (NOISE_WORDS.test(name)) return false;
  return true;
}
// 名前のサフィックス除去
function cleanName(name) {
  return name
    .replace(/さんの写真$|の写真$|ちゃんの写真$/, '')
    .replace(/【[^】]*】/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .trim();
}

async function fetchHtml(url, timeout = 12000) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
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

// ============================================================
// CMS別スクレイパー
// ============================================================

// caskan CMS
async function parseCaskan(html, baseUrl) {
  const $ = cheerio.load(html);
  const therapists = [];
  $('li:has(img[src*="caskan/img/cast_tmb"])').each((_, el) => {
    const $el = $(el);
    const img = $el.find('img[src*="caskan/img/cast_tmb"]').first();
    const rawName = cleanName(img.attr('alt')?.trim() || '');
    if (!isValidName(rawName) || /logo|shop|banner/i.test(rawName)) return;
    const imgSrc = img.attr('src') || '';
    const text = $el.text();
    therapists.push({ name: rawName, imgSrc: imgSrc.startsWith('http') ? imgSrc : `https://cdn2-caskan.com${imgSrc}`, age: extractAge(text), height: extractHeight(text), cup: extractCup(text) });
  });
  return therapists;
}

// 3days CMS
async function parse3days(html, siteUrl) {
  // data.jsのURLを複数パターンで探す
  const dataJsMatches = [
    ...html.matchAll(/src=["']([^"']*data\.js[^"'?]*)["'?]/g)
  ].map(m => m[1]);
  if (dataJsMatches.length === 0) return [];

  for (const rawUrl of dataJsMatches) {
    try {
      const dataJsUrl = rawUrl.startsWith('http') ? rawUrl : new URL(rawUrl, siteUrl).href;
      const dataJs = await fetchHtml(dataJsUrl);
      const evalResult = {};
      const stubs = `
        function getTodayFormatDate(s){return '';}
        function getFormatDate(d,s){return '';}
        function formatDate(d){return '';}
        function getNowDate(){return new Date();}
        function getSchedule(){return [];}
        function getScheduleData(){return [];}
        function getToday(){return '';}
        function todayString(){return '';}
        function getHoliday(){return '';}
        function isHoliday(){return false;}
        var moment = function(){return {format:function(){return '';}, isAfter:function(){return false;}}; };
      `;
      // すべてのトップレベル変数をevalResultに代入
      const wrapped = dataJs.replace(/^(?:const|var|let)\s+(\w+)\s*=/mg, (_, v) => `evalResult["${v}"] =`);
      try {
        new Function('evalResult', stubs + wrapped)(evalResult);
      } catch (e2) {
        // eval失敗時はregexで直接therapistName抽出
        const nameMatches = [...dataJs.matchAll(/therapistName\s*:\s*["'「」]([^"'「」,\n]+)["'「」]/g)];
        if (nameMatches.length > 0) {
          return nameMatches.map(m => ({ name: m[1].trim(), imgSrc: '', age: null, height: null, cup: null }))
            .filter(t => isValidName(t.name));
        }
        continue;
      }

      // therapistsキーを再帰的に探す
      function findTherapistArrays(obj, depth = 0) {
        if (depth > 6) return [];
        if (Array.isArray(obj) && obj.length > 0 && obj[0] && typeof obj[0] === 'object') {
          const keys = Object.keys(obj[0]);
          if (keys.some(k => /name|therapist|cast|girl/i.test(k))) return [obj];
        }
        if (typeof obj !== 'object' || !obj) return [];
        const result = [];
        for (const v of Object.values(obj)) result.push(...findTherapistArrays(v, depth + 1));
        return result;
      }

      const arrays = [];
      for (const v of Object.values(evalResult)) arrays.push(...findTherapistArrays(v));

      if (arrays.length === 0) continue;

      // 最も要素数の多い配列を使う
      const arr = arrays.sort((a, b) => b.length - a.length)[0];
      const results = arr.map(t => ({
        name: cleanName((t.therapistName || t.name || t.castName || t.girlName || '').trim()),
        imgSrc: t.img1 || t.img || t.image || t.photo || '',
        age: t.age ? parseInt(t.age) : null,
        height: t.height ? parseInt(t.height) : null,
        cup: (t.threeSize || t.bust || t.cup || '').match(/([A-J])(?:CUP|カップ)?/i)?.[1]?.toUpperCase() || null,
      })).filter(t => isValidName(t.name));

      if (results.length > 0) return results;
    } catch (e) {
      continue;
    }
  }
  return [];
}

// WordPress CMS
async function parseWordPress(html, siteUrl) {
  const $ = cheerio.load(html);
  const therapists = [];

  // セラピストページリンクを探す
  let castUrl = null;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/therapist|cast|lady|staff|girl|セラピスト|在籍/i.test(href + text) && !castUrl) {
      try { castUrl = href.startsWith('http') ? href : new URL(href, siteUrl).href; } catch {}
    }
  });

  const targetUrl = castUrl || siteUrl;
  const tHtml = castUrl ? await fetchHtml(castUrl) : html;
  const $t = cheerio.load(tHtml);

  $t('li:has(img[src*="wp-content/uploads"]), article:has(img[src*="wp-content/uploads"]), div:has(img[src*="wp-content/uploads"])').each((_, el) => {
    const $el = $t(el);
    if ($el.children('li, article').length > 0) return;
    const img = $el.find('img').first();
    const rawAlt = img.attr('alt') || '';
    const rawHeading = $el.find('.name, h3, h4, .cast-name, .staff-name').first().text() || '';
    const name = cleanName(rawAlt || rawHeading);
    if (!isValidName(name)) return;
    const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';
    if (!src) return;
    const text = $el.text();
    therapists.push({
      name, imgSrc: src.startsWith('http') ? src : new URL(src, targetUrl).href,
      age: extractAge(text), height: extractHeight(text), cup: extractCup(text)
    });
  });
  return therapists;
}

// men-es CMS
async function parseMenEs(html, siteUrl) {
  const $ = cheerio.load(html);
  let castUrl = null;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/therapist|cast|lady|staff|girl|セラピスト|在籍/i.test(href + text) && !castUrl) {
      try { castUrl = href.startsWith('http') ? href : new URL(href, siteUrl).href; } catch {}
    }
  });
  if (!castUrl) return [];
  const tHtml = await fetchHtml(castUrl);
  const $t = cheerio.load(tHtml);
  const therapists = [];
  $t('.cast-item, .therapist-item, li.cast, div.cast, article:has(img)').each((_, el) => {
    const $el = $t(el);
    const name = $el.find('.name, .cast-name, h3, h4').first().text().trim();
    if (!name || name.length < 2) return;
    const img = $el.find('img').first();
    const imgSrc = img.attr('src') || img.attr('data-src') || '';
    const text = $el.text();
    therapists.push({ name, imgSrc, age: extractAge(text), height: extractHeight(text), cup: extractCup(text) });
  });
  return therapists;
}

// wcms CMS (テキスト + data-original)
async function parseWcms(html, baseUrl) {
  const $ = cheerio.load(html);
  const therapists = [];
  $('img[data-original]').each((_, el) => {
    const $img = $(el);
    const dataSrc = $img.attr('data-original') || '';
    if (!dataSrc.match(/\.(jpg|jpeg|png|webp)/i)) return;
    const alt = ($img.attr('alt') || '').trim().replace(/\s+/g, '');
    if (!alt || alt.length < 2 || !/[ぁ-んァ-ヾ一-龯]/.test(alt)) return;
    const parent = $img.closest('li, div, article').first();
    const text = parent.text().replace(/\s+/g, ' ').trim();
    const nameMatch = text.match(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/);
    const name = nameMatch?.[1]?.trim() || alt;
    const fullSrc = dataSrc.startsWith('http') ? dataSrc : baseUrl + dataSrc;
    therapists.push({ name, imgSrc: fullSrc, age: extractAge(text), height: extractHeight(text), cup: extractCup(text) });
  });

  // data-original がない場合テキストのみ
  if (therapists.length === 0) {
    const nameMatches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/g)];
    const seen = new Set();
    for (const m of nameMatches) {
      const name = m[1].trim();
      if (seen.has(name) || /プレミアム|セラピー|コース|キャンペーン|ルーム/.test(name)) continue;
      seen.add(name);
      const ctx = html.slice(Math.max(0, html.indexOf(m[0]) - 100), html.indexOf(m[0]) + 200);
      therapists.push({ name, imgSrc: '', age: parseInt(m[2]), height: extractHeight(ctx), cup: extractCup(ctx) });
    }
  }
  return therapists;
}

// 汎用スクレイパー (CMS不明)
async function parseGeneric(html, siteUrl) {
  const $ = cheerio.load(html);
  const therapists = [];

  // セラピストページリンクを探して再取得
  let castUrl = null;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/therapist|cast|lady|staff|girl|セラピスト|在籍|キャスト/i.test(href + text) && !castUrl) {
      try { castUrl = href.startsWith('http') ? href : new URL(href, siteUrl).href; } catch {}
    }
  });

  const targetHtml = castUrl ? await fetchHtml(castUrl).catch(() => html) : html;
  const $t = cheerio.load(targetHtml);

  // jQuery lazyload (data-original)
  $t('img[data-original]').each((_, el) => {
    const $img = $t(el);
    const src = $img.attr('data-original') || '';
    const rawAlt = ($img.attr('alt') || '');
    const alt = cleanName(rawAlt);
    if (!isValidName(alt)) return;
    if (!src.match(/\.(jpg|jpeg|png|webp)/i)) return;
    const parent = $img.closest('li, div, article').first();
    const text = parent.text().replace(/\s+/g, ' ').trim();
    const fullSrc = src.startsWith('http') ? src : new URL(src, castUrl || siteUrl).href;
    therapists.push({ name: alt, imgSrc: fullSrc, age: extractAge(text), height: extractHeight(text), cup: extractCup(text) });
  });

  // 通常img (wp-content, upload, cast, photo等)
  if (therapists.length === 0) {
    $t('img').each((_, el) => {
      const $img = $t(el);
      const src = $img.attr('data-src') || $img.attr('data-lazy-src') || $img.attr('src') || '';
      if (!src.match(/\.(jpg|jpeg|png|webp)/i)) return;
      if (/logo|banner|icon|bg|btn|menu|access|recruit|map|tel|line/i.test(src)) return;
      const rawAlt = ($img.attr('alt') || '');
      const alt = cleanName(rawAlt);
      if (!isValidName(alt)) return;
      const parent = $img.closest('li, div, article').first();
      const text = parent.text().replace(/\s+/g, ' ').trim();
      const ageMatch = text.match(/[（(](\d{2,3})[)）]/) || rawAlt.match(/[（(](\d{2,3})[)）]/);
      if (!ageMatch && !text.match(/[ぁ-んァ-ヾ一-龯]{2,}/)) return;
      const fullSrc = src.startsWith('http') ? src : new URL(src, castUrl || siteUrl).href;
      therapists.push({ name: alt, imgSrc: fullSrc, age: ageMatch ? parseInt(ageMatch[1]) : null, height: extractHeight(text), cup: extractCup(text) });
    });
  }

  // テキストのみ (最終フォールバック)
  if (therapists.length === 0) {
    const allHtml = castUrl ? targetHtml : html;
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
// スケジュールURL検出
// ============================================================
function findScheduleUrl(html, siteUrl) {
  const $ = cheerio.load(html);
  const candidates = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    // スケジュール関連のリンクを検出
    if (/schedule|timetable|シフト|出勤|スケジュール|勤務|カレンダー/i.test(href + text)) {
      try {
        const abs = href.startsWith('http') ? href : new URL(href, siteUrl).href;
        // 同一ドメインのみ
        if (abs.startsWith(new URL(siteUrl).origin)) candidates.push(abs);
      } catch {}
    }
  });

  // 最初に見つかったもの（重複除去）
  return [...new Set(candidates)][0] || null;
}

// ============================================================
// メイン処理
// ============================================================

// 未処理店舗取得
let query = `${supabaseUrl}/rest/v1/shops?website_url=not.is.null&select=id,name,website_url,schedule_url&order=id`;
if (AREA_FILTER) query += `&id=like.${AREA_FILTER}_*`;
const shopsRes = await fetch(query, { headers: h });
const allShops = await shopsRes.json();

// セラピスト数確認
const therapistRes = await fetch(`${supabaseUrl}/rest/v1/therapists?select=shop_id`, { headers: h });
const allTherapists = await therapistRes.json();
const countMap = {};
for (const t of allTherapists) countMap[t.shop_id] = (countMap[t.shop_id] || 0) + 1;

// 未処理店舗のみ抽出
const zeroShops = allShops.filter(s => !countMap[s.id]);
console.log(`未処理店舗: ${zeroShops.length}/${allShops.length}件${AREA_FILTER ? ` [${AREA_FILTER}]` : ''}`);
if (DRY_RUN) console.log('[DRY RUN MODE]');

// URLでグループ化
const urlGroups = new Map();
for (const shop of zeroShops) {
  const url = shop.website_url.replace(/\/$/, '').toLowerCase();
  if (!urlGroups.has(url)) urlGroups.set(url, []);
  urlGroups.get(url).push(shop);
}
console.log(`ユニークURL: ${urlGroups.size}件`);

let processedUrls = 0, totalInserted = 0, totalSkipped = 0, totalFailed = 0;

for (const [url, shops] of urlGroups) {
  if (processedUrls >= LIMIT) break;
  processedUrls++;

  const primaryShop = shops[0];
  const shopNames = shops.map(s => s.id).join(', ');
  console.log(`\n[${processedUrls}/${urlGroups.size}] ${url}`);
  console.log(`  店舗: ${shopNames}`);

  try {
    const siteUrl = primaryShop.website_url;
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

    // 重複除去
    const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
    console.log(`  取得: ${unique.length}名`);
    if (unique.length > 0) {
      unique.slice(0, 3).forEach(t => console.log(`    ${t.name} (${t.age}歳, T${t.height})`));
    }

    if (unique.length === 0) {
      totalFailed++;
      console.log('  ⚠️ 0名 → スキップ');
      continue;
    }

    // スケジュールURL検出
    const scheduleUrl = findScheduleUrl(html, siteUrl);
    if (scheduleUrl) console.log(`  スケジュールURL: ${scheduleUrl}`);

    if (DRY_RUN) {
      console.log(`  [DRY RUN] ${unique.length}名 × ${shops.length}店舗`);
      continue;
    }

    // 全店舗に挿入
    for (const shop of shops) {
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
        if (!error) { inserted++; process.stdout.write('.'); }
      }
      console.log(`\n  [${shop.id}] ${inserted}名挿入`);
      totalInserted += inserted;

      // スケジュールURLを更新（未設定の場合のみ）
      if (scheduleUrl && !shop.schedule_url) {
        const { error: schErr } = await supabase.from('shops')
          .update({ schedule_url: scheduleUrl })
          .eq('id', shop.id);
        if (!schErr) console.log(`  📅 schedule_url設定: ${scheduleUrl}`);
      }
    }
    totalSkipped += (shops.length - 1); // 同URLの2店舗目以降はコピー

  } catch (e) {
    console.log(`  ❌ ${e.message}`);
    totalFailed++;
  }

  // レート制限回避
  await new Promise(r => setTimeout(r, 500));
}

console.log('\n' + '='.repeat(50));
console.log(`完了: ${processedUrls}URL処理, ${totalInserted}名挿入, ${totalFailed}URL失敗`);
