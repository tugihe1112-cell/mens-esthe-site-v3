/**
 * MoMo Spaの誤名簿を現行公式サイトで置き換え、目視確認済みの誤画像を全店から除く。
 *
 * 原因:
 * - shops.website_url は momospa.tokyo なのに、旧therapists.raw_data.imageは
 *   別サイト momospa.net 由来だった（同名ブランドの誤結合）。
 * - 旧取込が広告文を人名、広告・ロゴ・準備中画像を人物写真として許容した。
 * - その後のR2移行はHTTP 200 / image/*だけを確認したため、誤画像を恒久URL化した。
 *
 * 既定はdry-run。実更新は明示的に --live を付ける。
 *
 *   node scripts/maintenance/repair_momospa_and_placeholder_images.mjs
 *   node scripts/maintenance/repair_momospa_and_placeholder_images.mjs --live
 */
import crypto from 'crypto';
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { uploadImage } from '../lib/r2Upload.mjs';
import {
  KNOWN_BAD_THERAPIST_IMAGE_URLS,
  findRepeatedTherapistImageGroups,
  isKnownBadTherapistImageUrl,
  isSuspiciousTherapistName,
} from '../lib/therapistImageQuality.mjs';

const LIVE = process.argv.includes('--live');
const SHOP_ID = '60350';
const ORPHAN_SHOP_ID = 'tokyo_shibuya_ebisu_momospa';
const SHOP_IDS_TO_REPAIR = [SHOP_ID, ORPHAN_SHOP_ID];
const OFFICIAL_BASE = 'https://www.momospa.tokyo';
const ROSTER_URL = `${OFFICIAL_BASE}/girl`;
const OFFICIAL_ID_PREFIX = `${SHOP_ID}_momospa_`;
const KNOWN_NOISE_THERAPIST_IDS = ['tochigi_utsunomiya_utsunomiya_luangea_即姫割'];
const EXPECTED_MIN = 30;
const EXPECTED_MAX = 80;

