import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

async function checkUrl(label, url) {
  console.log(`\n--- ${label}: ${url} ---`);
  try {
    const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(12000) });
    console.log(`  HTTP: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    if (ogImg) console.log(`  og:image: ${ogImg}`);
    const imgCount = $('img').length;
    console.log(`  img総数: ${imgCount}`);
    // セラピスト系の画像
    ['images_staff','cast','staff','member','therapist','photo'].forEach(kw => {
      const n = $(`img[src*="${kw}"]`).length;
      if (n > 0) console.log(`  img[src*="${kw}"]: ${n}件`);
    });
    ['さんの写真','セラピスト'].forEach(kw => {
      const n = $(`img[alt*="${kw}"]`).length;
      if (n > 0) console.log(`  img[alt*="${kw}"]: ${n}件`);
    });
    if ($('[style*="background-image"]').length > 5) console.log(`  background-image: ${$('[style*="background-image"]').length}件`);
    // img先頭5件（ロゴ系除く）
    let shown = 0;
    $('img').each((_, el) => {
      if (shown >= 5) return;
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      if (/logo|header|footer|banner|icon|LINE|twitter|recruit|loading/i.test(src + alt)) return;
      if (!src) return;
      console.log(`  img: alt="${alt}" | ${src.slice(0, 70)}`);
      shown++;
    });
  } catch(e) {
    console.log(`  ❌ ${e.message}`);
  }
}

// 博多人妻さん
await checkUrl('博多人妻 /staff', 'https://hakatahitozuma.com/staff/');
await checkUrl('博多人妻 /cast', 'https://hakatahitozuma.com/cast/');
await checkUrl('博多人妻 TOP', 'https://hakatahitozuma.com/');

// Request
await checkUrl('Request TOP', 'https://aroma-request.com/');
await checkUrl('Request /staff', 'https://aroma-request.com/staff/');
await checkUrl('Request /cast', 'https://aroma-request.com/cast/');
await checkUrl('Request /staff.php', 'https://aroma-request.com/staff.php');
await checkUrl('Request /therapist.php', 'https://aroma-request.com/therapist.php');

// ピンキーグラッツェ
await checkUrl('ピンキー TOP', 'http://www.pinky-grazie.com/');
await checkUrl('ピンキー /cast', 'http://www.pinky-grazie.com/cast.html');
await checkUrl('ピンキー /staff.php', 'http://www.pinky-grazie.com/staff.php');
