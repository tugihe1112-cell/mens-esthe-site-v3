// ヒーロースライダーの店舗定義と整形ロジック（サーバー/クライアント共用）
// getStaticProps（サーバー）と TopHeroSlider（クライアント）で同じ整形を使い、
// SSR時とhydration時の描画を一致させる。

// men-esthe.jp 口コミ数TOP5店舗（実際の口コミページ数で算出・2026-05-26確定）
export const HERO_SHOP_IDS = [
  'tokyo_minato_azabujuban_linda_spa',                   // LINDA SPA（口コミ数1位: 84ページ）
  'tokyo_chuo_ginza_aroma_maison',                       // Aroma Maison（口コミ数2位: 66ページ）
  'tokyo_chuo_ginza_aromamore',                          // AROMA more（口コミ数3位: 54ページ）
  'tokyo_shinjuku_kabukicho_aromacharm',                 // AromaCharm（口コミ数4位: 48ページ）
  'tokyo_chiyoda_iidabashi_tokyo_aroma_este',            // 東京アロマエステ（口コミ数5位: 34ページ）
];

// スライドショー専用の画像上書き（店舗サムネイルとは別）
// type: 'cover' = 写真（全面表示）, 'logo' = ロゴ（contain＋背景色）
export const HERO_IMAGE_OVERRIDES = {
  'tokyo_minato_azabujuban_linda_spa':        { url: 'https://linda-spa.com/wp-content/themes/linda2/img/logo.png',  type: 'logo' },
  'tokyo_shinjuku_kabukicho_aromacharm':      { url: 'https://aromacharm.net/images_shop/logo.png',                  type: 'logo' },
  'tokyo_chiyoda_iidabashi_tokyo_aroma_este': { url: 'https://tokyoaroma.jp/wp-content/uploads/2023/12/girl-2554687_1280-1.jpg', type: 'cover' },
};

// DBの生レコード {id, group_id, name, raw_data, image_url} を
// アプリ内のshape（raw_data展開 + トップレベル上書き）に変換。
// DataContext.jsx の整形ロジックと同一に保つこと。
export function shapeShopRow(d) {
  if (!d) return null;
  const raw = d.raw_data || {};
  return {
    ...raw,
    area: typeof raw.area === 'string' ? raw.area : undefined,
    id: d.id,
    group_id: d.group_id,
    name: d.name,
    image_url: d.image_url,
  };
}

// shape済みshop → ヒーローアイテム（override適用）。画像が無ければ null。
export function toHeroItem(shop) {
  if (!shop) return null;
  const override = HERO_IMAGE_OVERRIDES[shop.id];
  const heroImage = override ? override.url : shop.image_url;
  const heroImageType = override ? override.type : 'cover';
  if (!heroImage) return null;
  return { ...shop, heroImage, heroImageType };
}

// サーバー用: 生レコード配列 → HERO_SHOP_IDS順のヒーローアイテム配列（最大5件）。
export function buildInitialHero(rows) {
  const map = Object.fromEntries((rows || []).map(r => [r.id, r]));
  return HERO_SHOP_IDS
    .map(id => toHeroItem(shapeShopRow(map[id])))
    .filter(Boolean)
    .slice(0, 5);
}
