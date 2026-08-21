import React, { useState } from "react";
import { useNavigate, useLocation, Link } from '../compat/router';
import { useAuth } from "../contexts/AuthContext"; // 👈 Supabaseの本物認証パイプ
import SeoHead from '../components/SeoHead.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // redirectはクエリ(?redirect=/post-review)で受け取る（compatはstateを渡せないため）。旧state経路もフォールバックで残す。
  // 外部URLや //example.com は受け付けず、同一サイト内の絶対パスだけを許可する。
  const requestedRedirect = new URLSearchParams(location.search || '').get('redirect')
    || location.state?.redirect;
  const redirectTo = typeof requestedRedirect === 'string'
    && requestedRedirect.startsWith('/')
    && !requestedRedirect.startsWith('//')
    && !/[\r\n]/.test(requestedRedirect)
    ? requestedRedirect
    : '/mypage';
  const { signIn } = useAuth(); // 👈 本物のログイン関数
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { 
      setError("メールアドレスとパスワードを入力してください"); 
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
      if (err.message.includes("Invalid login credentials")) {
        setError("メールアドレスまたはパスワードが間違っています");
      } else {
        setError("ログインに失敗しました: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ 2026-08-12 削除: ここに管理者のメールとパスワードを**平文でハードコード**し、
  //    それを「Fill Master ID」ボタンから誰でも入力できる状態で本番配信していた。
  //    パスワード文字列は配信中のJSチャンク（login-*.js）にそのまま含まれており、
  //    ログインページを開いてボタンを押すだけで誰でも管理者になれた
  //    （/admin へのアクセス・クレジット付与・口コミ削除が可能）。
  //    テスト用の入力補助を本番に残してはいけない。復活させないこと。

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      <SeoHead title="ログイン" noindex />
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-40 animate-slow-zoom"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950"></div> 
      </div>

      {/* Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow delay-1000"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Header */}
        <div className="text-center mb-10">
          {/* ブランド表記はヘッダーのロゴと同じ「メンエスマップ」に統一（2026-08-18）。
              以前は `MENS ESTHE` で、サイト名とも表記が違っていた。 */}
          <Link to="/" className="inline-block group">
            <h1 className="text-4xl font-black mb-3 text-white tracking-tighter drop-shadow-2xl group-hover:scale-105 transition duration-500">
              メンエス<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">マップ</span>
            </h1>
          </Link>
          <p className="text-slate-300 font-bold text-sm">
            ログイン
          </p>
        </div>

        {/* Glass Card */}
        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          {/* Top Shine */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent opacity-50"></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl p-3 text-sm font-bold text-center shadow-lg animate-shake">
                ⚠️ {error}
              </div>
            )}
            
            <div className="space-y-2 group">
              <label className="text-[11px] font-black text-slate-300 ml-2 group-focus-within:text-pink-400 transition">メールアドレス</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:border-pink-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-bold tracking-wide shadow-inner" 
                placeholder="vip@example.com" 
              />
            </div>
            
            <div className="space-y-2 group">
              <label className="text-[11px] font-black text-slate-300 ml-2 group-focus-within:text-pink-400 transition">パスワード</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:border-pink-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-bold tracking-wide shadow-inner" 
                placeholder="••••••••" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-lg shadow-lg shadow-pink-900/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">{loading ? 'ログイン中...' : 'ログイン'}</span>
              <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition duration-500"></div>
            </button>
          </form>

          <div className="mt-8 text-center pt-4 border-t border-white/5">
              <Link to="/register" className="text-sm text-slate-400 hover:text-white transition group font-medium inline-block py-3">
                アカウントをお持ちでない方は<span className="text-pink-400 font-bold border-b border-pink-400/30 group-hover:border-pink-400 transition-all ml-1">新規登録</span>
              </Link>
          </div>
        </div>

        {/* Quick Login Helpers */}
        {/* ⚠️ 2026-08-12 削除: 「Quick Access / Fill Master ID」ボタン。
            管理者の認証情報を平文で埋め込んで本番配信していた重大な脆弱性のため撤去。
            開発用の入力補助が必要な場合も、本番バンドルに認証情報を含めてはいけない。 */}

      </div>
      <style>{`
        @keyframes slow-zoom { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
        .animate-slow-zoom { animation: slow-zoom 20s infinite alternate linear; }
        .animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div>
  );
}
