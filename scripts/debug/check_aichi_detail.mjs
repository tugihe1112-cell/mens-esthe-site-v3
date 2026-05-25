import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function fetch2(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000) });
  return { ok: res.ok, status: res.status, html: res.ok ? await res.text() : '' };
}

// --- 1. 一宮: images_staff pattern ---
console.log('=== メンズエステ一宮 /cast/ ===');
{
  const { html } = await fetch2('https://esthe-ichinomiya.com/cast/');
  const $ = cheerio.load(html);
  $('img[src*="images_staff"]').slice(0,5).each((_,el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    console.log(`  alt=[${alt}] src=${src.slice(0,60)}`);
  });
  console.log(`  images_staff img総数: ${$('img[src*="images_staff"]').length}`);
}
await sleep(400);

// --- 2. M Spa: images_staff pattern ---
console.log('\n=== M Spa /cast/ ===');
{
  const { html } = await fetch2('https://m-spa.net/cast/');
  const $ = cheerio.load(html);
  $('img[src*="images_staff"]').slice(0,5).each((_,el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    console.log(`  alt=[${alt}] src=${src.slice(0,60)}`);
  });
  console.log(`  images_staff img総数: ${$('img[src*="images_staff"]').length}`);
}
await sleep(400);

// --- 3. Galaxy-NAGOYA: WordPress /cast/ ---
console.log('\n=== Galaxy-NAGOYA /cast/ ===');
{
  const { html } = await fetch2('https://galaxy-nagoya.com/cast/');
  const $ = cheerio.load(html);
  $('img[src*="wp-content/uploads"]').slice(0,8).each((_,el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    // 日本語文字を含む alt のみ
    if (/[ぁ-んァ-ヾ一-龯]/.test(alt)) console.log(`  ✅ alt=[${alt}] src=${src.slice(0,70)}`);
    else console.log(`  　　alt=[${alt}] src=${src.slice(0,70)}`);
  });
  console.log(`  wp-content img総数: ${$('img[src*="wp-content/uploads"]').length}`);
}
await sleep(400);

// --- 4. Spur Luxury: 3days, S3画像の周辺HTML ---
console.log('\n=== Spur Luxury /therapist/ ===');
{
  const { html } = await fetch2('https://spurluxury.com/therapist/');
  const $ = cheerio.load(html);
  // S3画像の周辺構造
  const s3Imgs = $('img[src*="s3"]');
  console.log(`  S3 img数: ${s3Imgs.length}`);
  s3Imgs.slice(0,3).each((_,el) => {
    const $el = $(el);
    const $parent = $el.parent();
    const $card = $el.closest('[class]');
    const nameEl = $card.find('p,span,h3,h4,.name,.therapist-name').first();
    console.log(`  src=${$el.attr('src')?.slice(40,90)}`);
    console.log(`    親クラス: ${$parent.attr('class')}, card親: ${$card.attr('class')?.slice(0,40)}`);
    console.log(`    name候補: [${nameEl.text().trim().slice(0,30)}]`);
  });
  // 全テキストからname抽出試行
  const texts = [];
  $('[class*="therapist"],[class*="cast"],[class*="staff"],[class*="girl"]').each((_,el) => {
    const t = $(el).text().trim().replace(/\s+/g,' ').slice(0,50);
    if (t) texts.push(t);
  });
  console.log('  3days系テキスト:', texts.slice(0,5));
}
await sleep(400);

// --- 5. VENIRE: 3days ---
console.log('\n=== VENIRE /therapist/ ===');
{
  const { html } = await fetch2('https://venire-aroma.com/therapist/');
  const $ = cheerio.load(html);
  const s3Imgs = $('img[src*="s3"]');
  console.log(`  S3 img数: ${s3Imgs.length}`);
  s3Imgs.slice(0,3).each((_,el) => {
    const $el = $(el);
    const $card = $el.closest('[class]');
    const nameEl = $card.find('p,span,h3,h4').first();
    console.log(`  src=${$el.attr('src')?.slice(40,90)}`);
    console.log(`    card: ${$card.attr('class')?.slice(0,40)}, name: [${nameEl.text().trim().slice(0,30)}]`);
  });
  // 全pタグ
  $('p').slice(0,20).each((_,el) => {
    const t = $(el).text().trim();
    if (t && t.length < 20 && /[ぁ-んァ-ヾ一-龯]/.test(t)) console.log(`  p: [${t}]`);
  });
}
await sleep(400);

