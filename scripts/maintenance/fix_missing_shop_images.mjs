/**
 * image_url が未設定の店舗に対して
 * og:image → apple-touch-icon → logo画像 → background-image の順で取得・設定
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase
  .from('shops')
  .select('id, name, website_url')
  .is('image_url', null)
  .not('website_url', 'is', null);

const toAbsolute = (src, base) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  if (src.startsWith('/')) return new URL(base).origin + src;
  return base.replace(/\/$/, '') + '/' + src;
};

const findImage = async (url) => {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();

    // 1. og:image
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
              || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];
    if (og) return toAbsolute(og, url);

    // 2. apple-touch-icon
    const icon = html.match(/<link[^>]+apple-touch-icon[^>]+href=["']([^"']+)["']/i)?.[1];
    if (icon) return toAbsolute(icon, url);

    // 3. logo画像（alt や src に logo を含む img）
    const logoMatch = [...html.matchAll(/<img[^>]+>/gi)].find(m => {
      const tag = m[0];
      return /logo/i.test(tag) && /src=["']([^"']+)["']/.test(tag);
    });
    if (logoMatch) {
      const src = logoMatch[0].match(/src=["']([^"']+)["']/)?.[1];
      if (src) return toAbsolute(src, url);
    }

    // 4. background-image（サイト独自ドメインのもの）
    const base = new URL(url).origin;
    const bgMatch = [...html.matchAll(/url\(["']?([^"')]+)["']?\)/gi)]
      .map(m => m[1])
      .find(s => s.startsWith(base) || s.startsWith('/'));
    if (bgMatch) return toAbsolute(bgMatch, url);

    return null;
  } catch (e) {
    return null;
  }
};

const checkImage = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return res.ok && (res.headers.get('content-type') || '').startsWith('image');
  } catch { return false; }
};

console.log(`${isDryRun ? '[DRY RUN] ' : ''}shop画像 一括設定\n`);

for (const shop of shops || []) {
  console.log(`🔍 ${shop.name} (${shop.website_url})`);
  const imageUrl = await findImage(shop.website_url);

  if (!imageUrl) {
    console.log(`   ❌ 画像が見つかりませんでした\n`);
    continue;
  }

  const ok = await checkImage(imageUrl);
  if (!ok) {
    console.log(`   ⚠️  取得できるが画像ではない: ${imageUrl}\n`);
    continue;
  }

  console.log(`   ✅ ${imageUrl}`);

  if (!isDryRun) {
    const { error } = await supabase.from('shops').update({ image_url: imageUrl }).eq('id', shop.id);
    if (error) console.log(`   ERROR: ${error.message}`);
    else console.log(`   → DB更新完了`);
  }
  console.log();
}

console.log('完了');
