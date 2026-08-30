/**
 * 本番のサイトマップ掲載ページと、そこから辿れる内部リンクを横断監視する。
 * 読み取り専用。副作用のあるAPIやフォーム送信は行わない。
 *
 * 実行: node scripts/monitoring/check_site_integrity.mjs
 *   BASE_URL=https://preview.example.com で対象を変更できる。
 *   --max-links=500 --concurrency=24 で全件寄りの手動監査も可能。
 */

import { fetchWithRetry } from '../lib/monitorFetch.mjs';

const option = (name) => process.argv.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);
const BASE = new URL(option('--base-url') || process.env.BASE_URL || 'https://www.mens-esthe-map.jp');
const UA = 'mens-esthe-map-site-integrity/1.0';
const MAX_LINKS = Math.max(1, Number(option('--max-links') || process.env.MAX_LINKS || 120));
const CONCURRENCY = Math.max(1, Number(option('--concurrency') || process.env.CONCURRENCY || 8));
const TIMEOUT_MS = 20_000;
const IMAGE_TIMEOUT_MS = 15_000;

const fixedRoutes = [
  '/', '/search', '/shops', '/area-search', '/ranking', '/new-therapists',
  '/popular-reviews', '/stats', '/post-review', '/login', '/register',
  '/contact', '/legal', '/privacy', '/terms', '/premium', '/board', '/chat',
  '/favorites', '/history', '/my-reviews', '/mypage', '/request-review',
  '/reset-password',
  '/area/tokyo',
  '/shops/kanagawa_sagamihara_unison_spa',
  '/shops/kanagawa_sagamihara_unison_spa/threads/kanagawa_sagamihara_unison_spa_%E5%A4%A9%E6%B5%B7%E3%82%86%E3%82%89',
  '/shops/tokyo_toshima_ikebukuro_aromamore/threads/tokyo_toshima_ikebukuro_aromamore_%E3%81%95%E3%81%AA',
];

const failures = [];
const warnings = [];

async function get(url, { redirect = 'follow' } = {}) {
  return fetchWithRetry(url, {
    redirect,
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
  }, { timeoutMs: TIMEOUT_MS });
}

async function mapLimit(items, limit, worker) {
  let cursor = 0;
  const results = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

function spreadSample(items, max) {
  if (items.length <= max) return items;
  return Array.from({ length: max }, (_, index) => items[Math.floor(index * items.length / max)]);
}

function decodeEntities(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function firstMatch(html, regex) {
  return decodeEntities(html.match(regex)?.[1]?.trim() || '');
}

function inspectHtml(path, html, { indexable = false } = {}) {
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
    || firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const canonical = firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    || firstMatch(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  const robots = firstMatch(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const charsetCount = (html.match(/<meta\b[^>]*charset=/gi) || []).length;

  if (!title) failures.push(`${path}: titleが無い`);
  if (charsetCount !== 1) failures.push(`${path}: charset指定が${charsetCount}件（1件であるべき）`);
  if (/undefined|null|NaN/i.test(`${title} ${description}`)) {
    failures.push(`${path}: SEO文に未定義値が露出している`);
  }
  if (indexable) {
    if (!description) failures.push(`${path}: sitemap掲載ページにdescriptionが無い`);
    if (!canonical) failures.push(`${path}: sitemap掲載ページにcanonicalが無い`);
    if (/noindex/i.test(robots)) failures.push(`${path}: sitemap掲載ページにnoindexがある`);
    if (h1Count !== 1) failures.push(`${path}: sitemap掲載ページのh1が${h1Count}件（1件であるべき）`);
    if ([...title].length < 15) failures.push(`${path}: sitemap掲載ページのtitleが短すぎる（${[...title].length}文字）`);
    if ([...description].length < 50) failures.push(`${path}: sitemap掲載ページのdescriptionが短すぎる（${[...description].length}文字）`);
  }

  for (const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(decodeEntities(block[1])); }
    catch { failures.push(`${path}: JSON-LDが不正`); }
  }

  const links = [];
  const images = [];
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const raw = decodeEntities(match[1]).trim();
    if (!raw || raw.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(raw)) continue;
    if (/undefined|null/i.test(raw)) failures.push(`${path}: 不正なリンク ${raw}`);
    try {
      const url = new URL(raw, BASE);
      if (url.origin !== BASE.origin) continue;
      if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/')) continue;
      url.hash = '';
      url.search = '';
      links.push(url.pathname || '/');
    } catch {
      failures.push(`${path}: URLとして解釈できないリンク ${raw}`);
    }
  }
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const raw = firstMatch(tag, /\bsrc=["']([^"']+)["']/i);
    if (!raw || /^(data:|blob:)/i.test(raw)) continue;
    try { images.push(new URL(raw, BASE).href); }
    catch { failures.push(`${path}: URLとして解釈できない画像 ${raw}`); }
  }
  const ogImage = firstMatch(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    || firstMatch(html, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i);
  if (ogImage) {
    try { images.push(new URL(ogImage, BASE).href); }
    catch { failures.push(`${path}: URLとして解釈できないOG画像 ${ogImage}`); }
  }
  return { title, canonical, links, images };
}

let sitemapPaths = [];
if (option('--skip-sitemap') !== '1' && !process.argv.includes('--skip-sitemap') && process.env.SKIP_SITEMAP !== '1') {
  const sitemapUrl = new URL('/api/sitemap.xml', BASE);
  let sitemapResponse;
  try {
    sitemapResponse = await get(sitemapUrl);
  } catch (error) {
    console.error(`❌ sitemap取得失敗（3回確認済み）: ${error.message}`);
    process.exit(1);
  }
  if (!sitemapResponse.ok || !/xml/i.test(sitemapResponse.headers.get('content-type') || '')) {
    console.error(`❌ sitemap取得失敗: HTTP ${sitemapResponse.status}`);
    process.exit(1);
  }
  const sitemapXml = await sitemapResponse.text();
  sitemapPaths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    const url = new URL(decodeEntities(m[1]));
    return url.pathname;
  });
  if (sitemapPaths.length < 15) failures.push(`sitemapのURL数が少なすぎる: ${sitemapPaths.length}`);
  if (new Set(sitemapPaths).size !== sitemapPaths.length) failures.push('sitemapに重複URLがある');
}

