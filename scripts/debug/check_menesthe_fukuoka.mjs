/**
 * men-esthe.jp の福岡ページから店舗名・リンクを取得
 * 実行: node scripts/debug/check_menesthe_fukuoka.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const urls = [
  'https://men-esthe.jp/fukuoka/',
  'https://men-esthe.jp/area/fukuoka/',
  'https://men-esthe.jp/pref/fukuoka/',
  'https://men-esthe.jp/search/?pref=40',
];

for (const url of urls) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`URL: ${url}`);
  try {
    const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(12000) });
    console.log(`HTTP: ${res.status}`);
    if (res.status !== 200) continue;

    const html = await res.text();
    const $ = cheerio.load(html);

    // img総数（0ならJS描画）
    console.log(`img総数: ${$('img').length}件`);

    // テキストの先頭（ページ内容確認）
    const text = $.text().replace(/\s+/g, ' ').trim().slice(0, 300);
    console.log(`テキスト: ${text}`);

    // 店舗リンク候補
    const seen = new Set();
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (!text || seen.has(href)) return;
      if (href.match(/\/shop\/|\/store\/|\/detail\/|\d{3,}/) && text.length > 1) {
        seen.add(href);
        console.log(`  店舗: "${text}" → ${href}`);
      }
    });

  } catch(e) {
    console.log(`❌ ${e.message}`);
  }
}
