/**
 * 神奈川 詳細確認2 (アプローチ・RiRe・Guarigione・doigt・スケジュール)
 * 実行: node scripts/debug/debug_kanagawa_detail2.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

async function dump(label, url) {
  console.log(`\n${'='.repeat(55)}`);
  console.log(`【${label}】 ${url}`);
  try {
    const res = await fetch(url, { headers: ua });
    const $ = cheerio.load(await res.text());
    console.log(`  HTTP: ${res.status}`);

    // アプローチ: .list_name と隣接imgの関係
    if (url.includes('beautycloud')) {
      $('.therapist li, .therapist_block, .list_photo').slice(0, 4).each((i, el) => {
        const img = $(el).find('img').first().attr('src') || $(el).prev('img').attr('src') || '';
        const name = $(el).find('.list_name, .name').text().trim() || $(el).text().trim().slice(0,40);
        console.log(`  [${i}] img="${img.slice(0,60)}" name="${name.slice(0,40)}"`);
      });
      // リスト構造確認
      console.log('  ul/li 構造:');
      $('ul li').slice(0, 3).each((i, el) => {
        const html = $.html(el).slice(0, 200).replace(/\s+/g, ' ');
        console.log(`    [${i}] ${html}`);
      });
    }

    // RiRe: 名前・画像構造
    if (url.includes('rire')) {
      $('.cast_item, .therapist_item, .cast, article').slice(0, 3).each((i, el) => {
        const img = $(el).find('img').first().attr('src') || '';
        const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,60);
        console.log(`  [${i}] img="${img.slice(0,60)}" text="${text}"`);
      });
      // WordPress postタイプ
      $('article, .cast-item, [class*="cast"]').slice(0, 3).each((i, el) => {
        const cls = $(el).attr('class') || '';
        const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,50);
        console.log(`  el[${i}] class="${cls.slice(0,40)}" "${text}"`);
      });
    }

    // Guarigione: .girl 構造
    if (url.includes('spa-g')) {
      $('.girl').slice(0, 3).each((i, el) => {
        const imgs = $(el).find('img').map((j, img) => $(img).attr('src') || '').get();
        const name = $(el).find('.name').text().trim();
        console.log(`  girl[${i}] name="${name}" imgs=${JSON.stringify(imgs.map(s=>s.slice(0,50)))}`);
      });
    }

    // doigt de fee: 店舗ごとのフィルタ + 名前
    if (url.includes('exe-fee')) {
      $('.head__shoplist a, .shop_select, [class*="shop"]').slice(0, 5).each((i, el) => {
        console.log(`  shop[${i}]: "${$(el).text().trim().slice(0,40)}" href="${$(el).attr('href')||''}"`);
      });
      // セラピスト一覧の構造
      $('[class*="lady"], [class*="therapist"], [class*="cast"]').slice(0, 3).each((i, el) => {
        const img = $(el).find('img').first().attr('src') || '';
        const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,60);
        console.log(`  lady[${i}] img="${img.slice(0,60)}" text="${text}"`);
      });
    }

    // スケジュールURL確認
    if (url.includes('schedule') || url.includes('rere-group') || url.includes('yuru-spa')) {
      const ogImg = $('meta[property="og:image"]').attr('content') || '';
      const title = $('title').text().trim();
      console.log(`  title="${title.slice(0,50)}" ogImg="${ogImg.slice(0,60)}"`);
      // スケジュールっぽいリンク
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href') || '';
        if (/schedule|出勤|スケジュール/i.test(href + $(el).text()))
          console.log(`  sched: "${href}" "${$(el).text().trim().slice(0,30)}"`);
      });
    }

  } catch (e) { console.log(`  ❌ ${e.message}`); }
}

(async () => {
  await dump('アプローチ /therapist.html', 'https://kawasakia.beautycloud.co.jp/therapist.html');
  await dump('RiRe /therapist/', 'https://rire-kawasaki.com/therapist/');
  await dump('Guarigione /therapist.html', 'https://www.spa-g.net/therapist.html');
  await dump('doigt de fee 川崎 /lady/', 'https://exe-fee.com/lady/?shop=kawasaki');
  await dump('doigt de fee /lady/ (all)', 'https://exe-fee.com/lady/');
  await dump('RERE GROUP schedule?', 'https://www.rere-group.com/');
  await dump('ゆるスパ横浜 schedule?', 'https://yuru-spa.com/yokohama/');
})();