function readEnv(key) {
  const env = fs.readFileSync('.env', 'utf8');
  return env
    .match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]
    ?.trim()
    .replace(/^['"]|['"]$/g, '');
}

function requireEnv(key) {
  const value = readEnv(key);
  if (!value) throw new Error(`.env に ${key} がありません`);
  return value;
}

const R2_PUBLIC_BASE = requireEnv('R2_PUBLIC_BASE').replace(/\/+$/, '');
const supabase = createClient(
  requireEnv('VITE_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`公式サイト取得失敗: HTTP ${response.status} ${url}`);
  return response.text();
}

function parseRoster(html) {
  const $ = cheerio.load(html);
  const roster = [];

  $('.c-panel').each((_, element) => {
    const $panel = $(element);
    const href = $panel.find('.c-panel__image a[href*="profile?lid="]').first().attr('href');
    const lid = href?.match(/[?&]lid=(\d+)/)?.[1];
    const nameText = $panel.find('.c-panel__name').first().text().replace(/\s+/g, ' ').trim();
    const name = nameText.replace(/\s*[（(]\d{2}[）)]\s*$/, '').trim();
    const sizeText = $panel.find('.c-panel__size').first().text().replace(/\s+/g, ' ').trim();
    const rawImageUrl = $panel.find('.c-panel__image img[src]').first().attr('src');
    if (!lid || !name || isSuspiciousTherapistName(name)) return;

    const profileUrl = new URL(href, OFFICIAL_BASE).href;
    const candidateImageUrl = rawImageUrl ? new URL(rawImageUrl, OFFICIAL_BASE).href : null;
    const sourceImageUrl =
      candidateImageUrl && new URL(candidateImageUrl).pathname.startsWith('/photos/')
        ? candidateImageUrl
        : null;
    const age = Number(nameText.match(/[（(](\d{2})[）)]/)?.[1]) || null;
    const height = Number(sizeText.match(/T\.?\s*(\d{3})/i)?.[1]) || null;
    const bust = Number(sizeText.match(/B\.?\s*(\d{2,3})/i)?.[1]) || null;
    const cup = sizeText.match(/B\.?\s*\d{2,3}\s*[（(]([A-I])[）)]/i)?.[1]?.toUpperCase() || null;
    const waist = Number(sizeText.match(/W\.?\s*(\d{2,3})/i)?.[1]) || null;
    const hip = Number(sizeText.match(/H\.?\s*(\d{2,3})/i)?.[1]) || null;

    roster.push({
      lid,
      name,
      age,
      height,
      bust,
      cup,
      waist,
      hip,
      sizeText: sizeText || null,
      profileUrl,
      sourceImageUrl,
    });
  });

  if (roster.length < EXPECTED_MIN || roster.length > EXPECTED_MAX) {
    throw new Error(`公式一覧の取得人数が異常です: ${roster.length}名（許容${EXPECTED_MIN}〜${EXPECTED_MAX}名）`);
  }
  if (new Set(roster.map((row) => row.lid)).size !== roster.length) {
    throw new Error('公式一覧にlidの重複があります');
  }
  if (new Set(roster.map((row) => row.name)).size !== roster.length) {
    throw new Error('公式一覧に同名の重複があります。自動更新を停止しました');
  }
  return roster;
}

function extensionOf(url) {
  const extension = new URL(url).pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
}

function imageKey(cast) {
  const sourceVersion = crypto.createHash('sha1').update(cast.sourceImageUrl).digest('hex').slice(0, 10);
  return `momospa_tokyo_${cast.lid}_${sourceVersion}.${extensionOf(cast.sourceImageUrl)}`;
}

async function fetchExistingState() {
  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('id,name,website_url,raw_data')
    .eq('id', SHOP_ID)
    .single();
  if (shopError) throw shopError;
  if (new URL(shop.website_url).hostname !== 'www.momospa.tokyo') {
    throw new Error(`店舗の公式ドメインが想定外です: ${shop.website_url}`);
  }

  const { data: therapists, error: therapistError } = await supabase
    .from('therapists')
    .select('id,shop_id,name,image_url,profile_image,raw_data,is_active')
    .in('shop_id', SHOP_IDS_TO_REPAIR);
  if (therapistError) throw therapistError;

  const { count: knownBadCount, error: knownBadError } = await supabase
    .from('therapists')
    .select('id', { count: 'exact', head: true })
    .in('image_url', KNOWN_BAD_THERAPIST_IMAGE_URLS);
  if (knownBadError) throw knownBadError;
  return { shop, therapists: therapists || [], knownBadCount: knownBadCount || 0 };
}

async function assertLegacyRowsHaveNoReviews(legacyRows) {
  const { count: byShop, error: shopError } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .in('shop_id', SHOP_IDS_TO_REPAIR);
  if (shopError) throw shopError;

  let byTherapist = 0;
  for (let from = 0; from < legacyRows.length; from += 80) {
    const ids = legacyRows.slice(from, from + 80).map((row) => row.id);
    const { count, error } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .in('therapist_id', ids);
    if (error) throw error;
    byTherapist += count || 0;
  }
  if ((byShop || 0) > 0 || byTherapist > 0) {
    throw new Error(`旧MoMo名簿に口コミ参照があります（shop=${byShop || 0}, therapist=${byTherapist}）。削除を停止しました`);
  }
}

async function uploadRosterImages(roster) {
  const prepared = [];
  const withPhoto = roster.filter((row) => row.sourceImageUrl).length;
  console.log(`R2へ公式本人写真${withPhoto}件を保存します`);
  for (const [index, cast] of roster.entries()) {
    let imageUrl = null;
    if (cast.sourceImageUrl) {
      imageUrl = await uploadImage(
        cast.sourceImageUrl,
        imageKey(cast),
        ROSTER_URL,
        'therapist-images',
        { timeoutMs: 30_000 },
      );
      if (!imageUrl) throw new Error(`本人写真の保存失敗: ${cast.name} (${cast.sourceImageUrl})`);
    }
    prepared.push({ ...cast, imageUrl });
    console.log(`  [${index + 1}/${roster.length}] ${cast.name}: ${imageUrl ? '写真保存' : '公式も写真なし'}`);
  }
  return prepared;
}

function buildTherapist(cast, now) {
  return {
    id: `${OFFICIAL_ID_PREFIX}${cast.lid}`,
    shop_id: SHOP_ID,
    name: cast.name,
    image_url: cast.imageUrl,
    profile_image: cast.imageUrl,
    age: cast.age,
    height: cast.height,
    bust: cast.bust,
    cup: cast.cup,
    waist: cast.waist,
    hip: cast.hip,
    three_size: cast.sizeText,
    is_active: true,
    last_seen_at: now,
    raw_data: {
      source: ROSTER_URL,
      sourceDomain: 'www.momospa.tokyo',
      sourceCastId: cast.lid,
      profileUrl: cast.profileUrl,
      sourceImageUrl: cast.sourceImageUrl,
      size: cast.sizeText,
    },
  };
}

async function nullKnownBadImages() {
  const { data, error } = await supabase
    .from('therapists')
    .update({ image_url: null, profile_image: null })
    .in('image_url', KNOWN_BAD_THERAPIST_IMAGE_URLS)
    .select('id,shop_id');
  if (error) throw error;
  return data || [];
}

async function deleteLegacyRows(rows) {
  let deleted = 0;
  for (let from = 0; from < rows.length; from += 80) {
    const ids = rows.slice(from, from + 80).map((row) => row.id);
    const { data, error } = await supabase.from('therapists').delete().in('id', ids).select('id');
    if (error) throw error;
    deleted += (data || []).length;
  }
  if (deleted !== rows.length) throw new Error(`旧MoMo名簿の削除件数不一致: ${deleted}/${rows.length}`);
  return deleted;
}

async function deleteKnownNoiseRows() {
  const { data: rows, error: rowError } = await supabase
    .from('therapists')
    .select('id,name')
    .in('id', KNOWN_NOISE_THERAPIST_IDS);
  if (rowError) throw rowError;
  if (!(rows || []).length) return 0;

  const { count: reviewRefs, error: reviewError } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .in('therapist_id', rows.map((row) => row.id));
  if (reviewError) throw reviewError;
  if ((reviewRefs || 0) > 0) throw new Error(`既知の広告名レコードに口コミ参照が${reviewRefs}件あります`);

  const { data: deleted, error: deleteError } = await supabase
    .from('therapists')
    .delete()
    .in('id', rows.map((row) => row.id))
    .select('id');
  if (deleteError) throw deleteError;
  return (deleted || []).length;
}

async function fetchAllActiveTherapists() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('therapists')
      .select('id,shop_id,name,image_url')
      .or('is_active.is.null,is_active.eq.true')
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if ((data || []).length < 1000) break;
  }
  return rows;
}

