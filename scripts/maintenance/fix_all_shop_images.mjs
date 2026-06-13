/**
 * 店舗画像 一括補完スクリプト（v2）
 *
 * 対象:
 *   1. image_url = null の店舗（website_url ありのもの）
 *   2. --check-broken オプション付きのとき: image_url が外部URLで 404/非画像になっている店舗も再取得
 *
 * 実行:
 *   node scripts/maintenance/fix_all_shop_images.mjs              # nullのみ補完
 *   node scripts/maintenance/fix_all_shop_images.mjs --check-broken  # 壊れたURLも再取得
 *   node scripts/maintenance/fix_all_shop_images.mjs --dry-run    # 確認のみ（DB更新しない）
 *
 * 画像取得の優先順位: og:image → twitter:image → apple-touch-icon → logo img
 * DB更新: image_url に直接 og:image の URL を設定（Storage 不使用）
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const checkBroken = process.argv.includes('--check-broken');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

// Service Role Key を使用（RLS バイパス）
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** URL を絶対 URL に変換 */
const toAbsolute = (src, base) => {
  if (!src) return null;
  try {
    if (src.startsWith('http')) return src;
    if (src.startsWith('//')) return 'https:' + src;
    return new URL(src, base).href;
  } catch { return null; }
};

/** HTTP → HTTPS に変換（混在コンテンツ対策） */
const toHttps = (url) => url?.replace(/^http:\/\//i, 'https://') ?? null;

/** サイトの og:image を取得する */
const fetchOgImage = async (websiteUrl) => {
  try {
    const res = await fetch(websiteUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();

    // 1. og:image
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];
    if (og) return toHttps(toAbsolute(og, websiteUrl));

    // 2. twitter:image
    const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)?.[1];
    if (tw) return toHttps(toAbsolute(tw, websiteUrl));

    // 3. apple-touch-icon
    const icon = html.match(/<link[^>]+apple-touch-icon[^>]+href=["']([^"']+)["']/i)?.[1];
    if (icon) return toHttps(toAbsolute(icon, websiteUrl));

    // 4. ヘッダーのロゴ img
    const logoMatch = [...html.matchAll(/<img[^>]+>/gi)]
      .find(m => /logo/i.test(m[0]) && /src=["']([^"']+)["']/.test(m[0]));
    if (logoMatch) {
      const src = logoMatch[0].match(/src=["']([^"']+)["']/)?.[1];
      if (src) return toHttps(toAbsolute(src, websiteUrl));
    }

    return null;
  } catch { return null; }
};

/** URL が有効な画像を返すか確認 */
const isValidImage = async (url) => {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    return ct.startsWith('image/') || ct.startsWith('video/') || ct === 'application/octet-stream';
  } catch { return false; }
};

// ---- メイン処理 ----

console.log(`\n=== 店舗画像 一括補完スクリプト${isDryRun ? ' [DRY RUN]' : ''}${checkBroken ? ' +壊れたURL確認' : ''} ===\n`);

// 1. image_url = null の店舗を取得
const { data: nullShops, error: e1 } = await supabase
  .from('shops')
  .select('id, name, website_url, image_url')
  .is('image_url', null)
  .not('website_url', 'is', null)
  .order('id');

if (e1) {
  console.error('DB取得エラー:', e1.message);
  process.exit(1);
}

console.log(`image_url=null の店舗: ${nullShops?.length ?? 0}件`);

// 2. --check-broken のとき: 外部URL（Storage以外）で壊れているものを取得
let brokenShops = [];
if (checkBroken) {
  const { data: allShops } = await supabase
    .from('shops')
    .select('id, name, website_url, image_url')
    .not('image_url', 'is', null)
    .not('website_url', 'is', null)
    .not('image_url', 'like', '%supabase.co%') // Storage URL は除外
    .order('id');

  if (allShops?.length) {
    console.log(`\n外部 image_url の店舗 ${allShops.length}件 を確認中（時間がかかります）...`);
    let checked = 0;
    for (const shop of allShops) {
      checked++;
      if (checked % 50 === 0) process.stdout.write(`  ${checked}/${allShops.length}件チェック済み\r`);
      const ok = await isValidImage(shop.image_url);
      if (!ok) brokenShops.push(shop);
    }
    console.log(`\n壊れた image_url: ${brokenShops.length}件`);
    brokenShops.forEach(s => console.log(`  ❌ ${s.name}: ${s.image_url?.substring(0, 60)}`));
  }
}

const targets = [...(nullShops || []), ...brokenShops];
if (targets.length === 0) {
  console.log('\n✅ 補完が必要な店舗はありませんでした。');
  process.exit(0);
}

console.log(`\n合計 ${targets.length}件 の処理を開始します...\n`);

// website_url ごとにグループ化（同一URLの店舗は1回だけ fetch）
const urlGroups = {};
for (const shop of targets) {
  const url = shop.website_url;
  if (!urlGroups[url]) urlGroups[url] = [];
  urlGroups[url].push(shop);
}

let successCount = 0, failCount = 0, noImageCount = 0;

for (const [websiteUrl, shops] of Object.entries(urlGroups)) {
  const shopNames = shops.map(s => s.name).join('、');
  process.stdout.write(`🔍 ${shopNames.substring(0, 40)}... `);

  const imageUrl = await fetchOgImage(websiteUrl);
  if (!imageUrl) {
    console.log(`❌ 画像未検出 (${websiteUrl.substring(0, 40)})`);
    noImageCount += shops.length;
    continue;
  }

  // 画像URLが実際に取得できるか確認
  const valid = await isValidImage(imageUrl);
  if (!valid) {
    console.log(`⚠️  URL無効: ${imageUrl.substring(0, 60)}`);
    noImageCount += shops.length;
    continue;
  }

  console.log(`✅ ${imageUrl.substring(0, 60)}`);

  if (!isDryRun) {
    for (const shop of shops) {
      const { error } = await supabase
        .from('shops')
        .update({ image_url: imageUrl })
        .eq('id', shop.id);
      if (error) {
        console.log(`   ⚠️ DB更新失敗 [${shop.id}]: ${error.message}`);
        failCount++;
      } else {
        successCount++;
      }
    }
  } else {
    successCount += shops.length;
  }

  // レート制限対策
  await new Promise(r => setTimeout(r, 400));
}

console.log(`\n=== 完了 ===`);
console.log(`✅ 成功: ${successCount}件`);
console.log(`❌ 画像未検出: ${noImageCount}件`);
console.log(`⚠️  失敗: ${failCount}件`);
if (isDryRun) console.log('\n[DRY RUN] DBへの書き込みは行いませんでした。');
