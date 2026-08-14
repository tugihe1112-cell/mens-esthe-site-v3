/**
 * 欠損しているセラピスト画像を、誤割当しない範囲で復旧する。
 *
 * 1. 同一ブランド(group_id)または同一website_url内で、同名かつ画像が一意な行をコピー
 * 2. Lynx公式サイトを再取得し、一覧の遅延画像と動画カードの詳細ページ画像をR2へ保存
 * 3. 過去に公式サイトから取得済みのLynxデータを、現行ページで見つからない行の補助ソースに利用
 *
 * 既定はdry-run。DB更新とR2アップロードには --live が必須。
 *
 * 実行:
 *   node scripts/maintenance/repair_missing_therapist_images.mjs
 *   node scripts/maintenance/repair_missing_therapist_images.mjs --live
 *   node scripts/maintenance/repair_missing_therapist_images.mjs --only=copy
 *   node scripts/maintenance/repair_missing_therapist_images.mjs --only=lynx --live
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { uploadImage } from '../lib/r2Upload.mjs';

const env = fs.readFileSync('.env', 'utf8');
const E = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(E('VITE_SUPABASE_URL'), E('SUPABASE_SERVICE_ROLE_KEY'));

const LIVE = process.argv.includes('--live');
const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const ONLY = onlyArg?.split('=')[1] || 'all';
if (!['all', 'copy', 'raw', 'lynx'].includes(ONLY)) throw new Error(`不正な --only: ${ONLY}`);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/139 Safari/537.36';
const PAGE_SIZE = 1000;

const LYNX_SITES = [
  {
    key: 'ikebukuro',
    listUrl: 'https://esthe-lynx-ikebukuro.com/therapist-list/',
    shopIds: new Set(['tokyo_toshima_ikebukuro_lynx']),
  },
  {
    key: 'gotanda',
    listUrl: 'https://esthe-lynx-gotanda.com/therapist-list/',
    shopIds: new Set(['tokyo_shinagawa_gotanda_lynx']),
  },
  {
    key: 'shinjuku-group',
    listUrl: 'https://esthe-lynx-shinjuku.com/therapist-list/',
    shopIds: null, // g_brand_lynxのうち池袋・五反田以外
  },
  {
    key: 'yokohama',
    listUrl: 'https://www.esthe-lynx-yokohama.com/therapist-list/',
    shopIds: new Set(['kanagawa_kannai_lynx']),
  },
];

const clean = (value) => String(value || '').trim();
const canonicalWebsite = (value) => clean(value).toLowerCase().replace(/\/+$/, '');
const websiteHost = (value) => {
  try { return new URL(value).hostname.toLowerCase(); } catch { return ''; }
};
const isMissing = (value) => !clean(value);
const isUsableImage = (value) => {
  const url = clean(value);
  return Boolean(url)
    && /^https?:\/\//i.test(url)
    && !/(?:no[-_]?image|no[-_]?photo|placeholder|spacer|dummy|logo|banner)/i.test(url)
    && !/\.svg(?:[?#]|$)/i.test(url);
};

async function fetchAll(table, select) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}取得失敗: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

async function updateImages(changes, label) {
  if (!changes.length) return 0;
  if (!LIVE) {
    console.log(`  DRY: ${label} ${changes.length}件（DB更新なし）`);
    return changes.length;
  }

  let updated = 0;
  for (let start = 0; start < changes.length; start += 10) {
    const batch = changes.slice(start, start + 10);
    const results = await Promise.all(batch.map(async (change) => {
      // 同時実行で既に写真が入った場合は上書きしない。
      const { data, error } = await supabase
        .from('therapists')
        .update({ image_url: change.image_url })
        .eq('id', change.id)
        .or('image_url.is.null,image_url.eq.')
        .select('id');
      if (error) throw new Error(`${label}: ${change.id}: ${error.message}`);
      return data?.length || 0;
    }));
    updated += results.reduce((sum, value) => sum + value, 0);
  }
  console.log(`  LIVE: ${label} ${updated}/${changes.length}件更新`);
  return updated;
}

function addIndex(index, key, imageUrl) {
  if (!key || !isUsableImage(imageUrl)) return;
  if (!index.has(key)) index.set(key, new Set());
  index.get(key).add(clean(imageUrl));
}

async function repairByTrustedDuplicate(shops, therapists) {
  console.log('\n[1/3] 同一ブランド・同一サイト内の一意画像を復旧');
  const shopById = new Map(shops.map((shop) => [shop.id, shop]));
  const index = new Map();

  for (const therapist of therapists) {
    if (!isUsableImage(therapist.image_url)) continue;
    const shop = shopById.get(therapist.shop_id);
    const name = clean(therapist.name);
    if (shop?.group_id) addIndex(index, `g\u0000${shop.group_id}\u0000${name}`, therapist.image_url);
    const website = canonicalWebsite(shop?.website_url);
    if (website) addIndex(index, `w\u0000${website}\u0000${name}`, therapist.image_url);
    const schedule = canonicalWebsite(shop?.schedule_url);
    if (schedule) addIndex(index, `s\u0000${schedule}\u0000${name}`, therapist.image_url);
    const host = websiteHost(shop?.website_url);
    if (host) addIndex(index, `h\u0000${host}\u0000${name}`, therapist.image_url);
  }

  const changes = [];
  let conflicts = 0;
  for (const therapist of therapists) {
    if (!isMissing(therapist.image_url)) continue;
    const shop = shopById.get(therapist.shop_id);
    const name = clean(therapist.name);
    const urls = new Set();
    if (shop?.group_id) {
      for (const url of index.get(`g\u0000${shop.group_id}\u0000${name}`) || []) urls.add(url);
    }
    const website = canonicalWebsite(shop?.website_url);
    if (website) {
      for (const url of index.get(`w\u0000${website}\u0000${name}`) || []) urls.add(url);
    }
    const schedule = canonicalWebsite(shop?.schedule_url);
    if (schedule) {
      for (const url of index.get(`s\u0000${schedule}\u0000${name}`) || []) urls.add(url);
    }
    const host = websiteHost(shop?.website_url);
    if (host) {
      for (const url of index.get(`h\u0000${host}\u0000${name}`) || []) urls.add(url);
    }
    if (urls.size === 1) changes.push({ id: therapist.id, image_url: [...urls][0] });
    else if (urls.size > 1) conflicts++;
  }

  console.log(`  候補 ${changes.length}件 / 画像競合 ${conflicts}件（競合はスキップ）`);
  await updateImages(changes, '一意画像コピー');
  return changes;
}

async function uploadWithRetry(sourceUrl, keyPrefix, referer = null, options = {}) {
  const digest = crypto.createHash('sha256').update(sourceUrl).digest('hex').slice(0, 24);
  const key = `${keyPrefix}_${digest}.${sourceExtension(sourceUrl)}`;
  let sourceOrigin = null;
  try { sourceOrigin = `${new URL(sourceUrl).origin}/`; } catch { /* noop */ }
  const referers = [referer, sourceOrigin, null].slice(0, options.attempts || 3);
  for (let attempt = 0; attempt < referers.length; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 250 : 1000 * attempt));
    const publicUrl = await uploadImage(
      sourceUrl,
      key,
      referers[attempt],
      'therapist-images',
      { timeoutMs: options.timeoutMs || 15000 },
    );
    if (publicUrl) return publicUrl;
  }
  return null;
}

