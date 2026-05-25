/**
 * DEEP ESSENTIAL ナビリンク全取得 + ラビットスパ caskan ロゴ確認
 * 実行: node scripts/debug/debug_deepe_nav.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

(async () => {
  // DEEP ESSENTIAL: 全aタグのhrefを列挙（重複なし）
  console.log('=== DEEP ESSENTIAL 全リンク ===');
  const res = await fetch('https://deep-e.com/', { headers: ua });
  const $ = cheerio.load(await res.text());
  const links = new Set();
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('http') || href.startsWith('/')) links.add(href);
  });
  [...links].sort().forEach(l => console.log(' ', l));

  // ラビットスパ caskan CDN ロゴ候補チェック
  console.log('\n=== ラビットスパ caskan ロゴ候補 ===');
  const candidates = [
    'https://cdn2-caskan.com/caskan/img/shop_logo/1520_logo.png',
    'https://cdn2-caskan.com/caskan/img/shop_logo/1520_logo.jpg',
    'https://cdn2-caskan.com/caskan/img/shop_top_logo/1520_logo.png',
    'https://rabbit-spa.net/images/logo.png',
    'https://rabbit-spa.net/images/logo.jpg',
    'https://rabbit-spa.net/img/logo.png',
  ];
  for (const url of candidates) {
    try {
      const r = await fetch(url, { headers: ua });
      console.log(`  ${r.status} ${url}`);
    } catch(e) { console.log(`  ERR ${url}`); }
  }

  // ラビットスパ トップページの全img
  console.log('\n=== ラビットスパ トップ全img ===');
  const res2 = await fetch('https://rabbit-spa.net/', { headers: ua });
  const $2 = cheerio.load(await res2.text());
  $2('img').each((i, el) => {
    const src = $2(el).attr('src') || '';
    const alt = $2(el).attr('alt') || '';
    if (!src.includes('cast_tmb') && !src.includes('sns')) {
      console.log(`  src="${src.slice(0,100)}" alt="${alt.slice(0,40)}"`);
    }
  });
})();
