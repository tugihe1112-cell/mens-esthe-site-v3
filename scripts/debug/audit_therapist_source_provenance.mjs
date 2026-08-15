/**
 * 現在表示中のセラピスト画像が、どの元URLからR2へ移されたかを復元して監査する。
 *
 * 2026-08-14のMoMo Spa事故では、同名の別サイト(momospa.net)の名簿を
 * 公式サイト(momospa.tokyo)の店舗へ結び付けた後、そのままR2へ移行していた。
 * R2化後はDBから元ドメインが見えにくいため、移行前バックアップと
 * `mig_${sha1(sourceUrl).slice(0, 20)}.${ext}` のファイル名を照合して出所を復元する。
 *
 * 読み取り専用。結果は既定で /tmp/therapist-source-provenance.json に保存する。
 *
 *   node scripts/debug/audit_therapist_source_provenance.mjs
 *   node scripts/debug/audit_therapist_source_provenance.mjs --out=/tmp/report.json
 */
import crypto from 'crypto';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const BACKUP_PATH =
  '_archive/root/database_backups/therapists_backup_2026-04-11T01-34-25-910Z.json';
const OUT =
  process.argv.find((arg) => arg.startsWith('--out='))?.slice('--out='.length) ||
  '/tmp/therapist-source-provenance.json';

const AGGREGATOR_ROOTS = new Set([
  'men-esthe.jp',
  'mens-est.jp',
  'men-esthe.com',
  'men-esthe.net',
]);

// 公式ページが直接参照することが多い汎用CMS/CDN。公式ドメインと違っても
// それだけでは誤画像の証拠にならないため、unknownとして別枠にする。
const GENERIC_DELIVERY_ROOTS = new Set([
  'amazonaws.com',
  'cloudfront.net',
  'cloudflare.com',
  'cloudflareimages.com',
  'imagedelivery.net',
  're-db.com',
  'caskan.com',
  'estheking.jp',
  'estama.jp',
  'ap2hp.com',
  'googleusercontent.com',
  'googleapis.com',
  'wixstatic.com',
]);

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

function hostOf(value) {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function rootDomain(host) {
  if (!host) return null;
  const labels = host.split('.').filter(Boolean);
  if (labels.length <= 2) return host;
  const multiPartSuffixes = new Set([
    'co.jp',
    'ne.jp',
    'or.jp',
    'ac.jp',
    'go.jp',
    'com.au',
    'co.uk',
  ]);
  const lastTwo = labels.slice(-2).join('.');
  return multiPartSuffixes.has(lastTwo)
    ? labels.slice(-3).join('.')
    : lastTwo;
}

function sourceUrlFromCurrent(row) {
  const raw = row.raw_data || {};
  return [raw.sourceImageUrl, raw.image, raw.image_url].find(
    (value) => typeof value === 'string' && /^https?:\/\//.test(value),
  );
}

function extensionOf(value) {
  let pathname = '';
  try {
    pathname = new URL(value).pathname;
  } catch {
    pathname = String(value || '').split(/[?#]/)[0];
  }
  const extension = pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (!extension) return 'jpg';
  if (extension === 'jpeg' || extension === 'jfif') return 'jpg';
  return ['jpg', 'png', 'webp', 'gif'].includes(extension) ? extension : 'jpg';
}

function migrationFilename(sourceUrl) {
  const hash = crypto.createHash('sha1').update(sourceUrl).digest('hex').slice(0, 20);
  return `mig_${hash}.${extensionOf(sourceUrl)}`;
}

function filenameOf(value) {
  try {
    return new URL(value).pathname.split('/').filter(Boolean).at(-1) || '';
  } catch {
    return '';
  }
}

async function fetchAll(table, columns) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order('id')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if ((data || []).length < pageSize) break;
  }
  return rows;
}

function sample(values, size = 8) {
  return [...new Set(values)].slice(0, size);
}

function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function summarizeGroup([key, rows]) {
  const [shopId, sourceRoot] = key.split('\u0000');
  const first = rows[0];
  return {
    shopId,
    shopName: first.shopName,
    websiteUrl: first.websiteUrl,
    officialRoot: first.officialRoot,
    sourceRoot,
    count: rows.length,
    sourceHosts: sample(rows.map((row) => row.sourceHost)),
    names: sample(rows.map((row) => row.therapistName)),
    sourceUrls: sample(rows.map((row) => row.sourceUrl), 3),
    provenance: sample(rows.map((row) => row.provenance)),
  };
}

function normalizePersonName(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\s　]+/g, '')
    .replace(/[（(]\d{2}[）)]$/g, '')
    .replace(/^(?:新人|《新人》|【新人】)/, '')
    .replace(/[.。]+$/g, '')
    .trim();
}

