/**
 * 大阪 WordPress セラピスト0店舗の構造調査
 * 実行: node scripts/debug/debug_osaka_wp_zero.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const SHOPS = [
  { id: 'osaka_tanimachi9_mrs_moonr', name: 'ミセスムーンR', url: 'https://www.moonr.jp/' },
  { id: 'osaka_shinosaka_mokukindo', name: '感謝 旧愛燦燦', url: 'https://kansya-osaka.com/' },
  { id: 'osaka_umeda_bunny_room', name: 'うさぎのお部屋', url: 'https://bunny-room.com/' },
  { id: 'osaka_dispatch_genkaya', name: '原価屋', url: 'https://genkaya.net/' },
  { id: 'osaka_tanimachi9_amaou', name: 'ミセスあまおう', url: 'https://amaou-therapi.jp/' },
  { id: 'osaka_umeda_bimajo_therapy', name: '美魔女セラピー', url: 'https://hananoame.com/' },
  { id: 'osaka_umeda_lirica', name: 'LIRICA OSAKA', url: 'https://lirica-osaka.com/' },
  { id: 'osaka_shinosaka_komoriuta', name: 'ミセスの子守唄', url: 'https://mrs-komoriuta.com/' },
  { id: 'osaka_nipponbashi_super_happy', name: 'スーパーハッピーガールズ', url: 'https://super-happy.net/' },
  { id: 'osaka_umeda_dsp', name: 'DSP', url: 'https://dsp-osaka.net/' },
];

async function fetchHtml(url, timeout = 10000) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(timeout) });
  return { html: await res.text(), finalUrl: res.url };
}

async function findTherapistPage($, baseUrl) {
  let therapistUrl = null;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/therapist|cast|lady|staff|girl|セラピスト|在籍|スタッフ|キャスト|ガール/i.test(href + text) && !therapistUrl) {
      try {
        therapistUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
      } catch {}
    }
  });
  return therapistUrl;
}

for (const shop of SHOPS) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${shop.id}] ${shop.name}`);
  console.log(`URL: ${shop.url}`);

  try {
    const { html, finalUrl } = await fetchHtml(shop.url);
    const $ = cheerio.load(html);

    // WP確認
    const isWP = html.includes('wp-content');
    console.log(`WP: ${isWP ? 'Yes' : 'No'}`);

    // セラピストページを探す
    const therapistUrl = await findTherapistPage($, shop.url);
    console.log(`セラピストページ: ${therapistUrl || '(トップにリンクなし)'}`);

    // img[src*="wp-content"] を数える
    const wpImgs = $('img[src*="wp-content/uploads"]').length;
    console.log(`wp-content画像数: ${wpImgs}`);

    // 主要セレクターを試す
    const selectors = [
      'li:has(img[src*="wp-content"])',
      'article:has(img)',
      '.cast-item', '.therapist-item', '.girl-item',
      '.cast', '.staff', '.member',
      'ul.list li', '.entry-content li',
      'div.col:has(img)', 'div.item:has(img)',
      'figure:has(img)', '.thumbnail',
    ];

    for (const sel of selectors) {
      const count = $(sel).length;
      if (count > 0) console.log(`  ✅ ${sel}: ${count}件`);
    }

    // セラピストページがあれば詳細調査
    if (therapistUrl && therapistUrl !== shop.url) {
      console.log(`\n  → セラピストページ調査: ${therapistUrl}`);
      try {
        const { html: tHtml } = await fetchHtml(therapistUrl);
        const $t = cheerio.load(tHtml);
        const wpImgs2 = $t('img[src*="wp-content/uploads"]').length;
        console.log(`  セラピストページ wp-content画像数: ${wpImgs2}`);

        for (const sel of selectors) {
          const count = $t(sel).length;
          if (count > 0) console.log(`  ✅ [therapist page] ${sel}: ${count}件`);
        }

        // 最初の5件のli/articleのテキストサンプル
        const sample = $t('li:has(img), article:has(img)').slice(0, 3);
        sample.each((i, el) => {
          const txt = $t(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
          const imgSrc = $t(el).find('img').first().attr('src') || '';
          console.log(`  サンプル[${i}]: ${txt}`);
          console.log(`  画像[${i}]: ${imgSrc.slice(0, 80)}`);
        });
      } catch (e) {
        console.log(`  セラピストページエラー: ${e.message}`);
      }
    }

  } catch (e) {
    console.log(`❌ ${e.message}`);
  }
}
