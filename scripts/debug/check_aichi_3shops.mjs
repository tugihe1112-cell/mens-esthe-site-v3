import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

async function fetch2(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000) });
  return { ok: res.ok, status: res.status, html: res.ok ? await res.text() : '' };
}

// === CAMPBELL /staff/ ===
console.log('=== CAMPBELL /staff/ ===');
{
  const { html } = await fetch2('https://vip-campbell.nagoya/staff/');
  const $ = cheerio.load(html);
  console.log(`img総数: ${$('img').length}`);
  // 名前っぽいalt
  $('img[alt]').each((_,el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    if (/[ぁ-んァ-ヾ一-龯]/.test(alt) && alt.length < 15) {
      console.log(`  ✅ alt=[${alt}] src=${src.slice(0,80)}`);
    }
  });
  // 全imgの先頭10件
  console.log('全img先頭10:');
  $('img').slice(0,10).each((_,el) => console.log(`  [${$(el).attr('alt')}] ${$(el).attr('src')?.slice(0,80)}`));
  // ogp
  const ogImg = $('meta[property="og:image"]').attr('content');
  console.log(`og:image: ${ogImg}`);
}

// === Spur Luxury: カード構造詳細 ===
console.log('\n=== Spur Luxury /therapist/ カード構造 ===');
{
  const { html } = await fetch2('https://spurluxury.com/therapist/');
  const $ = cheerio.load(html);
  // itemImgの親要素
  $('.itemImg').slice(0,3).each((_,el) => {
    const $el = $(el);
    const $parent = $el.parent();
    const $grandparent = $parent.parent();
    console.log(`  itemImg parent: [${$parent.attr('class')}]`);
    console.log(`  grandparent: [${$grandparent.attr('class')}]`);
    // テキスト要素
    const $card = $grandparent;
    console.log(`  card全テキスト: ${$card.text().trim().replace(/\s+/g,' ').slice(0,80)}`);
    const img = $el.find('img').first();
    console.log(`  img src: ${img.attr('src')?.slice(0,70)}`);
  });
  // 別アプローチ: liまたはdiv[class]の全一覧
  console.log('\n  li/div構造:');
  $('li').slice(0,5).each((_,el) => {
    const t = $(el).text().trim().replace(/\s+/g,' ').slice(0,60);
    const imgs = $(el).find('img').length;
    if (imgs > 0 || /[ぁ-んァ-ヾ一-龯]/.test(t)) console.log(`    li [imgs=${imgs}]: ${t}`);
  });
}

// === VENIRE: 名前要素探索 ===
console.log('\n=== VENIRE /therapist/ 名前構造 ===');
{
  const { html } = await fetch2('https://venire-aroma.com/therapist/');
  const $ = cheerio.load(html);
  // itemImgの周辺でテキストを持つ要素
  $('.itemImg,.itemImgZoom').slice(0,3).each((_,el) => {
    const $el = $(el);
    const $parent = $el.parent();
    const $grandparent = $parent.parent();
    console.log(`  card: ${$grandparent.attr('class')?.slice(0,40)}`);
    console.log(`  card全テキスト: ${$grandparent.text().trim().replace(/\s+/g,' ').slice(0,80)}`);
    $grandparent.find('p,span,h3,h4').each((_,te) => {
      const t = $(te).text().trim();
      if (t && t.length < 30) console.log(`    text: [${t}]`);
    });
  });
  // spanやh系タグで日本語
  console.log('\n  span/h系 日本語テキスト:');
  $('span,h2,h3,h4').each((_,el) => {
    const t = $(el).text().trim();
    if (/^[ぁ-んァ-ヾ一-龯]{1,10}$/.test(t)) console.log(`  [${$(el).get(0).tagName}] ${t}`);
  });
}
