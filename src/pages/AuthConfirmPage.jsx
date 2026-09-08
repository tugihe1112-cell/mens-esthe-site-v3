import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from '../compat/router';
import { supabase } from '../lib/supabase';
import SeoHead from '../components/SeoHead.jsx';
import {
  normalizeReturnTo,
  withReturnTo,
  authCompletePath,
  AUTH_RETURN_TO_FALLBACKS,
} from '../utils/authRedirect.js';
import { createOtpVerifier } from '../features/auth/verifyOtpOnce.mjs';

/**
 * /auth/confirm — Supabase の Auth メールHook経路（token_hash + type）を検証するページ。
 *
 * ⚠️ 通常登録API（api/auth/signup.js）が発行する action_link とは**別経路**。
 *    action_link は Supabase 側で検証されたあと /auth/complete へ戻ってくる。
 *    ここは token_hash を**このページ自身が verifyOtp する**用途に限定し、混ぜない。
 *
 * 【2026-09-07 の修正（FIXES.md F02）】
 * 「成功したのに『リンクが無効です』になりうる」経路があった:
 *   1. compat の useNavigate が毎レンダー新しい関数を返す
 *   2. その navigate が effect の依存配列に入っている
 *   3. verifyOtp 成功 → setStatus('success') → 再レンダー → navigate が別関数
 *      → effect が cleanup（遷移タイマー解除）されて再実行
 *      → **使用済みのワンタイムトークンで再検証** → error 表示に化ける
 * → (1) は compat/router.js 側で修正。ここでは
 *    (a) 検証と遷移を別 effect に分ける
 *    (b) token+type ごとの進行中 promise をモジュールに保持して二重検証を防ぐ
 *    (c) 非同期 reject も catch して「確認中」で固まらせない
 *   を行う。
 */

/**
 * token+type ごとの検証を1回に畳む。**モジュールスコープに置くのが要点**。
 * React 18 StrictMode の setup → cleanup → setup では ref もマウント境界で作り直されるため、
 * 「一度呼んだフラグを ref に立てて即 return」だと
 * 2回目の setup が結果を受け取れず、永久に「確認中」になる。
 * 進行中の promise 自体を共有すれば、2回目の setup も同じ結果を受け取れる。
 * 判定ロジックは CI から実行して検査するため verifyOtpOnce.mjs に置いてある。
 */
const verifyOnce = createOtpVerifier((args) => supabase.auth.verifyOtp(args));

export default function AuthConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryString = searchParams.toString();
  const [status, setStatus] = useState('confirming'); // confirming | success | error
  const [hasSession, setHasSession] = useState(false);

  // `#` 以降を落としてから解釈する（compat の useSearchParams は asPath を `?` で割るだけで、
  // ハッシュが最後のクエリ値に混ざる。トークンを値として扱わないためでもある）
  const params = useMemo(() => new URLSearchParams((queryString || '').split('#')[0]), [queryString]);
  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  const returnTo = normalizeReturnTo(params.get('next'), '');

  // recovery は従来どおり再設定画面へ。signup は F01 の完了ページへ渡し、
  // 「確認完了」の計測と戻り先復帰の担当を1か所に集約する。
  const destination = type === 'recovery'
    ? (returnTo || AUTH_RETURN_TO_FALLBACKS.recovery)
    : authCompletePath(returnTo || AUTH_RETURN_TO_FALLBACKS.signup, 'signup');
  const destinationRef = useRef(destination);
  destinationRef.current = destination;

  // ── effect A: 検証だけを行う（status を依存に入れない） ──────────────
  useEffect(() => {
    let active = true;
    if (!tokenHash || !type) {
      setStatus('error');
      return undefined;
    }
    setStatus('confirming');
    verifyOnce(tokenHash, type).then((result) => {
      if (!active) return;
      if (result.ok) {
        setStatus('success');
      } else {
        // ⚠️ トークンはログにもGAにも出さない
        console.error('[auth/confirm] 確認に失敗:', result.message);
        setStatus('error');
      }
    });
    return () => { active = false; };
  }, [tokenHash, type]);

  // ── effect B: 成功したときだけ遷移する ─────────────────────────
  // 遷移タイマーはこちらが持つ。検証 effect が再実行されても解除されない。
  useEffect(() => {
    if (status !== 'success') return undefined;
    const timer = window.setTimeout(() => navigate(destinationRef.current, { replace: true }), 1200);
    return () => window.clearTimeout(timer);
  }, [status, navigate]);

  // ── 失敗時: すでに確認済みセッションがあるなら続行できるようにする ─────
  useEffect(() => {
    if (status !== 'error') return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(Boolean(data?.session?.user));
    }).catch(() => { /* セッション取得失敗は「無し」として扱う */ });
    return () => { active = false; };
  }, [status]);

  const loginHref = withReturnTo('/login', returnTo);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <SeoHead title="メール確認" noindex />
      <div className="w-full max-w-sm text-center">
        {status === 'confirming' && (
          <>
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-white font-bold text-lg">確認中...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <p className="text-white font-bold text-xl mb-2">メール確認完了</p>
            <p className="text-slate-400 text-sm">続きの画面へ移動します...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <p className="text-white font-bold text-xl mb-2">リンクを確認できませんでした</p>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              有効期限が切れているか、すでに使用済みのリンクです。
            </p>

            {/* すでにログイン済みなら、リンクが使用済みでも先へ進める */}
            {hasSession && (
              <button
                type="button"
                onClick={() => navigate(destinationRef.current, { replace: true })}
                className="w-full min-h-12 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black transition"
              >
                このまま続ける
              </button>
            )}

            {/* ⚠️ 「もう一度登録する」を唯一の操作にしない。
                   同じメールで再登録すると api/auth/signup.js が 409 を返すため、
                   多くの人にとって行き止まりになる。主操作はログイン。 */}
            {!hasSession && (
              type === 'recovery' ? (
                <Link
                  to="/login"
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black transition"
                >
                  パスワード再設定をやり直す
                </Link>
              ) : (
                <Link
                  to={loginHref}
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black transition"
                >
                  ログインする
                </Link>
              )
            )}

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
