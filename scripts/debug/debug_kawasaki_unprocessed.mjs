/**
 * 川崎エリア 未処理店舗 HTML構造一括確認
 * 実行: node scripts/debug/debug_kawasaki_unprocessed.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const targets = [
  { name: 'アプローチ川崎',  url: 'https://kawasakia.beautycloud.co.jp/therapist.html' },
  { name: 'RERE GROUP',      url: 'https://www.rere-group.com/' },
  { name: 'LIVSPA',          url: 'https://livspa.net/therapist' },
  { name: 'Ho・O・Zu・Ki',   url: 'https://hoozuki-spa.net/therapist' },
  { name: 'RiRe川崎',        url: 'https://rire-kawasaki.com/therapist/' },
  { name: 'doigt de fee',    url: 'https://exe-fee.com/lady/' },
  { name: 'Fromage',         url: 'http://fromage-kawasaki.com/therapist' },
];

async function inspect({ name, url }) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${name}】 ${url}`);
  try {
    const res = await fetch(url, { headers: ua });
    const html = await res.text();
    const $ = cheerio.load(html);
    console.log(`  HTTP: ${res.status}`);

    // スタッフ/セラピスト関連リンク
    const staffLinks = new Set();
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/staff|cast|therapist|セラピスト|スタッフ|キャスト|girl|lady|schedule|スケジュール|出勤/i.test(href + text)) {
        staffLinks.add(`${href.slice(0,60)} [${text.slice(0,20)}]`);
      }
    });
    if (staffLinks.size) console.log('  リンク:', [...staffLinks].slice(0,6).join('\n        '));

    // セラピスト要素候補
    const selectors = [
      '.therapist', '.cast', '.staff', '.girl', '.lady',
      '[class*="therapist"]', '[class*="cast"]', '[class*="staff"]', '[class*="girl"]',
    ];
    for (const sel of selectors) {
      const count = $(sel).length;
      if (count > 0) {
        const first = $(sel).first();
        const img = first.find('img').first().attr('src') || first.find('img').first().attr('data-src') || '';
        const text = first.text().replace(/\s+/g,' ').trim().slice(0,60);
        console.log(`  ${sel}: ${count}件 | img="${img.slice(0,60)}" text="${text}"`);
      }
    }

    // img上位5枚（ロゴ/banner除く）
    let imgCount = 0;
    $('img').each((i, el) => {
      if (imgCount >= 4) return;
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      if (/icon|logo|banner|btn|arrow|nav|common/i.test(src)) return;
      if (!src || src.endsWith('.gif')) return;
      console.log(`  img[${i}]: "${src.slice(0,70)}" alt="${alt.slice(0,20)}"`);
      imgCount++;
    });

    // ロゴ候補
    let logo = '';
    $('img').each((i, el) => {
      const src = $(el).attr('src') || '';
      if (/logo/i.test(src) && !logo) logo = src;
    });
    if (!logo) logo = $('header img, .header img, #header img').first().attr('src') || '';
    if (logo) console.log(`  ロゴ候補: ${logo.slice(0,90)}`);

  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
}

(async () => {
  for (const t of targets) {
    await inspect(t);
  }
})();
