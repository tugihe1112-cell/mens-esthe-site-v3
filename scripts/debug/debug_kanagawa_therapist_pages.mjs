/**
 * 神奈川 残り店舗 セラピストページ構造確認
 * 実行: node scripts/debug/debug_kanagawa_therapist_pages.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

async function inspect(name, url) {
  console.log(`\n${'='.repeat(55)}`);
  console.log(`【${name}】 ${url}`);
  try {
    const res = await fetch(url, { headers: ua });
    const html = await res.text();
    const $ = cheerio.load(html);
    console.log(`  HTTP: ${res.status}`);

    // img上位10枚（icon/logo/nav除く）
    let count = 0;
    $('img').each((i, el) => {
      if (count >= 5) return;
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy') || '';
      const alt = $(el).attr('alt') || '';
      const cls = $(el).attr('class') || '';
      if (/icon|logo|nav|btn|arrow|banner|common|header_img/i.test(src + cls)) return;
      if (!src || src.endsWith('.gif') || src.includes('dummy')) return;
      console.log(`  img: src="${src.slice(0,75)}" alt="${alt.slice(0,25)}" cls="${cls.slice(0,20)}"`);
      count++;
    });

    // 名前っぽい要素
    $('[class*="name"],[class*="cast"],[class*="staff"],[class*="therapist"],[class*="girl"]').slice(0, 3).each((i, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 60);
      const cls = $(el).attr('class') || '';
      if (text) console.log(`  name-el: <${el.tagName} class="${cls.slice(0,30)}"> "${text}"`);
    });

  } catch (e) { console.log(`  ❌ ${e.message}`); }
}

(async () => {
  // Jesse確認
  await inspect('Jesse ms-jesse.com TOP', 'https://ms-jesse.com/');
  // レッドアイ確認
  await inspect('レッドアイ TOP', 'https://redeye-esthe.com/');
  // セラピストページ
  await inspect('doigt de fee /lady/', 'https://exe-fee.com/lady/');
  await inspect('アプローチ /therapist.html', 'https://kawasakia.beautycloud.co.jp/therapist.html');
  await inspect('Fromage /therapist', 'http://fromage-kawasaki.com/therapist');
  await inspect('LIVSPA /therapist', 'https://livspa.net/therapist');
  await inspect('RiRe /therapist/', 'https://rire-kawasaki.com/therapist/');
  await inspect('ベッドオブローゼス /therapists.html', 'https://bed-of-roses.site/therapists.html');
  await inspect('ROYCE /staff.php', 'https://aromaroyce.com/staff.php');
  await inspect('Guarigione /therapist.html', 'https://www.spa-g.net/therapist.html');
  await inspect('THE BLANC /therapist', 'https://the-blanc.site/therapist');
  await inspect('ワイプライム /therapist', 'https://y-prime-yokohama.com/therapist');
})();
