/**
 * 神奈川未処理店舗 CMS構造一括確認
 * 実行: node scripts/debug/debug_kanagawa_sites.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const SITES = [
  { id: 'kanagawa_fujisawa_pepe_spa',       url: 'https://www.pepespa.com/' },
  { id: 'kanagawa_shinyokohama_yuru_spa',    url: 'https://yuru-spa.com/yokohama/' },
  { id: 'kanagawa_yokohama_liora',           url: 'https://liora2024.com/' },
  { id: 'kanagawa_yokohama_y_prime',         url: 'https://y-prime-yokohama.com/' },
  { id: 'kanagawa_yokohama_the_blanc',       url: 'https://the-blanc.site/' },
  { id: 'kanagawa_yokohama_guarigione',      url: 'https://www.spa-g.net/' },
  { id: 'kanagawa_shinyurigaoka_redeye',     url: 'https://redeye-esthe.com/' },
  { id: 'kanagawa_musashikosugi_royce',      url: 'http://aromaroyce.com/' },
];

async function analyzeSite({ id, url }) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${id}]`);
  console.log(`URL: ${url}`);

  let html = '';
  try {
    const res = await fetch(url, { headers: ua });
    html = await res.text();
    console.log(`HTTP: ${res.status} (最終URL: ${res.url})`);
  } catch (e) {
    console.log(`❌ fetch失敗: ${e.message}`);
    return;
  }

  const $ = cheerio.load(html);

  // CMS判定
  const cms = [];
  if (html.includes('3days')) cms.push('3days');
  if (html.includes('caskan')) cms.push('caskan');
  if (html.includes('men-es.jp')) cms.push('men-es');
  if (html.includes('smarts.jp')) cms.push('smarts');
  if (html.includes('casta.jp') || html.includes('casta')) cms.push('casta');
  if ($('script[src*="s3"]').length || html.includes('s3.amazonaws')) cms.push('S3-data');
  console.log(`CMS候補: ${cms.length ? cms.join(', ') : 'なし/独自'}`);

  // スクリプトURL
  const scripts = [];
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (src.includes('data') || src.includes('cast') || src.includes('therapist') ||
        src.includes('lady') || src.includes('member') || src.includes('s3') ||
        src.includes('amazonaws')) {
      scripts.push(src);
    }
  });
  if (scripts.length) console.log(`注目script: ${scripts.join(', ')}`);

  // 画像URLパターン
  const imgSrcs = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (src) imgSrcs.push(src);
  });
  console.log(`img総数: ${imgSrcs.length}`);
  imgSrcs.slice(0, 5).forEach((s, i) => console.log(`  img[${i}]: ${s.slice(0, 80)}`));

  // セラピストページへのリンク
  const links = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim().slice(0, 20);
    if (/therapist|cast|lady|member|staff|girl/i.test(href)) links.push(`"${text}" → ${href}`);
  });
  if (links.length) {
    console.log(`セラピスト系リンク:`);
    links.slice(0, 5).forEach(l => console.log(`  ${l}`));
  }

  // ナビリンク（テキスト確認用）
  const navTexts = [];
  $('nav a, header a, .nav a, .menu a, .gnav a').each((_, el) => {
    const t = $(el).text().trim();
    const h = $(el).attr('href') || '';
    if (t) navTexts.push(`"${t}" → ${h}`);
  });
  if (navTexts.length) {
    console.log(`ナビ:`);
    navTexts.slice(0, 8).forEach(n => console.log(`  ${n}`));
  }

  // ロゴ候補
  const logoUrls = [];
  $('img[src*="logo"], header img, .logo img, .header img').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (src) logoUrls.push(src);
  });
  // CSS background-image
  const bgMatches = [...html.matchAll(/background(?:-image)?\s*:\s*url\(['"]?(https?:\/\/[^'"\)]+)['"]?\)/g)];
  bgMatches.slice(0, 3).forEach(m => logoUrls.push(`[bg] ${m[1]}`));
  if (logoUrls.length) console.log(`ロゴ候補: ${logoUrls.slice(0, 3).join(' | ')}`);

  // S3/CDN URL
  const s3 = [...html.matchAll(/https?:\/\/[^\s'"<>]*(?:s3|cloudfront|cdn|amazonaws)[^\s'"<>]*/gi)];
  if (s3.length) {
    console.log(`S3/CDN:`);
    [...new Set(s3.map(m => m[0]))].slice(0, 4).forEach(u => console.log(`  ${u.slice(0, 100)}`));
  }
}

async function run() {
  for (const site of SITES) {
    await analyzeSite(site);
  }
  console.log(`\n${'='.repeat(60)}`);
  console.log('完了');
}

run().catch(e => console.error('❌', e.message));
