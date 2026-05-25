/**
 * ベルマドンナ + 原価屋 詳細HTML調査
 * 実行: node scripts/debug/debug_bellmadonna_raw.mjs
 */
import * as cheerio from 'cheerio';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
};

// ============================================================
// ベルマドンナ - 生HTML確認
// ============================================================
console.log('=== ベルマドンナ bellmadonna.com ===');
{
  // トップページ・cast・gals 各URL試行
  const tryUrls = [
    'https://bellmadonna.com/',
    'https://bellmadonna.com/gals/',
    'https://bellmadonna.com/cast/',
    'https://bellmadonna.com/staff/',
    'https://bellmadonna.com/sitemap.xml',
    'https://bellmadonna.com/robots.txt',
  ];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000) });
      const text = await res.text();
      console.log(`\n${url} → ${res.status} (${text.length}文字)`);
      if (url.includes('sitemap') || url.includes('robots')) {
        console.log(text.slice(0, 500));
        continue;
      }
      // 先頭1000文字 (HTMLソース)
      console.log('--- HEAD ---');
      console.log(text.slice(0, 800));
      console.log('--- TAIL ---');
      console.log(text.slice(-300));

      // script タグ全部
      const $ = cheerio.load(text);
      console.log(`\nimgタグ数: ${$('img').length}`);
      $('img').each((i, el) => {
        const attrs = Object.entries(el.attribs || {}).map(([k,v]) => `${k}="${v.slice(0,80)}"`).join(' ');
        console.log(`  img[${i}]: ${attrs}`);
      });

      $('script').each((i, el) => {
        const src = $(el).attr('src') || '';
        const content = $(el).html() || '';
        if (src) console.log(`  script[src]: ${src}`);
        else if (content.length > 30) console.log(`  inline script(${content.length}文字): ${content.slice(0, 300)}`);
      });

      // iframeチェック
      $('iframe').each((i, el) => {
        console.log(`  iframe: src="${$(el).attr('src')}" width="${$(el).attr('width')}"`);
      });

      // meta refresh や JS redirect を探す
      const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
      if (metaRefresh) console.log(`  meta refresh: ${metaRefresh}`);

      // window.location や location.href
      const redirectMatch = text.match(/(?:window\.location|location\.href)\s*=\s*['"]([^'"]+)['"]/g);
      if (redirectMatch) console.log(`  JS redirect: ${redirectMatch.join(', ')}`);

    } catch (e) {
      console.log(`${url} → エラー: ${e.message}`);
    }
  }

  // 直接APIを試す
  console.log('\n--- ベルマドンナ API候補 ---');
  const apiCandidates = [
    'https://bellmadonna.com/api/cast',
    'https://bellmadonna.com/api/gals',
    'https://bellmadonna.com/data/cast.json',
    'https://bellmadonna.com/gals/data.js',
    'https://bellmadonna.com/cast/data.js',
  ];
  for (const apiUrl of apiCandidates) {
    try {
      const r = await fetch(apiUrl, { headers: ua, signal: AbortSignal.timeout(5000) });
      console.log(`${apiUrl} → ${r.status}`);
      if (r.ok) console.log((await r.text()).slice(0, 200));
    } catch { console.log(`${apiUrl} → エラー`); }
  }
}

