/**
 * 千葉・埼玉 新規登録店舗のキャストページ確認
 * 各店舗の /cast/ /therapist/ /staff/ 等を試してアクセス可能か確認
 */
import * as cheerio from 'cheerio';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const SHOPS = [
  // 千葉
  { id: 'chiba_chiba_spa_dream', url: 'https://spa-dream.com/' },
  { id: 'chiba_chiba_madame_relax', url: 'https://www.madame-relax.com/chiba/' },
  { id: 'chiba_chiba_body_spa', url: 'https://www.bodyspa2008.com/chiba' },
  { id: 'chiba_chiba_suhada_spa', url: 'https://suhadaspa.vsw.jp/chiba/' },
  // 松戸
  { id: 'chiba_matsudo_rose', url: 'https://esthetic-rose.com/' },
  { id: 'chiba_matsudo_aroma_mrs', url: 'https://aromamrs.com/' },
  { id: 'chiba_matsudo_himitsu_no_tobira', url: 'https://matsudo-mensesthe.com/' },
  { id: 'chiba_matsudo_paradise_spa', url: 'https://paradise-spa.info/' },
  { id: 'chiba_matsudo_lovers', url: 'https://lovers-matsudo.com/' },
  // 柏
  { id: 'chiba_kashiwa_suhada_spa', url: 'https://suhadaspa.vsw.jp/kashiwa/' },
  { id: 'chiba_kashiwa_m_labo_spa', url: 'https://mlabospa.vsw.jp/kashiwa/' },
  { id: 'chiba_kashiwa_bijo_spa', url: 'https://bijo-spa.com/' },
  { id: 'chiba_kashiwa_eden_spa', url: 'https://eden-spa.net/' },
  // 大宮
  { id: 'saitama_omiya_mrs_eternity', url: 'https://salon-eternity.com/' },
  { id: 'saitama_omiya_ace', url: 'https://omiya-mens-este.net/' },
  { id: 'saitama_omiya_aroma_castle', url: 'https://aroma-castle.jp/' },
  // 浦和
  { id: 'saitama_urawa_mitsu_no_yasuragi', url: 'http://www.mitsu-no-yasuragi.com/' },
  { id: 'saitama_urawa_kurenai', url: 'https://urawa-kurenai.com/' },
  { id: 'saitama_urawa_aroma_chiaful', url: 'https://aroma-chiaful.com/' },
  { id: 'saitama_urawa_romeo', url: 'https://aromaspa-romeo.com/' },
  { id: 'saitama_urawa_pink_lady', url: 'https://pink-lady.men-es.jp/' },
  // 川口・蕨
  { id: 'saitama_warabi_otona_no_teishajou', url: 'https://otei.ug11pm.com/' },
  { id: 'saitama_warabi_magokoro_spa', url: 'https://magokoro-spa.com/' },
  { id: 'saitama_kawaguchi_pattaya_resort', url: 'https://www.pattaya-resort.jp/' },
  { id: 'saitama_warabi_sukitto_spa', url: 'https://sukitto-spa.com/' },
  // 越谷・春日部
  { id: 'saitama_koshigaya_aroma_liberty', url: 'https://aromaliberty.com/' },
  { id: 'saitama_koshigaya_boku_no_esthe', url: 'https://boku-este.jp/' },
  { id: 'saitama_koshigaya_laugh_tale', url: 'https://www.laugh-tale.net/' },
  { id: 'saitama_koshigaya_red_ribbon', url: 'https://redribbon-koshigaya.com/' },
  { id: 'saitama_kasukabe_kyoko_no_shimai', url: 'https://kyoko-no-shimai.com/' },
  // 川越
  { id: 'saitama_kawagoe_nature', url: 'https://www.nature-esthetic.com/' },
  { id: 'saitama_kawagoe_otona_neverland', url: 'https://otona-neverland.net/' },
  { id: 'saitama_kawagoe_king', url: 'https://www.kawagoe2024king.com/' },
  { id: 'saitama_kawagoe_re_fle_spa', url: 'https://www.re-fre-spa.com/' },
  { id: 'saitama_kawagoe_lamp', url: 'https://kawagoe.senju-lamp.com/' },
  { id: 'saitama_kawagoe_anela_spa', url: 'https://anela-spa.com/' },
  // 所沢
  { id: 'saitama_tokorozawa_miyako', url: 'https://miyakospa.com/' },
  { id: 'saitama_tokorozawa_pause_grande', url: 'https://www.tokorozawa-pause.net/' },
  { id: 'saitama_tokorozawa_audition', url: 'https://tokorozawa-audition.com/' },
  { id: 'saitama_tokorozawa_bariano', url: 'https://es-balian-tokorozawa.com/' },
  { id: 'saitama_tokorozawa_third_place', url: 'https://tokorozawa.salon-thirdplace.com/' },
  { id: 'saitama_tokorozawa_lamp', url: 'https://tokorozawa.senju-lamp.com/' },
];

const CAST_PATHS = ['cast', 'therapist', 'staff', 'girl', 'lady', 'member', 'cast.html', 'therapist.html', 'staff.html'];

async function checkCastPage(baseUrl) {
  const base = baseUrl.replace(/\/$/, '');
  for (const path of CAST_PATHS) {
    try {
      const url = `${base}/${path}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);
        // セラピスト画像の数を概算
        const imgs = $('img').length;
        if (imgs > 3) return { url, imgs };
      }
    } catch {}
  }
  // トップページからcastリンクを探す
  try {
    const res = await fetch(baseUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const castLink = $('a[href]').filter((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text();
        return /cast|therapist|staff|セラピスト|キャスト|在籍/i.test(href + text);
      }).first().attr('href');
      if (castLink) {
        const fullUrl = castLink.startsWith('http') ? castLink : `${baseUrl.replace(/\/$/, '')}/${castLink.replace(/^\//, '')}`;
        return { url: fullUrl, via: 'topLink' };
      }
    }
  } catch {}
  return null;
}

async function main() {
  console.log('キャストページ確認中...\n');
  const found = [], notFound = [];

  for (const shop of SHOPS) {
    process.stdout.write(`  ${shop.id.split('_').slice(-2).join('_')} ... `);
    const result = await checkCastPage(shop.url);
    await sleep(400);
    if (result) {
      console.log(`✅ ${result.url}${result.imgs ? ` (img:${result.imgs})` : ''}`);
      found.push({ ...shop, castUrl: result.url });
    } else {
      console.log('❌ キャストページなし/不明');
      notFound.push(shop);
    }
  }

  console.log(`\n\n=== キャストページあり: ${found.length}件 ===`);
  found.forEach(s => console.log(`  ${s.id}: ${s.castUrl}`));
  console.log(`\n=== 要Chrome or スキップ: ${notFound.length}件 ===`);
  notFound.forEach(s => console.log(`  ${s.id}: ${s.url}`));
}

main();
