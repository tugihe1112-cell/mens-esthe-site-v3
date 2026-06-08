/**
 * 大阪 未登録97店舗 CMS種別検出スクリプト
 * 実行: node scripts/debug/check_osaka_cms_types.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

// セラピスト0の大阪店舗を取得
const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=like.osaka_*&select=id,name,website_url&order=id`, { headers: h });
const allShops = await r.json();

// 0件のみ絞り込み
const zeroShops = [];
for (const shop of allShops) {
  const tr = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id&limit=1`, { headers: h });
  const t = await tr.json();
  if (t.length === 0) zeroShops.push(shop);
}
console.log(`対象: ${zeroShops.length}店舗\n`);

// CMS検出パターン
function detectCms(html, baseUrl) {
  if (!html) return 'FETCH_ERROR';
  if (html.includes('images_staff')) return 'images_staff';
  if (html.includes('def/con?p=')) return 'defcon';
  if (html.includes('/data/staff/') && html.includes('stf_')) return 'premium_spa';
  if (html.includes('wcms/gals/images')) return 'wcms';
  if (html.includes('/photos/') && html.includes('/moto_')) return 'moto_photos';
  if (html.includes('caskan.com')) return 'caskan';
  if (html.includes('imagedelivery.net')) return 'cloudflare_images';
  if (html.includes('wp-content/uploads')) return 'wordpress';
  if (html.includes('estama.jp')) return 'estama';
  if (html.includes('re-db.com')) return 'redb';
  if (html.includes('imgsrv.jp')) return 'imgsrv';
  if (html.includes('upload/cast/thumb_')) return 'rookie_cms';
  if (html.includes('/photos/') && html.includes('/raw_')) return 'raw_photos'; // LEON SPA系
  if (html.includes('/vars/imgs/profiles/')) return 'cameron_cms';
  if (html.includes('therapist_img/')) return 'allie_cms';
  if (html.includes('image_girl/')) return 'spaflame_cms';
  if (html.includes('jimdofree.com') || html.includes('jimdo.com')) return 'JIMDO_BLOG';
  if (html.includes('ameblo.jp')) return 'AMEBLO_BLOG';
  if (html.includes('livedoor')) return 'LIVEDOOR_BLOG';
  if (html.includes('wordpress.com')) return 'WORDPRESS_COM_BLOG';
  // JS描画の疑い（bodyが薄い）
  const bodyLen = html.replace(/<[^>]+>/g, '').trim().length;
  if (bodyLen < 500) return 'JS_RENDER?';
  return 'UNKNOWN';
}

// 各店舗のセラピストページを試す
const staffPaths = ['/therapist/', '/cast/', '/staff/', '/ladies/', '/therapist.html', '/cast.html', '/staff.html', '/therapist.php'];

const results = { byType: {}, details: [] };

for (const shop of zeroShops) {
  const base = (shop.website_url || '').replace(/\/top\/?$/, '').replace(/\/+$/, '');
  if (!base || base.startsWith('http://blog') || base.includes('ameblo') || base.includes('livedoor') || base.includes('jimdofree') || base.includes('wordpress.com')) {
    const type = base.includes('ameblo') ? 'AMEBLO_BLOG' : base.includes('livedoor') ? 'LIVEDOOR_BLOG' : base.includes('jimdofree') || base.includes('wordpress.com') ? 'BLOG' : 'NO_URL';
    results.details.push({ id: shop.id, name: shop.name, url: shop.website_url, cms: type, staffUrl: null });
    results.byType[type] = (results.byType[type] || []);
    results.byType[type].push(shop.name);
    continue;
  }

  let detected = null;
  let staffUrl = null;

  // まずトップページを確認
  try {
    const topHtml = await fetch(base, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) }).then(r => r.text()).catch(() => null);
    const topCms = detectCms(topHtml, base);
    if (topCms !== 'UNKNOWN' && topCms !== 'JS_RENDER?') {
      detected = topCms;
      staffUrl = base;
    }
  } catch {}

  // スタッフページを試す
  if (!detected) {
    for (const path of staffPaths) {
      try {
        const url = base + path;
        const html = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) }).then(r => r.ok ? r.text() : null).catch(() => null);
        if (!html) continue;
        const cms = detectCms(html, base);
        if (cms !== 'UNKNOWN') {
          detected = cms;
          staffUrl = url;
          break;
        }
        // パスが存在する（OKだがUNKNOWN）→ とりあえず記録
        if (!detected) { detected = 'UNKNOWN(' + path + ')'; staffUrl = url; }
      } catch {}
    }
  }

  const finalCms = detected || 'NOT_FOUND';
  results.details.push({ id: shop.id, name: shop.name, url: shop.website_url, cms: finalCms, staffUrl });
  results.byType[finalCms] = results.byType[finalCms] || [];
  results.byType[finalCms].push(shop.name);

  process.stdout.write(`  [${finalCms}] ${shop.name}\n`);
  await new Promise(r => setTimeout(r, 600)); // 過負荷防止
}

console.log('\n========= CMS種別まとめ =========');
for (const [type, shops] of Object.entries(results.byType).sort((a,b) => b[1].length - a[1].length)) {
  console.log(`\n【${type}】 ${shops.length}店舗`);
  shops.forEach(n => console.log(`  - ${n}`));
}

// JSON保存
fs.writeFileSync('osaka_cms_detection.json', JSON.stringify(results, null, 2));
console.log('\n結果を osaka_cms_detection.json に保存しました');
