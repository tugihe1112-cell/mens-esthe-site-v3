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

// ⚠️ 変換ロジックはここに書かない。
// 以前は DataContext.jsx とここに**別々の実装**があり、しかも中身が食い違っていた
// （ここは website_url / business_hours 等を落としていた）。
// 2026-08-22 に src/utils/shopFields.js の shapeShopRow に一本化した。
// 既存の import 互換のため再エクスポートする。
// ⚠️ `export { X } from '...'` は**ローカル束縛を作らない**ので、この下の
//    buildInitialHero() から shapeShopRow を呼べず SSR が ReferenceError で 500 になる
//    （2026-08-22に本番を落とした。`npm run build` は実行時エラーなので通ってしまう）。
//    必ず import してから export すること。
import { shapeShopRow } from '../utils/shopFields';
export { shapeShopRow };

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
