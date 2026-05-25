/**
 * 大阪未処理店舗 CMS一括確認
 * 実行: node scripts/debug/debug_osaka_all_sites.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // 大阪でwebsite_urlあり・セラピスト0の店舗取得
  const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=like.osaka_*&website_url=not.is.null&select=id,name,website_url`, { headers: h });
  const shops = await r.json();

  // セラピスト0のみ抽出
  const unprocessed = [];
  for (const shop of shops) {
    const tr = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id&limit=1`, { headers: h });
    const therapists = await tr.json();
    if (therapists.length === 0) unprocessed.push(shop);
  }
  console.log(`未処理: ${unprocessed.length}件\n`);

  const results = [];

  for (const shop of unprocessed) {
    process.stdout.write(`[${shop.id}] ${shop.name} ... `);
    let cms = '不明', therapistUrl = '', logoUrl = '', sample = '';

    try {
      const res = await fetch(shop.website_url, { headers: ua, signal: AbortSignal.timeout(8000) });
      const html = await res.text();
      const $ = cheerio.load(html);

      // CMS判定
      if (html.includes('caskan')) cms = 'caskan';
      else if (html.includes('3days')) cms = '3days';
      else if (html.includes('men-es.jp')) cms = 'men-es';
      else if (html.includes('wp-content')) cms = 'wordpress';
      else if (html.includes('smarts')) cms = 'smarts';
      else cms = '独自';

      // セラピストページリンク
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        if (/therapist|cast|lady|staff|girl|セラピスト|在籍/i.test(href + text) && !therapistUrl) {
          therapistUrl = href.startsWith('http') ? href : (href.startsWith('/') ? new URL(href, shop.website_url).href : shop.website_url + href);
        }
      });

      // ロゴ候補
      const logoEl = $('img[src*="logo"], header img, .logo img, .header img').first();
      if (logoEl.length) {
        const src = logoEl.attr('src') || '';
        logoUrl = src.startsWith('http') ? src : (src.startsWith('/') ? new URL(src, shop.website_url).href : '');
      }
      // CSS bg ロゴ
      if (!logoUrl) {
        const bgM = html.match(/background(?:-image)?\s*:\s*url\(['"]?(https?:\/\/[^'"\)]+logo[^'"\)]+)['"]?\)/i)
          || html.match(/background(?:-image)?\s*:\s*url\(['"]?(https?:\/\/cdn2-caskan[^'"\)]+logo[^'"\)]+)['"]?\)/i);
        if (bgM) logoUrl = bgM[1];
      }

      // セラピストサンプル（li/article に img がある場合）
      $('li:has(img), article:has(img)').slice(0, 1).each((_, el) => {
        sample = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 80);
      });

      console.log(`${cms}`);
    } catch (e) {
      cms = `❌ ${e.message.slice(0, 40)}`;
      console.log(cms);
    }

    results.push({ id: shop.id, name: shop.name, url: shop.website_url, cms, therapistUrl, logoUrl, sample });
  }

  console.log('\n' + '='.repeat(70));
  console.log('=== 結果サマリー ===');
  for (const r of results) {
    console.log(`\n[${r.cms}] ${r.id}`);
    console.log(`  名前: ${r.name}`);
    console.log(`  URL: ${r.url}`);
    if (r.therapistUrl) console.log(`  セラピスト: ${r.therapistUrl}`);
    if (r.logoUrl) console.log(`  ロゴ: ${r.logoUrl}`);
    if (r.sample) console.log(`  サンプル: ${r.sample}`);
  }

  // CMS別集計
  const cmsCounts = {};
  results.forEach(r => { cmsCounts[r.cms] = (cmsCounts[r.cms] || 0) + 1; });
  console.log('\n=== CMS別件数 ===');
  Object.entries(cmsCounts).sort((a,b) => b[1]-a[1]).forEach(([cms, n]) => console.log(`  ${cms}: ${n}件`));
}

run().catch(e => console.error('❌', e.message));
