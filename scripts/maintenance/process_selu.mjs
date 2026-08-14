/**
 * メンズエステ セル〜Selu〜（代々木上原・経堂）を登録する。
 *
 * - 公式サイトから在籍セラピストを取得
 * - 店舗ロゴと本人写真を Cloudflare R2 に保存
 * - shops / therapists を冪等に upsert
 *
 * 既定は dry-run。実更新は明示的に --live を付ける。
 *
 *   node scripts/maintenance/process_selu.mjs
 *   node scripts/maintenance/process_selu.mjs --live
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { uploadImage } from '../lib/r2Upload.mjs';

const LIVE = process.argv.includes('--live');
const BASE_URL = 'https://esthe-selu.com';
const CASTS_URL = `${BASE_URL}/casts/`;
const SHOP_ID = 'tokyo_shibuya_yoyogiuehara_selu';
const SHOP_NAME = 'メンズエステ セル〜Selu〜';
const SHOP_LOGO_URL = `${BASE_URL}/wp-content/uploads/2026/04/logo.png`;
const R2_PUBLIC_BASE = requireEnv('R2_PUBLIC_BASE').replace(/\/+$/, '');
const EXPECTED_MIN_CASTS = 40;

const supabase = createClient(
  requireEnv('VITE_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

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

function largestImageUrl($item) {
  const $img = $item.find('img.cast-image').first();
  const candidates = ($img.attr('srcset') || '')
    .split(',')
    .map((entry, index) => {
      const match = entry.trim().match(/^(\S+)\s+(\d+)w$/);
      return match ? { url: match[1], width: Number(match[2]), index } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.width - b.width || a.index - b.index);
  return candidates.at(-1)?.url || $img.attr('src') || null;
}

function parseCasts(html) {
  const $ = cheerio.load(html);
  const casts = [];

  $('.cast__item').each((_, element) => {
    const $item = $(element);
    const name = $item.find('img.cast-image').first().attr('alt')?.trim();
    const href = $item.find('.cast__thumb a[href*="/casts/cast-"]').first().attr('href');
    const castId = href?.match(/cast-(\d+)/)?.[1];
    if (!name || !castId) return;

    const nameText = $item.find('.cast__name').text().replace(/\s+/g, ' ').trim();
    const sizeText = $item.find('.cast__size').text().replace(/\s+/g, ' ').trim();
    const imageUrl = largestImageUrl($item);
    const isPlaceholder = !imageUrl || /\/logo(?:-|\.)/i.test(new URL(imageUrl).pathname);
    const age = Number(nameText.match(/\((\d{2})歳\)/)?.[1]) || null;
    const height = Number(sizeText.match(/T(\d{3})/i)?.[1]) || null;
    const cup = sizeText.match(/\(([A-I])\)/i)?.[1]?.toUpperCase() || null;
    const tags = $item
      .find('.type__labels .type__label')
      .map((__, tag) => $(tag).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter(Boolean);

    casts.push({
      castId,
      name,
      age,
      height,
      cup,
      sizeText: sizeText || null,
      tags,
      profileUrl: new URL(href, BASE_URL).href,
      sourceImageUrl: isPlaceholder ? null : imageUrl,
    });
  });

  const uniqueNames = new Set(casts.map((cast) => cast.name));
  const uniqueCastIds = new Set(casts.map((cast) => cast.castId));
  if (casts.length < EXPECTED_MIN_CASTS) {
    throw new Error(`取得人数が少なすぎます: ${casts.length}名（最低${EXPECTED_MIN_CASTS}名）`);
  }
  if (uniqueNames.size !== casts.length) throw new Error('公式一覧に同名の重複があります');
  if (uniqueCastIds.size !== casts.length) throw new Error('公式一覧にcast IDの重複があります');
  return casts;
}

function imageExtension(url) {
  const extension = new URL(url).pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
}

async function assertNoOtherShopUsesDomain() {
  const { data, error } = await supabase
    .from('shops')
    .select('id,name,website_url')
    .ilike('website_url', '%esthe-selu.com%');
  if (error) throw error;
  const conflict = (data || []).find((shop) => shop.id !== SHOP_ID);
  if (conflict) {
    throw new Error(`同じ公式URLの別店舗が存在します: ${conflict.id} ${conflict.name}`);
  }
}

async function uploadAllImages(casts) {
  console.log(`R2へ店舗ロゴ1件・本人写真${casts.filter((cast) => cast.sourceImageUrl).length}件を保存します`);
  const shopImageUrl = await uploadImage(
    SHOP_LOGO_URL,
    'selu_logo.png',
    BASE_URL,
    'shop-logos',
    { timeoutMs: 30_000 },
  );
  if (!shopImageUrl) throw new Error('店舗ロゴをR2へ保存できませんでした');

  const prepared = [];
  for (const [index, cast] of casts.entries()) {
    let imageUrl = null;
    if (cast.sourceImageUrl) {
      const key = `selu_cast_${cast.castId}.${imageExtension(cast.sourceImageUrl)}`;
      imageUrl = await uploadImage(
        cast.sourceImageUrl,
        key,
        CASTS_URL,
        'therapist-images',
        { timeoutMs: 30_000 },
      );
      if (!imageUrl) throw new Error(`画像保存失敗: ${cast.name} (${cast.sourceImageUrl})`);
    }
    prepared.push({ ...cast, imageUrl });
    console.log(`  [${index + 1}/${casts.length}] ${cast.name}: ${imageUrl ? '写真保存' : '公式も写真なし'}`);
  }
  return { shopImageUrl, casts: prepared };
}

function buildShop(shopImageUrl) {
  return {
    id: SHOP_ID,
    group_id: 'g_brand_selu',
    area_id: 'tokyo_shibuya_yoyogi',
    name: SHOP_NAME,
    website_url: `${BASE_URL}/`,
    schedule_url: `${BASE_URL}/schedule/`,
    image_url: shopImageUrl,
    phone_number: '070-8422-7643',
    business_hours: '11:00〜翌5:00',
    price_system: [
      '70分 14,000円',
      '90分 16,000円（通常18,000円）',
      '120分 22,000円（通常24,000円）',
      '入会金・写真指名料 無料',
    ].join('\n'),
    raw_data: {
      id: SHOP_ID,
      name: SHOP_NAME,
      region: '関東エリア',
      prefecture: '東京都',
      city: '渋谷区',
      area: '代々木・原宿',
      address: '東京都渋谷区西原3-8-8',
      nearestStation: '代々木上原駅・経堂駅',
      websiteUrl: `${BASE_URL}/`,
      image: shopImageUrl,
      hours: '11:00〜翌5:00',
      price: '70分 14,000円〜',
      tags: ['完全個室', '深夜営業', '写真指名料無料'],
      brandId: 'selu',
      isPremium: false,
      reviewCount: 0,
      description:
        '代々木上原駅徒歩4分・経堂駅徒歩2分。下北沢からも利用できるメンズエステ。',
    },
  };
}

function buildTherapist(cast) {
  return {
    id: `${SHOP_ID}_${cast.name}`,
    shop_id: SHOP_ID,
    name: cast.name,
    image_url: cast.imageUrl,
    age: cast.age,
    height: cast.height,
    cup: cast.cup,
    is_active: true,
    last_seen_at: new Date().toISOString(),
    raw_data: {
      source: CASTS_URL,
      sourceCastId: cast.castId,
      profileUrl: cast.profileUrl,
      sourceImageUrl: cast.sourceImageUrl,
      size: cast.sizeText,
      tags: cast.tags,
    },
  };
}

async function verify() {
  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('id,name,website_url,image_url')
    .eq('id', SHOP_ID)
    .single();
  if (shopError) throw shopError;

  const { data: therapists, error: therapistError } = await supabase
    .from('therapists')
    .select('id,name,image_url,is_active')
    .eq('shop_id', SHOP_ID);
  if (therapistError) throw therapistError;

  const withPhoto = therapists.filter((row) => row.image_url);
  const nonR2 = [shop.image_url, ...withPhoto.map((row) => row.image_url)].filter(
    (url) => !url?.startsWith(`${R2_PUBLIC_BASE}/`),
  );
  if (therapists.length !== 48) throw new Error(`登録後人数が48名ではありません: ${therapists.length}`);
  if (withPhoto.length !== 47) throw new Error(`写真あり人数が47名ではありません: ${withPhoto.length}`);
  if (nonR2.length) throw new Error(`R2以外の画像URLが${nonR2.length}件あります`);

  return { shop, therapistCount: therapists.length, withPhoto: withPhoto.length };
}

async function main() {
  console.log(`[${LIVE ? 'LIVE' : 'DRY RUN'}] ${SHOP_NAME}`);
  await assertNoOtherShopUsesDomain();
  const casts = parseCasts(await fetchHtml(CASTS_URL));
  const withPhoto = casts.filter((cast) => cast.sourceImageUrl).length;
  console.log(`公式一覧: ${casts.length}名（本人写真あり ${withPhoto}名 / 公式も写真なし ${casts.length - withPhoto}名）`);
  console.log(`店舗ID: ${SHOP_ID}`);
  console.log(`先頭: ${casts.slice(0, 5).map((cast) => cast.name).join('、')}`);

  if (!LIVE) {
    console.log('DBとR2は変更していません。実行する場合は --live を付けてください。');
    return;
  }

  const uploaded = await uploadAllImages(casts);
  const shop = buildShop(uploaded.shopImageUrl);
  const therapists = uploaded.casts.map(buildTherapist);

  const { error: shopError } = await supabase.from('shops').upsert(shop, { onConflict: 'id' });
  if (shopError) throw shopError;
  const { error: therapistError } = await supabase
    .from('therapists')
    .upsert(therapists, { onConflict: 'id' });
  if (therapistError) throw therapistError;

  const result = await verify();
  console.log(`完了: ${result.shop.name} / ${result.therapistCount}名 / 写真${result.withPhoto}名`);
}

main().catch((error) => {
  console.error('失敗:', error.message);
  process.exitCode = 1;
});
