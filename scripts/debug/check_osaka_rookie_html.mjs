/**
 * 大阪 rookie_cms HTML構造調査
 * 実行: node scripts/debug/check_osaka_rookie_html.mjs
 */
import * as cheerio from 'cheerio';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

const SITES = [
  { name: '癒刻',          url: 'https://yukoku-esthe.com/cast/' },
  { name: 'SPA Mona',      url: 'https://menesthe-higashiosak-mona.com/cast/' },
  { name: '新感覚Mエステ', url: 'https://www.shinkankaku.com/cast/' },
  { name: "C'est la 美",   url: 'https://cestlavieosaka.com/cast/' },
];

for (const site of SITES) {
  console.log(`\n========== ${site.name} ==========`);
  try {
    const res = await fetch(site.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) { console.log('  fetch失敗'); continue; }
    const html = await res.text();
    const $ = cheerio.load(html);

    // 最初のcast要素を探してそのHTML構造を表示
    const firstCast = $('[data-p1*="upload/cast/thumb_"]').first();
    if (firstCast.length) {
      // 5階層上の親のHTMLを表示（最初のcastItemの構造確認）
      let $p = firstCast;
      for (let i = 0; i < 4; i++) $p = $p.parent();
      const html4 = $.html($p).replace(/\s+/g, ' ').slice(0, 800);
      console.log('  [HTMLサンプル]', html4);

      // alt属性確認
      $('[data-p1*="upload/cast/thumb_"]').slice(0, 5).each((_, el) => {
        const castId = $(el).attr('data-p1')?.match(/thumb_(\d+)/)?.[1];
        const alt = $(el).attr('alt') || '(なし)';
        // 周辺テキスト
        let $parent = $(el);
        for (let i = 0; i < 5; i++) {
          $parent = $parent.parent();
          const t = $parent.clone().children('img, script, style').remove().end().text().replace(/\s+/g, ' ').trim().slice(0, 100);
          if (t) { console.log(`  castId=${castId} alt="${alt}" text="${t}"`); break; }
        }
      });
    } else {
      console.log('  data-p1要素なし。img[src*="upload/cast/thumb_"]を確認:');
      $('img[src*="upload/cast/thumb_"]').slice(0, 3).each((_, el) => {
        const src = $(el).attr('src');
        const alt = $(el).attr('alt') || '(なし)';
        let $parent = $(el);
        for (let i = 0; i < 5; i++) {
          $parent = $parent.parent();
          const t = $parent.clone().children('img, script, style').remove().end().text().replace(/\s+/g, ' ').trim().slice(0, 100);
          if (t) { console.log(`  src="${src?.slice(-30)}" alt="${alt}" text="${t}"`); break; }
        }
      });
    }
  } catch(e) {
    console.log(`  エラー: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 800));
}
console.log('\n完了');
