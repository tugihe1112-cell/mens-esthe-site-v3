/**
 * men-esthe.jp の salonId と我々のDBのshopIdを照合して
 * scrape_menesthe_reviews.mjs に追加すべきTARGETS配列を出力する
 *
 * 実行: node scripts/debug/find_menesthe_salon_ids.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// men-esthe.jpで収集したサロンID → HP URLのマッピング
// キー: ドメイン（スキームなし、末尾スラッシュなし）でnormalize
const MENESTHE_MAP = [
  // 渋谷エリア (area id=6) - Silk は既にTARGETSに登録済み
  { salonId: '9416',  menestheShopName: 'Silk (シルク)',            hp: 'silk-esthe.com' },

  // 六本木・西麻布エリア (area id=19)
  { salonId: '7711',  menestheShopName: 'ザ・プレミアムスパ',        hp: 'the-premiumspa.com' },
  { salonId: '12912', menestheShopName: 'アロマレディアン',           hp: 'aroma-ledian.com' },
  { salonId: '8721',  menestheShopName: 'THE HALF（ザ・ハーフ）',    hp: 'the-half.com' },

  // 新橋・銀座エリア (area id=18)
  { salonId: '1537',  menestheShopName: 'タイガーゲート 虎ノ門',     hp: 'tiger-gate.net' },
  { salonId: '2099',  menestheShopName: 'リラックス東京',             hp: 'relax-tokyo.jp' },
  { salonId: '2482',  menestheShopName: 'ノーブランド',               hp: 'aroma-nobrand.com' },
  { salonId: '295',   menestheShopName: 'アロマメゾン',               hp: 'aromamaison.tokyo' },
  { salonId: '12651', menestheShopName: 'うさぎちゃんスパ',           hp: 'usagichan-spa.com' },
  { salonId: '13483', menestheShopName: '銀座のニューエステ',         hp: 'ginza.menes-jp.com' },
  { salonId: '2670',  menestheShopName: 'アロマジュエルズ',           hp: 'aroma-jewels.jp' },
  { salonId: '11137', menestheShopName: 'エステの気分',               hp: 'estheno-kibun.com' },
  { salonId: '886',   menestheShopName: 'アロマモア',                 hp: 'aromamore.tokyo' },
  { salonId: '11884', menestheShopName: 'ミラジュール',               hp: 'total-beauty-salon.net' },
  { salonId: '310',   menestheShopName: 'メンズエステ恵比寿',         hp: 'mens-este.com' },
  { salonId: '14338', menestheShopName: 'アロマルナベル',             hp: 'aroma-lunabelle.com' },
  { salonId: '202',   menestheShopName: 'ザギン',                     hp: 'za-gin.com' },
  { salonId: '9709',  menestheShopName: '竜宮城 旧百万石',            hp: 'esthe-ryugujo.com' },

  // 麻布十番エリア (area id=16)
  { salonId: '72',    menestheShopName: 'リンダスパ',                 hp: 'linda-spa.com' },
  { salonId: '11447', menestheShopName: 'カリナ',                     hp: 'carinna-azabu.com' },
  { salonId: '2575',  menestheShopName: 'ベラスパ',                   hp: 'bella-spa-esthe.com' },
  { salonId: '1710',  menestheShopName: 'リミテッドスパ',             hp: 'limited-spa.com' },
  { salonId: '2197',  menestheShopName: 'アナイチ',                   hp: 'anaichi-este.com' },
  { salonId: '9749',  menestheShopName: 'アロマエメラルド',           hp: 'a-emerald.com' },
  { salonId: '7427',  menestheShopName: 'サウダージ',                 hp: 'saudade-tokyo.com' },
  { salonId: '3877',  menestheShopName: 'アリア',                     hp: 'aria-azabu.com' },
  { salonId: '8751',  menestheShopName: 'スパアンジュ',               hp: 'spa-ange-ginza.men-este.com' },
  { salonId: '1517',  menestheShopName: '東京アロマエステ',           hp: 'tokyoaroma.jp' },
  { salonId: '7632',  menestheShopName: 'ラヴィット',                 hp: 'loveit.love' },
  { salonId: '190',   menestheShopName: 'デジャヴ東京',               hp: 'dejavu.tokyo' },

  // 五反田エリア (area id=1)
  { salonId: '1247',  menestheShopName: 'アンナ',                     hp: 'esthe-anna.net' },
  { salonId: '2593',  menestheShopName: 'アロマABC',                  hp: 'a-abc.tokyo' },
  { salonId: '1442',  menestheShopName: 'ラグタイム',                 hp: 'mensesthe-luxtime.jp' },
  { salonId: '9534',  menestheShopName: 'ゆるスパ五反田店',           hp: 'yuru-spa.com' },
  { salonId: '77',    menestheShopName: 'レインズラプト',             hp: 'rainsrapt.com' },
  { salonId: '13313', menestheShopName: 'エステの王様',               hp: 'estheking.jp' },
  { salonId: '10216', menestheShopName: 'むちむちお姉さん',           hp: 'muchi2onesan.com' },
  { salonId: '2531',  menestheShopName: 'クジャク',                   hp: 'ms-kujaku.com' },
  { salonId: '2798',  menestheShopName: 'エーゴスパ',                 hp: 'a5spa.com' },
  { salonId: '15206', menestheShopName: 'カノネコ',                   hp: 'the-garnet-kanoneko.com' },
  { salonId: '1401',  menestheShopName: 'ダリア',                     hp: 'gotandadahlia.com' },
  { salonId: '9056',  menestheShopName: 'キャンディスパ',             hp: 'candy-s-candy.men-es.jp' },
];

// URLを正規化してドメイン部分を抽出
const normUrl = (url) => {
  if (!url) return '';
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '')
    .toLowerCase()
    .split('/')[0]; // ドメインのみ
};

// 全東京店舗を取得
console.log('=== DBからshopデータ取得中...\n');
const { data: shops, error } = await supabase
  .from('shops')
  .select('id, name, website_url, raw_data')
  .or('raw_data->>prefecture.eq.東京都,id.ilike.tokyo_%,id.ilike.shizuoka_%')
  .order('id');

if (error) {
  console.error('DBエラー:', error.message);
  process.exit(1);
}

// shop.website_urlをドメインでインデックス
const shopByDomain = {};
for (const shop of shops) {
  if (!shop.website_url) continue;
  const domain = normUrl(shop.website_url);
  if (!shopByDomain[domain]) shopByDomain[domain] = [];
  shopByDomain[domain].push(shop);
}

// 照合
console.log('=== 照合結果 ===\n');
const targets = [];
const noMatch = [];

for (const entry of MENESTHE_MAP) {
  const hp = entry.hp.toLowerCase();
  // ドメイン完全一致 or 部分一致（サブドメイン対応）
  const matchedShops = shops.filter(s => {
    const d = normUrl(s.website_url);
    return d === hp || d.endsWith('.' + hp) || hp.endsWith('.' + d);
  });

  if (matchedShops.length === 0) {
    noMatch.push(entry);
    console.log(`❌ ${entry.menestheShopName} (id=${entry.salonId}): 一致なし (${entry.hp})`);
  } else {
    for (const shop of matchedShops) {
      targets.push({ salonId: entry.salonId, shopId: shop.id, shopName: shop.name, menestheShopName: entry.menestheShopName });
      console.log(`✅ ${entry.menestheShopName} (id=${entry.salonId}) → ${shop.id} "${shop.name}"`);
    }
  }
}

// TARGETS配列を出力
console.log('\n=== TARGETS配列（scrape_menesthe_reviews.mjsに追加） ===\n');
console.log('const TARGETS = [');
for (const t of targets) {
  console.log(`  { salonId: '${t.salonId}', shopId: '${t.shopId}', shopName: '${t.shopName}' }, // men-esthe: ${t.menestheShopName}`);
}
console.log('];');

console.log(`\n合計: ${targets.length}件マッチ / ${MENESTHE_MAP.length}件中`);
if (noMatch.length > 0) {
  console.log(`\n未マッチ（DBに未登録の可能性）:`);
  for (const e of noMatch) {
    console.log(`  - ${e.menestheShopName} (salonId=${e.salonId}): ${e.hp}`);
  }
}
