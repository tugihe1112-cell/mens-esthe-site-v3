/**
 * react-router-dom 互換レイヤー
 *
 * Next.js Pages Router の useRouter に橋渡しする。
 * 既存コンポーネントの import 先を
 *   'react-router-dom'  →  '../compat/router'（相対パスは各ファイルで調整）
 * に変えるだけで動くよう設計。
 */
import React from 'react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
// ⚠️ クエリ更新の判定ロジックは queryString.js に切り出してある（CIでテストするため）。
//    ここに戻すとテストできなくなり、2026-08-22 の無限ループ事故が再発しうる。
import { buildNextQueryString } from './queryString';

// ── useNavigate ──────────────────────────────────────
export function useNavigate() {
  const router = useRouter();
  return (to, options = {}) => {
    // react-router の navigate(-1) / navigate(1) 等（履歴移動）を Next.js に橋渡し。
    // ※以前は数値をそのまま router.push(-1) に渡していて何も起きなかった（＝「戻る」ボタンが無反応だった）。
    if (typeof to === 'number') {
      if (typeof window === 'undefined') { router.back(); return; }
      let hasNav = false;
      try { hasNav = !!sessionStorage.getItem('hasInternalNav'); } catch { /* noop */ }
      // 直リンク/新規タブ（アプリ内遷移なし=履歴に戻り先が無い）で navigate(-1) すると無反応になるため、ホームへフォールバック
      if (to < 0 && !hasNav) { router.push('/'); return; }
      window.history.go(to);
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

// ── useParams ────────────────────────────────────────
export function useParams() {
  const router = useRouter();
  return router.query || {};
}

// ── useLocation ──────────────────────────────────────
export function useLocation() {
  const router = useRouter();
  const asPath = router.asPath || '';
  const [pathname, search] = asPath.split('?');
  return {
    pathname: pathname || '/',
    search: search ? `?${search}` : '',
    hash: '',
    state: null,
  };
}

// ── useSearchParams ───────────────────────────────────
/**
 * ⚠️ 2026-08-22: ここに**無限ループのバグが2つ**あった（本番でページがチカチカしていた）。
 *
 *  ① 毎レンダーで `params` と `setParams` を**新しく作っていた**。
 *     呼び出し側は `useEffect(..., [shopInput, castInput, selectedTags, setSearchParams])`
 *     のように setSearchParams を依存配列に入れるため、**毎レンダーで effect が発火**する。
 *  ② `setParams` が**関数以外の引数を無視**していた。
 *     react-router の `setSearchParams({shop: 'x'})` というオブジェクト呼び出しが
 *     一切反映されず、**同じURLのまま router.replace** を呼び続けていた。
 *
 *  ①+② の結果、「effect発火 → replace → 再レンダー → effect発火 …」が延々と回り、
 *  実測で **3秒間に400回** の history.replaceState が走っていた。
 *  RouteProgress（遷移バー）も毎回出入りするので、画面全体がチカチカする。
 *
 * 【修正方針】
 *  - `params` / `setParams` を **useMemo / useCallback で安定させる**
 *  - オブジェクト・URLSearchParams・関数・配列すべてを受け付ける（react-router 互換）
 *  - **URLが変わらないなら replace しない**（ループの最後の砦。ここは外さないこと）
 */
export function useSearchParams() {
  const router = useRouter();
  const asPath = router.asPath || '';
  const queryString = asPath.includes('?') ? asPath.split('?')[1] : '';

  // queryString が同じ間は同じインスタンスを返す（依存配列に入れても再発火しない）
  const params = React.useMemo(() => new URLSearchParams(queryString), [queryString]);

  // ⚠️ router をそのまま useCallback の依存に入れると、router の同一性が変わった瞬間に
  //    setParams も作り直され、①の問題が再発しうる。ref 経由にして依存から外す。
  const routerRef = React.useRef(router);
  routerRef.current = router;

  const setParams = React.useCallback((nextInit) => {
    const nextQs = buildNextQueryString(queryString, nextInit);
    if (nextQs === null) return; // 変化なし＝replaceしない（ループの最後の砦）

    const r = routerRef.current;
    // ⚠️ router.pathname は動的ルートだと `/shops/[shopId]` のようなテンプレート。
    //    実URLに書き戻すので asPath 側（`?` より前）を使うこと。
    const basePath = (r.asPath || r.pathname || '/').split('?')[0];
    r.replace(nextQs ? `${basePath}?${nextQs}` : basePath, undefined, { shallow: true });
  }, [queryString]);

  return [params, setParams];
}

// ── NavLink ──────────────────────────────────────────
// react-router-dom の NavLink（isActive コールバック付き）を Next.js で再現
export const NavLink = React.forwardRef(function NavLink(
  { to, href, children, className, style, onClick, ...rest },
  ref
) {
  const router = useRouter();
  const destination = to || href || '/';
  const isActive = router.pathname === destination ||
    (destination !== '/' && router.asPath.startsWith(destination));

  // className が関数の場合（({ isActive }) => ...）
  const resolvedClassName = typeof className === 'function'
    ? className({ isActive })
    : className;

  // children が関数の場合（({ isActive }) => ...）
  const resolvedChildren = typeof children === 'function'
    ? children({ isActive })
    : children;

  return (
    <NextLink
      href={destination}
      ref={ref}
      className={resolvedClassName}
      style={style}
      onClick={onClick}
      {...rest}
    >
      {resolvedChildren}
    </NextLink>
  );
});
NavLink.displayName = 'NavLink';

// ── Link ─────────────────────────────────────────────
// react-router-dom の <Link to="..."> を Next.js の <Link href="..."> に変換
export const Link = React.forwardRef(function Link(
  { to, href, children, className, style, onClick, replace, state, ...rest },
  ref
) {
  const destination = to || href || '/';
  return (
    <NextLink
      href={destination}
      ref={ref}
      className={className}
      style={style}
      onClick={onClick}
      replace={replace}
      {...rest}
    >
      {children}
    </NextLink>
  );
});
Link.displayName = 'Link';

// ── Navigate ─────────────────────────────────────────
export function Navigate({ to, replace }) {
  const router = useRouter();
  React.useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ── BrowserRouter / Routes / Route ───────────────────
// Next.js では不要だが、誤ってインポートされても壊れないようダミーを提供
export function BrowserRouter({ children }) { return children; }
export function Routes({ children }) { return children; }
export function Route() { return null; }

// デフォルトエクスポートなし（named exports のみ）
