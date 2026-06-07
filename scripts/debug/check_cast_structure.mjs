/**
 * キャストページのHTML構造確認
 * パターン分類のために数サイトを調査
 */
import * as cheerio from 'cheerio';

const TARGETS = [
  { id: 'spa_dream', url: 'https://spa-dream.com/girl' },
  { id: 'rose', url: 'https://esthetic-rose.com/cast' },
  { id: 'suhada_chiba', url: 'https://suhadaspa.vsw.jp/chiba/therapist' },
  { id: 'kurenai', url: 'https://urawa-kurenai.com/staff' },
  { id: 'romeo', url: 'https://aromaspa-romeo.com/therapist' },
  { id: 'otona_teishajou', url: 'https://otei.ug11pm.com/cast' },
  { id: 'boku_esthe', url: 'https://boku-este.jp/cast' },
  { id: 'red_ribbon', url: 'https://redribbon-koshigaya.com/therapist' },
  { id: 'kawagoe_lamp', url: 'https://kawagoe.senju-lamp.com/cast' },
  { id: 'audition', url: 'https://tokorozawa-audition.com/therapist' },
];

async function check(id, url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 画像パターン分析
    const imgs = $('img').map((_, el) => $(el).attr('src') || '').get().filter(s => s && !s.includes('spacer') && !s.includes('blank')).slice(0, 3);
    const bgImgs = $('[style*="background-image"]').map((_, el) => {
      const s = $(el).attr('style') || '';
      return s.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1] || '';
    }).get().filter(Boolean).slice(0, 3);

    // alt属性で名前らしいものを探す
    const alts = $('img[alt]').map((_, el) => $(el).attr('alt')).get().filter(a => a && /[ぁ-んァ-ヾ一-龯]/.test(a) && a.length < 20).slice(0, 5);

    console.log(`\n【${id}】 ${url}`);
    console.log(`  imgs: ${imgs.join(' | ')}`);
    if (bgImgs.length) console.log(`  bg:   ${bgImgs.join(' | ')}`);
    console.log(`  alts: ${alts.join(' / ')}`);
  } catch(e) {
    console.log(`\n【${id}】 エラー: ${e.message}`);
  }
}

for (const t of TARGETS) {
  await check(t.id, t.url);
  await new Promise(r => setTimeout(r, 400));
}
