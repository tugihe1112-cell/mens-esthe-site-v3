/**
 * men-esthe.jp 福岡マッチ店舗の公式URLを取得
 * 実行: node scripts/debug/check_menesthe_fukuoka_urls.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const BASE = 'https://men-esthe.jp';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const targets = [
  { dbName: 'MOTHERS (マザーズ)',              salonId: 2301 },
  { dbName: 'Feerique (フェリーク) 福岡',       salonId: 3720 },
  { dbName: 'メンズアロマ博多人妻さん',            salonId: 2428 },
  { dbName: 'Lion Heart (ライオンハート) 福岡',  salonId: 1497 },
  { dbName: 'Request (リクエスト)',             salonId: 5368 },
  { dbName: 'ピンキーグラッツェ小倉',              salonId: 2716 },
];

for (const t of targets) {
  console.log(`\n=== ${t.dbName} ===`);
  const url = `${BASE}/salon.php?id=${t.salonId}`;
  try {
    const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(12000) });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 公式サイトURL
    let officialUrl = '';
    $('a[href]').each((_, el) => {
      if (officialUrl) return;
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/公式|official|ホームページ|HP|サイト/i.test(text) && href.startsWith('http') && !href.includes('men-esthe.jp')) {
        officialUrl = href;
      }
    });

    // 外部リンク全般（men-esthe.jp以外）
    const externalLinks = new Set();
    $('a[href^="http"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href.includes('men-esthe.jp') && !href.includes('google') && !href.includes('twitter') && !href.includes('instagram')) {
        externalLinks.add(href);
      }
    });

    // schedule_url候補
    let scheduleUrl = '';
    $('a[href]').each((_, el) => {
      if (scheduleUrl) return;
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/スケジュール|schedule/i.test(text) && href.startsWith('http') && !href.includes('men-esthe.jp')) {
        scheduleUrl = href;
      }
    });

    console.log(`公式URL: ${officialUrl || '（見つからず）'}`);
    console.log(`schedule: ${scheduleUrl || '（見つからず）'}`);
    console.log(`外部リンク一覧:`);
    [...externalLinks].forEach(l => console.log(`  ${l}`));

    // shop画像候補（og:image）
    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    if (ogImg) console.log(`og:image: ${ogImg}`);

  } catch(e) {
    console.log(`❌ ${e.message}`);
  }
  await sleep(400);
}
