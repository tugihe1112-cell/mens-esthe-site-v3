import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from '../compat/router';
import { supabase } from '../lib/supabase';
import SeoHead from '../components/SeoHead.jsx';
import {
  normalizeReturnTo,
  withReturnTo,
  AUTH_RETURN_TO_FALLBACKS,
} from '../utils/authRedirect.mjs';

/**
 * /auth/complete — メール確認のあと Supabase から戻ってくる自社ページ（FIXES.md F01）。
 *
 * 【なぜ必要か】
 * これまで api/auth/signup.js の generateLink は `redirectTo: SITE_URL + '/'` 固定だった。
 * つまり口コミを読んでいた人が登録しても、確認メールを踏んだ先は**必ずホーム**で、
 * 読んでいたページには二度と戻らなかった。
 *
 * 【役割】
 *   1. Supabase SDK がURLからセッションを取り込み終えるのを待つ
 *   2. 確認済みユーザーがいることを確かめる
 *   3. 検証済みの戻り先（next）へ replace で送る
 *
 * ⚠️ `redirectTo` に外部URLを渡させないため、**Supabaseへ渡すのはこの固定パスだけ**。
 *    戻り先は `next` に「検証済みの相対URL」としてのみ載せる。
 *
 * ⚠️ このページは `/auth/confirm` と役割が違う。
 *    - /auth/confirm … token_hash をこのアプリが verifyOtp する（Auth メールHook経路）
 *    - /auth/complete … Supabase 側で検証が終わった後の**着地点**
 *    signup の確認完了はどちらの経路でも最後にここへ来る。
 *    ⚠️ 「確認完了」の計測イベント（U06 の registration_confirmed / registration_return）を
 *       足すときは**このページだけ**に置くこと。/auth/confirm と二重発火させない。
 *       トークンや生URLをイベントに載せないこと。
 */

// SDK がURLのトークンを取り込むのを待つ上限。
// これを超えたら「確認できなかった」として戻り先付きログインへ案内する（無限スピナーにしない）。
const SESSION_TIMEOUT_MS = 12_000;

export default function AuthCompletePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryString = searchParams.toString();
  const [status, setStatus] = useState('checking'); // checking | success | error

  // ⚠️ compat の useSearchParams は asPath を `?` で割るだけなので、
  //    Supabase が付ける `#access_token=...` が**最後のクエリ値に混入する**。
  //    `#` 以降を落としてから解釈する（トークンを値として扱わないためでもある）。
  const params = useMemo(() => new URLSearchParams((queryString || '').split('#')[0]), [queryString]);
  const returnTo = normalizeReturnTo(params.get('next'), AUTH_RETURN_TO_FALLBACKS.signup);
  const authError = params.get('error') || params.get('error_description');

  const returnToRef = useRef(returnTo);
  returnToRef.current = returnTo;

  useEffect(() => {
    // Supabase はエラーをハッシュ側に載せて返すことがある（#error=access_denied...）。
    // ⚠️ 取り出すのは error だけ。access_token をstateやログへ持ち出さない。
    let hashError = null;
    if (typeof window !== 'undefined' && window.location.hash) {
      hashError = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('error');
    }

    // Supabase 側がエラーを付けて戻してきた場合は待たずに案内へ切り替える
    if (authError || hashError) {
      setStatus('error');
      return undefined;
    }

    let active = true;
    let timer;
    let subscription;

    const finish = (session) => {
      if (!active || !session?.user) return;
      active = false;
      window.clearTimeout(timer);
      setStatus('success');
      // replace で戻る（履歴に /auth/complete を残すと「戻る」でここへ戻ってしまう）
      navigate(returnToRef.current, { replace: true });
    };

    // 既に取り込み済みならこちらで即決着する
    supabase.auth.getSession()
      .then(({ data }) => finish(data?.session))
      .catch(() => { /* 取得失敗は下のイベント/タイムアウトに任せる */ });

    // detectSessionInUrl による取り込みは非同期。SIGNED_IN を待つ。
    const listener = supabase.auth.onAuthStateChange((_event, session) => finish(session));
    subscription = listener?.data?.subscription;

    timer = window.setTimeout(() => {
      if (!active) return;
      active = false;
      setStatus('error');
    }, SESSION_TIMEOUT_MS);

    return () => {
      active = false;
      window.clearTimeout(timer);
      subscription?.unsubscribe?.();
    };
  }, [authError, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <SeoHead title="メール確認" noindex />
      <div className="w-full max-w-sm text-center">
        {status === 'checking' && (
          <>
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-white font-bold text-lg">確認しています...</p>
            <p className="text-slate-400 text-sm mt-2">このまま少しお待ちください。</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <p className="text-white font-bold text-xl mb-2">メール確認が完了しました</p>
            <p className="text-slate-400 text-sm">元のページに戻ります...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-white font-bold text-xl mb-2">確認後のログインを完了できませんでした</p>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              メールの確認自体は終わっている場合があります。
              下のボタンからログインすると、続きの操作に進めます。
            </p>
            <Link
              to={withReturnTo('/login', returnTo)}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black transition"
            >
              ログインする
            </Link>
            <Link
              to="/"
              className="mt-4 inline-flex min-h-11 items-center justify-center px-4 text-xs font-bold text-slate-400 hover:text-white transition"
            >
              ホームに戻る
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
