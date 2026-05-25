/**
 * アマテラス横浜 料金・セラピスト詳細確認
 * 実行: node scripts/debug/debug_amaterasu_system.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

async function check(label, url) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${label}】 ${url}`);
  try {
    const res = await fetch(url, { headers: ua });
    const $ = cheerio.load(await res.text());
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    // 料金らしい部分を抽出
    const priceMatches = text.match(/[\d,]+円[^\n]{0,50}/g) || [];
    console.log(`  HTTP: ${res.status}`);
    console.log(`  料金候補: ${priceMatches.slice(0, 10).join(' | ')}`);
    // 全テキストの一部
    console.log(`  テキスト先頭300字: ${text.slice(0, 300)}`);
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
}

async function checkTherapist(url) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【セラピスト詳細】 ${url}`);
  try {
    const res = await fetch(url, { headers: ua });
    const $ = cheerio.load(await res.text());

    // .therapist-datas-each の構造を確認
    $('.therapist-datas-each, .therapist-data-each').slice(0, 3).each((i, el) => {
      const img = $(el).find('img.therapist-data-each-tmb').first();
      const src = img.attr('src') || '';
      const name = $(el).find('a.therapist-datas-name, .therapist-datas-name').first().text().trim();
      const spec = $(el).find('.therapist-datas-spec').first().text().trim();
      console.log(`\n  [${i}] name="${name}" spec="${spec.replace(/\s+/g,' ')}" img="${src.slice(0,70)}"`);
    });
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
}

(async () => {
  await check('system', 'https://amaterasu-yokohama.com/system');
  await check('price', 'https://amaterasu-yokohama.com/price');
  await check('course', 'https://amaterasu-yokohama.com/course');
  await checkTherapist('https://amaterasu-yokohama.com/therapist');
})();
