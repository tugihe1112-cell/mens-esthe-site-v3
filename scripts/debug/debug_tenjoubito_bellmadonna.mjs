/**
 * 天上人PREMIUM (fucolle CMS) + ベルマドンナ 詳細調査
 * 実行: node scripts/debug/debug_tenjoubito_bellmadonna.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

// ============================================================
// 天上人PREMIUM - fucolle CMS の構造解析
// ============================================================
console.log('=== 天上人PREMIUM (fucolle CMS) ===');
{
  const urls = [
    'https://www.tenjoubitopr.com/staff/',
    'https://www.tenjoubitopr.com/cast/',
    'https://www.tenjoubitopr.com/girl/',
    'https://www.tenjoubitopr.com/',
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000) });
      if (!res.ok) { console.log(`${url} → ${res.status}`); continue; }
      const html = await res.text();
      const $ = cheerio.load(html);

      const allImgs = $('img');
      const scripts = $('script[src]');
      const allScripts = $('script');

      console.log(`\n${url} → ${res.status}`);
      console.log(`img: ${allImgs.length}, script[src]: ${scripts.length}, script: ${allScripts.length}`);

      // script[src] のURLを全部表示
      scripts.each((i, el) => {
        const src = $(el).attr('src') || '';
        console.log(`  script[src]: ${src}`);
      });

      // fucolle 特有のAPIエンドポイントを探す
      const fucolleApi = html.match(/fucolle[^"'\s]*/g) || [];
      console.log(`fucolle URL: ${[...new Set(fucolleApi)].join(', ').slice(0, 200)}`);

      // fetch/axios/XMLHttpRequest の呼び出しを探す
      const fetchCalls = html.match(/(?:fetch|axios\.get|\.open)\s*\(['"]([^'"]{5,100})['"]/g) || [];
      console.log(`API呼び出し候補: ${fetchCalls.slice(0, 5).join(' | ')}`);

      // JSON-LD や data-* 属性
      const jsonLd = $('script[type="application/ld+json"]').html();
      if (jsonLd) console.log(`JSON-LD: ${jsonLd.slice(0, 200)}`);

      // app, root, main などの要素でデータ属性を持つもの
      $('[data-id], [data-shop], [data-cast], [data-therapist]').each((i, el) => {
        const $el = $(el);
        const attrs = Object.keys(el.attribs || {}).filter(a => a.startsWith('data-'));
        console.log(`  data-attr: <${el.name}> ${attrs.map(a => `${a}="${$el.attr(a)}"`).join(' ')}`);
      });

      // script 内容をすべて確認 (100文字以上のもの)
      allScripts.each((i, el) => {
        const content = $(el).html() || '';
        if (content.length < 50) return;
        console.log(`\n  inline script[${i}] (${content.length}文字): ${content.slice(0, 300).replace(/\s+/g, ' ')}`);
      });

      // ページ全体から名前パターンを探す
      const nameMatches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8})\s*[（(](\d{2,3})[)）]/g)];
      console.log(`\n名前候補: ${nameMatches.length}件 ${nameMatches.slice(0, 5).map(m => `${m[1]}(${m[2]})`).join(', ')}`);

      break; // 最初に成功したURLのみ
    } catch (e) {
      console.log(`${url} → エラー: ${e.message}`);
    }
  }

  // fucolle の API エンドポイントを直接試す
  console.log('\n--- fucolle API 直接アクセス ---');
  const apiCandidates = [
    'https://api.fucolle.com/cast',
    'https://api.fucolle.com/gals',
    'https://www.tenjoubitopr.com/api/cast',
    'https://www.tenjoubitopr.com/api/gals',
    'https://www.tenjoubitopr.com/wp-json/wp/v2/cast',
  ];
  for (const apiUrl of apiCandidates) {
    try {
      const r = await fetch(apiUrl, { headers: { ...ua, 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) });
      console.log(`  ${apiUrl} → ${r.status}`);
      if (r.ok) {
        const text = await r.text();
        console.log(`  レスポンス: ${text.slice(0, 200)}`);
      }
    } catch (e) { console.log(`  ${apiUrl} → エラー`); }
  }
}