async function repairFromRawData(shops, therapists, alreadyHandledIds) {
  console.log('\n[2/3] raw_data.imageに残る元画像をR2へ復旧');
  const shopById = new Map(shops.map((shop) => [shop.id, shop]));
  const rows = therapists.filter((therapist) => {
    if (!isMissing(therapist.image_url) || alreadyHandledIds.has(therapist.id)) return false;
    return isUsableImage(therapist.raw_data?.image);
  });
  console.log(`  元画像URLあり ${rows.length}件`);

  const urlToPublic = new Map();
  let failed = 0;
  const failedSamples = [];
  const sourceRows = new Map();
  for (const row of rows) {
    const sourceUrl = clean(row.raw_data.image);
    if (!sourceRows.has(sourceUrl)) sourceRows.set(sourceUrl, row);
  }
  const sources = [...sourceRows.entries()];
  let cursor = 0;
  async function worker() {
    while (cursor < sources.length) {
      const index = cursor++;
      const [sourceUrl, row] = sources[index];
      let publicUrl = sourceUrl;
      if (LIVE && !sourceUrl.startsWith(`${E('R2_PUBLIC_BASE')?.replace(/\/+$/, '')}/`)) {
        const shop = shopById.get(row.shop_id);
        publicUrl = await uploadWithRetry(
          sourceUrl,
          'raw_repair',
          shop?.website_url || null,
          { attempts: 2, timeoutMs: 7000 },
        );
      }
      urlToPublic.set(sourceUrl, publicUrl || null);
      if (!publicUrl) {
        failed++;
        if (failedSamples.length < 8) failedSamples.push(sourceUrl);
      }
      if (LIVE && (index + 1) % 25 === 0) console.log(`  元画像検証 ${index + 1}/${sources.length}`);
    }
  }
  await Promise.all(Array.from({ length: LIVE ? 6 : 1 }, () => worker()));
  const changes = rows.flatMap((row) => {
    const publicUrl = urlToPublic.get(clean(row.raw_data.image));
    return publicUrl ? [{ id: row.id, image_url: publicUrl }] : [];
  });
  console.log(`  一意な元画像 ${urlToPublic.size}件 / 取得不能 ${failed}件`);
  for (const url of failedSamples) console.warn(`  取得不能: ${url}`);
  await updateImages(changes, 'raw_data画像');
  return changes;
}

