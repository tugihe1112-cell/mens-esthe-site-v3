/**
 * 大阪 独自CMS店舗の構造調査
 * 実行: node scripts/debug/debug_osaka_indie.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const SHOPS = [
  { id: 'osaka_umeda_lavieet', name: 'La vie et', url: 'https://lavieet.net/' },
  { id: 'osaka_juso_wife_line', name: '和いふらいん', url: 'https://wife-line.com/' },
  { id: 'osaka_umeda_darlin_premium', name: 'ダーリンプレミアム', url: 'https://darlin-premium.com/' },
  { id: 'osaka_sakaisujihonmachi_tenjoubito_pr', name: '天上人PREMIUM', url: 'https://www.tenjoubitopr.com/' },
  { id: 'osaka_sakaisujihonmachi_queen_spumante', name: 'Queen Spumante', url: 'https://queenspumante.com/' },
  { id: 'osaka_sakaihigashi_leonspa', name: 'LEON SPA', url: 'https://leonspa.net/' },
  { id: 'osaka_umeda_furyu', name: 'Furyu 風流', url: 'https://furyu.net/' },
  { id: 'osaka_umeda_majimespa', name: 'マジメSPA', url: 'https://majime-spa.com/' },
  { id: 'osaka_sakuragawa_leonspa_gold', name: 'LEON SPA Gold', url: 'https://leonspa-gold.com/' },
  { id: 'osaka_umeda_beauty_and_beast', name: 'ビューティーアンドビースト', url: 'https://beauty-and-beast.net/' },
  { id: 'osaka_umeda_my_mama_spa', name: '僕のママスパ', url: 'https://higashiyama1250.wixsite.com/home' },
  { id: 'osaka_umeda_kakurega', name: '隠れ家', url: 'https://kakurega-iyashi.com/' },
  { id: 'osaka_sakaisujihonmachi_es_doll', name: 'イーエスドール', url: 'https://e-s-doll.com/' },
  { id: 'osaka_umeda_celeb_spa', name: 'セレブスパ', url: 'https://kitashinchiceleb.com/' },
  { id: 'osaka_takatsuki_mrs_viaura', name: 'ミセス美オーラ', url: 'https://mrs-viaura.com/' },
  { id: 'osaka_takatsuki_tamanegi', name: 'タマネギ', url: 'https://tamanegiman.com/' },
  { id: 'osaka_umeda_sr_himawari', name: 'SEACRET ROOM ひまわり', url: 'https://sr-himawari.com/' },
  { id: 'osaka_umeda_bellmadonna', name: 'ベルマドンナ', url: 'https://bellmadonna.com/' },
];

async function fetchHtml(url, timeout = 10000) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(timeout) });
  return { html: await res.text(), finalUrl: res.url };
}

for (const shop of SHOPS) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${shop.id}] ${shop.name}`);
  console.log(`URL: ${shop.url}`);

  try {
    const { html, finalUrl } = await fetchHtml(shop.url);
    const $ = cheerio.load(html);

    // CMS判定
    let cms = '独自';
    if (html.includes('caskan')) cms = 'caskan';
    else if (html.includes('3days')) cms = '3days';
    else if (html.includes('men-es.jp')) cms = 'men-es';
    else if (html.includes('wp-content')) cms = 'wordpress';
    else if (html.includes('smarts')) cms = 'smarts';
    else if (html.includes('wix.com') || html.includes('wixsite')) cms = 'wix';
    console.log(`CMS: ${cms}`);

    // セラピストページリンクを探す
    let therapistUrl = null;
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/therapist|cast|lady|staff|girl|セラピスト|在籍|スタッフ|キャスト|ガール/i.test(href + text) && !therapistUrl) {
        try {
          therapistUrl = href.startsWith('http') ? href : new URL(href, shop.url).href;
        } catch {}
      }
    });
    console.log(`セラピストURL: ${therapistUrl || 'なし'}`);

    // 画像を含む要素を調査
    const imgParents = new Map();
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (!src || /logo|icon|banner|bg|button|arrow|sns|twitter|line|instagram/i.test(src)) return;
      const parent = $(el).parent();
      const tag = parent[0]?.name || '';
      const cls = parent.attr('class') || '';
      const key = `${tag}.${cls}`;
      imgParents.set(key, (imgParents.get(key) || 0) + 1);
    });

    console.log('画像の親要素:');
    [...imgParents.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 5).forEach(([k,v]) => console.log(`  ${k}: ${v}枚`));

    // テキストサンプル (名前っぽいもの)
    const bodyText = $('body').text().replace(/\s+/g, ' ');
    const nameMatch = bodyText.match(/([ぁ-ん]{2,4}[\s　][ぁ-ん]{2,5}|[ァ-ヾ]{3,8})/g);
    if (nameMatch) console.log(`名前候補: ${nameMatch.slice(0, 5).join(', ')}`);

    // ロゴURL
    const logoEl = $('img[src*="logo"], header img, .logo img').first();
    if (logoEl.length) console.log(`ロゴ: ${logoEl.attr('src')}`);

    // セラピストページがあれば調査
    if (therapistUrl && therapistUrl !== shop.url) {
      try {
        const { html: tHtml } = await fetchHtml(therapistUrl);
        const $t = cheerio.load(tHtml);
        console.log(`\n  → セラピストページ: ${therapistUrl}`);

        // 画像数
        const allImgs = $t('img').length;
        console.log(`  全画像数: ${allImgs}`);

        // サンプル
        $t('li:has(img), article:has(img), div:has(img)').slice(0, 2).each((i, el) => {
          const txt = $t(el).text().replace(/\s+/g, ' ').trim().slice(0, 120);
          const imgSrc = $t(el).find('img').first().attr('src') || '';
          console.log(`  [${i}] ${txt}`);
          console.log(`  img: ${imgSrc.slice(0, 80)}`);
        });
      } catch (e) {
        console.log(`  セラピストページエラー: ${e.message}`);
      }
    }

  } catch (e) {
    console.log(`❌ ${e.message}`);
  }
}