// --- 6. ゆりかご名古屋 /therapist/ ---
console.log('\n=== ゆりかご名古屋 /therapist/ ===');
{
  const { html } = await fetch2('https://www.yurikago-nagoya.com/therapist/');
  const $ = cheerio.load(html);
  const cms = html.includes('wp-content') ? 'wordpress' : 'generic';
  console.log(`  CMS: ${cms}`);
  console.log(`  wp-content img: ${$('img[src*="wp-content"]').length}`);
  $('img[src*="wp-content/uploads"]').slice(0,5).each((_,el) => {
    console.log(`  alt=[${$(el).attr('alt')}] src=${$(el).attr('src')?.slice(0,70)}`);
  });
  // img alt一覧（日本語）
  const jpAlts = [];
  $('img[alt]').each((_,el) => {
    const alt = $(el).attr('alt') || '';
    if (/[ぁ-んァ-ヾ一-龯]/.test(alt) && alt.length < 20) jpAlts.push(alt);
  });
  console.log(`  日本語alt: ${jpAlts.slice(0,10).join(', ')}`);
}
await sleep(400);

// --- 7. URL修正が必要な店舗 ---
console.log('\n=== CAMPBELL 各パス試行 ===');
for (const path of ['/staff/', '/cast/', '/therapist/', '/girl/', '/member/']) {
  const { ok, status } = await fetch2(`https://vip-campbell.nagoya${path}`);
  console.log(`  ${path}: ${ok ? '✅' : '❌'} ${status}`);
  await sleep(200);
}

console.log('\n=== ENCORE 各パス試行 ===');
for (const path of ['/staff/', '/cast/', '/therapist/', '/girl/']) {
  const { ok, status } = await fetch2(`https://encore-nagoya.com${path}`);
  console.log(`  ${path}: ${ok ? '✅' : '❌'} ${status}`);
  await sleep(200);
}

console.log('\n=== Marigold 各パス試行 ===');
for (const path of ['/girl/', '/therapist/', '/staff/', '/cast/', '/']) {
  const { ok, status, html } = await fetch2(`https://mari-gold.biz${path}`);
  if (ok) {
    const $ = cheerio.load(html);
    const wpImgs = $('img[src*="wp-content/uploads"]').length;
    console.log(`  ${path}: ✅ ${status}, wp-content imgs: ${wpImgs}`);
    $('img[src*="wp-content/uploads"]').slice(0,3).each((_,el) => console.log(`    alt=[${$(el).attr('alt')}]`));
  } else {
    console.log(`  ${path}: ❌ ${status}`);
  }
  await sleep(200);
}

console.log('\n=== GOLDEN ROSE /staff/ apl pattern ===');
{
  const { html } = await fetch2('https://golden-rose.jp/staff/');
  const $ = cheerio.load(html);
  // apl パターン
  $('img[src*="apl"]').slice(0,10).each((_,el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    if (!/slideimg|topimage|smtop/.test(src)) console.log(`  alt=[${alt}] src=${src.slice(0,70)}`);
  });
  // staffの構造
  console.log(`  apl img総数: ${$('img[src*="apl"]').length}`);
  // 名前らしいalt
  $('img[alt]').each((_,el) => {
    const alt = $(el).attr('alt') || '';
    if (/[ぁ-んァ-ヾ一-龯]/.test(alt) && !alt.includes('GOLDEN') && !alt.includes('エステ')) {
      console.log(`  名前候補: [${alt}] src=${$(el).attr('src')?.slice(0,60)}`);
    }
  });
}
