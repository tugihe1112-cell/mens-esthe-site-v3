/**
 * 千葉・埼玉 ランキング未登録店舗の公式URL一括取得
 * mens-mg.comのranking_areaページ → shop詳細ページ → 公式URL抽出
 */
import * as cheerio from 'cheerio';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// エリアID → エリア名・都道府県
const AREAS = [
  { id: 3000, name: '千葉', pref: '千葉県', city: 'chiba' },
  { id: 3200, name: '松戸', pref: '千葉県', city: 'matsudo' },
  { id: 3250, name: '柏', pref: '千葉県', city: 'kashiwa' },
  { id: 3100, name: '大宮', pref: '埼玉県', city: 'omiya' },
  { id: 3120, name: '浦和', pref: '埼玉県', city: 'urawa' },
  { id: 3130, name: '川口・蕨', pref: '埼玉県', city: 'kawaguchi' },
  { id: 3150, name: '越谷・春日部', pref: '埼玉県', city: 'koshigaya' },
  { id: 3600, name: '川越', pref: '埼玉県', city: 'kawagoe' },
  { id: 3650, name: '所沢', pref: '埼玉県', city: 'tokorozawa' },
];

// DBに既存の店舗名（スキップ対象）
const ALREADY_REGISTERED = new Set([
  'madamerest', 'マダムレスト', 'luana', 'ルアナ',
  'regis', 'レジス', 'offsuit', 'オフスート',
  'queendom', 'クイーンダム', 'らんぷ大宮', 'lamp',
  '今日子の姉妹', 'mabui', 'マブイ',
  '秘密のミセスルーム', 'メンズエステ妻',
  'lynx', 'リンクス', 'luxury', 'ラグジュアリー',
]);

function isRegistered(name) {
  const n = name.toLowerCase().replace(/[～~ 　]/g, '');
  for (const r of ALREADY_REGISTERED) {
    if (n.includes(r.toLowerCase())) return true;
  }
  return false;
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
}

async function getShopUrl(shopId) {
  const html = await fetchPage(`https://mens-mg.com/shop.php?id=${shopId}`);
  if (!html) return null;
  const $ = cheerio.load(html);
  // 公式サイトリンクを探す
  let officialUrl = null;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    if (href.includes('mens-mg.com') || href.includes('google.com/maps') || href.includes('twitter.com') || href.includes('instagram.com') || href.includes('line.me') || href.startsWith('tel:') || href.startsWith('mailto:')) return;
    if (href.startsWith('http') && !officialUrl) {
      officialUrl = href;
    }
  });
  return officialUrl;
}

async function getRankingShops(areaId, topN = 5) {
  const html = await fetchPage(`https://mens-mg.com/ranking_area.php?area=${areaId}`);
  if (!html) return [];
  const $ = cheerio.load(html);

  const shops = [];
  // shop.phpリンクを順番に取得（重複除去）
  const seen = new Set();
  $('a[href*="shop.php?id="]').each((_, el) => {
    const href = $(el).attr('href');
    const match = href?.match(/shop\.php\?id=(\d+)/);
    if (match && !seen.has(match[1])) {
      seen.add(match[1]);
      // 店名は近くのh2/h3から
      let name = 'unknown';
      const parent = $(el).closest('section, article, li, div.shop');
      const h = parent.find('h2, h3').first();
      if (h.length) name = h.text().trim();
      shops.push({ shopId: match[1], name });
    }
  });

  return shops.slice(0, topN + 2); // 登録済みスキップ分の余裕を持たせる
}

async function main() {
  const results = [];

  for (const area of AREAS) {
    console.log(`\n【${area.name}】取得中...`);
    const shops = await getRankingShops(area.id, 6);
    await sleep(800);

    let count = 0;
    for (const shop of shops) {
      if (count >= 5) break;
      if (isRegistered(shop.name)) {
        console.log(`  スキップ（登録済み）: ${shop.name}`);
        continue;
      }

      const officialUrl = await getShopUrl(shop.shopId);
      await sleep(600);

      console.log(`  ${count + 1}位: ${shop.name}`);
      console.log(`     mensMG: https://mens-mg.com/shop.php?id=${shop.shopId}`);
      console.log(`     公式URL: ${officialUrl || 'なし'}`);

      results.push({
        area: area.name,
        pref: area.pref,
        city: area.city,
        rank: count + 1,
        name: shop.name,
        shopId: shop.shopId,
        officialUrl,
      });
      count++;
    }
  }

  console.log('\n\n=== 結果まとめ ===');
  console.log(JSON.stringify(results, null, 2));
}

main();
