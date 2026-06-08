/**
 * 大阪 generic 10店舗 HTML構造調査
 * 何も取得できなかった10店舗のキャストページを調べる
 * 実行: node scripts/debug/check_osaka_generic_shops.mjs
 */
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

async function fetchHtml(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { html: null, status: res.status };
    return { html: await res.text(), status: res.status };
  } catch (e) { return { html: null, status: 0, err: e.message }; }
}

const SHOPS = [
  { name: '濃密Candy',       url: 'https://candy-esthe.com/',       paths: ['/staff.html', '/cast/', '/'] },
  { name: '余白',            url: 'https://osaka-yohaku.com/',      paths: ['/cast/', '/therapist/', '/'] },
  { name: 'BESTSTAR大阪',    url: 'https://beststar-osaka.com/',    paths: ['/cast/', '/therapist/', '/staff/', '/'] },
  { name: '絶頂SPA',         url: 'https://zechoo-spa.com/',        paths: ['/cast/', '/therapist/', '/'] },
  { name: 'dandy lab',       url: 'https://www.dandy-lab.com/',     paths: ['/staff/', '/cast/', '/therapist/', '/'] },
  { name: 'マダムスパ',      url: 'http://www.madam-spa.net/',      paths: ['/staff/', '/cast/', '/'] },
  { name: 'Deep Chill',      url: 'http://www.deep-chill.info/',    paths: ['/staff/', '/cast/', '/therapist/', '/'] },
  { name: 'オーダーメイドエステ', url: 'https://aromaesthe.biz/',   paths: ['/staff.html', '/therapist/', '/cast/', '/'] },
  { name: 'Elin',            url: 'http://www.osakaelin.com/',      paths: ['/therapist/', '/cast/', '/'] },
  { name: 'Feliz',           url: 'https://www.osakafeliz.com/',    paths: ['/therapist/', '/cast/', '/'] },
];

const IMG_SELECTORS = [
  '[data-p1*="upload/cast/"]',
  '[data-original*="/wcms/gals/images/"]',
  'img[src*="images_staff"]',
  'img[src*="/photos/"]',
  'img[src*="cast/main"]',
  'img[src*="cast/thumb"]',
  'img[src*="upload/cast/"]',
  'img[src*="wp-content/uploads"]',
  'img[src*="data/staff"]',
  'img[src*="userimg/"]',
];

for (const shop of SHOPS) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${shop.name} | ${shop.url}`);

  let foundAny = false;
  for (const path of shop.paths) {
    const url = shop.url.replace(/\/+$/, '') + path;
    const { html, status, err } = await fetchHtml(url);
    if (!html) {
      if (status === 0) console.log(`  ${path} → 接続失敗 (${err?.slice(0,50)})`);
      else console.log(`  ${path} → HTTP ${status}`);
      continue;
    }
    const $ = cheerio.load(html);
    const title = $('title').text().slice(0, 50);
    const allImgs = $('img').length;
    console.log(`  ${path} → OK [${status}] title="${title}" imgs=${allImgs}`);

    // どのセレクターが一致するか確認
    for (const sel of IMG_SELECTORS) {
      const count = $(sel).length;
      if (count > 0) {
        console.log(`    ✓ ${sel} → ${count}件`);
        // サンプルで3件表示
        $(sel).slice(0, 3).each((_, el) => {
          const src = $(el).attr('data-original') || $(el).attr('data-p1') || $(el).attr('data-src') || $(el).attr('src') || '';
          const alt = $(el).attr('alt') || '';
          console.log(`      alt="${alt.slice(0,30)}" src="${src.slice(0,60)}"`);
        });
        foundAny = true;
      }
    }

    // どんな画像URLパターンがあるか全般的に確認
    if (!foundAny) {
      const imgSrcs = [];
      $('img[src]').each((_, el) => {
        const src = $(el).attr('src') || '';
        if (src && !src.includes('noimage') && !src.startsWith('data:') && src.length > 10) {
          imgSrcs.push(src.slice(0, 80));
        }
      });
      if (imgSrcs.length > 0) {
        console.log(`    全imgパターン (${imgSrcs.length}件):`);
        imgSrcs.slice(0, 8).forEach(s => console.log(`      ${s}`));
      }
    }

    if (foundAny) break; // 見つかったらこの店舗はOK
  }

  if (!foundAny) {
    console.log(`  → ⚠️ 既知パターンなし（JS描画 or 非公開）`);
  }

  await new Promise(r => setTimeout(r, 600));
}

console.log(`\n\n調査完了`);
