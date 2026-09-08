import React, { useState, useRef } from "react";
import { useNavigate, useLocation, Link } from '../compat/router';
import { useAuth } from "../contexts/AuthContext"; // 👈 Supabaseの本物認証パイプ
import SeoHead from '../components/SeoHead.jsx';
import { supabase } from '../lib/supabase';
import { normalizeReturnTo, withReturnTo, AUTH_RETURN_TO_FALLBACKS } from '../utils/authRedirect.mjs';
import { useRequestedReturnTo } from '../utils/useReturnTo';

const SITE_URL = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // redirectはクエリ(?redirect=/post-review)で受け取る（compatはstateを渡せないため）。旧state経路もフォールバックで残す。
  // ⚠️ 2026-09-07（FIXES.md F01）: ここに書かれていた自前の検証を
  //    src/utils/authRedirect.mjs の normalizeReturnTo に一本化した。
  //    バックスラッシュ・二重エンコード・認証ページ自身へのループが素通りしていたため。
  //    判定を各ファイルに散らすと必ずどこかが緩くなる（D-011 と同じ考え方）。
  // ⚠️ 2026-09-08: ここを描画時に直接読むと、静的生成されたHTMLに焼かれた
  //    `href="/register"` をReactが上書きできない（ハイドレーションの属性ミスマッチ）。
  //    マウント後に読む useRequestedReturnTo を通すこと。詳細は useReturnTo.js。
  const requestedRedirect = useRequestedReturnTo('redirect') || location.state?.redirect;
  const redirectTo = normalizeReturnTo(requestedRedirect, AUTH_RETURN_TO_FALLBACKS.login);
  // 新規登録リンクへ引き継ぐ戻り先（未指定＝/mypage のときは付けない）
  const returnTo = normalizeReturnTo(requestedRedirect, '');
  const { signIn } = useAuth(); // 👈 本物のログイン関数
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      // U03-9: 送信後は最初の不正欄へfocusを移す（入力値は消さない）
      const target = !email ? emailRef.current : passwordRef.current;
      if (target) target.focus();
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      // 🚀 Supabaseに本物のログインリクエストを送信
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        throw signInError;
      }

      // ログイン成功したらリダイレクト先（または/mypage）へ
      navigate(redirectTo);
    } catch (err) {
      console.error("Login Error:", err);
      // エラーメッセージの日本語化
      // ⚠️ 2026-09-08（DESIGN.md U03-10）: 以前は `"ログインに失敗しました: " + err.message`
      //    としており、Supabaseの内部メッセージをそのまま画面に出していた。
      //    利用者が次に何をすればよいか分からないうえ、内部実装を露出させる。
      if (err?.message?.includes("Invalid login credentials")) {
        setError("メールアドレスまたはパスワードが間違っています");
      } else if (err?.message?.includes("Email not confirmed")) {
        setError("メールの確認がまだ完了していません。確認メールのリンクを押してください");
      } else {
        setError("ログインできませんでした。時間をおいて、もう一度お試しください");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setError('');
    setResetSent(false);
    if (!normalizedEmail) {
      setError('再設定メールを送るメールアドレスを入力してください');
      return;
    }
    setResetLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${SITE_URL}/reset-password`,
    });
    setResetLoading(false);
    if (resetError) {
      setError('再設定メールを送信できませんでした。時間をおいてお試しください。');
      return;
    }
    // アカウントの有無を第三者へ漏らさない共通表示にする。
    setResetSent(true);
  };

  // ⚠️ 2026-08-12 削除: ここに管理者のメールとパスワードを**平文でハードコード**し、
  //    それを「Fill Master ID」ボタンから誰でも入力できる状態で本番配信していた。
  //    パスワード文字列は配信中のJSチャンク（login-*.js）にそのまま含まれており、
  //    ログインページを開いてボタンを押すだけで誰でも管理者になれた
  //    （/admin へのアクセス・クレジット付与・口コミ削除が可能）。
  //    テスト用の入力補助を本番に残してはいけない。復活させないこと。

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 relative bg-slate-950">
      <SeoHead title="会員ログイン・アカウント認証" noindex />

      {/* ⚠️ U03-1: 背景は紺＋薄いグラデーション**1枚**。
          以前あった 800px の発光レイヤー2枚（animate-pulse-slow で常時動く）は削除した。 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 to-slate-950" aria-hidden="true"></div>

      <div className="w-full max-w-md relative z-10">

        <div className="text-center mb-6">
          {/* U03-2: ロゴは24px。ロゴをH1にしない */}
          <Link to="/" className="inline-block text-2xl font-black text-white tracking-tight hover:text-pink-100 transition">
            メンエス<span className="text-pink-500">マップ</span>
          </Link>
          <h1 className="ui-h1 mt-4">ログイン</h1>
        </div>

        <div className="ui-card p-5 lg:p-6">

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-3">
                <p className="ui-error">{error}</p>
              </div>
            )}
            {resetSent && (
              <div role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
                <p className="ui-help text-emerald-100">登録済みの場合は、パスワード再設定メールが届きます。</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="ui-label">メールアドレス</label>
              <input
                id="email" name="email" ref={emailRef} type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" autoCapitalize="none" spellCheck={false}
                className="ui-field mt-1.5" placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="ui-label">パスワード</label>
              <div className="relative mt-1.5">
                <input
                  id="password" name="password" ref={passwordRef}
                  type={showPassword ? 'text' : 'password'} required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="ui-field pr-14" placeholder="パスワード"
                />
                {/* ⚠️ type=button（submitにしない）。切り替えても値は消さない。 */}
                <button
                  type="button" onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                  className="ui-tap absolute right-1 top-1/2 -translate-y-1/2 rounded-lg text-slate-300 hover:text-white"
                  style={{ fontSize: '13px' }}
                >
                  {showPassword ? '隠す' : '表示'}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={resetLoading}
                  className="ui-link inline-flex items-center min-h-11 px-1 disabled:opacity-50"
                  style={{ fontSize: '13px' }}
                >
                  {resetLoading ? '送信中…' : 'パスワードを忘れた方'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="ui-btn-primary w-full">
              {loading ? 'ログイン中…' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            {/* ⚠️ F01: 戻り先を新規登録へ引き継ぐ。withReturnTo を外さないこと。 */}
            <Link to={withReturnTo('/register', returnTo)} className="ui-help inline-flex items-center justify-center min-h-11">
              アカウントをお持ちでない方は<span className="ui-link ml-1">新規登録</span>
            </Link>
          </div>
        </div>

        {/* ⚠️ 2026-08-12 削除: 「Quick Access / Fill Master ID」ボタン。
            管理者の認証情報を平文で埋め込んで本番配信していた重大な脆弱性のため撤去。
            開発用の入力補助が必要な場合も、本番バンドルに認証情報を含めてはいけない。 */}

        <div className="mt-6 text-center">
          <Link to="/" className="ui-link inline-flex items-center justify-center min-h-11" style={{ fontSize: '13px' }}>← ホームに戻る</Link>
        </div>
      </div>
    </div>
  );
}
