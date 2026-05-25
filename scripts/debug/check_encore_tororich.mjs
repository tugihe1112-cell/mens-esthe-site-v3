import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// === ENCORE: トップページ全画像 ===
console.log('=== ENCORE トップ ===');
{
  const res = await fetch('https://encore-nagoya.com/', { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  $('img[src*="images_staff"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    console.log(`  alt=[${alt}] src=${src.slice(0, 80)}`);
  });
  console.log(`  images_staff img数: ${$('img[src*="images_staff"]').length}`);

  // staffページのリンクを探す
  $('a[href]').each((_,el) => {
    const href = $(el).attr('href') || '';
    if (/staff|cast|therapist|lady|girl|セラピスト|在籍/i.test(href)) {
      console.log(`  staffリンク: ${href}`);
    }
  });
}
await sleep(400);

// === Tororich: 画像確認 ===
console.log('\n=== Tororich /staff/ 詳細 ===');
{
  const res = await fetch('https://www.tororich.net/staff/', { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  $('.item.clearfix').slice(0, 5).each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim().replace(/\s+/g, ' ').slice(0, 60);
    const imgs = $el.find('img').map((_,im) => ({
      src: $(im).attr('src') || $(im).attr('data-src') || '',
      alt: $(im).attr('alt') || ''
    })).get();
    console.log(`  card${i+1}: "${text}"`);
    imgs.forEach(im => console.log(`    img: alt=[${im.alt}] src=${im.src.slice(0,70)}`));
  });

  // 名前らしいパターン
  const names = [];
  $('.item.clearfix').each((_, el) => {
    const t = $(el).text().trim().replace(/\s+/g,' ');
    const m = t.match(/^([ぁ-んァ-ヾ一-龯々]{1,8})\s/);
    if (m) names.push(m[1]);
  });
  console.log(`  名前候補: ${names.join(', ')}`);
}
await sleep(400);

// === RICH AROMA: S3画像確認 ===
console.log('\n=== RICH AROMA カード詳細 ===');
{
  const res = await fetch('https://www.richaroma.nagoya/therapist/', { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  $('.item.clearfix').slice(0, 5).each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim().replace(/\s+/g, ' ').slice(0, 80);
    const imgSrc = $el.find('img').first().attr('src') || '';
    // 名前: 漢字読み仮名（年齢） → 漢字部分
    const nameMatch = text.match(/^([ぁ-んァ-ヾ一-龯々]{1,8})[（(（]/);
    console.log(`  card${i+1}: "${text}"`);
    console.log(`    name: ${nameMatch?.[1] || 'なし'}, img: ${imgSrc.slice(0,70)}`);
  });

  // S3画像数
  console.log(`  S3 img数: ${$('img[src*="amazonaws"]').length}`);
  $('img[src*="amazonaws"]').slice(0,3).each((_,el) => {
    console.log(`  S3 img: ${$(el).attr('src')?.slice(0,80)}`);
  });
}