async function fetchHtml(url, referer = null) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const headers = { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' };
      if (referer) headers.referer = referer;
      const response = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }
  throw new Error(`${url}: ${lastError?.message || '取得失敗'}`);
}

function absoluteUrl(value, baseUrl) {
  if (!clean(value)) return null;
  try { return new URL(value, baseUrl).href; } catch { return null; }
}

function imageFrom($root, baseUrl) {
  const selectors = [
    '.main img[data-src]', '.main img[data-lazy-src]', '.main img[src]',
    '.photo-outline img.photo[data-src]', '.photo-outline img.photo[src]',
    'img.photo[data-src]', 'img.photo[src]',
  ];
  for (const selector of selectors) {
    const node = $root.find(selector).first();
    const raw = node.attr('data-src') || node.attr('data-lazy-src') || node.attr('src');
    const url = absoluteUrl(raw, baseUrl);
    if (isUsableImage(url)) return url;
  }
  return null;
}

function therapistName($card) {
  // dl.nameも同じclassを持つため、先にdd.nameだけを選ぶ。
  const fromNode = clean($card.find('dd.name').first().text()) || clean($card.find('[itemprop="name"]').first().text());
  if (fromNode) return fromNode.replace(/\s+/g, ' ');
  return clean($card.text().match(/Name\.(.+?)Age\./s)?.[1]).replace(/\s+/g, ' ');
}

