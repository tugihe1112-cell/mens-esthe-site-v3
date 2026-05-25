/**
 * wcmsサイトの全キャストページURL探索（サイトマップ・リンク・API）
 * 実行: node scripts/debug/check_wcms_links.mjs
 */
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function tryUrl(url, label = '') {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    return { ok: res.status === 200, status: res.status, text: res.status === 200 ? await res.text() : '', url: res.url };
  } catch (e) {
    return { ok: false, status: 0, text: '', url };
  }
}

const SITES = [
  { name: 'ミセスの子守唄', base: 'https://mrs-komoriuta.com' },
  { name: 'ミセスムーンR 大阪', base: 'https://www.moonr.jp' },
  { name: 'ミセスムーンR 兵庫', base: 'https://moor-kobe.jp' },
];

for (const site of SITES) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${site.name}】 ${site.base}`);
  console.log('='.repeat(60));

  // 1. sitemap.xml
  for (const smPath of ['/sitemap.xml', '/sitemap_index.xml', '/robots.txt']) {
    const r = await tryUrl(site.base + smPath);
    if (r.ok) {
      console.log(`\n✅ ${smPath}`);
      // castや girl 関連URLを抜き出す
      const lines = r.text.split('\n').filter(l => /cast|girl|staff|therapist|lady|member|gals/.test(l));
      lines.slice(0, 10).forEach(l => console.log(`  ${l.trim().slice(0, 100)}`));
      if (lines.length === 0) console.log('  → キャスト関連URLなし');
    } else {
      console.log(`  ${smPath} → ${r.status}`);
    }
  }

  // 2. トップページのリンク全件
  console.log('\n--- トップページのリンク（キャスト関連） ---');
  const top = await tryUrl(site.base + '/');
  if (top.ok) {
    const $ = cheerio.load(top.text);
    const hrefs = new Set();
    $('a[href]').each((_, el) => {
      const h = $(el).attr('href') || '';
      hrefs.add(h);
    });
    // 全リンク出力（キャスト系以外も）
    const allHrefs = [...hrefs].filter(h => h && !h.startsWith('tel:') && !h.startsWith('mailto:'));
    console.log(`全リンク数: ${allHrefs.length}件`);
    // キャスト・女性・スタッフ関連
    const castHrefs = allHrefs.filter(h => /cast|girl|staff|therapist|lady|member|gals|woman|療養|セラピ|キャスト|スタッフ|メンバー/.test(h));
    console.log(`キャスト系: ${castHrefs.length}件`);
    castHrefs.forEach(h => console.log(`  ${h}`));
    // 全リンクも表示（少なければ全部）
    if (allHrefs.length <= 30) {
      console.log('全リンク:');
      allHrefs.forEach(h => console.log(`  ${h}`));
    } else {
      console.log('全リンク（先頭30件）:');
      allHrefs.slice(0, 30).forEach(h => console.log(`  ${h}`));
    }
  }

  // 3. wcms固有パス試行
  console.log('\n--- wcms系パス試行 ---');
  const wcmsPaths = [
    '/wcms/',
    '/wcms/cast/',
    '/wcms/girl/',
    '/wcms/gals/',
    '/wcms/cast/list/',
    '/wcms/api/',
    '/wcms/api/cast',
    '/wcms/api/cast.json',
    '/wcms/api/girl',
    '/wcms/girl/list/',
    '/girl/',
    '/girl/list/',
    '/gals/',
    '/lady/',
  ];
  for (const p of wcmsPaths) {
    const r = await tryUrl(site.base + p);
    if (r.ok) {
      console.log(`✅ ${p} (${r.text.length}bytes)`);
      const $ = cheerio.load(r.text);
      const galsCount = (r.text.match(/\/wcms\/gals\/images\//g) || []).length;
      console.log(`   gals images: ${galsCount}件`);
      if (r.text.length < 500) console.log(`   内容: ${r.text.slice(0, 200)}`);
    }
    // 404以外のエラーは表示
    else if (r.status !== 404 && r.status !== 0) {
      console.log(`  ${p} → ${r.status}`);
    }
  }

  // 4. ページ内のJavaScriptからAPI URLを探す
  console.log('\n--- JSファイルのAPI URL探索 ---');
  if (top.ok) {
    const $ = cheerio.load(top.text);
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src && !src.includes('google') && !src.includes('jquery') && !src.includes('bootstrap')) {
        console.log(`  script: ${src}`);
      }
    });
    // インラインJSからcast/gals関連を探す
    const inlineScripts = [];
    $('script:not([src])').each((_, el) => {
      const content = $(el).html() || '';
      if (/cast|gals|girl|therapist|staff/i.test(content)) {
        inlineScripts.push(content.slice(0, 200));
      }
    });
    if (inlineScripts.length > 0) {
      console.log('インラインJS（cast/gals関連）:');
      inlineScripts.slice(0, 3).forEach(s => console.log(`  ${s}`));
    }
  }
}

// 特別チェック: moonr.jp の全キャスト一覧（AJAX API探索）
console.log('\n\n=== ムーンR AJAX API 詳細探索 ===');
const moonrApiPaths = [
  '/api/cast',
  '/api/girl',
  '/api/therapist',
  '/json/cast',
  '/json/girl',
  '/cast.json',
  '/girl.json',
  '/wcms/api/cast.json',
  '/wcms/cast.json',
];
for (const p of moonrApiPaths) {
  const r = await tryUrl('https://www.moonr.jp' + p);
  if (r.ok) {
    console.log(`✅ moonr.jp${p}:`);
    console.log(r.text.slice(0, 300));
  }
}

console.log('\n完了');