const routes = [...new Set([...fixedRoutes, ...sitemapPaths])];
const titles = new Map();
const canonicals = new Map();
const discoveredLinks = new Set();
const discoveredImages = new Set();

await mapLimit(routes, CONCURRENCY, async (path) => {
  try {
    const response = await get(new URL(path, BASE));
    if (!response.ok) {
      failures.push(`${path}: HTTP ${response.status}`);
      return;
    }
    const type = response.headers.get('content-type') || '';
    if (!/text\/html/i.test(type)) {
      failures.push(`${path}: HTMLではない (${type})`);
      return;
    }
    const html = await response.text();
    const meta = inspectHtml(path, html, { indexable: sitemapPaths.includes(path) });
    if (sitemapPaths.includes(path)) {
      if (meta.title) {
        if (titles.has(meta.title)) failures.push(`${path}: titleが${titles.get(meta.title)}と重複`);
        titles.set(meta.title, path);
      }
      if (meta.canonical) {
        if (canonicals.has(meta.canonical)) failures.push(`${path}: canonicalが${canonicals.get(meta.canonical)}と重複`);
        canonicals.set(meta.canonical, path);
      }
    }
    meta.links.forEach((link) => discoveredLinks.add(link));
    meta.images.forEach((image) => discoveredImages.add(image));
  } catch (error) {
    failures.push(`${path}: 取得失敗 (${error.message})`);
  }
});

await mapLimit([...discoveredImages].sort(), Math.min(CONCURRENCY, 6), async (url) => {
  try {
    const response = await fetchWithRetry(url, {
      headers: { 'User-Agent': UA, Accept: 'image/*' },
    }, { timeoutMs: IMAGE_TIMEOUT_MS });
    const type = response.headers.get('content-type') || '';
    await response.body?.cancel().catch(() => {});
    if (!response.ok || !/^image\//i.test(type)) {
      failures.push(`画像 ${url}: HTTP ${response.status} (${type || 'content-typeなし'})`);
    }
  } catch (error) {
    failures.push(`画像 ${url}: 取得失敗 (${error.message})`);
  }
});

// routes本体は上でHTMLまで検査済み。同じURLをもう一度叩かず、未検査リンクだけを見る。
const routeSet = new Set(routes);
const sortedLinks = [...discoveredLinks].filter((path) => !routeSet.has(path)).sort();
const checkedLinks = spreadSample(sortedLinks, MAX_LINKS);
if (sortedLinks.length > MAX_LINKS) {
  warnings.push(`内部リンク${sortedLinks.length}件から全範囲に分散した${MAX_LINKS}件を検査`);
}
await mapLimit(checkedLinks, CONCURRENCY, async (path) => {
  try {
    const response = await get(new URL(path, BASE), { redirect: 'manual' });
    if (response.status >= 400) failures.push(`内部リンク ${path}: HTTP ${response.status}`);
  } catch (error) {
    failures.push(`内部リンク ${path}: 取得失敗 (${error.message})`);
  }
});

if (failures.length) {
  console.error(`\n🚨 サイト完全性監視で${failures.length}件の異常を検出:\n`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

warnings.forEach((warning) => console.warn(`⚠️ ${warning}`));
console.log(`✅ サイト完全性正常（主要+sitemap ${routes.length}ページ / 内部リンク ${checkedLinks.length}件）`);
