/**
 * ミセスの子守唄・ムーンR のキャストページURL探索
 * 実行: node scripts/debug/check_wcms_cast_urls.mjs
 */
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const SITES = [
  { name: 'ミセスの子守唄', base: 'https://mrs-komoriuta.com' },
  { name: 'ミセスムーンR 大阪', base: 'https://www.moonr.jp' },
  { name: 'ミセスムーンR 兵庫', base: 'https://moor-kobe.jp' },
];

const PATHS = [
  '/',
  '/cast/',
  '/cast/index.html',
  '/cast_list/',
  '/therapist/',
  '/girl/',
  '/girls/',
  '/staff/',
  '/member/',
  '/lady/',
  '/cast.html',
  '/therapist.html',
];

for (const site of SITES) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${site.name}】 ${site.base}`);
  console.log('='.repeat(60));

  for (const path of PATHS) {
    const url = site.base + path;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(8000),
        redirect: 'follow',
      });
      const finalUrl = res.url;
      const status = res.status;

      if (status === 200) {
        const text = await res.text();
        // wcms/gals 系の画像が含まれているか
        const galsCount = (text.match(/\/wcms\/gals\/images\//g) || []).length;
        const photosCount = (text.match(/\/photos\//g) || []).length;
        const imgCount = (text.match(/<img /g) || []).length;
        console.log(`✅ ${path} → ${finalUrl} [${status}] img:${imgCount} gals:${galsCount} photos:${photosCount}`);

        // wcms/gals があれば詳細表示
        if (galsCount > 0) {
          const matches = text.match(/src="([^"]*\/wcms\/gals\/images\/[^"]+)"/g)?.slice(0, 5) || [];
          matches.forEach(m => console.log(`   ${m}`));
          // altパターン確認
          const altMatches = text.match(/alt="([^"]+)"[^>]*src="[^"]*\/wcms\/gals\//g)?.slice(0, 5) || [];
          altMatches.forEach(m => console.log(`   ${m.slice(0, 80)}`));
        }
      } else {
        console.log(`  ${path} → ${status}`);
      }
    } catch (e) {
      console.log(`  ${path} → ERR: ${e.message}`);
    }
  }
}

// ─── ムーンR はトップページからキャストページへのリンクを探す ───
console.log('\n\n=== www.moonr.jp トップページのリンク構造 ===');
try {
  const res = await fetch('https://www.moonr.jp/', {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(10000),
  });
  const html = await res.text();

  // aタグのhrefを全取得
  const hrefs = [];
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const h = m[1];
    if (h.includes('cast') || h.includes('therapist') || h.includes('girl') || h.includes('staff') || h.includes('lady') || h.includes('member')) {
      hrefs.push(h);
    }
  }
  console.log('キャスト系リンク:', [...new Set(hrefs)].slice(0, 20));

  // wcms/gals の画像URLを全取得
  const galsUrls = [...html.matchAll(/\/wcms\/gals\/images\/(\d+)\/([^"'\s)]+)/g)].slice(0, 10);
  console.log('\n/wcms/gals/images/ パターン (最初の10件):');
  galsUrls.forEach(m => console.log(`  id=${m[1]} file=${m[2]}`));
} catch (e) {
  console.log('失敗:', e.message);
}

console.log('\n完了');
