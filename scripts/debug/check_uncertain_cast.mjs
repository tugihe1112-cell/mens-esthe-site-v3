import * as cheerio from 'cheerio';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TARGETS = [
  { id: 'aroma_mrs', url: 'https://aromamrs.com/staff.php' },
  { id: 'paradise_spa', url: 'https://paradise-spa.info/staff.php' },
  { id: 'lovers', url: 'https://lovers-matsudo.com/staff' },
  { id: 'bijo_spa', url: 'https://bijo-spa.com/member' },
  { id: 'magokoro', url: 'https://magokoro-spa.com/staff.html' },
  { id: 'sukitto', url: 'https://sukitto-spa.com/therapist.php' },
  { id: 'aroma_liberty', url: 'https://aromaliberty.com/therapist.php' },
  { id: 'kawagoe_king', url: 'https://www.kawagoe2024king.com/staff' },
  { id: 'otona_neverland', url: 'https://otona-neverland.net/cast' },
  { id: 'boku_esthe', url: 'https://boku-este.jp/cast' },
  { id: 'bariano', url: 'https://es-balian-tokorozawa.com/therapist' },
  // re-db sites - checking text elements near images
  { id: 'otona_teishajou', url: 'https://otei.ug11pm.com/cast' },
  { id: 'kawagoe_lamp', url: 'https://kawagoe.senju-lamp.com/cast' },
  { id: 'tokorozawa_lamp', url: 'https://tokorozawa.senju-lamp.com/cast' },
];

async function check(id, url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 全imgのsrc + alt (最初の10件)
    const imgs = $('img').map((_, el) => ({
      src: ($(el).attr('src') || $(el).attr('data-src') || '').substring(0, 80),
      alt: ($(el).attr('alt') || '').substring(0, 20)
    })).get().filter(i => i.src && !i.src.startsWith('data:')).slice(0, 8);

    // 背景画像
    const bgs = $('[style*="background"]').map((_, el) => {
      const m = ($(el).attr('style') || '').match(/url\(['"]?([^'")\s]+)/);
      return m ? m[1].substring(0, 80) : '';
    }).get().filter(Boolean).slice(0, 4);

    // 日本語テキストのある要素
    const jpTexts = $('p, span, h3, h4, div.name, .cast-name, .staff-name, .therapist-name, .name').map((_, el) => {
      const t = $(el).text().trim();
      return /^[ぁ-んァ-ヾ一-龯]{1,10}$/.test(t) ? t : '';
    }).get().filter(Boolean).slice(0, 8);

    console.log(`\n【${id}】`);
    imgs.forEach(i => console.log(`  img: ${i.src} | alt="${i.alt}"`));
    if (bgs.length) console.log(`  bg: ${bgs.join(' | ')}`);
    if (jpTexts.length) console.log(`  names: ${jpTexts.join(' / ')}`);
  } catch(e) {
    console.log(`\n【${id}】 ERROR: ${e.message.substring(0, 60)}`);
  }
}

for (const t of TARGETS) {
  await check(t.id, t.url);
  await sleep(500);
}
