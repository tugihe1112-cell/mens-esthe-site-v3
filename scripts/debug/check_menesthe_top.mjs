/**
 * men-esthe.jp のトップページ構造確認
 * 実行: node scripts/debug/check_menesthe_top.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const res = await fetch('https://men-esthe.jp/', { headers: ua, signal: AbortSignal.timeout(12000) });
console.log(`HTTP: ${res.status}`);
const html = await res.text();
const $ = cheerio.load(html);

console.log(`img総数: ${$('img').length}件`);
console.log(`\nテキスト先頭500字:\n${$.text().replace(/\s+/g, ' ').trim().slice(0, 500)}`);

// 都道府県リンクを探す
console.log('\n=== 都道府県/エリアリンク候補 ===');
$('a[href]').each((_, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim();
  if (/福岡|九州|北九州|博多/.test(text + href)) {
    console.log(`  "${text}" → ${href}`);
  }
});

// 全リンクパターン確認（ユニーク）
console.log('\n=== hrefパターン（先頭20件）===');
const hrefs = new Set();
$('a[href]').each((_, el) => {
  const href = $(el).attr('href') || '';
  if (href.startsWith('http') || href.startsWith('/')) hrefs.add(href);
});
[...hrefs].slice(0, 20).forEach(h => console.log(`  ${h}`));
