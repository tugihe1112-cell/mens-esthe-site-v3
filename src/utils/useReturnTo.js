import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { normalizeReturnTo } from './authRedirect.mjs';

/**
 * 「いま見ているページ」を認証後の戻り先として使える形で返す。
 *
 * ⚠️ SSR では空文字を返し、マウント後の effect で埋める。
 *    サーバー側は hash（`#review-123`）を知り得ないので、
 *    初期HTMLに戻り先を書くと必ず hydration が食い違う。
 *    「登録リンクを押す時点で正しければよい」ので、これで足りる。
 *
 * 認証ページ自身（/login・/register・/auth/*）は normalizeReturnTo が弾くため、
 * ログイン画面の「新規登録」リンクが自分自身へ戻るループにはならない。
 */
export function useReturnTo() {
  const router = useRouter();
  const [returnTo, setReturnTo] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    setReturnTo(normalizeReturnTo(current, ''));
  }, [router.asPath]);

  return returnTo;
}

/**
 * クリックした瞬間の現在地を返す（イベントハンドラ用）。
 * ボタンの onClick から呼ぶ場合は state を経由する必要がないのでこちらを使う。
 */
export function currentReturnTo() {
  if (typeof window === 'undefined') return '';
  return normalizeReturnTo(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
    '',
  );
}