async function scrapeLynxSite(site, wantedNames) {
  const html = await fetchHtml(site.listUrl);
  const $ = cheerio.load(html);
  const found = new Map();
  const detailQueue = [];

  $('a[href]').each((_, element) => {
    const $card = $(element);
    const href = clean($card.attr('href'));
    if (!/\/therapist\/?\?id=\d+/i.test(href)) return;
    const name = therapistName($card);
    if (!wantedNames.has(name) || found.has(name)) return;
    const imageUrl = imageFrom($card, site.listUrl);
    if (imageUrl) found.set(name, imageUrl);
    else detailQueue.push({ name, url: absoluteUrl(href, site.listUrl) });
  });

  // 動画カードは一覧に静止画がない。詳細ページのphoto-outlineから取得する。
  for (const item of detailQueue) {
    if (!item.url || found.has(item.name)) continue;
    try {
      const detailHtml = await fetchHtml(item.url, site.listUrl);
      const $detail = cheerio.load(detailHtml);
      const imageUrl = imageFrom($detail.root(), item.url);
      if (imageUrl) found.set(item.name, imageUrl);
    } catch (error) {
      console.warn(`  詳細取得失敗 ${site.key}/${item.name}: ${error.message}`);
    }
  }

  console.log(`  ${site.key}: 対象名 ${wantedNames.size} / 公式ページ一致 ${found.size}`);
  return found;
}

function loadHistoricalLynxSources() {
  const bySite = new Map(LYNX_SITES.map((site) => [site.key, new Map()]));

  // 2026-06-07にChromeで取得した横浜93名。
  const yokohamaPath = new URL('./fix_lynx_yokohama.mjs', import.meta.url);
  const yokohama = fs.readFileSync(yokohamaPath, 'utf8');
  for (const [, name, file] of yokohama.matchAll(/\{\s*name:\s*['"]([^'"]+)['"]\s*,\s*img:\s*`\$\{BASE\}([^`]+)`/g)) {
    bySite.get('yokohama').set(clean(name), `https://admin.esthe-lynx-yokohama.com/photos/${file}`);
  }

  // 池袋・五反田の初回取得データ。fが空の項目は現行ページ/別履歴に任せる。
  const processPath = new URL('./process_lynx.mjs', import.meta.url);
  const processSource = fs.readFileSync(processPath, 'utf8');
  const sections = [
    ['ikebukuro', processSource.match(/const IKEBUKURO_THERAPISTS = \[([\s\S]*?)\n\];/)?.[1], 'https://admin.esthe-lynx-ikebukuro.com/photos/'],
    ['gotanda', processSource.match(/const GOTANDA_THERAPISTS = \[([\s\S]*?)\n\];/)?.[1], 'https://admin.esthe-lynx-gotanda.com/photos/'],
  ];
  for (const [key, source, base] of sections) {
    if (!source) continue;
    for (const match of source.matchAll(/\{\s*name:\s*['"]([^'"]+)['"][^}]*?f:\s*['"]([^'"]*)['"]/g)) {
      const [, name, file] = match;
      if (file) bySite.get(key).set(clean(name), `${base}${file}`);
    }
  }

  // 旧Chrome取得のグループ名簿。公式の名前とURLの対応だけを補助ソースに使う。
  const evergreenPath = new URL('../archive/update_lynx_evergreen.mjs', import.meta.url);
  const evergreen = fs.readFileSync(evergreenPath, 'utf8');
  for (const match of evergreen.matchAll(/\{\s*name:\s*['"]([^'"]+)['"][^}]*?img:\s*['"](https?:\/\/[^'"]+)['"]/g)) {
    const [, name, imageUrl] = match;
    if (isUsableImage(imageUrl)) bySite.get('shinjuku-group').set(clean(name), imageUrl);
  }

  return bySite;
}

function sourceExtension(url) {
  try {
    const ext = new URL(url).pathname.match(/\.(jpe?g|png|webp|gif)$/i)?.[1]?.toLowerCase();
    return ext === 'jpeg' ? 'jpg' : (ext || 'jpg');
  } catch { return 'jpg'; }
}

