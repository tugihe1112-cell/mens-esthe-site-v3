import * as cheerio from 'cheerio';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TARGETS = [
  { id: 'madame_relax', url: 'https://www.madame-relax.com/chiba/detail.cgi?status=7' },
  { id: 'aroma_mrs', url: 'https://aromamrs.com/staff.php' },
  { id: 'himitsu_tobira', url: 'https://matsudo-mensesthe.com/cast' },
  { id: 'paradise_spa', url: 'https://paradise-spa.info/staff.php' },
  { id: 'lovers', url: 'https://lovers-matsudo.com/staff' },
  { id: 'suhada_kashiwa', url: 'https://suhadaspa.vsw.jp/kashiwa/therapist' },
  { id: 'm_labo_spa', url: 'https://mlabospa.vsw.jp/kashiwa/therapist' },
  { id: 'bijo_spa', url: 'https://bijo-spa.com/member' },
  { id: 'eden_spa', url: 'https://eden-spa.net/girl' },
  { id: 'mrs_eternity', url: 'https://salon-eternity.com/cast' },
  { id: 'omiya_ace', url: 'https://omiya-mens-este.net/cast' },
  { id: 'mitsu_yasuragi', url: 'http://www.mitsu-no-yasuragi.com/staff' },
  { id: 'aroma_chiaful', url: 'https://aroma-chiaful.com/cast' },
  { id: 'pink_lady', url: 'https://pink-lady.men-es.jp/staff.html' },
  { id: 'magokoro', url: 'https://magokoro-spa.com/staff.html' },
  { id: 'sukitto', url: 'https://sukitto-spa.com/therapist.php' },
  { id: 'aroma_liberty', url: 'https://aromaliberty.com/therapist.php' },
  { id: 'laugh_tale', url: 'https://www.laugh-tale.net/staff' },
  { id: 'kawagoe_nature', url: 'https://www.nature-esthetic.com/therapist' },
  { id: 'otona_neverland', url: 'https://otona-neverland.net/cast' },
  { id: 'kawagoe_king', url: 'https://www.kawagoe2024king.com/staff' },
  { id: 're_fle_spa', url: 'https://www.re-fre-spa.com/therapist' },
  { id: 'miyako', url: 'https://miyakospa.com/itemList.html' },
  { id: 'pause_grande', url: 'https://www.tokorozawa-pause.net/staff' },
  { id: 'bariano', url: 'https://es-balian-tokorozawa.com/therapist' },
  { id: 'third_place', url: 'https://tokorozawa.salon-thirdplace.com/therapist' },
  { id: 'tokorozawa_lamp', url: 'https://tokorozawa.senju-lamp.com/cast' },
];

async function check(id, url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
    const html = await res.text();
    const $ = cheerio.load(html);
    const imgs = $('img').map((_, el) => $(el).attr('src') || $(el).attr('data-src') || '').get()
      .filter(s => s && !s.includes('spacer') && !s.startsWith('data:') && !s.includes('logo') && !s.includes('banner')).slice(0, 2);
    const bgImgs = $('[style*="background-image"]').map((_, el) => {
      return ($(el).attr('style') || '').match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1] || '';
    }).get().filter(Boolean).slice(0, 2);
    const alts = $('img[alt]').map((_, el) => $(el).attr('alt')).get()
      .filter(a => a && /[ぁ-んァ-ヾ一-龯]/.test(a) && a.length < 15).slice(0, 4);
    const pattern = imgs[0]?.includes('caskan') ? 'caskan'
      : imgs[0]?.includes('re-db') ? 're-db'
      : imgs[0]?.includes('wp-content') ? 'WordPress'
      : imgs[0]?.includes('/photos/') ? 'LEON-SPA'
      : imgs[0]?.includes('images_staff') ? 'images_staff'
      : imgs[0]?.includes('optImg') ? 'Mirajour'
      : bgImgs.length ? `bg-image(${bgImgs[0]?.split('/').pop()})`
      : imgs[0] ? `other(${imgs[0]?.split('/').slice(-2).join('/')})` : '?';
    console.log(`${id}: [${pattern}] alts=${alts.join('/')}`);
    if (bgImgs.length) console.log(`  → bg: ${bgImgs[0]}`);
  } catch(e) {
    console.log(`${id}: ERROR ${e.message.substring(0,50)}`);
  }
}

for (const t of TARGETS) {
  await check(t.id, t.url);
  await sleep(400);
}