async function main() {
  const [shops, therapists] = await Promise.all([
    fetchAll('shops', 'id,name,website_url,group_id'),
    fetchAll('therapists', 'id,shop_id,name,image_url,raw_data,is_active'),
  ]);
  const shopById = new Map(shops.map((shop) => [shop.id, shop]));
  const officialShopsByRoot = groupBy(
    shops.filter((shop) => hostOf(shop.website_url)),
    (shop) => rootDomain(hostOf(shop.website_url)),
  );

  const backup = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));
  const backupById = new Map();
  const backupSourceByMigrationFilename = new Map();
  for (const row of backup) {
    if (!/^https?:\/\//.test(row.image_url || '')) continue;
    const candidates = backupById.get(row.id) || [];
    candidates.push(row.image_url);
    backupById.set(row.id, candidates);
    backupSourceByMigrationFilename.set(migrationFilename(row.image_url), row.image_url);
  }

  const recovered = [];
  for (const therapist of therapists) {
    if (!therapist.image_url || therapist.is_active === false) continue;
    const shop = shopById.get(therapist.shop_id);
    if (!shop) continue;

    let sourceUrl = sourceUrlFromCurrent(therapist);
    let provenance = sourceUrl ? 'current_raw_data' : null;
    if (!sourceUrl) {
      const currentFilename = filenameOf(therapist.image_url);
      sourceUrl = (backupById.get(therapist.id) || []).find(
        (candidate) => migrationFilename(candidate) === currentFilename,
      );
      if (sourceUrl) provenance = 'backup_hash_match';
      if (!sourceUrl) {
        sourceUrl = backupSourceByMigrationFilename.get(currentFilename);
        if (sourceUrl) provenance = 'backup_global_hash_match';
      }
    }
    if (!sourceUrl) continue;

    const sourceHost = hostOf(sourceUrl);
    const officialHost = hostOf(shop.website_url);
    recovered.push({
      therapistId: therapist.id,
      therapistName: therapist.name,
      shopId: shop.id,
      shopName: shop.name,
      groupId: shop.group_id,
      websiteUrl: shop.website_url,
      officialHost,
      officialRoot: rootDomain(officialHost),
      currentImageUrl: therapist.image_url,
      sourceUrl,
      sourceHost,
      sourceRoot: rootDomain(sourceHost),
      provenance,
    });
  }

  const mismatches = recovered.filter(
    (row) => row.sourceRoot && row.officialRoot && row.sourceRoot !== row.officialRoot,
  );
  const aggregator = mismatches.filter((row) => AGGREGATOR_ROOTS.has(row.sourceRoot));
  const anotherOfficial = mismatches.filter((row) => {
    const owners = officialShopsByRoot.get(row.sourceRoot) || [];
    return owners.some(
      (shop) => shop.id !== row.shopId && (!row.groupId || shop.group_id !== row.groupId),
    );
  });
  const unknown = mismatches.filter(
    (row) =>
      !AGGREGATOR_ROOTS.has(row.sourceRoot) &&
      !GENERIC_DELIVERY_ROOTS.has(row.sourceRoot) &&
      !anotherOfficial.includes(row),
  );

  const urlGroups = groupBy(recovered, (row) => row.sourceUrl);
  const crossShopReuse = [...urlGroups.values()]
    .filter((rows) => new Set(rows.map((row) => row.shopId)).size > 1)
    .filter((rows) => new Set(rows.map((row) => row.therapistName)).size > 1)
    .filter((rows) => {
      const groupIds = new Set(rows.map((row) => row.groupId).filter(Boolean));
      const roots = new Set(rows.map((row) => row.officialRoot).filter(Boolean));
      return groupIds.size !== 1 && roots.size !== 1;
    })
    .map((rows) => ({
      sourceUrl: rows[0].sourceUrl,
      currentImageUrl: rows[0].currentImageUrl,
      count: rows.length,
      shops: sample(rows.map((row) => `${row.shopId}:${row.shopName}`), 12),
      names: sample(rows.map((row) => row.therapistName), 12),
    }))
    .sort((a, b) => b.count - a.count);

  const recoveredByTherapistId = new Map(
    recovered.map((row) => [row.therapistId, row]),
  );
  const imageRows = therapists
    .filter((row) => row.image_url && row.is_active !== false)
    .map((row) => {
      const shop = shopById.get(row.shop_id);
      const recoveredRow = recoveredByTherapistId.get(row.id);
      return {
        therapistId: row.id,
        therapistName: row.name,
        normalizedName: normalizePersonName(row.name),
        shopId: row.shop_id,
        shopName: shop?.name || '',
        groupId: shop?.group_id || null,
        officialRoot: rootDomain(hostOf(shop?.website_url)),
        imageUrl: row.image_url,
        sourceUrl: recoveredRow?.sourceUrl || null,
      };
    });
  const withinShopReuse = [...groupBy(imageRows, (row) => `${row.shopId}\u0000${row.imageUrl}`).values()]
    .map((rows) => ({
      shopId: rows[0].shopId,
      shopName: rows[0].shopName,
      imageUrl: rows[0].imageUrl,
      sourceUrl: rows.find((row) => row.sourceUrl)?.sourceUrl || null,
      rowCount: rows.length,
      distinctNormalizedNames: new Set(rows.map((row) => row.normalizedName)).size,
      names: sample(rows.map((row) => row.therapistName), 15),
      ids: sample(rows.map((row) => row.therapistId), 15),
    }))
    .filter((group) => group.distinctNormalizedNames >= 2)
    .sort(
      (a, b) =>
        b.distinctNormalizedNames - a.distinctNormalizedNames || b.rowCount - a.rowCount,
    );
  const currentCrossShopReuse = [...groupBy(imageRows, (row) => row.imageUrl).values()]
    .filter((rows) => new Set(rows.map((row) => row.shopId)).size > 1)
    .filter((rows) => new Set(rows.map((row) => row.normalizedName)).size > 1)
    .filter((rows) => {
      const groupIds = new Set(rows.map((row) => row.groupId).filter(Boolean));
      const roots = new Set(rows.map((row) => row.officialRoot).filter(Boolean));
      return groupIds.size !== 1 && roots.size !== 1;
    })
    .map((rows) => ({
      imageUrl: rows[0].imageUrl,
      sourceUrl: rows.find((row) => row.sourceUrl)?.sourceUrl || null,
      rowCount: rows.length,
      shopCount: new Set(rows.map((row) => row.shopId)).size,
      distinctNormalizedNames: new Set(rows.map((row) => row.normalizedName)).size,
      shops: sample(rows.map((row) => `${row.shopId}:${row.shopName}`), 20),
      names: sample(rows.map((row) => row.therapistName), 20),
      ids: sample(rows.map((row) => row.therapistId), 30),
    }))
    .sort(
      (a, b) =>
        b.distinctNormalizedNames - a.distinctNormalizedNames || b.rowCount - a.rowCount,
    );

  const grouped = (rows) =>
    [...groupBy(rows, (row) => `${row.shopId}\u0000${row.sourceRoot}`).entries()]
      .map(summarizeGroup)
      .sort((a, b) => b.count - a.count || a.shopName.localeCompare(b.shopName, 'ja'));

  const report = {
    generatedAt: new Date().toISOString(),
    counts: {
      shops: shops.length,
      activeWithImage: therapists.filter((row) => row.image_url && row.is_active !== false).length,
      sourceRecovered: recovered.length,
      sameOfficialRoot: recovered.length - mismatches.length,
      mismatchedRoot: mismatches.length,
      aggregator: aggregator.length,
      anotherOfficial: anotherOfficial.length,
      unknownNonGeneric: unknown.length,
      crossShopReuseGroups: crossShopReuse.length,
      withinShopReuseGroups: withinShopReuse.length,
      currentCrossShopReuseGroups: currentCrossShopReuse.length,
    },
    aggregator: grouped(aggregator),
    anotherOfficial: grouped(anotherOfficial),
    unknownNonGeneric: grouped(unknown),
    crossShopReuse,
    withinShopReuse,
    currentCrossShopReuse,
  };
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.counts, null, 2));
  console.log(`\n別店舗の公式ドメイン由来: ${report.anotherOfficial.length}グループ`);
  for (const row of report.anotherOfficial.slice(0, 30)) {
    console.log(`  ${row.shopId} | ${row.shopName} | ${row.sourceRoot} | ${row.count}件`);
  }
  console.log(`\n不明なブランド/CDN由来: ${report.unknownNonGeneric.length}グループ`);
  for (const row of report.unknownNonGeneric.slice(0, 50)) {
    console.log(`  ${row.shopId} | ${row.shopName} | ${row.sourceRoot} | ${row.count}件`);
  }
  console.log(`\n同一元画像の無関係店舗間使い回し: ${crossShopReuse.length}組`);
  for (const row of crossShopReuse.slice(0, 20)) {
    console.log(`  ${row.count}件 | ${row.shops.join(' / ')} | ${row.names.join('、')}`);
  }
  console.log(`\n1店舗内の異名同一画像: ${withinShopReuse.length}組`);
  for (const row of withinShopReuse.slice(0, 40)) {
    console.log(
      `  ${row.shopId} | ${row.distinctNormalizedNames}名 | ${row.names.join('、')} | ${row.sourceUrl || row.imageUrl}`,
    );
  }
  console.log(`\n現在URLの無関係店舗間使い回し: ${currentCrossShopReuse.length}組`);
  for (const row of currentCrossShopReuse.slice(0, 40)) {
    console.log(
      `  ${row.shopCount}店/${row.distinctNormalizedNames}名 | ${row.shops.join(' / ')} | ${row.names.join('、')}`,
    );
  }
  console.log(`\n詳細: ${OUT}`);
}

main().catch((error) => {
  console.error('❌', error.message);
  process.exit(1);
});
