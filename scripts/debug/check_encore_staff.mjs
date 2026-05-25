import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const res = await fetch('https://encore-nagoya.com/staff.php', { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

console.log(`images_staff img数: ${$('img[src*="images_staff"]').length}`);
$('img[src*="images_staff"]').each((_, el) => {
  const alt = $(el).attr('alt') || '';
  const src = $(el).attr('src') || '';
  // "新人❤︎なのは" → "なのは"
  const nameMatch = alt.match(/[❤︎❤♡♪★☆◆●■▲]\s*([ぁ-んァ-ヾ一-龯々\s　]{1,10})$/) ||
                    alt.match(/([ぁ-んァ-ヾ一-龯々]{1,10})$/);
  console.log(`  [${alt}] → ${nameMatch?.[1]?.trim() || '?'} | ${src.slice(0,70)}`);
});
