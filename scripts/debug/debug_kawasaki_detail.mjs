/**
 * 川崎 詳細構造確認2
 * 実行: node scripts/debug/debug_kawasaki_detail.mjs
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

  // ① アプローチ川崎 - beautycloud CMS セラピスト一覧構造
  await dump('アプローチ川崎 /therapist.html', 'https://kawasakia.beautycloud.co.jp/therapist.html', ($) => {
    // li要素の構造
    $('ul li').slice(0, 4).each((i, el) => {
      const img = $(el).find('img').attr('src') || '';
      const name = $(el).find('.list_name, .name, p').text().replace(/\s+/g,' ').trim().slice(0,40);
      const href = $(el).find('a').attr('href') || '';
      console.log(`  li[${i}]: href="${href}" img="${img.slice(0,60)}" name="${name}"`);
    });
    // .list_photo か .therapist_item
    $('[class*="list_photo"], [class*="cast_item"], [class*="therapist_item"]').slice(0,3).each((i, el) => {
      const cls = $(el).attr('class') || '';
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
      const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,50);
      console.log(`  item[${i}] class="${cls.slice(0,30)}" img="${img.slice(0,60)}" "${text}"`);
    });
    console.log('  全img数:', $('img').length);
    $('img').slice(1, 8).each((i, el) => {
      const src = $(el).attr('src') || '';
      console.log(`    img: ${src.slice(0,80)}`);
    });
  });

  // ② Ho・O・Zu・Ki・SPA /therapist.php
  await dump('Ho・O・Zu・Ki /therapist.php', 'https://hoozuki-spa.net/therapist.php', ($) => {
    $('[class*="cast"], [class*="therapist"], [class*="girl"], [class*="staff"]').slice(0,3).each((i, el) => {
      const cls = $(el).attr('class') || '';
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
      const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,60);
      console.log(`  [${i}] cls="${cls.slice(0,30)}" img="${img.slice(0,70)}" "${text}"`);
    });
    $('img').slice(0,6).each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      if (/icon|logo|banner|btn/i.test(src)) return;
      console.log(`  img: "${src.slice(0,80)}" alt="${alt}"`);
    });
  });

  // ③ RERE GROUP /therapist/
  await dump('RERE GROUP /therapist/', 'https://www.rere-group.com/therapist/', ($) => {
    $('[class*="cast"], [class*="therapist"], [class*="girl"], article').slice(0,4).each((i, el) => {
      const cls = $(el).attr('class') || '';
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
      const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,60);
      console.log(`  [${i}] cls="${cls.slice(0,30)}" img="${img.slice(0,60)}" "${text}"`);
    });
    $('img').slice(0,6).each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      if (!src || /icon|logo|banner|btn/i.test(src)) return;
      console.log(`  img: "${src.slice(0,80)}" alt="${alt.slice(0,20)}"`);
    });
    // 店舗フィルタ
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/shop|store|店舗|kawasaki|川崎|戸塚/i.test(href + text))
        console.log(`  shoplink: "${href}" [${text.slice(0,30)}]`);
    });
  });

  // ④ RiRe川崎 - cast構造詳細
  await dump('RiRe川崎 /therapist/', 'https://rire-kawasaki.com/therapist/', ($) => {
    $('[class*="cast"]').slice(0,5).each((i, el) => {
      const cls = $(el).attr('class') || '';
      const tag = el.tagName;
      const img = $(el).find('img').attr('src') || '';
      const href = $(el).find('a').attr('href') || $(el).closest('a').attr('href') || $(el).attr('href') || '';
      const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,50);
      console.log(`  <${tag} class="${cls.slice(0,40)}"> img="${img.slice(0,60)}" href="${href}" "${text}"`);
    });
    // 個別castのimg確認
    $('a[href*="casts"]').slice(0,4).each((i, el) => {
      const href = $(el).attr('href') || '';
      const img = $(el).find('img').attr('src') || '';
      const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,30);
      console.log(`  cast-a[${i}]: href="${href}" img="${img.slice(0,70)}" "${text}"`);
    });
  });

  // ⑤ LIVSPA - caskan CMS cast構造詳細
  await dump('LIVSPA /therapist', 'https://livspa.net/therapist', ($) => {
    // caskan: .cast_list内の個別castブロック
    $('[class*="cast"]').slice(0,5).each((i, el) => {
      const cls = $(el).attr('class') || '';
      const tag = el.tagName;
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
      const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,60);
      console.log(`  <${tag} class="${cls.slice(0,40)}"> img="${img.slice(0,70)}" "${text}"`);
    });
    // alt=名前のimg
    $('img[alt]').slice(0,6).each((i, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      if (!alt || /logo|banner/i.test(alt)) return;
      console.log(`  img alt="${alt}" src="${src.slice(0,70)}"`);
    });
  });

  // ⑥ doigt de fee - 店舗別フィルタ確認
  await dump('doigt de fee /lady/?shop=kawasaki', 'https://exe-fee.com/lady/?shop=kawasaki', ($) => {
    console.log('  img数:', $('img').length);
    $('img').slice(0,5).each((i, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      console.log(`  img[${i}]: "${src.slice(0,70)}" alt="${alt.slice(0,30)}"`);
    });
    $('select, [class*="shop"], [class*="filter"]').slice(0,3).each((i, el) => {
      console.log(`  filter[${i}]: ${$.html(el).slice(0,200).replace(/\s+/g,' ')}`);
    });
  });

  // ⑦ Fromage - 個別セラピストページ確認
  await dump('Fromage /therapist/117', 'http://fromage-kawasaki.com/therapist/117', ($) => {
    const img = $('img[src*="therapist"], img[src*="cast"], img[src*="photo"]').first().attr('src') || '';
    console.log(`  img: "${img.slice(0,80)}"`);
    // 名前/年齢
    $('[class*="name"], [class*="age"], h1, h2').slice(0,5).each((i, el) => {
      const text = $(el).text().replace(/\s+/g,' ').trim();
      if (text) console.log(`  text[${i}]: "${text.slice(0,60)}"`);
    });
    // 全img
    $('img').slice(0,5).each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      console.log(`  img[${i}]: "${src.slice(0,80)}"`);
    });
  });

})();
