import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { normalizeReturnTo } from './authRedirect.js';

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
 * URLのクエリで指定された戻り先を、**マウント後に**読む。
 *
 * ⚠️ 2026-09-08 本番実測で判明した事故。
 *    `/login` `/register` は静的生成（ビルド出力の `○ Static`）なので、
 *    HTMLには `href="/register"`（戻り先なし）が焼き込まれている。
 *    クライアントの初回レンダーが `/register?redirect=...` を計算しても、
 *    **Reactはハイドレーション時の属性の食い違いを直さない**（本番ビルドでは警告も出ない）。
 *    その後に state が変わらなければ再レンダーも起きないので、古い href がDOMに残り続ける。
 *      実測: Reactのpropsは `/register?redirect=%2Fpopular-reviews` なのに
 *            DOMの href は `/register` のままだった。
 *    ＝ ロジックは全部正しいのに、画面上のリンクだけが戻り先を失う。
 *
 * ⚠️ `router.asPath` にクエリが載らないから、ではない。実測では asPath にも
 *    `router.query` にも redirect は入っており、`isReady` も true だった。
 *    2026-09-07 の「静的最適化ページは asPath にクエリが載らない」という記述は誤り。
 *
 * → 初回レンダーはSSRと同じ値（＝空）を返し、マウント後のeffectで実値に切り替える。
 *   これで「本物の再レンダー」が起きるので、Reactが href を書き換える。
 *   useReturnTo（リンクを作る側）が最初から正しく動いていたのは、この形だったから。
 *
 * ⚠️ 検証は境界テストでは捉えられない（DOM属性の更新はReactのハイドレーション挙動）。
 *    本番で「Reactのprops上のhref」と「実DOMのhref」が一致することを実測して確かめること。
 */
export function useRequestedReturnTo(paramName = 'redirect') {
  const router = useRouter();
  const [requested, setRequested] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setRequested(new URLSearchParams(window.location.search || '').get(paramName) || '');
  }, [router.asPath, paramName]);

  return requested;
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
