/**
 * mens-est.jp の東京エリア全店舗スラッグを収集し、SupabaseのDBと照合する
 * 実行: node scripts/debug/find_mensest_shop_slugs.mjs
 *
 * 出力: scrape_mensest_reviews.mjs に貼り付ける TARGETS 配列
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 東京都内の全エリアURL（55件）
const TOKYO_AREA_URLS = [
  'https://mens-est.jp/tokyo/a-01718/',
  'https://mens-est.jp/tokyo/a-01764/',
  'https://mens-est.jp/tokyo/a-01748/',
  'https://mens-est.jp/tokyo/a-01769/',
  'https://mens-est.jp/tokyo/a-01760/',
  'https://mens-est.jp/tokyo/a-01727/',
  'https://mens-est.jp/tokyo/a-01770/',
  'https://mens-est.jp/tokyo/a-01752/',
  'https://mens-est.jp/tokyo/a-01773/',
  'https://mens-est.jp/tokyo/a-01750/',
  'https://mens-est.jp/tokyo/a-01775/',
  'https://mens-est.jp/tokyo/a-01986/',
  'https://mens-est.jp/tokyo/a-01776/',
  'https://mens-est.jp/tokyo/a-01678/',
  'https://mens-est.jp/tokyo/a-01592/',
  'https://mens-est.jp/tokyo/a-01806/',
  'https://mens-est.jp/tokyo/a-01798/',
  'https://mens-est.jp/tokyo/a-01817/',
  'https://mens-est.jp/tokyo/a-01802/',
  'https://mens-est.jp/tokyo/a-01659/',
  'https://mens-est.jp/tokyo/a-01724/',
  'https://mens-est.jp/tokyo/a-01937/',
  'https://mens-est.jp/tokyo/a-01720/',
  'https://mens-est.jp/tokyo/a-02129/',
  'https://mens-est.jp/tokyo/a-02130/',
  'https://mens-est.jp/tokyo/a-02131/',
  'https://mens-est.jp/tokyo/a-02146/',
  'https://mens-est.jp/tokyo/a-02147/',
  'https://mens-est.jp/tokyo/a-02150/',
  'https://mens-est.jp/tokyo/a-02132/',
  'https://mens-est.jp/tokyo/a-01702/',
  'https://mens-est.jp/tokyo/a-02199/',
  'https://mens-est.jp/tokyo/a-02053/',
  'https://mens-est.jp/tokyo/a-01857/',
  'https://mens-est.jp/tokyo/a-01913/',
  'https://mens-est.jp/tokyo/a-01876/',
  'https://mens-est.jp/tokyo/a-01636/',
  'https://mens-est.jp/tokyo/a-01614/',
  'https://mens-est.jp/tokyo/a-01882/',
  'https://mens-est.jp/tokyo/a-01647/',
  'https://mens-est.jp/tokyo/a-01604/',
  'https://mens-est.jp/tokyo/a-01649/',
  'https://mens-est.jp/tokyo/a-01958/',
  'https://mens-est.jp/tokyo/a-01669/',
  'https://mens-est.jp/tokyo/a-01679/',
  'https://mens-est.jp/tokyo/a-01654/',
  'https://mens-est.jp/tokyo/a-02096/',
  'https://mens-est.jp/tokyo/a-01657/',
  'https://mens-est.jp/tokyo/a-02031/',
  'https://mens-est.jp/tokyo/a-01746/',
  'https://mens-est.jp/tokyo/a-01904/',
  'https://mens-est.jp/tokyo/a-01993/',
  'https://mens-est.jp/tokyo/a-01711/',
  'https://mens-est.jp/tokyo/a-01705/',
  'https://mens-est.jp/tokyo/a-01839/',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const normDomain = (url) => {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch { return null; }
};

const fetchHtml = async (url) => {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ja,en;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
};

// エリアページから店舗情報を取得
async function scrapeAreaPage(areaUrl) {
  const html = await fetchHtml(areaUrl);
  const $ = cheerio.load(html);
  const shops = [];

  $('li[data-selectshopid]').each((_, el) => {
    const slug = $(el).attr('data-selectshopid');
    if (!slug) return;
    const name = $(el).find('.shop-name a').first().text().trim();
    const officialUrl = $(el).find('a[href^="http"]').filter((_, a) => {
      const href = $(a).attr('href') || '';
      return !href.includes('mens-est.jp')
        && !href.includes('google.com')
        && !href.includes('twitter.com')
        && !href.includes('instagram.com')
        && !href.includes('t.co')
        && !href.includes('line.me')
        && !href.includes('tel:');
    }).first().attr('href') || null;

    shops.push({ slug, name, officialUrl });
  });

  return shops;
}

// 店舗詳細ページから公式URLを取得（エリアページで取得できなかった場合）
async function getOfficialUrlFromDetail(slug) {
  try {
    const html = await fetchHtml(`https://mens-est.jp/shop/${slug}/`);
    const $ = cheerio.load(html);
    // 「公式HP」ラベルの近くにあるリンクを探す
    let officialUrl = null;
    $('th, td, .info-label, dt').each((_, el) => {
      const text = $(el).text();
      if (text.includes('公式HP') || text.includes('公式サイト') || text.includes('ホームページ')) {
        const row = $(el).closest('tr, dl');
        const link = row.find('a[href^="http"]')
          .filter((_, a) => !$(a).attr('href').includes('mens-est.jp'))
          .first().attr('href');
        if (link) { officialUrl = link; return false; }
      }
    });
    // フォールバック: 外部リンクで最初の非SNSのもの
    if (!officialUrl) {
      officialUrl = $('a[href^="http"]').filter((_, a) => {
        const href = $(a).attr('href') || '';
        return !href.includes('mens-est.jp')
          && !href.includes('google.com')
          && !href.includes('twitter.com')
          && !href.includes('instagram.com')
          && !href.includes('t.co')
          && !href.includes('line.me');
      }).first().attr('href') || null;
    }
    return officialUrl;
  } catch (e) {
    return null;
  }
}

async function main() {
  // DBから東京都の全店舗を取得
  const { data: dbShops, error } = await supabase
    .from('shops')
    .select('id, name, website_url, raw_data')
    .eq('raw_data->>prefecture', '東京都');

  if (error) { console.error('DB error:', error); return; }

  // domain → shop のマップを作成
  const domainToShop = {};
  for (const shop of dbShops) {
    if (shop.website_url) {
      const domain = normDomain(shop.website_url);
      if (domain) domainToShop[domain] = shop;
    }
  }
  console.log(`DB: 東京都 ${dbShops.length}店舗 (URL設定済み: ${Object.keys(domainToShop).length}件)\n`);

  // 全エリアページをスクレイプ
  const allSlugs = new Map(); // slug → { slug, name, officialUrl }
  let areaCount = 0;
  for (const areaUrl of TOKYO_AREA_URLS) {
    try {
      const shops = await scrapeAreaPage(areaUrl);
      for (const s of shops) {
        if (!allSlugs.has(s.slug)) allSlugs.set(s.slug, s);
      }
      areaCount++;
      process.stdout.write(`\rエリアページ処理中: ${areaCount}/${TOKYO_AREA_URLS.length} (収集: ${allSlugs.size}件)`);
    } catch (e) {
      process.stdout.write(`\n  ⚠ ${areaUrl}: ${e.message}\n`);
    }
    await sleep(800);
  }
  console.log(`\nエリアページ完了: ${allSlugs.size}件のスラッグ収集\n`);

  // 公式URL未取得の店舗 → 詳細ページから取得
  const withoutUrl = [...allSlugs.values()].filter(s => !s.officialUrl);
  console.log(`公式URL未取得: ${withoutUrl.length}件 → 詳細ページから取得中...`);
  let detailCount = 0;
  for (const s of withoutUrl) {
    const url = await getOfficialUrlFromDetail(s.slug);
    if (url) allSlugs.get(s.slug).officialUrl = url;
    detailCount++;
    if (detailCount % 10 === 0) process.stdout.write(`\r  詳細ページ: ${detailCount}/${withoutUrl.length}`);
    await sleep(500);
  }
  console.log(`\n詳細ページ完了\n`);

  // DBと照合
  const matched = [];
  const unmatched = [];

  for (const [slug, info] of allSlugs) {
    if (!info.officialUrl) {
      unmatched.push({ reason: 'URL無し', slug, name: info.name });
      continue;
    }
    const domain = normDomain(info.officialUrl);
    if (!domain) {
      unmatched.push({ reason: 'URL不正', slug, name: info.name, url: info.officialUrl });
      continue;
    }
    const dbShop = domainToShop[domain];
    if (dbShop) {
      matched.push({
        shopSlug: slug,
        shopId: dbShop.id,
        shopName: dbShop.name,
        mensestName: info.name,
        domain,
      });
    } else {
      unmatched.push({ reason: 'DB不一致', slug, name: info.name, domain });
    }
  }

  console.log(`✅ マッチ: ${matched.length}件`);
  console.log(`❌ 未マッチ: ${unmatched.length}件\n`);

  // 未マッチのうち「DB不一致」を表示（手動追加の参考）
  const noDbMatch = unmatched.filter(u => u.reason === 'DB不一致');
  if (noDbMatch.length > 0) {
    console.log('=== DB不一致（手動確認・追加用）===');
    noDbMatch.forEach(u => console.log(`  ${u.name} (${u.slug}) → ${u.domain}`));
    console.log('');
  }

  // マッチした店舗の口コミ数を確認
  console.log('=== マッチ結果 ===');
  matched.forEach(m => console.log(`  ✅ ${m.mensestName} → ${m.shopId} (${m.domain})`));

  // TARGETS 配列を出力
  console.log('\n\n// ========================================');
  console.log('// scrape_mensest_reviews.mjs の TARGETS に貼り付け:');
  console.log('// ========================================');
  console.log('const TARGETS = ' + JSON.stringify(
    matched.map(m => ({
      shopSlug: m.shopSlug,
      shopIds: [m.shopId],
      shopName: m.shopName,
    })),
    null, 2
  ) + ';');
}

main().catch(console.error);
