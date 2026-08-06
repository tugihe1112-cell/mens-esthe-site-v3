// エリアSEOページ（/area/:slug）の単一ソース。
// ⚠️ 以前は同じ県リストが pages/area/[pref].jsx / src/pages/PrefecturePage.jsx /
//    api/sitemap.xml.js / このファイル の4箇所に散在しており、
//    サイトマップだけが ibaraki / tochigi / gunma を submit していたのに
//    ページ側の PREF_MAP に無く「このエリアページは存在しません」をHTTP200で
//    返す soft404 になっていた（茨城18店・栃木20店・群馬36店が実在するのに
//    約74店へのクロール経路を失っていた）。県を増減するときは必ずここを直すこと。
//
// 有効な slug → 都道府県名。ルーティング判定・SSR・サイトマップの正
export const PREF_SLUG_MAP = {
  tokyo:     '東京都',
  osaka:     '大阪府',
  aichi:     '愛知県',
  kanagawa:  '神奈川県',
  saitama:   '埼玉県',
  chiba:     '千葉県',
  hyogo:     '兵庫県',
  kyoto:     '京都府',
  fukuoka:   '福岡県',
  miyagi:    '宮城県',
  shizuoka:  '静岡県',
  shiga:     '滋賀県',
  hiroshima: '広島県',
  hokkaido:  '北海道',
  ibaraki:   '茨城県',
  tochigi:   '栃木県',
  gunma:     '群馬県',
};

// フッター等の一覧に出さない slug（ページ自体は有効だが掲載数が少なく訴求しない）
const HIDDEN_FROM_LINKS = new Set(['shiga']);

// Footer と ホーム呼水の県ブロックで共用するリンク一覧
export const AREA_LINKS = Object.entries(PREF_SLUG_MAP)
  .filter(([slug]) => !HIDDEN_FROM_LINKS.has(slug))
  .map(([slug, label]) => ({ slug, label }));

// 都道府県名 → slug（対応が無い県は undefined ＝ 呼び出し側で null 扱い）
export const PREF_TO_SLUG = Object.fromEntries(
  Object.entries(PREF_SLUG_MAP).map(([slug, label]) => [label, slug])
);
