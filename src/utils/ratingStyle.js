// 評価スコア→色（信頼の演出・全カード共通）
//   ★4.0以上 = emerald（好評）／3.x = amber（可もなく）／3未満 = rose（辛口）
// 狙い: ★2が赤で堂々と並ぶ＝「辛口も載る本物」が一目で伝わる。
// ModernReviewCard / HomeReviewCard で共有（重複ロジックの一本化）。

export function ratingTextClass(score) {
  const n = Number(score);
  if (n >= 4.0) return 'text-emerald-400';
  if (n >= 3.0) return 'text-amber-400';
  return 'text-rose-400';
}

// バッジ/バーのグラデーション（bg-gradient-to-* と併用）
export function ratingGradientClass(score) {
  const n = Number(score);
  if (n >= 4.0) return 'from-emerald-600 to-teal-600 shadow-emerald-900/40';
  if (n >= 3.0) return 'from-amber-500 to-orange-600 shadow-amber-900/40';
  return 'from-rose-600 to-red-700 shadow-rose-900/40';
}

// 淡い面のバッジ（ホームの口コミ欄）。色の境目は上の2つと同じ＝辛口は同じ赤系で出る。
//   塗りつぶしのバッジを1画面に7個並べると★ばかりが目立ち、本文より先に色が読まれるため。
export function ratingSoftClass(score) {
  const n = Number(score);
  if (n >= 4.0) return 'bg-emerald-500/15 text-emerald-300';
  if (n >= 3.0) return 'bg-amber-500/15 text-amber-300';
  return 'bg-rose-500/15 text-rose-300';
}