async function verify(expectedRoster) {
  const { data: current, error: currentError } = await supabase
    .from('therapists')
    .select('id,name,image_url,profile_image,is_active,raw_data')
    .eq('shop_id', SHOP_ID)
    .eq('is_active', true);
  if (currentError) throw currentError;
  const { count: orphanCount, error: orphanError } = await supabase
    .from('therapists')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', ORPHAN_SHOP_ID);
  if (orphanError) throw orphanError;

  const activeRows = await fetchAllActiveTherapists();
  const knownBad = activeRows.filter((row) => isKnownBadTherapistImageUrl(row.image_url));
  const suspiciousNames = activeRows.filter((row) => isSuspiciousTherapistName(row.name));
  const repeatedGroups = findRepeatedTherapistImageGroups(activeRows, 5);
  const withPhoto = (current || []).filter((row) => row.image_url).length;
  const nonR2 = (current || [])
    .filter((row) => row.image_url)
    .filter((row) => !row.image_url.startsWith(`${R2_PUBLIC_BASE}/therapist-images/`));
  const wrongSource = (current || []).filter(
    (row) => row.raw_data?.sourceDomain !== 'www.momospa.tokyo',
  );

  if ((current || []).length !== expectedRoster.length) {
    throw new Error(`MoMo在籍人数不一致: ${(current || []).length}/${expectedRoster.length}`);
  }
  if (withPhoto !== expectedRoster.filter((row) => row.sourceImageUrl).length) {
    throw new Error(`MoMo写真あり人数不一致: ${withPhoto}`);
  }
  if ((orphanCount || 0) !== 0) throw new Error(`孤児MoMo名簿が${orphanCount}件残っています`);
  if (knownBad.length) throw new Error(`既知の誤画像が${knownBad.length}件残っています`);
  if (suspiciousNames.length) throw new Error(`広告・プレースホルダー名の表示が${suspiciousNames.length}件残っています`);
  if (repeatedGroups.length) throw new Error(`同一画像5名以上の使い回しが${repeatedGroups.length}組残っています`);
  if (nonR2.length) throw new Error(`MoMoの外部画像が${nonR2.length}件残っています`);
  if (wrongSource.length) throw new Error(`MoMoに公式外ソースが${wrongSource.length}件残っています`);

  return {
    active: current.length,
    withPhoto,
    withoutPhoto: current.length - withPhoto,
    allActiveRows: activeRows.length,
  };
}