// ============================================================
// 原価屋 - castページ調査
// ============================================================
console.log('\n\n=== 原価屋 genkaya.net ===');
{
  // cast/staffページを探す
  const tryUrls = [
    'https://genkaya.net/cast/',
    'https://genkaya.net/staff/',
    'https://genkaya.net/therapist/',
    'https://genkaya.net/girl/',
    'https://genkaya.net/lady/',
    'https://genkaya.net/member/',
    'https://genkaya.net/girls/',
  ];

  // まずトップページからリンクを探す
  try {
    const topRes = await fetch('https://genkaya.net/', { headers: ua, signal: AbortSignal.timeout(10000) });
    const topHtml = await topRes.text();
    const $ = cheerio.load(topHtml);

    console.log('\nトップページのリンク (therapist系):');
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/cast|staff|girl|lady|therapist|セラピスト|在籍|スタッフ|キャスト/i.test(href + text)) {
        console.log(`  "${text}" → ${href}`);
      }
    });

    // ナビゲーションリンクを全部表示
    console.log('\nナビゲーションリンク:');
    $('nav a, header a, .menu a, .nav a').slice(0, 20).each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (href && text) console.log(`  "${text}" → ${href}`);
    });

    // 全画像とalt属性
    console.log(`\n全img: ${$('img').length}`);
    $('img').each((i, el) => {
      const $img = $(el);
      const src = $img.attr('src') || '';
      const alt = $img.attr('alt') || '';
      const dataSrc = $img.attr('data-src') || $img.attr('data-original') || '';
      if (!src && !dataSrc) return;
      // m-sns.net 以外の画像
      if (src.includes('m-sns.net') || src.includes('banner')) return;
      const imgUrl = dataSrc || src;
      if (!imgUrl.match(/\.(jpg|jpeg|png|webp)/i)) return;
      console.log(`  img[${i}]: src=${imgUrl.slice(0, 70)} alt="${alt}"`);
    });

  } catch (e) {
    console.log(`トップページエラー: ${e.message}`);
  }

  // 各候補URLを試す
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(8000) });
      if (!res.ok) { console.log(`${url} → ${res.status}`); continue; }
      const html = await res.text();
      const $ = cheerio.load(html);

      const imgs = $('img');
      const nameMatches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8})\s*[（(](\d{2,3})[)）]/g)];
      console.log(`\n${url} → ${res.status}: img:${imgs.length}, 名前:${nameMatches.length}件`);

      if (nameMatches.length > 0) {
        console.log(`サンプル: ${nameMatches.slice(0, 5).map(m => `${m[1]}(${m[2]})`).join(', ')}`);
        // 画像も確認
        imgs.slice(0, 5).each((i, el) => {
          const $img = $(el);
          const src = $img.attr('data-original') || $img.attr('data-src') || $img.attr('src') || '';
          const alt = $img.attr('alt') || '';
          console.log(`  img[${i}]: alt="${alt}" src=${src.slice(0, 70)}`);
        });
        break;
      }
    } catch (e) {
      console.log(`${url} → エラー: ${e.message}`);
    }
  }
}

// ============================================================
// 未処理店舗の一括調査: lavieet / mufufu / cream / my_mama_spa
// ============================================================
console.log('\n\n=== 残り未処理店舗 ===');
const remaining = [
  { id: 'osaka_umeda_lavieet',   name: 'La vie et',   url: 'https://lavieet.net/' },
  { id: 'osaka_umeda_mufufu',    name: 'ムフフ',       url: 'https://mufufu-foot-care-center.com/' },
  { id: 'osaka_tanimachi9_cream', name: 'C.r.e.a.m', url: 'http://cream-osaka.com/' },
];

for (const shop of remaining) {
  console.log(`\n[${shop.id}] ${shop.name} - ${shop.url}`);
  try {
    const res = await fetch(shop.url, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) { console.log(`  → ${res.status}`); continue; }
    const html = await res.text();
    const $ = cheerio.load(html);

    const cms = html.includes('caskan') ? 'caskan'
      : html.includes('3days') ? '3days'
      : html.includes('men-es.jp') ? 'men-es'
      : html.includes('wp-content') ? 'wordpress'
      : html.includes('wcms') ? 'wcms'
      : html.includes('fucolle') ? 'fucolle'
      : '独自';

    const imgs = $('img').length;
    const lazyImgs = $('img[data-src], img[data-lazy-src], img[data-original]').length;
    const nameMatches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8})\s*[（(](\d{2,3})[)）]/g)];

    console.log(`  CMS:${cms}, img:${imgs}, lazy:${lazyImgs}, 名前候補:${nameMatches.length}件`);
    if (nameMatches.length > 0) {
      console.log(`  サンプル: ${nameMatches.slice(0, 5).map(m => `${m[1]}(${m[2]})`).join(', ')}`);
    }

    // castページリンク
    let castUrl = null;
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/cast|staff|girl|lady|therapist|セラピスト|在籍/i.test(href + text) && !castUrl) {
        try { castUrl = href.startsWith('http') ? href : new URL(href, shop.url).href; } catch {}
      }
    });
    if (castUrl) console.log(`  castページ: ${castUrl}`);

    // cast/staff/therapistページを直接試す
    if (!castUrl || nameMatches.length === 0) {
      for (const path of ['/cast/', '/staff/', '/therapist/', '/girl/']) {
        try {
          const castRes = await fetch(new URL(path, shop.url).href, { headers: ua, signal: AbortSignal.timeout(8000) });
          if (!castRes.ok) continue;
          const castHtml = await castRes.text();
          const castNames = [...castHtml.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8})\s*[（(](\d{2,3})[)）]/g)];
          const castImgs = (castHtml.match(/<img/gi) || []).length;
          console.log(`  ${path} → ${castRes.status}: img:${castImgs}, 名前:${castNames.length}件 ${castNames.slice(0,3).map(m=>`${m[1]}(${m[2]})`).join(',')}`);
          if (castNames.length > 0) break;
        } catch {}
      }
    }

  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
}
