/**
 * Lynx等 店舗カード画像 再取得スクリプト
 *
 * 対象:
 *   - Lynx 全店舗（esthe-lynx-*.com）
 *   - image_url が null または broken（404/非画像）の店舗
 *
 * 実行:
 *   node scripts/maintenance/fix_lynx_shop_images.mjs --dry-run
 *   node scripts/maintenance/fix_lynx_shop_images.mjs
 *
 *   # Lynx 以外も含めて全nullを再取得したい場合:
 *   node scripts/maintenance/fix_all_shop_images.mjs --check-broken
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const toAbsolute = (src, base) => {
  if (!src) return null;
  try {
    if (src.startsWith('http')) return src;
    if (src.startsWith('//')) return 'https:' + src;
    return new URL(src, base).href;
  } catch { return null; }
};
const toHttps = (url) => url?.replace(/^http:\/\//i, 'https://') ?? null;

const BAD_PATTERNS = ['s0.wp.com/i/blank', '/no-image', 'no_image', 'no-img', 'noimage', 'photo/girl/', 'photo/cast/'];
const isBadUrl = (url) => url ? BAD_PATTERNS.some(p => url.toLowerCase().includes(p)) : false;

async function fetchOgImage(websiteUrl) {
  try {
    const res = await fetch(websiteUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();

    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];
    if (og && !isBadUrl(og)) return toHttps(toAbsolute(og, websiteUrl));

    const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
    if (tw && !isBadUrl(tw)) return toHttps(toAbsolute(tw, websiteUrl));

    const icon = html.match(/<link[^>]+apple-touch-icon[^>]+href=["']([^"']+)["']/i)?.[1];
    if (icon) return toHttps(toAbsolute(icon, websiteUrl));

    const logoMatch = [...html.matchAll(/<img[^>]+>/gi)]
      .find(m => /logo/i.test(m[0]) && /src=["']([^"']+)["']/.test(m[0]));
    if (logoMatch) {
      const src = logoMatch[0].match(/src=["']([^"']+)["']/)?.[1];
      if (src && !isBadUrl(src)) return toHttps(toAbsolute(src, websiteUrl));
    }
    return null;
  } catch { return null; }
}

async function isValidImage(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD', headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    return ct.startsWith('image/');
  } catch { return false; }
}

const isForce = process.argv.includes('--force');

console.log(`\n=== Lynx 等 店舗画像 再取得${isDryRun ? ' [DRY RUN]' : ''}${isForce ? ' [FORCE]' : ''} ===\n`);
if (isForce) console.log('⚠️  --force: 全 Lynx 店舗を強制再取得（現在の image_url を無視）\n');

// Lynx 全店舗を取得（website_url か name に lynx/リンクス を含む）
const { data: rawShops, error: e1a } = await supabase
  .from('shops')
  .select('id, name, website_url, image_url')
  .ilike('website_url', '%esthe-lynx%');

const { data: nameShops, error: e1b } = await supabase
  .from('shops')
  .select('id, name, website_url, image_url')
  .ilike('name', '%lynx%');

if (e1a || e1b) { console.error('DB取得エラー:', (e1a || e1b).message); process.exit(1); }

// 重複除去
const shopMap = {};
for (const s of [...(rawShops || []), ...(nameShops || [])]) shopMap[s.id] = s;
const lynxShops = Object.values(shopMap);

console.log(`Lynx 店舗数: ${lynxShops.length}件`);
lynxShops.forEach(s => console.log(`  ${s.id} → ${s.image_url ? s.image_url.slice(0, 70) : 'null'}`));

// --force の場合は全件、それ以外は null/broken のみ
const targets = [];
for (const shop of lynxShops) {
  if (isForce) {
    // Supabase Storage URL でも強制更新（ただし og:image 取得成功した場合のみ置き換え）
    targets.push({ ...shop, reason: 'force' });
    continue;
  }
  if (!shop.image_url) {
    targets.push({ ...shop, reason: 'null' });
    continue;
  }
  // Storage URL はスキップ
  if (shop.image_url.includes('supabase.co')) continue;
  // 外部URL: HEAD チェック（content-type も確認）
  const valid = await isValidImage(shop.image_url);
  if (!valid || isBadUrl(shop.image_url)) {
    targets.push({ ...shop, reason: `broken(${shop.image_url.slice(0, 50)})` });
  }
}

console.log(`\n修正対象: ${targets.length}件`);
if (targets.length === 0) {
  console.log('\n✅ 修正が必要な Lynx 店舗はありませんでした。');
  console.log('（画像が表示されない場合、フロントエンドのキャッシュや他の原因を確認してください）');
  process.exit(0);
}

for (const shop of targets) {
  console.log(`  [${shop.reason}] ${shop.name}`);
}

if (isDryRun) {
  console.log('\n[DRY RUN] ここで終了。実行するには --dry-run を外してください。');
  process.exit(0);
}

console.log('\n--- og:image 再取得開始 ---\n');

// website_url でグループ化
const urlGroups = {};
for (const shop of targets) {
  const url = shop.website_url;
  if (!url) continue;
  if (!urlGroups[url]) urlGroups[url] = [];
  urlGroups[url].push(shop);
}

let fixed = 0, failed = 0;

for (const [websiteUrl, shops] of Object.entries(urlGroups)) {
  const names = shops.map(s => s.name).join('、');
  process.stdout.write(`🔍 ${names.slice(0, 50)}... `);

  const newUrl = await fetchOgImage(websiteUrl);
  if (!newUrl) {
    console.log(`❌ 取得不可 (${websiteUrl.slice(0, 40)})`);
    failed += shops.length;
    continue;
  }

  const valid = await isValidImage(newUrl);
  if (!valid || isBadUrl(newUrl)) {
    console.log(`⚠️  取得URLが無効: ${newUrl.slice(0, 60)}`);
    failed += shops.length;
    continue;
  }

  console.log(`✅ ${newUrl.slice(0, 70)}`);

  for (const shop of shops) {
    const { error } = await supabase
      .from('shops')
      .update({ image_url: newUrl })
      .eq('id', shop.id);
    if (error) {
      console.log(`   ❌ DB更新失敗 [${shop.id}]: ${error.message}`);
      failed++;
    } else {
      fixed++;
    }
  }

  await new Promise(r => setTimeout(r, 400));
}

console.log(`\n=== 完了 ===`);
console.log(`✅ 修正: ${fixed}件`);
console.log(`❌ 取得不可/失敗: ${failed}件`);

if (failed > 0) {
  console.log('\n取得不可の店舗はLynxのサイトが対応CDN変更の可能性があります。');
  console.log('Chrome in Chrome で手動取得が必要な場合があります。');
}