async function main() {
  console.log(`[${LIVE ? 'LIVE' : 'DRY RUN'}] MoMo Spaの名簿・誤画像修復`);
  const roster = parseRoster(await fetchHtml(ROSTER_URL));
  const state = await fetchExistingState();
  const legacyRows = state.therapists.filter((row) => !row.id.startsWith(OFFICIAL_ID_PREFIX));
  const existingOfficial = state.therapists.filter((row) => row.id.startsWith(OFFICIAL_ID_PREFIX));
  await assertLegacyRowsHaveNoReviews(legacyRows);

  console.log(`公式: ${roster.length}名（本人写真${roster.filter((row) => row.sourceImageUrl).length}名）`);
  console.log(`旧MoMo誤名簿: ${legacyRows.length}件（公式ID形式の既存行: ${existingOfficial.length}件）`);
  console.log(`目視確認済みの誤画像: 全店合計 ${state.knownBadCount}件`);
  console.log(`先頭: ${roster.slice(0, 5).map((row) => row.name).join('、')}`);

  if (!LIVE) {
    console.log('DBとR2は変更していません。実更新は --live を付けてください。');
    return;
  }

  const prepared = await uploadRosterImages(roster);
  const now = new Date().toISOString();
  const therapists = prepared.map((cast) => buildTherapist(cast, now));
  const { error: upsertError } = await supabase
    .from('therapists')
    .upsert(therapists, { onConflict: 'id' });
  if (upsertError) throw upsertError;

  const currentIds = new Set(therapists.map((row) => row.id));
  const departedIds = existingOfficial
    .filter((row) => !currentIds.has(row.id))
    .map((row) => row.id);
  if (departedIds.length) {
    const { error } = await supabase
      .from('therapists')
      .update({ is_active: false })
      .in('id', departedIds);
    if (error) throw error;
  }

  const { error: shopUpdateError } = await supabase
    .from('shops')
    .update({
      website_url: `${OFFICIAL_BASE}/`,
      schedule_url: `${OFFICIAL_BASE}/schedule`,
      business_hours: '12:00〜翌5:00',
      raw_data: {
        ...(state.shop.raw_data || {}),
        websiteUrl: `${OFFICIAL_BASE}/`,
        hours: '12:00〜翌5:00',
      },
    })
    .eq('id', SHOP_ID);
  if (shopUpdateError) throw shopUpdateError;

  const nulled = await nullKnownBadImages();
  const deleted = await deleteLegacyRows(legacyRows);
  const deletedNoise = await deleteKnownNoiseRows();
  const result = await verify(roster);
  console.log(`誤画像を非表示: ${nulled.length}件 / 旧MoMo誤名簿を削除: ${deleted}件 / 他店の広告名を削除: ${deletedNoise}件`);
  console.log(`完了: MoMo在籍${result.active}名 / 写真${result.withPhoto}名 / 公式も写真なし${result.withoutPhoto}名`);
  console.log(`全サイトの在籍行${result.allActiveRows}件に、既知誤画像・広告名・5名以上使い回しは0件`);
}

main().catch((error) => {
  console.error('失敗:', error.message);
  process.exitCode = 1;
});
