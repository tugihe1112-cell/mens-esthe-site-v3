/**
 * Bed of Roses サイト構造確認
 * 実行: node scripts/debug/debug_bed_of_roses.mjs
 */
import * as cheerio from 'cheerio';

const SITE = 'https://bed-of-roses.site';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function tryUrl(url) {
  const res = await fetch(url, { headers: ua });
  return { res, $ : cheerio.load(await res.text()), status: res.status };
}

async function run() {
  // よくあるセラピストページパターンを試す
  const candidates = [
    `${SITE}/therapist`,
    `${SITE}/therapist/`,
    `${SITE}/cast`,
    `${SITE}/cast/`,
    `${SITE}/lady`,
    `${SITE}/lady/`,
  ];

  let $ = null, baseUrl = null;
  for (const url of candidates) {
    try {
      const r = await fetch(url, { headers: ua });
      if (r.ok && r.url.includes('therapist') || r.ok && r.url.includes('cast') || r.ok && r.url.includes('lady')) {
        $ = cheerio.load(await r.text());
        baseUrl = url;
        console.log(`✅ ${url} → HTTP ${r.status}`);
        break;
      } else if (r.ok) {
        $ = cheerio.load(await r.text());
        baseUrl = url;
        console.log(`✅ ${url} → HTTP ${r.status} (最終URL: ${r.url})`);
        break;
      }
    } catch (_) {}
  }

  // トップページから試す
  if (!$) {
    const { res, $: top$ } = await tryUrl(`${SITE}/index.html`);
    console.log(`トップページ HTTP: ${res.status}`);
    $ = top$;
    baseUrl = `${SITE}/index.html`;

    // セラピストページへのリンクを探す
    console.log('\n=== ナビリンク ===');
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (text) console.log(`  "${text}" → ${href}`);
    });
  }

  console.log(`\n=== img 総数: ${$('img').length} ===`);
  $('img').slice(0, 8).each((i, el) => {
    const src = $( el).attr('src') || $( el).attr('data-src') || '';
    const alt = $( el).attr('alt') || '';
    console.log(`  [${i}] src="${src.slice(0, 80)}" alt="${alt.slice(0, 30)}"`);
  });

  console.log('\n=== /therapist/ or /cast/ リンク ===');
  $('a[href*="therapist"], a[href*="cast"], a[href*="lady"]').slice(0, 8).each((_, el) => {
    console.log(`  ${$(el).attr('href')}`);
  });

  console.log('\n=== li/article 先頭5 ===');
  $('li:has(img), article:has(img)').slice(0, 5).each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
    const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
    console.log(`  [${i}] img="${img.slice(0, 60)}" text="${text}"`);
  });

  console.log('\n=== ロゴ候補 ===');
  $('img[src*="logo"], header img, .logo img').slice(0, 3).each((_, el) => {
    console.log(`  ${$(el).attr('src') || ''}`);
  });
}

run().catch(e => console.error('❌', e.message));
