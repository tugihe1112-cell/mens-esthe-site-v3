/**
 * 超レベチなエステ24 /therapist/ ページ構造確認
 * 実行: node scripts/debug/check_levechi_therapist.mjs
 */
import * as cheerio from 'cheerio';

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const res = await fetch('https://tokyo242424.com/therapist/', { headers: UA, signal: AbortSignal.timeout(15000) });
console.log(`HTTP: ${res.status}`);
const html = await res.text();
const $ = cheerio.load(html);

// img 全件
const imgs = [];
$('img').each((_, el) => {
  const alt = $(el).attr('alt') || '';
  const src = $(el).attr('src') || '';
  if (src.includes('estama') || /[ぁ-んァ-ヾ一-龯]/.test(alt)) imgs.push({ alt, src });
});
console.log(`\nestama系 or 日本語alt img: ${imgs.length}件`);
imgs.slice(0, 30).forEach(i => console.log(`  alt="${i.alt}"  src="${i.src.slice(0,100)}"`));

// テキスト内の名前候補
const jpTexts = new Set();
$('*').each((_, el) => {
  const text = $(el).clone().children().remove().end().text().trim();
  if (text.length >= 2 && text.length <= 12 && /[ぁ-んァ-ヾ一-龯]/.test(text) &&
    !['成田', '東金', '高崎', '中野', 'メンズ', 'エステ', 'ルーム', 'セラピスト', '出勤', '予約', '体験'].some(w => text.includes(w))) {
    jpTexts.add(text);
  }
});
console.log(`\n名前っぽいテキスト: ${jpTexts.size}件`);
[...jpTexts].slice(0, 30).forEach(t => console.log(`  "${t}"`));

// ページ全体テキスト
console.log('\nページテキスト(先頭3000字):');
console.log($('body').text().replace(/\s+/g, ' ').slice(0, 3000));
