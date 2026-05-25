/**
 * JS動的CMSグループ 詳細調査
 * ダーリンプレミアム / Queen Spumante / ビューティーアンドビースト / ベルマドンナ
 * 実行: node scripts/debug/debug_js_cms_group.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const SHOPS = [
  { id: 'osaka_umeda_darlin_premium',             name: 'ダーリンプレミアム',        url: 'https://darlin-premium.com/',        castPath: '/gals/' },
  { id: 'osaka_sakaisujihonmachi_queen_spumante', name: 'Queen Spumante',           url: 'https://queenspumante.com/',         castPath: '/gals/' },
  { id: 'osaka_umeda_beauty_and_beast',           name: 'ビューティーアンドビースト', url: 'https://beauty-and-beast.net/',      castPath: '/gals/' },
  { id: 'osaka_umeda_bellmadonna',                name: 'ベルマドンナ',               url: 'https://bellmadonna.com/',           castPath: '/gals/' },
];

for (const shop of SHOPS) {
  console.log('\n' + '='.repeat(60));
  console.log(`[${shop.id}] ${shop.name}`);

  for (const path of [shop.castPath, '/cast/', '/staff/', '/therapist/', '/girl/', '/']) {
    const tryUrl = shop.url.replace(/\/$/, '') + path;
    try {
      const res = await fetch(tryUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
      if (!res.ok) { console.log(`  ${path} → ${res.status}`); continue; }

      const html = await res.text();
      const $ = cheerio.load(html);

      // CMS判定
      const cms = html.includes('caskan') ? 'caskan'
        : html.includes('3days') ? '3days'
        : html.includes('men-es.jp') ? 'men-es'
        : html.includes('wp-content') ? 'wordpress'
        : html.includes('wcms') ? 'wcms'
        : '独自';

      // 画像数
      const allImgs = $('img');
      const dataImgs = $('img[data-src], img[data-lazy], img[data-lazy-src], img[data-original]');
      const wcmsImgs = $('img[src*="wcms"]');
      const castImgs = $('img[src*="cast"], img[src*="gals"], img[src*="girl"], img[src*="upload"]');

      console.log(`  ${path} → ${res.status} | CMS:${cms}`);
      console.log(`    全img: ${allImgs.length}, lazy: ${dataImgs.length}, wcms: ${wcmsImgs.length}, cast: ${castImgs.length}`);

      // wcms/gals 画像詳細
      if (wcmsImgs.length > 0) {
        wcmsImgs.slice(0, 3).each((i, el) => {
          const $img = $(el);
          const src = $img.attr('src') || '';
          const alt = $img.attr('alt') || '';
          const parent = $img.closest('li, div, article').first();
          const text = parent.text().replace(/\s+/g, ' ').trim().slice(0, 100);
          console.log(`    wcms[${i}]: src=${src.slice(0, 70)}`);
          console.log(`           alt="${alt}" parent="${text.slice(0, 70)}"`);
        });
      }

      // cast/upload 画像詳細
      if (castImgs.length > 0) {
        castImgs.slice(0, 3).each((i, el) => {
          const $img = $(el);
          const src = $img.attr('src') || '';
          const alt = $img.attr('alt') || '';
          const parent = $img.closest('li, div, article').first();
          const text = parent.text().replace(/\s+/g, ' ').trim().slice(0, 100);
          console.log(`    cast[${i}]: src=${src.slice(0, 70)}`);
          console.log(`           alt="${alt}" parent="${text.slice(0, 70)}"`);
        });
      }

      // lazy load 画像詳細
      if (dataImgs.length > 0) {
        dataImgs.slice(0, 3).each((i, el) => {
          const $img = $(el);
          const lazySrc = $img.attr('data-src') || $img.attr('data-lazy') || $img.attr('data-lazy-src') || $img.attr('data-original') || '';
          const alt = $img.attr('alt') || '';
          const parent = $img.closest('li, div, article').first();
          const text = parent.text().replace(/\s+/g, ' ').trim().slice(0, 100);
          console.log(`    lazy[${i}]: data-src=${lazySrc.slice(0, 70)}`);
          console.log(`           alt="${alt}" parent="${text.slice(0, 70)}"`);
        });
      }

      // 名前テキスト探索
      const nameMatches = [...html.matchAll(/([ぁ-んァ-ヾ一-龯]{2,8}(?:[\s　][ぁ-んァ-ヾ一-龯]{1,6})?)\s*[（(](\d{2,3})[)）]/g)];
      if (nameMatches.length > 0) {
        console.log(`    名前候補 ${nameMatches.length}件: ${nameMatches.slice(0, 5).map(m => `${m[1]}(${m[2]})`).join(', ')}`);
      }

      // script タグ内のデータ
      let foundScriptData = false;
      $('script').each((_, el) => {
        const content = $(el).html() || '';
        if ((content.includes('name') || content.includes('photo')) && content.includes('gal') && content.length < 100000) {
          if (/[ぁ-んァ-ヾ一-龯]/.test(content)) {
            console.log(`    script内日本語データ: ${content.slice(0, 300).replace(/\s+/g, ' ')}`);
            foundScriptData = true;
          }
        }
      });

      // API/JSON エンドポイント候補
      const apiMatches = html.match(/(?:fetch|ajax|xhr|api|json)\s*\(['"](\/[^'"]{3,80})['"]/gi) || [];
      if (apiMatches.length > 0) {
        console.log(`    API候補: ${apiMatches.slice(0, 3).map(m => m.slice(0, 80)).join(' | ')}`);
      }

      // wcms/gals/xxx.json のようなデータファイル
      const dataFileMatches = html.match(/["'](\/[^"']*(?:gals|cast|girl)[^"']*\.(?:json|js))["']/gi) || [];
      if (dataFileMatches.length > 0) {
        console.log(`    データファイル候補: ${dataFileMatches.slice(0, 5).join(', ')}`);
      }

      // 名前クラスの要素
      $('[class*="name"], [class*="cast_name"], [class*="gal_name"], [class*="therapist"]').slice(0, 5).each((i, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (/[ぁ-んァ-ヾ一-龯]/.test(text)) {
          console.log(`    name-class[${i}]: "${text.slice(0, 80)}"`);
        }
      });

      break; // 最初に成功したパスで終了
    } catch (e) {
      console.log(`  ${path} → エラー: ${e.message}`);
    }
  }
}
