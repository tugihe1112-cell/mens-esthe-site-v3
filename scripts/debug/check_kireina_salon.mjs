/**
 * kireina-salon.com/girl 構造デバッグ
 * 実行: node scripts/debug/check_kireina_salon.mjs
 */
import * as cheerio from 'cheerio';

const WEBSITE_URL = 'https://kireina-salon.com';
const CAST_URL = 'https://kireina-salon.com/girl';
const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const res = await fetch(CAST_URL, { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

console.log(`ステータス: ${res.status}, img数: ${$('img').length}`);

console.log('\n--- img一覧（上位20件）---');
$('img').slice(0, 20).each((i, el) => {
  const $e = $(el);
  console.log(`[${i}] src=${($e.attr('src')||'').slice(0,80)} alt=${($e.attr('alt')||'').slice(0,30)}`);
});

console.log('\n--- 名前っぽいテキストブロック ---');
$('li, div, article, p').filter((_, el) => {
  const t = $(el).children().length === 0 ? $(el).text().trim() : '';
  return t.length >= 2 && t.length <= 15 && /[ぁ-んァ-ヾ一-龯]/.test(t);
}).slice(0, 15).each((i, el) => {
  console.log(`[${i}] <${el.name} class="${$(el).attr('class')||''}"> ${$(el).text().trim()}`);
});

console.log('\n--- 全体構造（クラス名上位）---');
const classes = {};
$('[class]').each((_, el) => {
  ($(el).attr('class') || '').split(/\s+/).forEach(c => { if (c) classes[c] = (classes[c]||0)+1; });
});
Object.entries(classes).sort((a,b)=>b[1]-a[1]).slice(0, 20).forEach(([c,n]) => console.log(`  .${c} ×${n}`));
