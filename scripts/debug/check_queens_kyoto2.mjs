import * as cheerio from 'cheerio';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

// http / https 両方試す
for (const url of ['http://queenskyoto.com', 'https://queenskyoto.com', 'http://www.queenskyoto.com']) {
  console.log(`\n=== ${url} ===`);
  try {
    const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000), redirect: 'follow' });
    console.log(`  status: ${res.status}, url: ${res.url}`);
    const html = await res.text();
    console.log(`  HTML length: ${html.length}`);
    console.log(`  HTML先頭500文字:\n${html.slice(0, 500)}`);
  } catch(e) {
    console.log(`  エラー: ${e.message}`);
  }
}
