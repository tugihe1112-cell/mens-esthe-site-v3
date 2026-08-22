/**
 * check_image_health.mjs --all が作った監査結果だけを対象に、画像ではない参照を修復する。
 * 既定はdry-run。DB更新は --live のときだけ。
 *
 * 実行:
 *   node scripts/monitoring/check_image_health.mjs --all --no-history --report=/tmp/image-audit.json
 *   node scripts/maintenance/repair_invalid_image_content.mjs --report=/tmp/image-audit.json
 *   node scripts/maintenance/repair_invalid_image_content.mjs --report=/tmp/image-audit.json --live
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { checkImageBody, mapConcurrent } from '../lib/imageDeliveryQuality.mjs';

const args = process.argv.slice(2);
const LIVE = args.includes('--live');
const REPORT_FILE = (args.find((arg) => arg.startsWith('--report=')) || '').split('=').slice(1).join('=');
if (!REPORT_FILE || !fs.existsSync(REPORT_FILE)) {
  throw new Error('--report=/absolute/path/to/image-audit.json を指定してください');
}

function env(key) {
  if (process.env[key]) return process.env[key];
  const source = fs.readFileSync('.env', 'utf8');
  return source.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
}

const url = env('VITE_SUPABASE_URL');
const serviceRole = env('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !serviceRole) throw new Error('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が必要です');
const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });
const audit = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));

const chunks = (items, size = 100) => {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(label, operation, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(500 * attempt);
    }
  }
  throw new Error(`${label}: ${lastError?.message || 'unknown error'}`);
}

async function fetchRows(table, ids) {
  const rows = [];
  for (const batch of chunks(ids)) {
    const columns = table === 'therapists'
      ? 'id,shop_id,name,image_url,profile_image,is_active,raw_data'
      : 'id,name,image_url,website_url,raw_data';
    const { data } = await withRetry(`${table} read`, async () => {
      const result = await supabase.from(table).select(columns).in('id', batch);
      if (result.error) throw result.error;
      return result;
    });
    rows.push(...(data || []));
  }
  return rows;
}

async function fetchShopWebsites(shopIds) {
  const result = new Map();
  for (const batch of chunks([...new Set(shopIds.filter(Boolean))])) {
    const { data } = await withRetry('shop website read', async () => {
      const response = await supabase.from('shops').select('id,website_url').in('id', batch);
      if (response.error) throw response.error;
      return response;
    });
    for (const row of data || []) result.set(row.id, row.website_url || '');
  }
  return result;
}

function rawImageValue(rawData) {
  const value = rawData?.image || rawData?.image_url || rawData?.photo || rawData?.profile_image;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value.url || value.src || '';
  return '';
}

function normalizeCandidate(value, websiteUrl) {
  if (!value || typeof value !== 'string') return '';
  try {
    return new URL(value, websiteUrl || undefined).href;
  } catch {
    return '';
  }
}

function isTrustedRawCandidate(candidate, websiteUrl) {
  try {
    const candidateHost = new URL(candidate).hostname.toLowerCase();
    if (candidateHost === 'mens-esthe-images.tugihe1112.workers.dev') return true;
    const officialHost = new URL(websiteUrl).hostname.toLowerCase().replace(/^www\./, '');
    const normalizedCandidate = candidateHost.replace(/^www\./, '');
    return normalizedCandidate === officialHost || normalizedCandidate.endsWith(`.${officialHost}`);
  } catch {
    return false;
  }
}

async function updateRow(table, row, nextImage, clearProfile) {
  const patch = { image_url: nextImage };
  if (table === 'therapists' && clearProfile) patch.profile_image = null;
  await withRetry(`${table}:${row.id} update`, async () => {
    const result = await supabase
      .from(table)
      .update(patch)
      .eq('id', row.id)
      .eq('image_url', row.image_url);
    if (result.error) throw result.error;
    return result;
  });
}

async function processTable(table) {
  const section = audit?.report?.[table];
  const badUrls = new Set((section?.badExamples || []).map((item) => item.url));
  const affected = section?.affectedExamples || [];
  if (badUrls.size !== section?.dead || affected.length !== section?.affectedRows) {
    throw new Error(`${table}: 完全な --report ではありません（URL/行数が監査結果と一致しません）`);
  }

  const rows = await fetchRows(table, affected.map((item) => item.id));
  const current = rows.filter((row) => badUrls.has(row.image_url));
  const shopWebsites = table === 'therapists'
    ? await fetchShopWebsites(current.map((row) => row.shop_id))
    : new Map();
  const candidatesById = new Map();
  for (const row of current) {
    const websiteUrl = table === 'therapists' ? shopWebsites.get(row.shop_id) : row.website_url;
    const profileCandidate = normalizeCandidate(row.profile_image, websiteUrl);
    const rawCandidate = normalizeCandidate(rawImageValue(row.raw_data), websiteUrl);
    const candidates = [];
    if (profileCandidate && !badUrls.has(profileCandidate)) {
      candidates.push({ url: profileCandidate, source: 'profile_image' });
    }
    if (
      rawCandidate
      && !badUrls.has(rawCandidate)
      && isTrustedRawCandidate(rawCandidate, websiteUrl)
      && !candidates.some((candidate) => candidate.url === rawCandidate)
    ) {
      candidates.push({ url: rawCandidate, source: 'raw_data' });
    }
    candidatesById.set(row.id, candidates);
  }
  const alternatives = [...new Set([...candidatesById.values()].flat().map((candidate) => candidate.url))];
  const alternativeChecks = await mapConcurrent(alternatives, 16, checkImageBody);
  const validAlternatives = new Set(
    alternatives.filter((_, index) => alternativeChecks[index]?.ok),
  );

  const repairs = current.map((row) => {
    const selected = (candidatesById.get(row.id) || []).find((candidate) => validAlternatives.has(candidate.url));
    return {
      row,
      nextImage: selected?.url || null,
      source: selected?.source || null,
      clearProfile: Boolean(row.profile_image && badUrls.has(row.profile_image)),
    };
  });
  const byShop = {};
  for (const { row } of repairs) {
    const key = row.shop_id || row.id;
    byShop[key] = (byShop[key] || 0) + 1;
  }

  console.log(JSON.stringify({
    table,
    auditedBadUrls: badUrls.size,
    auditedRows: affected.length,
    stillMatching: repairs.length,
    restoredFromProfileImage: repairs.filter((item) => item.source === 'profile_image').length,
    restoredFromTrustedRawData: repairs.filter((item) => item.source === 'raw_data').length,
    cleared: repairs.filter((item) => !item.nextImage).length,
    rowsWithRawData: repairs.filter((item) => item.row.raw_data && Object.keys(item.row.raw_data).length).length,
    rawDataKeyExamples: [...new Set(repairs.flatMap((item) => Object.keys(item.row.raw_data || {})))].slice(0, 30),
    affectedGroups: Object.keys(byShop).length,
    topGroups: Object.entries(byShop).sort((a, b) => b[1] - a[1]).slice(0, 20),
  }, null, 2));

  if (LIVE) {
    await mapConcurrent(repairs, 8, ({ row, nextImage, clearProfile }) => (
      updateRow(table, row, nextImage, clearProfile)
    ));
  }
  return repairs.length;
}

const shopCount = await processTable('shops');
const therapistCount = await processTable('therapists');
console.log(LIVE
  ? `✅ ${shopCount + therapistCount}行を限定更新しました`
  : `DRY-RUN: ${shopCount + therapistCount}行が対象です（更新は0件）`);