async function repairLynx(shops, therapists, copiedIds) {
  console.log('\n[3/3] Lynx公式画像を再取得してR2へ保存');
  const shopById = new Map(shops.map((shop) => [shop.id, shop]));
  const lynxMissing = therapists.filter((therapist) => {
    if (!isMissing(therapist.image_url) || copiedIds.has(therapist.id)) return false;
    const shop = shopById.get(therapist.shop_id);
    return shop?.group_id === 'g_brand_lynx' || therapist.shop_id === 'kanagawa_kannai_lynx';
  });
  const historical = loadHistoricalLynxSources();
  const sourceByRow = new Map();

  for (const site of LYNX_SITES) {
    const rows = lynxMissing.filter((therapist) => {
      if (site.shopIds) return site.shopIds.has(therapist.shop_id);
      const shop = shopById.get(therapist.shop_id);
      return shop?.group_id === 'g_brand_lynx'
        && therapist.shop_id !== 'tokyo_toshima_ikebukuro_lynx'
        && therapist.shop_id !== 'tokyo_shinagawa_gotanda_lynx';
    });
    const wantedNames = new Set(rows.map((row) => clean(row.name)));
    if (!wantedNames.size) continue;

    let current = new Map();
    try {
      current = await scrapeLynxSite(site, wantedNames);
    } catch (error) {
      console.warn(`  ${site.key}一覧取得失敗: ${error.message}`);
    }
    const fallback = historical.get(site.key) || new Map();
    for (const row of rows) {
      const name = clean(row.name);
      const imageUrl = current.get(name) || fallback.get(name);
      if (isUsableImage(imageUrl)) sourceByRow.set(row.id, imageUrl);
    }
  }

  console.log(`  欠損 ${lynxMissing.length}件 / 公式画像と照合 ${sourceByRow.size}件`);
  const urlToPublic = new Map();
  const changes = [];
  let uploadFailures = 0;
  const failedSamples = [];

  for (const row of lynxMissing) {
    const sourceUrl = sourceByRow.get(row.id);
    if (!sourceUrl) continue;
    let publicUrl = urlToPublic.get(sourceUrl);
    if (!urlToPublic.has(sourceUrl)) {
      if (LIVE) {
        publicUrl = await uploadWithRetry(sourceUrl, 'lynx_repair', null);
        if (!publicUrl) {
          uploadFailures++;
          if (failedSamples.length < 8) failedSamples.push(sourceUrl);
          urlToPublic.set(sourceUrl, null);
          continue;
        }
      } else {
        publicUrl = sourceUrl;
      }
      urlToPublic.set(sourceUrl, publicUrl);
    }
    if (!publicUrl) continue;
    changes.push({ id: row.id, image_url: publicUrl });
  }

  console.log(`  一意な元画像 ${urlToPublic.size}件 / upload失敗 ${uploadFailures}件`);
  for (const url of failedSamples) console.warn(`  取得不能: ${url}`);
  await updateImages(changes, 'Lynx公式画像');
  return changes;
}

async function main() {
  console.log(`\n=== 欠損セラピスト画像修復 ${LIVE ? 'LIVE' : 'DRY RUN'} / ${ONLY} ===`);
  const [shops, therapists] = await Promise.all([
    fetchAll('shops', 'id,name,website_url,schedule_url,group_id'),
    fetchAll('therapists', 'id,shop_id,name,image_url,raw_data'),
  ]);
  const before = therapists.filter((row) => isMissing(row.image_url)).length;
  console.log(`開始時: therapists ${therapists.length}件 / 画像なし ${before}件`);

  let copied = [];
  if (ONLY === 'all' || ONLY === 'copy') copied = await repairByTrustedDuplicate(shops, therapists);
  let raw = [];
  if (ONLY === 'all' || ONLY === 'raw') {
    raw = await repairFromRawData(shops, therapists, new Set(copied.map((row) => row.id)));
  }
  let lynx = [];
  if (ONLY === 'all' || ONLY === 'lynx') {
    const handled = new Set([...copied, ...raw].map((row) => row.id));
    lynx = await repairLynx(shops, therapists, handled);
  }

  console.log(`\n予定/処理対象: コピー ${copied.length}件 + raw_data ${raw.length}件 + Lynx ${lynx.length}件`);
  if (!LIVE) console.log('DBとR2は未変更。適用するには --live を付ける。');
}

main().catch((error) => {
  console.error('❌', error);
  process.exit(1);
});
