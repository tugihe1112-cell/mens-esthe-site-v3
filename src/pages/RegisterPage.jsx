import React, { useState, useRef } from "react";
import { Link } from '../compat/router';
import SeoHead from '../components/SeoHead.jsx';
import { normalizeReturnTo, withReturnTo } from '../utils/authRedirect.js';
import { useRequestedReturnTo } from '../utils/useReturnTo';

// ⚠️ 内部の例外メッセージを利用者にそのまま出さない（DESIGN.md U03-10）。
//    ただし **4xx はAPIが利用者向けに書いた文言**（「メールアドレスの形式が正しくありません」等）で、
//    握りつぶすと「なぜ送れないのか分からない」状態になる。実際に一度そうなった（2026-09-08）。
//    分けて扱う：
//      - 4xx と 503 … APIの文言をそのまま出してよい（すべて固定の日本語文）
//      - 500 と通信失敗 … `err.message` が混ざるので**絶対に出さない**。固定文言に写す。
const SAFE_API_MESSAGE_STATUS = new Set([400, 401, 403, 404, 409, 422, 429, 503]);
const FORM_ERROR_TEXT = {
  duplicate: 'このメールアドレスは登録済みです。ログインしてください',
  rate_limit: '時間をおいて、もう一度お試しください',
  network: '送信できませんでした。入力内容はそのままで、もう一度お試しください',
  server: '送信できませんでした。入力内容はそのままで、もう一度お試しください',
};

