/**
 * Supabase Storage の店舗サムネイルを og:image に差し替え
 * 同一 website_url の店舗はまとめて1回フェッチ → 全店舗に適用
 * 実行: node scripts/maintenance/fix_shop_storage_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const STORAGE_ORIGIN = getEnv('VITE_SUPABASE_URL') + '/storage';
const DELAY_MS = 1200; // リクエスト間隔

if (DRY_RUN) console.log('🔍 DRY-RUN モード（DB変更なし）\n');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// og:image / twitter:image / apple-touch-icon を取得
async function fetchOgImage(siteUrl) {
  try {
    const res = await fetch(siteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const patterns = [
      /og:image[^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*og:image/i,
      /twitter:image[^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*twitter:image/i,
      /apple-touch-icon[^>]*href=["']([^"']+)["']/i,
    ];

    for (const pat of patterns) {
      const m = html.match(pat);
      if (m?.[1]) {
        let imgUrl = m[1].trim();
        if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
        if (imgUrl.startsWith('/')) {
          const base = new URL(siteUrl);
          imgUrl = base.origin + imgUrl;
        }
        if (imgUrl.startsWith('http')) return imgUrl;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// 対象店舗（Supabase Storage 画像）を取得
const { data: shops } = await supabase
  .from('shops')
  .select('id, name, image_url, website_url')
  .order('website_url');

const targets = shops.filter(s => s.image_url && s.image_url.includes(STORAGE_ORIGIN) && s.website_url);
console.log(`差し替え対象: ${targets.length}件\n`);

// website_url でグループ化
const byUrl = {};
for (const s of targets) {
  const key = s.website_url.replace(/\/$/, '');
  if (!byUrl[key]) byUrl[key] = [];
  byUrl[key].push(s);
}

const urls = Object.keys(byUrl);
console.log(`ユニークURL数: ${urls.length}件（1回フェッチで複数店舗に適用）\n`);

let updated = 0, failed = 0, skipped = 0;

for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  const shopGroup = byUrl[url];
  const names = shopGroup.map(s => s.name).join(', ');

  process.stdout.write(`[${i + 1}/${urls.length}] ${url} ... `);

  const ogImg = await fetchOgImage(url);

  if (!ogImg) {
    console.log(`❌ 取得失敗 → [${names}]`);
    failed += shopGroup.length;
    await sleep(DELAY_MS);
    continue;
  }

  // Storage の既存画像と同じなら skip（外部URLが入っていれば既に綺麗）
  const isSameAsStorage = shopGroup.every(s => s.image_url === ogImg);
  if (isSameAsStorage) {
    console.log(`⏭ 変化なし`);
    skipped += shopGroup.length;
    await sleep(DELAY_MS);
    continue;
  }

  console.log(`✅ ${ogImg.slice(0, 60)}...`);

  if (!DRY_RUN) {
    for (const shop of shopGroup) {
      const { error } = await supabase
        .from('shops')
        .update({ image_url: ogImg })
        .eq('id', shop.id);
      if (error) {
        console.log(`  ⚠️  更新失敗: ${shop.name} - ${error.message}`);
        failed++;
      } else {
        updated++;
      }
    }
  } else {
    shopGroup.forEach(s => console.log(`  → ${s.name}`));
    updated += shopGroup.length;
  }

  await sleep(DELAY_MS);
}

console.log(`\n=== 完了 ===`);
console.log(`✅ 更新: ${updated}件`);
console.log(`❌ 失敗: ${failed}件`);
console.log(`⏭ スキップ: ${skipped}件`);
if (DRY_RUN) console.log('\n本実行は --dry-run なしで。');
