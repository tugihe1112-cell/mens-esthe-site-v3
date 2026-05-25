/**
 * 小悪魔スパトウキョウ・こころのゆりかご・Bed of Roses の詳細確認
 * 同一の4名（橋本るい・小鳥遊ゆり・葉月あや・双葉ゆりな）が複数店舗に登録
 * 実行: node scripts/debug/check_koakuma_detail.mjs
 */
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 全角スペースあり・なし両パターンを試す
const TARGET_NAMES_VARIANTS = [
  ['橋本　るい', '橋本 るい', '橋本るい'],
  ['小鳥遊　ゆり', '小鳥遊 ゆり', '小鳥遊ゆり', 'たかなし　ゆり', 'たかなしゆり'],
  ['葉月　あや', '葉月 あや', '葉月あや'],
  ['双葉　ゆりな', '双葉 ゆりな', '双葉ゆりな'],
];

async function fetchHtml(url, referer) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: referer || url },
      signal: AbortSignal.timeout(12000),
    });
    return { ok: res.ok, status: res.status, text: res.ok ? await res.text() : '' };
  } catch (e) {
    return { ok: false, status: 0, text: '' };
  }
}

const SITES = [
  { name: '小悪魔スパトウキョウ', url: 'https://mens-esthe-aroma.site' },
  { name: 'こころのゆりかご 大阪', url: 'https://kokoronoyurikago-osaka.site' },
  { name: 'Bed of Roses', url: 'https://bed-of-roses.site' },
];

for (const site of SITES) {
  console.log('\n' + '='.repeat(60));
  console.log(`【${site.name}】 ${site.url}`);
  console.log('='.repeat(60));

  const tryPaths = ['/', '/index.html', '/cast/', '/therapist/', '/staff/', '/girls/'];

  for (const path of tryPaths) {
    const r = await fetchHtml(site.url + path, site.url + '/');
    if (!r.ok) { process.stdout.write(`${path}:${r.status} `); continue; }

    const $ = cheerio.load(r.text);

    // 全画像のalt・src一覧（最初の3つ）
    const allImgs = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || '';
      const alt = ($(el).attr('alt') || '').trim();
      if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('btn')) {
        allImgs.push({ alt, src: src.slice(-70) });
      }
    });

    // background-image
    const bgImgs = [];
    $('[style*="background"]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const m = style.match(/url\(['"]?([^'")\s]+\.(?:jpg|jpeg|png|webp))['"]?\)/i);
      if (m && !m[1].includes('logo')) {
        const text = $(el).text().trim().slice(0, 20);
        bgImgs.push({ text, url: m[1].slice(-60) });
      }
    });

    // 対象名前の検索（全角スペース・半角スペース・なしの全バリエーション）
    const hits = [];
    for (const variants of TARGET_NAMES_VARIANTS) {
      for (const v of variants) {
        if (r.text.includes(v)) {
          const idx = r.text.indexOf(v);
          const ctx = r.text.slice(Math.max(0, idx - 100), idx + v.length + 200).replace(/\n/g, ' ');
          hits.push({ variant: v, ctx: ctx.slice(0, 250) });
          break;
        }
      }
    }

    if (allImgs.length > 0 || hits.length > 0) {
      console.log(`\n✅ ${path} (${r.text.length}byte)`);
      console.log(`  img:${allImgs.length}件 bg:${bgImgs.length}件 nameHits:${hits.length}件`);

      if (allImgs.length <= 20) {
        allImgs.forEach(i => console.log(`  img: alt="${i.alt}" src="...${i.src}"`));
      }
      bgImgs.slice(0, 5).forEach(b => console.log(`  bg: "${b.text}" → ...${b.url}`));
      hits.forEach(h => console.log(`  ✅ "${h.variant}": ${h.ctx}`));
    }
    await sleep(300);
  }
}

console.log('\n完了');
