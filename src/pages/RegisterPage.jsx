import React, { useState } from "react";
import { useNavigate, Link } from '../compat/router';
import SeoHead from '../components/SeoHead.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const displayName = name.normalize('NFKC').trim().replace(/\s+/g, ' ');
    if (!displayName || !email || !password || !confirmPassword) { setError("すべての項目を入力してください"); return; }
    if (displayName.length > 30) { setError("表示名は30文字以内で入力してください"); return; }
    if (password !== confirmPassword) { setError("パスワードが一致しません"); return; }
    if (password.length < 8) { setError("パスワードは8文字以上で設定してください"); return; }
    if (!agreeToTerms) { setError("利用規約に同意してください"); return; }

    setIsLoading(true);
    try {
      // サーバーサイドでユーザー作成 + 確認メール送信を一括実行
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, email, password }),
      });
      const result = await r.json();
      if (!r.ok) {
        setError(result.error || '登録に失敗しました');
        setIsLoading(false);
        return;
      }
      setDone(true);
    } catch (err) {
      if (err.message?.includes("User already registered")) {
        setError("このメールアドレスはすでに登録されています");
      } else {
        setError(err.message || "登録に失敗しました。もう一度お試しください");
        setIsLoading(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden bg-slate-950">
      <SeoHead title="新規会員登録" noindex />
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-40 animate-slow-zoom"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950"></div> 
      </div>

      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-800/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow delay-1000"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="text-center mb-8">
          {/* ⚠️ 2026-08-18: 見出しが `JOIN VIP` だった。日本語サイトに英語という以前に、
                 **VIPという会員種別は実在しない**（プレミアムは準備中で価格表示も外してある）。
                 入口で無いものを約束しないこと。ブランド名に統一し、
                 副題には実際に得られるもの（登録で3日間の閲覧権＝api/auth/signup.js の credits_days:3）を書く。
                 h1 は <Link to="/"> でロゴ兼ホーム導線を兼ねているので構造は変えない。 */}
          <Link to="/" className="inline-block group">
            <h1 className="text-4xl font-black mb-2 text-white tracking-tighter drop-shadow-2xl group-hover:text-pink-100 transition">
              メンエス<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">マップ</span>
            </h1>
          </Link>
          <p className="text-slate-300 font-bold text-sm">無料会員登録</p>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            登録するだけで<b className="text-pink-300">3日間</b>、口コミが読み放題になります
          </p>
        </div>

        {/* Glass Card */}
        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
          
          {done ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📧</div>
              <p className="text-white font-black text-lg mb-2">確認メールを送信しました</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                <span className="text-pink-400 font-bold">{email}</span> に届いたメールのリンクをタップすると登録が完了します。
              </p>
              <Link to="/login" className="mt-6 inline-block text-pink-400 font-bold text-sm hover:underline">ログインページへ →</Link>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl p-3 text-sm font-bold text-center shadow-lg">
                ⚠️ {error}
              </div>
            )}

            {/* ⚠️ 2026-08-17 修正: ラベルが英語＋9px、しかも表示名のプレースホルダが
                   「山田 太郎」＝**本名の例**だった。この業種で本名入力を誘導するのは危険で、
                   実際には口コミ投稿者名として公開される項目。ニックネーム例に変更し、
                   「公開される」ことをその場で明示する。登録者2人の段階で、ここは
                   サイトで最も重要な入口。 */}
            <div className="space-y-1 group">
              <label className="text-[11px] font-black text-slate-300 ml-2 group-focus-within:text-pink-400 transition">表示名（ニックネーム）</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoComplete="nickname" className="w-full p-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:border-pink-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-bold shadow-inner" placeholder="例）メンエス浪人" />
              <p className="text-[11px] text-slate-500 ml-2 leading-relaxed">口コミの投稿者名として公開されます。本名は避けてください</p>
            </div>

            <div className="space-y-1 group">
              <label className="text-[11px] font-black text-slate-300 ml-2 group-focus-within:text-pink-400 transition">メールアドレス</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:border-pink-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-bold shadow-inner" placeholder="example@email.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 group min-w-0">
                <label className="text-[11px] font-black text-slate-300 ml-2 group-focus-within:text-pink-400 transition">パスワード</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:border-pink-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-bold shadow-inner" placeholder="8文字以上" />
              </div>
              <div className="space-y-1 group min-w-0">
                <label className="text-[11px] font-black text-slate-300 ml-2 group-focus-within:text-pink-400 transition">パスワード（確認）</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:border-pink-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-bold shadow-inner" placeholder="もう一度入力" />
              </div>
            </div>

            <div className="flex items-start pt-2 px-1">
              <div className="flex items-center h-5">
                <input id="terms" type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-600 focus:ring-pink-500" />
              </div>
              <label htmlFor="terms" className="ml-3 text-xs text-slate-400 font-medium leading-5">
                <Link to="/terms" className="text-pink-400 hover:underline inline-block py-3 -my-3 px-1">利用規約</Link> と <Link to="/privacy" className="text-pink-400 hover:underline inline-block py-3 -my-3 px-1">プライバシーポリシー</Link> に同意する
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-lg shadow-lg shadow-pink-900/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 mt-2">
              {isLoading ? "登録中..." : "無料で登録する"}
            </button>
          </form>
          )}

          <div className="mt-6 text-center pt-2 border-t border-white/5">
            <p className="text-sm text-slate-400 font-medium">
              すでにアカウントをお持ちの方は<Link to="/login" className="text-pink-400 font-bold hover:text-white transition ml-1 border-b border-pink-400/30 hover:border-white inline-block py-3 -my-3 px-1">ログイン</Link>
            </p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-white transition font-bold inline-block py-3 -my-3 px-3">← ホームに戻る</Link>
        </div>
      </div>
      <style>{`
        @keyframes slow-zoom { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
        .animate-slow-zoom { animation: slow-zoom 20s infinite alternate linear; }
        .animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div>
  );
}
