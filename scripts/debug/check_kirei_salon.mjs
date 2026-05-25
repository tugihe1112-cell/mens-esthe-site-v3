/**
 * 綺麗なサロン サイト構造デバッグ
 * 実行: node scripts/debug/check_kirei_salon.mjs
 */
import * as cheerio from 'cheerio';

const WEBSITE_URL = 'https://kirei1212.livedoor.blog';
const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

console.log('=== トップページ ===');
const res = await fetch(WEBSITE_URL, { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

console.log(`img数: ${$('img').length}, 記事数: ${$('article').length}`);

console.log('\n--- 記事タイトル一覧 ---');
$('h1, h2.entry-title, .article-title, .entry-header h2').each((i, el) => {
  console.log(`[${i}] ${$(el).text().trim().slice(0, 60)}`);
});

console.log('\n--- img一覧 ---');
$('img').each((i, el) => {
  const $e = $(el);
  const src = $e.attr('src') || $e.attr('data-src') || '';
  if (/favicon|logo|banner|ad_/i.test(src)) return;
  console.log(`[${i}] src=${src.slice(0, 80)} alt=${($e.attr('alt')||'').slice(0,30)}`);
});

console.log('\n--- カテゴリ/メニューリンク ---');
$('a').filter((_, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim();
  return /cast|staff|girl|therapist|キャスト|セラピスト|スタッフ|在籍|出勤|女の子/i.test(href + text);
}).each((i, el) => {
  console.log(`[${i}] href=${$(el).attr('href')} text=${$(el).text().trim().slice(0,40)}`);
});

console.log('\n--- 全リンク一覧（/archives/ 含む）---');
const archiveLinks = [];
$('a[href*="/archives/"]').each((_, el) => {
  const href = $(el).attr('href') || '';
  if (!archiveLinks.includes(href) && !/comment|trackback/.test(href)) archiveLinks.push(href);
});
archiveLinks.slice(0, 20).forEach((href, i) => console.log(`[${i}] ${href}`));

// 最初の記事を取得してみる
if (archiveLinks.length > 0) {
  const firstUrl = archiveLinks[0].startsWith('http') ? archiveLinks[0] : WEBSITE_URL + archiveLinks[0];
  console.log(`\n=== 記事サンプル: ${firstUrl} ===`);
  const r2 = await fetch(firstUrl, { headers: ua });
  const h2 = await r2.text();
  const $2 = cheerio.load(h2);
  console.log(`タイトル: ${$2('h1, h2.entry-title').first().text().trim()}`);
  console.log(`本文テキスト: ${$2('.entry-content, .article-body').first().text().replace(/\s+/g,' ').trim().slice(0,200)}`);
  $2('img').each((i, el) => {
    const src = $2(el).attr('src') || '';
    if (!/favicon|logo/i.test(src)) console.log(`  img[${i}]: ${src.slice(0,80)} alt=${($2(el).attr('alt')||'').slice(0,30)}`);
  });
}