// ============================================================
// ベルマドンナ - 構造解析
// ============================================================
console.log('\n\n=== ベルマドンナ (bellmadonna.com) ===');
{
  const urls = [
    'https://bellmadonna.com/gals/',
    'https://bellmadonna.com/cast/',
    'https://bellmadonna.com/staff/',
    'https://bellmadonna.com/',
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000) });
      if (!res.ok) { console.log(`${url} → ${res.status}`); continue; }
      const html = await res.text();
      const $ = cheerio.load(html);

      const allImgs = $('img');
      const scripts = $('script[src]');
      const allScripts = $('script');

      console.log(`\n${url} → ${res.status}`);
      console.log(`img: ${allImgs.length}, script[src]: ${scripts.length}`);
      console.log(`CMS判定: ${html.includes('caskan') ? 'caskan' : html.includes('3days') ? '3days' : html.includes('wp-content') ? 'wp' : html.includes('wcms') ? 'wcms' : html.includes('fucolle') ? 'fucolle' : '独自'}`);

      // script[src] URLを表示
      scripts.each((i, el) => {
        const src = $(el).attr('src') || '';
        console.log(`  script[src]: ${src}`);
      });

      // fetch/API 呼び出し
      const fetchCalls = html.match(/(?:fetch|axios\.get|\.open)\s*\(['"]([^'"]{5,100})['"]/g) || [];
      fetchCalls.slice(0, 5).forEach(f => console.log(`  API: ${f.slice(0, 100)}`));

      // data-src 全取得
      const dataSrcs = $('img[data-src]');
      console.log(`data-src imgs: ${dataSrcs.length}`);
      dataSrcs.slice(0, 5).each((i, el) => {
        console.log(`  [${i}] data-src: ${$(el).attr('data-src')}`);
      });

      // inline scripts
      allScripts.each((i, el) => {
        const content = $(el).html() || '';
        if (content.length < 100) return;
        console.log(`\n  inline script[${i}] (${content.length}文字): ${content.slice(0, 400).replace(/\s+/g, ' ')}`);
      });

      // 名前パターン
      const nameMatches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8})\s*[（(](\d{2,3})[)）]/g)];
      console.log(`名前候補: ${nameMatches.length}件 ${nameMatches.slice(0, 5).map(m => `${m[1]}(${m[2]})`).join(', ')}`);

      break;
    } catch (e) {
      console.log(`${url} → エラー: ${e.message}`);
    }
  }
}

// ============================================================
// 原価屋 (genkaya.net) - 追加調査
// ============================================================
console.log('\n\n=== 原価屋 (genkaya.net) ===');
{
  const urls = [
    'https://genkaya.net/',
    'https://genkaya.net/cast/',
    'https://genkaya.net/staff/',
    'https://genkaya.net/therapist/',
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000) });
      if (!res.ok) { console.log(`${url} → ${res.status}`); continue; }
      const html = await res.text();
      const $ = cheerio.load(html);
      const imgs = $('img');
      const lazy = $('img[data-src], img[data-lazy-src]');
      console.log(`${url} → img:${imgs.length}, lazy:${lazy.length}`);
      console.log(`CMS: ${html.includes('caskan') ? 'caskan' : html.includes('3days') ? '3days' : html.includes('wp-content') ? 'wp' : html.includes('wcms') ? 'wcms' : '独自'}`);
      const nameMatches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8})\s*[（(](\d{2,3})[)）]/g)];
      console.log(`名前候補: ${nameMatches.length}件 ${nameMatches.slice(0, 5).map(m => `${m[1]}(${m[2]})`).join(', ')}`);
      $('img[src*="cast"], img[src*="staff"], img[src*="girl"], img[src*="upload"]').slice(0, 3).each((i, el) => {
        console.log(`  img[${i}] src: ${$(el).attr('src')?.slice(0, 70)}`);
      });
      $('script[src]').each((_, el) => console.log(`  script: ${$(el).attr('src')}`));
      break;
    } catch (e) { console.log(`${url} → エラー: ${e.message}`); }
  }
}
