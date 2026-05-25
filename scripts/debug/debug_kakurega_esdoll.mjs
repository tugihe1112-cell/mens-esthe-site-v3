/**
 * 隠れ家・イーエスドール 詳細構造調査
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

// ============================================================
// 隠れ家 - /pic/girl/ 画像の周辺構造を調査
// ============================================================
console.log('=== 隠れ家 kakurega-iyashi.com/girllist ===');
{
  const res = await fetch('https://kakurega-iyashi.com/girllist', { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  // /pic/girl/ を含む画像の親構造を丁寧に調査
  const picImgs = $('img[src*="/pic/girl/"]');
  console.log(`/pic/girl/ 画像数: ${picImgs.length}`);

  picImgs.slice(0, 3).each((i, el) => {
    const $img = $(el);
    const src = $img.attr('src');
    // 祖先を順に探索
    let $cur = $img;
    for (let depth = 0; depth < 6; depth++) {
      $cur = $cur.parent();
      const tag = $cur[0]?.name || '?';
      const cls = $cur.attr('class') || '';
      const id = $cur.attr('id') || '';
      const text = $cur.text().replace(/\s+/g, ' ').trim().slice(0, 100);
      console.log(`  [img${i}] depth${depth}: <${tag} class="${cls}" id="${id}"> → "${text}"`);
      if (tag === 'body' || tag === 'html') break;
    }
    console.log(`  img src: ${src}`);
    console.log('');
  });

  // p.therapist_img の構造も確認
  console.log('\np.therapist_img の構造:');
  $('p.therapist_img').slice(0, 3).each((i, el) => {
    const $el = $(el);
    const imgSrc = $el.find('img').attr('src') || '';
    const text = $el.text().trim();
    const parent = $el.parent();
    const parentText = parent.text().replace(/\s+/g, ' ').trim().slice(0, 150);
    const parentTag = parent[0]?.name;
    const parentCls = parent.attr('class') || '';
    console.log(`  [${i}] img: ${imgSrc}`);
    console.log(`       text: "${text}"`);
    console.log(`       parent<${parentTag} class="${parentCls}">: "${parentText}"`);
    // 兄弟要素を確認
    parent.children().each((j, sib) => {
      const $sib = $(sib);
      const sibText = $sib.text().replace(/\s+/g, ' ').trim().slice(0, 80);
      const sibTag = sib.name;
      const sibCls = $sib.attr('class') || '';
      if (sibText) console.log(`       sibling[${j}]: <${sibTag} class="${sibCls}"> "${sibText}"`);
    });
    console.log('');
  });
}

// ============================================================
// イーエスドール - images_staff のみで正しく取得
// ============================================================
console.log('\n=== イーエスドール e-s-doll.com/staff.php ===');
{
  const res = await fetch('https://e-s-doll.com/staff.php', { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  // images_staff のみ
  const staffImgs = $('img[src*="images_staff"]');
  console.log(`images_staff 画像数: ${staffImgs.length}`);

  staffImgs.slice(0, 5).each((i, el) => {
    const $img = $(el);
    const src = $img.attr('src');
    const alt = $img.attr('alt') || '';
    const parent = $img.closest('li, div, tr, article').first();
    const parentText = parent.text().replace(/\s+/g, ' ').trim().slice(0, 150);
    const parentTag = parent[0]?.name;
    const parentCls = parent.attr('class') || '';
    console.log(`  [${i}] alt="${alt}" src=${src?.slice(0, 60)}`);
    console.log(`       parent<${parentTag} class="${parentCls}">: "${parentText.slice(0, 100)}"`);
  });
}
