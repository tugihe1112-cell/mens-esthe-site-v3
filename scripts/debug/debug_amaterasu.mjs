/**
 * アマテラス横浜 サイト構造確認
 * 実行: node scripts/debug/debug_amaterasu.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

async function inspect(label, url) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${label}】 ${url}`);
  try {
    const res = await fetch(url, { headers: ua });
    const $ = cheerio.load(await res.text());

    // セラピスト・スタッフ関連リンク
    const staffLinks = [];
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/staff|cast|therapist|セラピスト|スタッフ|キャスト|model|girl|lady/i.test(href + text)) {
        staffLinks.push(`  href="${href}" text="${text.slice(0,30)}"`);
      }
    });
    console.log(`\n📋 スタッフ関連リンク (${staffLinks.length}件):`);
    staffLinks.slice(0, 10).forEach(l => console.log(l));

    // img最初の15枚
    console.log('\n🖼️  img (最初の15枚):');
    $('img').slice(0, 15).each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      const cls = $(el).attr('class') || '';
      console.log(`  [${i}] src="${src.slice(0,80)}" alt="${alt.slice(0,30)}" class="${cls.slice(0,25)}"`);
    });

    // ロゴ候補
    console.log('\n🏷️  ロゴ候補:');
    $('img').each((i, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      if (/logo/i.test(src + alt)) console.log(`  ${src.slice(0,100)}`);
    });
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    if (ogImage) console.log(`  OGP: ${ogImage.slice(0,100)}`);

  } catch (e) {
    console.log(`❌ ${e.message}`);
  }
}

(async () => {
  await inspect('アマテラス横浜 TOP', 'https://amaterasu-yokohama.com');
  await inspect('アマテラス横浜 therapist?', 'https://amaterasu-yokohama.com/therapist');
})();
