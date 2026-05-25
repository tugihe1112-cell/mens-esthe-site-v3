/**
 * Request のセラピスト構造を詳しく確認
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const res = await fetch('https://request-hakata.com/therapist/', { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

// cast imgの詳細（重複含む）
console.log('=== cast img 全件（先頭15件）===');
$('img[src*="cast"]').slice(0, 15).each((i, el) => {
  const src = $(el).attr('src') || '';
  const parent = $(el).closest('li, div, article, tr, section');
  const text = parent.text().trim().replace(/\s+/g, ' ').slice(0, 80);
  console.log(`[${i}] src末尾: ...${src.slice(-30)}`);
  console.log(`     親テキスト: "${text}"`);
});

// 名前っぽいテキストを探す
console.log('\n=== 日本語テキスト含む要素 ===');
let count = 0;
$('*').each((_, el) => {
  if (count > 15) return;
  const text = $(el).clone().children().remove().end().text().trim();
  if (/^[ぁ-んァ-ヾ一-龯]{2,8}$/.test(text)) {
    const src = $(el).find('img').attr('src') || '';
    console.log(`  "${text}" | tag:${$(el)[0].name} | img:${src.slice(0, 40)}`);
    count++;
  }
});
