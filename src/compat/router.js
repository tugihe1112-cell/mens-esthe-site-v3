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
export function useSearchParams() {
  const router = useRouter();
  const asPath = router.asPath || '';
  const queryString = asPath.includes('?') ? asPath.split('?')[1] : '';
  const params = new URLSearchParams(queryString);

  const setParams = (updater) => {
    const current = new URLSearchParams(queryString);
    if (typeof updater === 'function') {
      updater(current);
    }
    router.replace(`${router.pathname}?${current.toString()}`, undefined, { shallow: true });
  };

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
