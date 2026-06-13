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

    if (!name || !email || !password || !confirmPassword) { setError("すべての項目を入力してください"); return; }
    if (password !== confirmPassword) { setError("パスワードが一致しません"); return; }
    if (password.length < 8) { setError("パスワードは8文字以上で設定してください"); return; }
    if (!agreeToTerms) { setError("利用規約に同意してください"); return; }

    setIsLoading(true);
    try {
      // サーバーサイドでユーザー作成 + 確認メール送信を一括実行
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
           <Link to="/" className="inline-block group">
            <h1 className="text-4xl font-black mb-2 text-white tracking-tighter drop-shadow-2xl group-hover:text-pink-100 transition">
              JOIN <span className="text-pink-500">VIP</span>
            </h1>
          </Link>
          <p className="text-slate-300 font-bold tracking-[0.2em] text-[10px] uppercase opacity-80">Create New Account</p>
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

            <div className="space-y-1 group">
              <label className="text-[9px] font-black text-slate-400 ml-2 tracking-widest group-focus-within:text-pink-400 transition">USERNAME</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:border-pink-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-bold shadow-inner" placeholder="山田 太郎" />
            </div>

            <div className="space-y-1 group">
              <label className="text-[9px] font-black text-slate-400 ml-2 tracking-widest group-focus-within:text-pink-400 transition">EMAIL</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:border-pink-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-bold shadow-inner" placeholder="example@email.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 group">
                <label className="text-[9px] font-black text-slate-400 ml-2 tracking-widest group-focus-within:text-pink-400 transition">PASSWORD</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:border-pink-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-bold shadow-inner" placeholder="8+ chars" />
              </div>
              <div className="space-y-1 group">
                <label className="text-[9px] font-black text-slate-400 ml-2 tracking-widest group-focus-within:text-pink-400 transition">CONFIRM</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:border-pink-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-bold shadow-inner" placeholder="Re-type" />
              </div>
            </div>

            <div className="flex items-start pt-2 px-1">
              <div className="flex items-center h-5">
                <input id="terms" type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-600 focus:ring-pink-500" />
              </div>
              <label htmlFor="terms" className="ml-3 text-xs text-slate-400 font-medium leading-5">
                <Link to="/terms" className="text-pink-400 hover:underline">利用規約</Link> と <Link to="/privacy" className="text-pink-400 hover:underline">プライバシーポリシー</Link> に同意する
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-lg shadow-lg shadow-pink-900/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 mt-2">
              {isLoading ? "登録中..." : "CREATE ACCOUNT"}
            </button>
          </form>
          )}

          <div className="mt-6 text-center pt-2 border-t border-white/5">
            <p className="text-sm text-slate-400 font-medium">
              Already have an account? <Link to="/login" className="text-pink-400 font-bold hover:text-white transition ml-1 border-b border-pink-400/30 hover:border-white pb-0.5">Login Here</Link>
            </p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link to="/" className="text-[10px] text-slate-500 hover:text-white transition font-bold tracking-widest uppercase">← Back to Home</Link>
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
