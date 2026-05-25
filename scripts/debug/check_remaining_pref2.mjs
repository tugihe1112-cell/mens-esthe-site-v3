/**
 * 未処理3店舗 詳細構造確認（第2弾）
 * 実行: node scripts/debug/check_remaining_pref2.mjs
 */
import * as cheerio from 'cheerio';

const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetch$(url) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000) });
  const html = await res.text();
  return { $: cheerio.load(html), html, status: res.status };
}

// ─── 1. 俺の家 staff.php ────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【大阪 俺の家】 staff.php');
console.log('='.repeat(60));
try {
  const { $, html } = await fetch$('http://ore-no-ie.com/staff.php');

  // img 全般
  const imgs = [];
  $('img').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    imgs.push({ alt, src });
  });
  console.log(`img 総数: ${imgs.length}`);

  // セラピスト候補（images_staff / cast / girl / member系）
  const therapistImgs = imgs.filter(i =>
    i.src.includes('images_staff') ||
    i.src.includes('/cast') ||
    i.src.includes('/girl') ||
    i.src.includes('/member') ||
    i.src.includes('/staff') ||
    i.src.includes('/photo')
  );
  console.log(`\nセラピスト系img: ${therapistImgs.length}件`);
  therapistImgs.slice(0, 10).forEach(i => console.log(`  alt="${i.alt}" src="${i.src}"`));

  // alt に名前っぽいもの（日本語）
  const jpImgs = imgs.filter(i => /[ぁ-んァ-ヾ一-龯]/.test(i.alt) && i.alt.length < 15 && !i.alt.includes('エステ') && !i.alt.includes('メンズ'));
  console.log(`\n名前っぽいalt img: ${jpImgs.length}件`);
  jpImgs.slice(0, 15).forEach(i => console.log(`  alt="${i.alt}" src="${i.src}"`));

  // ページ内のテキストからセラピスト名らしきものを探す
  const bodyText = $('body').text().replace(/\s+/g, ' ').slice(0, 2000);
  console.log(`\nページテキスト(先頭2000字):\n${bodyText}`);
} catch(e) { console.log(`❌ ${e.message}`); }

await sleep(1000);

// ─── 2. 超レベチなエステ24 キャストページ探し ───────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【千葉 超レベチなエステ24】 キャスト構造確認');
console.log('='.repeat(60));

const levechiUrls = [
  'https://tokyo242424.com/cast/',
  'https://tokyo242424.com/staff/',
  'https://tokyo242424.com/therapist/',
  'https://tokyo242424.com/girl/',
];
for (const url of levechiUrls) {
  try {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(8000) });
    console.log(`${url} → HTTP ${res.status}`);
  } catch(e) { console.log(`${url} → ❌ ${e.message}`); }
  await sleep(300);
}

// メインページのキャスト部分を詳しく見る
try {
  const { $, html } = await fetch$('https://tokyo242424.com/');
  console.log(`\nメインページ img総数: $('img').length=${$('img').length}`);

  // ブログ系画像（img_xxxxx形式）のalt一覧
  const blogImgs = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (src.includes('shop_blog') && /[ぁ-んァ-ヾ一-龯]/.test(alt)) {
      blogImgs.push({ alt, src: src.slice(0, 80) });
    }
  });
  console.log(`\nブログ系キャスト画像: ${blogImgs.length}件`);
  blogImgs.slice(0, 20).forEach(i => console.log(`  alt="${i.alt}" src="${i.src}"`));

  // ルーム判定パターン確認
  const naritaImgs = blogImgs.filter(i => i.alt.includes('成田'));
  const toganeImgs = blogImgs.filter(i => i.alt.includes('東金'));
  console.log(`\n成田ルーム: ${naritaImgs.length}件, 東金ルーム: ${toganeImgs.length}件`);
} catch(e) { console.log(`❌ ${e.message}`); }

await sleep(1000);

// ─── 3. Fromage JS確認 ─────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【神奈川 Fromage】 JS/APIエンドポイント確認');
console.log('='.repeat(60));
try {
  const { $, html } = await fetch$('http://fromage-kawasaki.com/cast/');

  // script タグのsrcを確認
  const scripts = [];
  $('script[src]').each((_, el) => scripts.push($(el).attr('src')));
  console.log(`\nscriptタグ src (${scripts.length}件):`);
  scripts.slice(0, 10).forEach(s => console.log(`  ${s}`));

  // data-src / data-url 系（遅延ロード）
  const dataSrcs = [];
  $('[data-src],[data-url],[data-image]').each((_, el) => {
    dataSrcs.push({
      tag: el.tagName,
      dataSrc: $(el).attr('data-src') || $(el).attr('data-url') || $(el).attr('data-image') || '',
      alt: $(el).attr('alt') || $(el).attr('data-name') || $(el).text().trim().slice(0,20),
    });
  });
  console.log(`\ndata-src 系 (${dataSrcs.length}件):`);
  dataSrcs.slice(0, 10).forEach(d => console.log(`  ${d.tag} alt="${d.alt}" data-src="${d.dataSrc.slice(0,80)}"`));

  // セラピスト名らしいテキストを探す
  const jpTexts = [];
  $('*').each((_, el) => {
    const text = $(el).clone().children().remove().end().text().trim();
    if (text.length > 0 && text.length < 12 && /[ぁ-んァ-ヾ一-龯]/.test(text) &&
        !text.includes('川崎') && !text.includes('メンズ') && !text.includes('エステ') &&
        !text.includes('コース') && !text.includes('料金') && !text.includes('予約')) {
      jpTexts.push(text);
    }
  });
  const uniqueJpTexts = [...new Set(jpTexts)];
  console.log(`\n名前っぽいテキスト (${uniqueJpTexts.length}件):`);
  uniqueJpTexts.slice(0, 30).forEach(t => console.log(`  "${t}"`));

  // html内にAPIエンドポイントがあるか
  const apiMatch = html.match(/api[^"']*therapist[^"']*/gi) || [];
  const jsonMatch = html.match(/\/api\/[^"' ]+/g) || [];
  console.log(`\nAPI系文字列: ${[...apiMatch, ...jsonMatch].slice(0,5).join(', ')}`);

} catch(e) { console.log(`❌ ${e.message}`); }
