/**
 * 東京都 未処理20店舗の構造調査
 * cheerioで各サイトにアクセスし、セラピスト画像・名前の取得可能性を確認
 * 実行: node scripts/debug/check_tokyo_remaining.mjs
 */
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SHOPS = [
  { id: 'tokyo_adachi_ushida_ranpu_kitasenju',       name: 'らんぷ 北千住',             url: 'https://www.senju-lamp.com/' },
  { id: 'tokyo_chiyoda_akihabara_assouplir',         name: 'Assouplir 秋葉原',          url: 'https://assouplir-tokyo.com/' },
  { id: 'tokyo_chiyoda_akihabara_weal',              name: 'Weal 秋葉原',               url: 'https://weal-group.jp/' },
  { id: 'tokyo_chiyoda_kudanshita_rondo',            name: 'ロンド 九段下',             url: 'https://ginza-kiwami.com/' },
  { id: 'tokyo_chuo_ginza_aroma_amour',              name: 'AROMA AMOUR 銀座',          url: 'http://www.akiba-amour.com/' },
  { id: 'tokyo_chuo_ginza_rondo',                    name: 'ロンド 銀座',               url: 'https://ginza-kiwami.com/' },
  { id: 'tokyo_dispatch_candy_spa',                  name: 'Candy Spa',                 url: 'https://candy-s-candy.men-es.jp/' },
  { id: 'tokyo_dispatch_outside_no_brand',           name: 'No Brand',                  url: 'https://no-brand.jp/' },
  { id: 'tokyo_meguro_jiyugaoka_doigt_de_fee',       name: 'doigt de fee 自由が丘',     url: 'https://exe-fee.com/' },
  { id: 'tokyo_minato_azabujuban_edel',              name: 'EDEL AZABU 麻布十番',       url: 'https://edel-azabu.com/' },
  { id: 'tokyo_minato_tamachi_edel',                 name: 'EDEL AZABU 田町',           url: 'https://edel-azabu.com/' },
  { id: 'tokyo_nakano_golden',                       name: 'ゴールデン 中野',           url: 'https://golden0508.com/' },
  { id: 'tokyo_ota_kamata_anjuaile',                 name: 'Anjuaile 蒲田',             url: 'https://esthe-angeaile.com/' },
  { id: 'tokyo_ota_kamata_doigt_de_fee',             name: 'doigt de fee 蒲田',         url: 'https://exe-fee.com/' },
  { id: 'tokyo_ota_kamata_hoozuki',                  name: 'Ho・O・Zu・Ki・SPA 蒲田',   url: 'http://hoozuki-spa.net/' },
  { id: 'tokyo_ota_omori_hoozuki',                   name: 'Ho・O・Zu・Ki・SPA 大森',   url: 'http://hoozuki-spa.net/' },
  { id: 'tokyo_setagaya_futakotamagawa_jesse',       name: 'Jesse 二子玉川',            url: 'https://ms-jesse.com/' },
  { id: 'tokyo_setagaya_ikejiriohashi_authority',    name: 'AUTHORITY 池尻大橋',        url: 'https://www.me-authority.com/' },
  { id: 'tokyo_shinjuku_shinjuku_first',             name: 'First 新宿',                url: 'https://esthe-first.com/' },
  { id: 'tokyo_taito_ueno_iyashinokuukan_annex',     name: '癒しの空間 Annex',          url: 'https://iyashinokuukan-annex.com/' },
];

// セラピスト一覧ページのよくあるパス
const CAST_PATHS = ['/therapist/', '/cast/', '/girls/', '/staff/', '/therapist', '/cast', '/girls', '/staff', '/member/', '/member'];

async function tryFetch(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: url },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

async function analyzeShop(shop) {
  const base = shop.url.replace(/\/$/, '');

  // まずトップページを取得してセラピストページへのリンクを探す
  const topHtml = await tryFetch(shop.url);
  if (!topHtml) {
    return { ...shop, status: '❌ 取得失敗', imgs: 0, names: [] };
  }

  const $top = cheerio.load(topHtml);

  // セラピストページへのリンクを探す
  let castUrl = null;
  $top('a[href]').each((_, el) => {
    const href = $top(el).attr('href') || '';
    if (/therapist|cast|girl|staff|member/i.test(href) && !castUrl) {
      castUrl = href.startsWith('http') ? href : base + (href.startsWith('/') ? href : '/' + href);
    }
  });

  // パス候補を試す
  if (!castUrl) {
    for (const path of CAST_PATHS) {
      const html = await tryFetch(base + path);
      if (html && html.length > 2000) {
        castUrl = base + path;
        break;
      }
      await sleep(200);
    }
  }

  const targetUrl = castUrl || shop.url;
  const html = castUrl ? await tryFetch(castUrl) : topHtml;
  if (!html) return { ...shop, status: '⚠️ キャストページなし', imgs: 0, names: [] };

  const $ = cheerio.load(html);

  // 画像URLパターン調査
  const imgSrcs = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (src && !src.includes('logo') && !src.includes('banner') && !src.includes('icon') && src.length > 10) {
      imgSrcs.push({ src: src.slice(0, 80), alt: alt.slice(0, 20) });
    }
  });

  // テキスト内から日本語名前らしきものを抽出（サンプル）
  const text = $.text();
  const nameMatches = text.match(/[一-龯ぁ-んァ-ヾ]{1,2}[一-龯ぁ-んァ-ヾa-zA-Zａ-ｚ]{1,6}/g) || [];
  const uniqueNames = [...new Set(nameMatches)].slice(0, 8);

  // JS描画判定: imgが少ない or bodyが空に近い
  const isJsRendered = imgSrcs.filter(i => i.src.includes('therapist') || i.src.includes('cast') || i.src.includes('staff') || i.src.includes('photo')).length === 0 && html.length < 5000;

  return {
    ...shop,
    castUrl: targetUrl,
    status: isJsRendered ? '⚠️ JS描画の可能性' : '✅ cheerio取得可能',
    imgs: imgSrcs.length,
    therapistImgs: imgSrcs.filter(i => /therapist|cast|staff|photo|member|girl/i.test(i.src)).length,
    sampleImgs: imgSrcs.slice(0, 3),
    sampleNames: uniqueNames,
  };
}

console.log('東京都 未処理20店舗 構造調査中...\n');

const seen = new Set();
for (const shop of SHOPS) {
  // 同じURLは1回だけアクセス
  const key = shop.url;
  if (seen.has(key)) {
    console.log(`[${shop.name}] ← 上と同じURL`);
    continue;
  }
  seen.add(key);

  process.stdout.write(`[${shop.name}] 調査中... `);
  const result = await analyzeShop(shop);
  console.log(`${result.status}`);
  console.log(`  キャストURL: ${result.castUrl || 'なし'}`);
  console.log(`  img総数: ${result.imgs} / セラピスト系img: ${result.therapistImgs || 0}`);
  if (result.sampleImgs?.length) {
    result.sampleImgs.forEach(i => console.log(`    ${i.src} [${i.alt}]`));
  }
  console.log();
  await sleep(500);
}

console.log('完了');
