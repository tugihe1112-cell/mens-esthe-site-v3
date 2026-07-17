// エリアSEOページ（/area/:slug）のリンク定義。Footer と ホーム呼水の県ブロックで共用。
export const AREA_LINKS = [
  { slug: 'tokyo',     label: '東京都' },
  { slug: 'osaka',     label: '大阪府' },
  { slug: 'aichi',     label: '愛知県' },
  { slug: 'kanagawa',  label: '神奈川県' },
  { slug: 'saitama',   label: '埼玉県' },
  { slug: 'chiba',     label: '千葉県' },
  { slug: 'hyogo',     label: '兵庫県' },
  { slug: 'kyoto',     label: '京都府' },
  { slug: 'fukuoka',   label: '福岡県' },
  { slug: 'miyagi',    label: '宮城県' },
  { slug: 'shizuoka',  label: '静岡県' },
  { slug: 'hiroshima', label: '広島県' },
  { slug: 'hokkaido',  label: '北海道' },
];

// 都道府県名 → slug（対応が無い県は undefined ＝ 呼び出し側で null 扱い）
export const PREF_TO_SLUG = Object.fromEntries(AREA_LINKS.map((a) => [a.label, a.slug]));
