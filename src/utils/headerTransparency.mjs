/**
 * ヘッダーの背景を透過にしてよいページかを判定する純粋関数。
 *
 * ⚠️ 2026-09-08（FIXES.md F06-D）: 以前は Header.jsx に
 *      ['/', '/shops/', '/login', '/register', '/ranking', '/brands/']
 *        .some(p => pathname === p || pathname.startsWith(p))
 *    と書かれていた。配列の先頭に '/' があるため **全てのpathnameが startsWith('/') を満たし**、
 *    どのページでも透過ヘッダーになっていた。
 *    /search・/popular-reviews・店舗一覧(/shops)のようにヒーローを持たないページでも
 *    背景が透けて、本文の上端とヘッダーが重なって読みにくくなる。
 *
 * 直し方＝「完全一致で見るページ」と「前方一致で見るページ」を分ける。
 *  - 完全一致: ホームと固定ページ（'/' が他の全URLに前方一致する問題を断つ）
 *  - 前方一致: 店舗詳細 /shops/:id とブランド詳細 /brands/:id だけ。
 *    prefix より長いことを要求するので、'/shops'（店舗一覧）は不透明のままになる。
 *
 * ヒーロー（h-40vh 等）を持つページを透過にする、という設計自体は 2026-08-17 の判断を維持する。
 */
export const TRANSPARENT_EXACT_PATHS = ['/', '/login', '/register', '/ranking'];
export const TRANSPARENT_PATH_PREFIXES = ['/shops/', '/brands/'];

export function isTransparentHeaderPath(pathname) {
  if (typeof pathname !== 'string' || pathname === '') return false;
  // location.pathname に query/hash は入らない想定だが、混ざっても誤判定しないよう落とす。
  const bare = pathname.split('?')[0].split('#')[0];
  // 末尾スラッシュの揺れを吸収する（'/' 自身は残す）。
  const path = bare.length > 1 ? bare.replace(/\/+$/, '') : bare;
  if (TRANSPARENT_EXACT_PATHS.includes(path)) return true;
  return TRANSPARENT_PATH_PREFIXES.some(
    (prefix) => path.startsWith(prefix) && path.length > prefix.length,
  );
}