export default function RegisterPage() {
  // ⚠️ 2026-09-07（FIXES.md F01）: 登録画面が戻り先を受け取っていなかった。
  //    口コミを読んで登録した人が、確認メールを踏んだ先で必ずホームに着地していた。
  //    クエリ名は既存の `redirect` に統一する（新しい用語を増やさない）。
  // ⚠️ 2026-09-08: ここを描画時に直接読むと、静的生成されたHTMLに焼かれた
  //    `href="/login"` をReactが上書きできない（ハイドレーションの属性ミスマッチ）。
  //    マウント後に読む useRequestedReturnTo を通すこと。詳細は useReturnTo.js。
  const returnTo = normalizeReturnTo(useRequestedReturnTo('redirect'), '');

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null); // { code, text }
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const refs = {
    name: useRef(null),
    email: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
    terms: useRef(null),
  };

  const validate = (displayName) => {
    const next = {};
    if (!displayName) next.name = '表示名を入力してください';
    else if (displayName.length > 30) next.name = '表示名は30文字以内で入力してください';
    if (!email) next.email = 'メールアドレスを入力してください';
    if (!password) next.password = 'パスワードを入力してください';
    else if (password.length < 8) next.password = 'パスワードは8文字以上で設定してください';
    if (!confirmPassword) next.confirmPassword = '確認用のパスワードを入力してください';
    else if (password !== confirmPassword) next.confirmPassword = 'パスワードが一致しません';
    if (!agreeToTerms) next.terms = '利用規約とプライバシーポリシーへの同意が必要です';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const displayName = name.normalize('NFKC').trim().replace(/\s+/g, ' ');
    const nextErrors = validate(displayName);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // U03-9: 送信後は最初の不正欄へfocusを移す（入力値は消さない）
      const order = ['name', 'email', 'password', 'confirmPassword', 'terms'];
      const first = order.find((k) => nextErrors[k]);
      if (first && refs[first].current) refs[first].current.focus();
      return;
    }

    setIsLoading(true);
    try {
      // サーバーサイドでユーザー作成 + 確認メール送信を一括実行
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // return_to はサーバー側でも normalizeReturnTo で再検証する。
        // クライアントから絶対URLを自由に指定させない設計（FIXES.md F01-5）。
        body: JSON.stringify({ display_name: displayName, email, password, return_to: returnTo }),
      });
      if (!r.ok) {
        let apiMessage = '';
        try {
          const result = await r.json();
          if (typeof result?.error === 'string') apiMessage = result.error.slice(0, 200);
        } catch { /* 本文が読めなくても固定文言で続行する */ }

        if (r.status === 409) {
          setFormError({ code: 'duplicate', text: FORM_ERROR_TEXT.duplicate });
        } else if (r.status === 429) {
          setFormError({ code: 'rate_limit', text: FORM_ERROR_TEXT.rate_limit });
        } else if (SAFE_API_MESSAGE_STATUS.has(r.status) && apiMessage) {
          // 入力の直し方が書かれているのはここ。握りつぶさない。
          setFormError({ code: 'validation', text: apiMessage });
        } else {
          // 500 など。ここで apiMessage を使うと err.message が露出する。
          setFormError({ code: 'server', text: FORM_ERROR_TEXT.server });
        }
        setIsLoading(false);
        return;
      }
      // ⚠️ API成功は「登録完了」ではない。確認メールを送ったところまで。
      setSentTo(email);
      setDone(true);
      setIsLoading(false);
    } catch {
      setFormError({ code: 'network', text: FORM_ERROR_TEXT.network });
      setIsLoading(false);
    }
  };

  const describedBy = (key, helpId) => {
    const ids = [];
    if (helpId) ids.push(helpId);
    if (fieldErrors[key]) ids.push(`${key}-error`);
    return ids.length ? ids.join(' ') : undefined;
  };

  // ⚠️ コンポーネントとして定義するとレンダーのたびに型が変わり、Reactが毎回再マウントする。
  //    ただの関数にして呼び出す。
  const fieldError = (key) =>
    fieldErrors[key] ? (
      <p id={`${key}-error`} className="ui-error mt-1.5">{fieldErrors[key]}</p>
    ) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 relative bg-slate-950">
      <SeoHead title="新規会員登録" noindex />

      {/* ⚠️ U03-1: 背景は紺＋薄いグラデーション**1枚**だけ。
          以前あった 800px の発光レイヤー2枚（animate-pulse-slow で常時動く）は削除した。
          読める文字を写真や光の演出に依存させない。 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 to-slate-950" aria-hidden="true"></div>

      <div className="w-full max-w-md relative z-10">

        <div className="text-center mb-6">
          {/* U03-2: ロゴは24px。ロゴをH1にしない（H1はページの用件） */}
          <Link to="/" className="inline-block text-2xl font-black text-white tracking-tight hover:text-pink-100 transition">
            メンエス<span className="text-pink-500">マップ</span>
          </Link>
          <h1 className="ui-h1 mt-4">無料会員登録</h1>
          <p className="text-pink-300 font-bold text-sm mt-2">登録で3日間、口コミ読み放題</p>
          {/* ⚠️ 「メール確認完了から丸3日」とは書かない。起算はAPIがアカウントを作る時点から72時間。 */}
          <p className="ui-muted mt-1.5">メール確認後に利用できます。閲覧期間は登録手続き時から3日間です。</p>
        </div>

        <div className="ui-card p-5 lg:p-6">

          {done ? (
            <div>
              <p className="text-white font-black text-lg mb-3">確認メールを送信しました</p>
              <p className="ui-muted">
                宛先：<span className="text-pink-300 font-bold break-all">{sentTo}</span>
              </p>
              <ol className="ui-muted mt-4 space-y-1.5 list-decimal list-inside">
                <li>メールを開く</li>
                <li>メール内のリンクを押す</li>
              </ol>
              <p className="ui-muted mt-4">届かない場合は迷惑メールフォルダも確認してください。</p>
              {returnTo && (
                <p className="text-emerald-300 mt-3" style={{ fontSize: '13px', lineHeight: 1.7 }}>
                  確認後、先ほどのページに戻ります。
                </p>
              )}
              {/* ⚠️ 「メールを修正して再登録」は置かない。アカウントは既に作られているので
                     新規アカウントが増えるだけになる。再送機能もバックエンドが無いので作らない。 */}
              <div className="mt-6 flex flex-col gap-3">
                <Link to={withReturnTo('/login', returnTo)} className="ui-btn-primary w-full">ログインする</Link>
                <Link to="/contact" className="ui-link text-center inline-flex items-center justify-center min-h-11" style={{ fontSize: '13px' }}>
                  メールアドレスを間違えた場合はお問い合わせ
                </Link>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div role="alert" className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-3">
                <p className="ui-error">{formError.text || FORM_ERROR_TEXT.server}</p>
                {formError.code === 'duplicate' && (
                  <Link to={withReturnTo('/login', returnTo)} className="ui-link inline-flex items-center min-h-11" style={{ fontSize: '13px' }}>
                    ログインページへ
                  </Link>
                )}
              </div>
            )}

            {/* ⚠️ 2026-08-17: プレースホルダが「山田 太郎」＝**本名の例**だった。
                   この業種で本名入力を誘導するのは危険で、実際に投稿者名として公開される項目。
                   ニックネーム例に変更し、「公開される」ことをその場で明示している。 */}
            <div>
              <label htmlFor="display-name" className="ui-label">表示名（ニックネーム）</label>
              <input
                id="display-name" name="display_name" ref={refs.name} type="text" required
                value={name} onChange={(e) => setName(e.target.value)} maxLength={30}
                autoComplete="nickname"
                aria-invalid={fieldErrors.name ? 'true' : undefined}
                aria-describedby={describedBy('name', 'display-name-help')}
                className="ui-field mt-1.5" placeholder="例）メンエス浪人"
              />
              <p id="display-name-help" className="ui-help mt-1.5">口コミの投稿者名として公開されます。1〜30文字。本名は避けてください</p>
              {fieldError('name')}
            </div>

            <div>
              <label htmlFor="email" className="ui-label">メールアドレス</label>
              <input
                id="email" name="email" ref={refs.email} type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" autoCapitalize="none" spellCheck={false}
                aria-invalid={fieldErrors.email ? 'true' : undefined}
                aria-describedby={describedBy('email')}
                className="ui-field mt-1.5" placeholder="example@email.com"
              />
              {fieldError('email')}
            </div>

            {/* U03-3: スマホ・PCとも1列。確認欄は残す */}
            <div>
              <label htmlFor="password" className="ui-label">パスワード</label>
              <div className="relative mt-1.5">
                <input
                  id="password" name="new-password" ref={refs.password}
                  type={showPassword ? 'text' : 'password'} required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={fieldErrors.password ? 'true' : undefined}
                  aria-describedby={describedBy('password')}
                  className="ui-field pr-14" placeholder="8文字以上"
                />
                {/* ⚠️ type=button（submitにしない）。切り替えても値は消さない。
                       パスワードマネージャーと貼り付けを妨げない。 */}
                <button
                  type="button" onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                  className="ui-tap absolute right-1 top-1/2 -translate-y-1/2 rounded-lg text-slate-300 hover:text-white"
                  style={{ fontSize: '13px' }}
                >
                  {showPassword ? '隠す' : '表示'}
                </button>
              </div>
              {fieldError('password')}
            </div>

            <div>
              <label htmlFor="confirm-password" className="ui-label">パスワード（確認）</label>
              <div className="relative mt-1.5">
                <input
                  id="confirm-password" name="confirm-password" ref={refs.confirmPassword}
                  type={showConfirm ? 'text' : 'password'} required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={fieldErrors.confirmPassword ? 'true' : undefined}
                  aria-describedby={describedBy('confirmPassword')}
                  className="ui-field pr-14" placeholder="もう一度入力"
                />
                <button
                  type="button" onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? '確認用パスワードを隠す' : '確認用パスワードを表示'}
                  className="ui-tap absolute right-1 top-1/2 -translate-y-1/2 rounded-lg text-slate-300 hover:text-white"
                  style={{ fontSize: '13px' }}
                >
                  {showConfirm ? '隠す' : '表示'}
                </button>
              </div>
              {fieldError('confirmPassword')}
            </div>

            <div className="pt-1">
              <div className="flex items-start gap-3">
                <input
                  id="terms" name="terms" ref={refs.terms} type="checkbox"
                  checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)}
                  aria-invalid={fieldErrors.terms ? 'true' : undefined}
                  aria-describedby={describedBy('terms')}
                  className="w-5 h-5 mt-0.5 shrink-0 rounded border-slate-600 bg-slate-800 text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="terms" className="ui-help">
                  {/* U03-8: 新しいタブで開く＝入力を保持する */}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="ui-link">利用規約</a>
                  {' と '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="ui-link">プライバシーポリシー</a>
                  {' に同意する'}
                </label>
              </div>
              {fieldError('terms')}
            </div>

            {/* U03-7: 入力→メール確認の2段階であることをボタンの直前で伝える */}
            <p className="ui-help pt-1">
              送信すると確認メールが届きます。メール内のリンクを押すと登録が完了します。
            </p>

            <button type="submit" disabled={isLoading} className="ui-btn-primary w-full">
              {isLoading ? "送信中…" : "確認メールを送る"}
            </button>
          </form>
          )}

          {!done && (
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <p className="ui-help">
                すでにアカウントをお持ちの方は
                <Link to={withReturnTo('/login', returnTo)} className="ui-link ml-1 inline-flex items-center min-h-11">ログイン</Link>
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="ui-link inline-flex items-center justify-center min-h-11" style={{ fontSize: '13px' }}>← ホームに戻る</Link>
        </div>
      </div>
    </div>
  );
}
