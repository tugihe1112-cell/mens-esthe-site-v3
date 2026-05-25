/**
 * 未処理3店舗のサイト構造確認
 * 実行: node scripts/debug/check_remaining_pref.mjs
 */
import * as cheerio from 'cheerio';

const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function checkSite(label, url, selectors) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${label}】 ${url}`);
  console.log('='.repeat(60));
  try {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000) });
    console.log(`HTTP: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    for (const [desc, sel] of Object.entries(selectors)) {
      const els = $(sel);
      console.log(`\n[${desc}] "${sel}" → ${els.length}件`);
      els.slice(0, 5).each((i, el) => {
        const $el = $(el);
        const alt = $el.attr('alt') || $el.text().trim().slice(0, 30);
        const src = $el.attr('src') || $el.attr('href') || '';
        console.log(`  ${i+1}: alt/text="${alt}" src="${src.slice(0,80)}"`);
      });
    }

    // img タグ全般のパス傾向を確認
    const imgSrcs = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src && !src.includes('.svg') && !src.includes('logo') && !src.includes('banner')) {
        imgSrcs.push(src);
      }
    });
    console.log(`\n[全img サンプル] ${imgSrcs.length}件`);
    imgSrcs.slice(0, 8).forEach(s => console.log(`  ${s.slice(0,100)}`));

  } catch(e) {
    console.log(`❌ エラー: ${e.message}`);
  }
}

// 大阪: 俺の家
await checkSite('大阪 俺の家', 'http://ore-no-ie.com/', {
  'img[alt系]': 'img[alt]',
  'staff/cast系リンク': 'a[href*="cast"], a[href*="staff"], a[href*="girl"], a[href*="therapist"]',
});
await sleep(1000);

// 神奈川: Fromage（キャスト/スタッフページ）
await checkSite('神奈川 Fromage キャストページ', 'http://fromage-kawasaki.com/cast/', {
  'img[alt系]': 'img[alt]',
  '.photo img': '.photo img',
  'li.therapist-box': 'li.therapist-box',
  '.girls_box img': '.girls_box img',
});
await sleep(1000);

await checkSite('神奈川 Fromage トップ', 'http://fromage-kawasaki.com/', {
  'img[alt系]': 'img[alt]',
  'staff/cast系リンク': 'a[href*="cast"], a[href*="staff"], a[href*="girl"]',
});
await sleep(1000);

// 千葉: 超レベチなエステ24
await checkSite('千葉 超レベチなエステ24', 'https://tokyo242424.com/', {
  'img[alt系]': 'img[alt]',
  'staff/cast系リンク': 'a[href*="cast"], a[href*="staff"], a[href*="girl"], a[href*="member"]',
});
await sleep(1000);

// 成田店・東金店 それぞれ確認
await checkSite('千葉 成田店 確認', 'https://tokyo242424.com/narita/', {
  'img[alt系]': 'img[alt]',
});
await sleep(500);
await checkSite('千葉 東金店 確認', 'https://tokyo242424.com/togane/', {
  'img[alt系]': 'img[alt]',
});
