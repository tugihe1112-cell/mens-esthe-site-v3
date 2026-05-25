/**
 * 川崎 詳細確認3 (アプローチ名前構造 / RERE GROUP 川崎ページ / Fromage)
 * 実行: node scripts/debug/debug_kawasaki_detail2.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function dump(label, url, fn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${label}】 ${url}`);
  try {
    const res = await fetch(url, { headers: ua });
    const $ = cheerio.load(await res.text());
    console.log(`  HTTP: ${res.status}`);
    fn($);
  } catch (e) { console.log(`  ❌ ${e.message}`); }
}

(async () => {

  // ① アプローチ川崎 - .list_photo 周辺の構造をHTML丸ごと確認
  await dump('アプローチ川崎 list_photo HTML', 'https://kawasakia.beautycloud.co.jp/therapist.html', ($) => {
    // list_photo の親要素を確認
    const first = $('.list_photo').first();
    const parent = first.parent();
    console.log('  .list_photo 親タグ:', parent[0]?.tagName, 'class:', parent.attr('class') || '');
    // 親のHTML（名前候補含む）
    console.log('  親HTML:', $.html(parent).slice(0, 400).replace(/\s+/g, ' '));

    // 全 .list_photo を持つ祖先の構造
    console.log('\n  --- li/div 構造 ---');
    $('ul.cast_list li, .therapist_wrap li, .cast_wrap, section.cast li').slice(0, 3).each((i, el) => {
      const html = $.html(el).slice(0, 300).replace(/\s+/g, ' ');
      console.log(`  [${i}] ${html}`);
    });

    // 個別セラピストページのIDリスト
    console.log('\n  --- 個別セラピストリンク ---');
    $('a[href*="/therapist/ID"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 40);
      const img = $(el).find('img').attr('src') || '';
      console.log(`  [${i}] href="${href}" text="${text}" img="${img.slice(0,50)}"`);
    });

    // list_nameクラスを探す
    $('[class*="list_name"], [class*="cast_name"], [class*="name"]').slice(0, 5).each((i, el) => {
      const cls = $(el).attr('class') || '';
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      console.log(`  name-el[${i}] cls="${cls}" "${text.slice(0, 50)}"`);
    });
  });

  // ② アプローチ川崎 - 個別セラピストページで名前と画像確認
  await dump('アプローチ川崎 個別 IDCGVOKT', 'https://kawasakia.beautycloud.co.jp/therapist/IDCGVOKT', ($) => {
    $('h1, h2, .name, [class*="name"], [class*="title"]').slice(0, 5).each((i, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text) console.log(`  [${i}] <${el.tagName} class="${$(el).attr('class')||''}"> "${text.slice(0,60)}"`);
    });
    $('img').slice(0, 4).each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      if (/logo|banner|btn|icon/i.test(src)) return;
      console.log(`  img[${i}]: "${src.slice(0,80)}" alt="${alt}"`);
    });
  });

  // ③ RERE GROUP - 川崎店ページ
  await dump('RERE GROUP /kawasaki/', 'https://www.rere-group.com/kawasaki/', ($) => {
    $('[class*="therapist"]').slice(0, 5).each((i, el) => {
      const cls = $(el).attr('class') || '';
      const tag = el.tagName;
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
      const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 60);
      console.log(`  <${tag} class="${cls.slice(0,40)}"> img="${img.slice(0,60)}" "${text}"`);
    });
    $('img').slice(0, 8).each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      if (!src || /logo|banner|btn|icon|menu|svg/i.test(src)) return;
      console.log(`  img: "${src.slice(0,80)}" alt="${alt.slice(0,20)}"`);
    });
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (/therapist|schedule/i.test(href))
        console.log(`  link: "${href}" [${$(el).text().trim().slice(0,20)}]`);
    });
  });

  // ④ RERE GROUP - セラピスト一覧ページ（川崎限定URL試す）
  await dump('RERE GROUP /therapist/?shop=kawasaki', 'https://www.rere-group.com/therapist/?shop=kawasaki', ($) => {
    $('[class*="therapist_img"]').slice(0, 5).each((i, el) => {
      const img = $(el).find('img').attr('src') || $(el).attr('src') || '';
      const parent = $(el).parent();
      const name = parent.find('[class*="name"], p, span').first().text().trim();
      console.log(`  [${i}] img="${img.slice(0,70)}" name="${name.slice(0,30)}"`);
    });
    $('img[src*="system.jpn.com"]').slice(0, 5).each((i, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      console.log(`  sys-img[${i}]: "${src.slice(0,80)}" alt="${alt}"`);
    });
  });

  // ⑤ Fromage - セラピスト一覧ページ詳細
  await dump('Fromage /therapist', 'http://fromage-kawasaki.com/therapist', ($) => {
    // S3 URL確認
    $('img[src*="amazonaws"]').slice(0, 5).each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      console.log(`  s3-img[${i}]: "${src.slice(0,100)}" alt="${alt}"`);
    });
    // lazy load
    $('img[data-src*="amazonaws"], img[data-lazy*="amazonaws"]').slice(0, 3).each((i, el) => {
      console.log(`  lazy: data-src="${$(el).attr('data-src')?.slice(0,80)||''}"`);
    });
    // セラピストリンク構造
    $('a[href*="/therapist/"]').slice(0, 5).each((i, el) => {
      const href = $(el).attr('href') || '';
      const img = $(el).find('img').attr('src') || '';
      const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,30);
      console.log(`  th-link: href="${href}" img="${img.slice(0,60)}" "${text}"`);
    });
    // staff要素
    $('[class*="staff"]').slice(0, 3).each((i, el) => {
      const cls = $(el).attr('class') || '';
      const html = $.html(el).slice(0, 300).replace(/\s+/g,' ');
      console.log(`  staff[${i}] cls="${cls.slice(0,30)}" html="${html}"`);
    });
  });

})();
