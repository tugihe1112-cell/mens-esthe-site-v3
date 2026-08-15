/**
 * 同一画像の別人・別店舗への誤割当を全件除去し、LOHAS 2店舗の保存名衝突を修復する。
 *
 * 原因:
 * 1. 公式HTMLの<img src>がspacer/準備中で、実画像がbackground-imageにあるサイトを誤抽出
 * 2. `lohas_${lid}.jpg` のように店舗を含まないR2キーを使い、金沢と沖縄で相互上書き
 * 3. 動画URLをjpg拡張子でR2へ保存
 * 4. 同一元画像を無関係な別人名へ結び付けた旧スクレイプ
 *
 * 既定はdry-run。--liveのみDB/R2を変更する。
 *
 *   node scripts/maintenance/repair_semantic_image_collisions.mjs
 *   node scripts/maintenance/repair_semantic_image_collisions.mjs --live
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { uploadImage } from '../lib/r2Upload.mjs';
import {
  KNOWN_BAD_THERAPIST_IMAGE_URLS,
  areTherapistNamesLikelySame,
  findUnrelatedRepeatedTherapistImageGroups,
  isKnownBadTherapistImageUrl,
  isSuspiciousTherapistName,
  normalizeTherapistNameForImageComparison,
} from '../lib/therapistImageQuality.mjs';
import {
  assertOfficialRosterSource,
  rootDomainOf,
  scopedImageKey,
} from '../lib/sourceProvenance.mjs';

const LIVE = process.argv.includes('--live');
const INVALID_VIDEO_URL =
  'https://mens-esthe-images.tugihe1112.workers.dev/therapist-images/mig_dedaeba698addfa21c16.jpg';

const LOHAS_SPECS = [
  {
    shopId: 'ishikawa_kanazawa_lohas',
    officialWebsiteUrl: 'https://spa-lohas.com/top',
    rosterUrl: 'https://spa-lohas.com/top',
    keyPrefix: 'lohas_kanazawa',
    min: 25,
    max: 50,
  },
  {
    shopId: 'okinawa_naha_lohas',
    officialWebsiteUrl: 'https://lohas-official.com/s/',
    rosterUrl: 'https://lohas-official.com/s/girl',
    keyPrefix: 'lohas_okinawa',
    min: 20,
    max: 40,
  },
];

function env(key) {
  if (process.env[key]) return process.env[key];
  const text = fs.readFileSync('.env', 'utf8');
  return text
    .match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]
    ?.trim()
    .replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env('VITE_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`公式ページ取得失敗: HTTP ${response.status} ${url}`);
  return response.text();
}

function cleanOfficialName(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s*[（(]\d{2}[）)]\s*$/, '')
    .replace(/^(?:《新人》|【新人】|新人)\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLohasRoster(html, spec) {
  const $ = cheerio.load(html);
  const byLid = new Map();
  $('a[href*="profile?lid="]').each((_, anchor) => {
    const $anchor = $(anchor);
    const $image = $anchor.find('img[src*="/photos/"]').first();
    if (!$image.length) return;
    const href = $anchor.attr('href');
    const lid = href?.match(/[?&]lid=(\d+)/)?.[1];
    if (!lid) return;
    const $panel = $anchor.closest('.c-panel, .newface_article, li');
    const panelName = $panel.find('.newface_name, .c-panel__name').first().text();
    const name = cleanOfficialName(panelName || $image.attr('alt') || $anchor.attr('title'));
    const sourceImageUrl = new URL($image.attr('src'), spec.rosterUrl).href;
    const profileUrl = new URL(href, spec.rosterUrl).href;
    if (!name || isSuspiciousTherapistName(name) || !/^[ぁ-んァ-ヶ一-龯A-Za-z]+$/.test(name)) return;
    byLid.set(lid, { lid, name, sourceImageUrl, profileUrl });
  });
  const roster = [...byLid.values()];
  if (roster.length < spec.min || roster.length > spec.max) {
    throw new Error(
      `${spec.shopId}の公式人数が異常: ${roster.length}名（許容${spec.min}〜${spec.max}）`,
    );
  }
  const normalizedNames = roster.map((row) => normalizeTherapistNameForImageComparison(row.name));
  if (new Set(normalizedNames).size !== normalizedNames.length) {
    throw new Error(`${spec.shopId}の公式名簿に同名重複があります`);
  }
  return roster;
}

async function fetchAll(table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order('id')
      .range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if ((data || []).length < 1000) break;
  }
  return rows;
}

function groupBy(rows, keyOf) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  }
  return groups;
}

function isNoiseRow(row) {
  return isSuspiciousTherapistName(row.name);
}

function crossShopCollisionGroups(rows, shopById) {
  return [...groupBy(rows.filter((row) => row.image_url), (row) => row.image_url).values()]
    .filter((group) => new Set(group.map((row) => row.shop_id)).size > 1)
    .filter((group) => {
      const shops = group.map((row) => shopById.get(row.shop_id)).filter(Boolean);
      const roots = new Set(shops.map((shop) => rootDomainOf(shop.website_url)).filter(Boolean));
      const groupIds = new Set(shops.map((shop) => shop.group_id).filter(Boolean));
      if (roots.size === 1 || groupIds.size === 1) return false;
      const names = [...new Set(group.map((row) => row.name))];
      return names.some((name, index) =>
        names.slice(index + 1).some((other) => !areTherapistNamesLikelySame(name, other)),
      );
    })
    .map((group) => ({
      imageUrl: group[0].image_url,
      rows: group,
    }));
}

async function prepareOfficialLohas() {
  const prepared = [];
  for (const spec of LOHAS_SPECS) {
    assertOfficialRosterSource(spec);
    const roster = parseLohasRoster(await fetchHtml(spec.rosterUrl), spec);
    console.log(`${spec.shopId}: 公式${roster.length}名`);
    prepared.push({ spec, roster });
  }
  if (!LIVE) return prepared;

  for (const item of prepared) {
    const uploaded = [];
    for (let from = 0; from < item.roster.length; from += 4) {
      const batch = item.roster.slice(from, from + 4);
      const results = await Promise.all(
        batch.map(async (cast) => {
          const key = scopedImageKey({
            shopId: item.spec.shopId,
            castId: cast.lid,
            sourceUrl: cast.sourceImageUrl,
            prefix: item.spec.keyPrefix,
          });
          const imageUrl = await uploadImage(
            cast.sourceImageUrl,
            key,
            item.spec.rosterUrl,
            'therapist-images',
            {
              timeoutMs: 30_000,
              officialWebsiteUrl: item.spec.officialWebsiteUrl,
              sourcePageUrl: item.spec.rosterUrl,
            },
          );
          if (!imageUrl) throw new Error(`公式写真の保存失敗: ${item.spec.shopId}/${cast.name}`);
          return { ...cast, imageUrl };
        }),
      );
      uploaded.push(...results);
      console.log(`  ${item.spec.shopId}: 写真 ${uploaded.length}/${item.roster.length}`);
    }
    item.roster = uploaded;
  }
  return prepared;
}

async function reviewReferencedIds(ids) {
  const referenced = new Set();
  for (let from = 0; from < ids.length; from += 80) {
    const chunk = ids.slice(from, from + 80);
    const { data, error } = await supabase
      .from('reviews')
      .select('therapist_id')
      .in('therapist_id', chunk);
    if (error) throw error;
    for (const row of data || []) if (row.therapist_id) referenced.add(row.therapist_id);
  }
  return referenced;
}

async function nullImageUrls(urls) {
  let total = 0;
  for (let from = 0; from < urls.length; from += 50) {
    const chunk = urls.slice(from, from + 50);
    const { data, error } = await supabase
      .from('therapists')
      .update({ image_url: null, profile_image: null })
      .in('image_url', chunk)
      .select('id');
    if (error) throw error;
    total += (data || []).length;
  }
  return total;
}

async function removeNoiseRows(rows) {
  if (!rows.length) return { deleted: 0, deactivated: 0 };
  const referenced = await reviewReferencedIds(rows.map((row) => row.id));
  const deletable = rows.filter((row) => !referenced.has(row.id)).map((row) => row.id);
  const retained = rows.filter((row) => referenced.has(row.id)).map((row) => row.id);
  let deleted = 0;
  let deactivated = 0;
  if (deletable.length) {
    const { data, error } = await supabase
      .from('therapists')
      .delete()
      .in('id', deletable)
      .select('id');
    if (error) throw error;
    deleted = (data || []).length;
  }
  if (retained.length) {
    const { data, error } = await supabase
      .from('therapists')
      .update({ is_active: false, image_url: null, profile_image: null })
      .in('id', retained)
      .select('id');
    if (error) throw error;
    deactivated = (data || []).length;
  }
  return { deleted, deactivated };
}

async function syncLohas(prepared, allTherapists) {
  const now = new Date().toISOString();
  for (const { spec, roster } of prepared) {
    const existing = allTherapists.filter((row) => row.shop_id === spec.shopId);
    const byName = groupBy(existing, (row) => normalizeTherapistNameForImageComparison(row.name));
    const { error: deactivateError } = await supabase
      .from('therapists')
      .update({ is_active: false, image_url: null, profile_image: null })
      .eq('shop_id', spec.shopId);
    if (deactivateError) throw deactivateError;

    for (const cast of roster) {
      const normalized = normalizeTherapistNameForImageComparison(cast.name);
      const candidates = byName.get(normalized) || [];
      const current =
        candidates.find((row) => row.id === `${spec.shopId}_${cast.name}`) || candidates[0];
      const values = {
        shop_id: spec.shopId,
        name: cast.name,
        image_url: cast.imageUrl,
        profile_image: cast.imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          source: spec.rosterUrl,
          sourceDomain: new URL(spec.rosterUrl).hostname,
          sourceCastId: cast.lid,
          profileUrl: cast.profileUrl,
          sourceImageUrl: cast.sourceImageUrl,
        },
      };
      if (current) {
        const { error } = await supabase.from('therapists').update(values).eq('id', current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('therapists').insert({
          id: `${spec.shopId}_official_${cast.lid}`,
          ...values,
        });
        if (error) throw error;
      }
    }
  }
}

async function verify(prepared) {
  const [shops, therapists] = await Promise.all([
    fetchAll('shops', 'id,website_url,group_id'),
    fetchAll('therapists', 'id,shop_id,name,image_url,profile_image,is_active,raw_data'),
  ]);
  const active = therapists.filter((row) => row.is_active !== false);
  const semantic = findUnrelatedRepeatedTherapistImageGroups(active);
  const shopById = new Map(shops.map((shop) => [shop.id, shop]));
  const cross = crossShopCollisionGroups(active, shopById);
  const knownBad = active.filter((row) => isKnownBadTherapistImageUrl(row.image_url));
  const suspiciousNames = active.filter(isNoiseRow);
  const blank = active.filter((row) => row.image_url === '');
  if (semantic.length) throw new Error(`別人名の同一画像が${semantic.length}組残っています`);
  if (cross.length) throw new Error(`無関係店舗間の同一画像が${cross.length}組残っています`);
  if (knownBad.length) throw new Error(`既知の誤画像が${knownBad.length}件残っています`);
  if (suspiciousNames.length) throw new Error(`広告・テスト名が${suspiciousNames.length}件残っています`);
  if (blank.length) throw new Error(`空文字image_urlが${blank.length}件残っています`);

  for (const { spec, roster } of prepared) {
    const rows = active.filter((row) => row.shop_id === spec.shopId);
    if (rows.length !== roster.length) {
      throw new Error(`${spec.shopId}の有効人数不一致: ${rows.length}/${roster.length}`);
    }
    if (rows.some((row) => !row.image_url || row.image_url !== row.profile_image)) {
      throw new Error(`${spec.shopId}に写真未設定またはprofile_image不一致があります`);
    }
    if (new Set(rows.map((row) => row.image_url)).size !== rows.length) {
      throw new Error(`${spec.shopId}の公式写真URLに重複があります`);
    }
    if (rows.some((row) => row.raw_data?.source !== spec.rosterUrl)) {
      throw new Error(`${spec.shopId}に公式出所未記録の行があります`);
    }
  }
  return {
    active: active.length,
    knownBad: knownBad.length,
    semanticCollisions: semantic.length,
    crossShopCollisions: cross.length,
    suspiciousNames: suspiciousNames.length,
  };
}

async function main() {
  console.log(`[${LIVE ? 'LIVE' : 'DRY RUN'}] セラピスト画像の意味的衝突を修復`);
  const officialLohas = await prepareOfficialLohas();
  const [shops, therapists] = await Promise.all([
    fetchAll('shops', 'id,name,website_url,group_id'),
    fetchAll('therapists', 'id,shop_id,name,image_url,profile_image,is_active,raw_data'),
  ]);
  const active = therapists.filter((row) => row.is_active !== false);
  const noiseRows = active.filter(isNoiseRow);
  const cleanActive = active.filter((row) => !isNoiseRow(row));
  const within = findUnrelatedRepeatedTherapistImageGroups(cleanActive);
  const shopById = new Map(shops.map((shop) => [shop.id, shop]));
  const cross = crossShopCollisionGroups(cleanActive, shopById);
  const badUrls = new Set([
    ...KNOWN_BAD_THERAPIST_IMAGE_URLS,
    INVALID_VIDEO_URL,
    ...within.map((group) => group.imageUrl),
    ...cross.map((group) => group.imageUrl),
  ]);
  const affectedRows = active.filter((row) => badUrls.has(row.image_url));
  const blankRows = active.filter((row) => row.image_url === '');

  console.log(`公式LOHAS: ${officialLohas.map((item) => `${item.spec.shopId}=${item.roster.length}`).join(', ')}`);
  console.log(`1店舗内の別人名・同一画像: ${within.length}組`);
  console.log(`無関係店舗間の同一画像: ${cross.length}組`);
  console.log(`非表示対象: ${affectedRows.length}行 / ${badUrls.size} URL`);
  console.log(`空文字画像: ${blankRows.length}行 / 広告・テスト名: ${noiseRows.length}行`);
  if (noiseRows.length) {
    console.log(`  広告・テスト名: ${noiseRows.map((row) => `${row.id}=${row.name}`).join(', ')}`);
  }
  for (const group of within.slice(0, 35)) {
    console.log(`  ${group.shopId}: ${group.names.join(' / ')}`);
  }

  if (!LIVE) {
    console.log('DBとR2は変更していません。実更新は --live を付けてください。');
    return;
  }

  const nulled = await nullImageUrls([...badUrls]);
  const { data: blankUpdated, error: blankError } = await supabase
    .from('therapists')
    .update({ image_url: null, profile_image: null })
    .eq('image_url', '')
    .select('id');
  if (blankError) throw blankError;
  const noise = await removeNoiseRows(noiseRows);
  await syncLohas(officialLohas, therapists);
  const verified = await verify(officialLohas);

  console.log(`非表示: ${nulled}行 / 空文字修正: ${(blankUpdated || []).length}行`);
  console.log(`広告・テスト行: 削除${noise.deleted} / 非活性${noise.deactivated}`);
  console.log(`検証: ${JSON.stringify(verified)}`);
  console.log('✅ 修復・公式名簿再同期・自己検証が完了しました');
}

main().catch((error) => {
  console.error('❌', error.message);
  process.exit(1);
});
