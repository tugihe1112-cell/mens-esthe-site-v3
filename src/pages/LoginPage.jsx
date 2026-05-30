import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // 👈 Supabaseの本物認証パイプ
import SeoHead from '../components/SeoHead.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirect || '/mypage';
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

  const fillAccount = (type) => {
    // 💡 先ほどターミナルで作った「本物のマスターID」をセットします
    if (type === 'admin') { 
      setEmail('master@mens-esthe.jp'); 
      setPassword('MasterPassword2026!'); 
    } else {
      setEmail('');
      setPassword('');
      setError('デモ用アカウントは無効化されています。ご自身のアカウントでログインしてください。');
    }
  };

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
          <Link to="/" className="inline-block group">
            <h1 className="text-5xl font-black mb-3 text-white tracking-tighter drop-shadow-2xl group-hover:scale-105 transition duration-500">
              MENS <span className="text-pink-500">ESTHE</span>
            </h1>
          </Link>
          <p className="text-slate-300 font-bold tracking-[0.3em] text-[10px] uppercase opacity-80">
            Enter the Exclusive World
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
              <label className="text-[10px] font-black text-slate-400 ml-2 tracking-widest group-focus-within:text-pink-400 transition">EMAIL</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:border-pink-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-bold tracking-wide shadow-inner" 
                placeholder="vip@example.com" 
              />
            </div>
            
            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-slate-400 ml-2 tracking-widest group-focus-within:text-pink-400 transition">PASSWORD</label>
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
              <span className="relative z-10">{loading ? 'LOGGING IN...' : 'LOGIN'}</span>
              <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition duration-500"></div>
            </button>
          </form>

          <div className="mt-8 text-center pt-4 border-t border-white/5">
              <Link to="/register" className="text-sm text-slate-400 hover:text-white transition group font-medium">
                Don't have an account? <span className="text-pink-400 font-bold border-b border-pink-400/30 group-hover:border-pink-400 pb-0.5 transition-all ml-1">Sign Up</span>
              </Link>
          </div>
        </div>

        {/* Quick Login Helpers */}
        <div className="mt-8 px-4 opacity-50 hover:opacity-100 transition duration-500">
          <p className="text-center text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">Quick Access</p>
          <div className="flex justify-center">
            <button onClick={() => fillAccount('admin')} className="px-6 py-2 bg-slate-900/60 rounded-lg border border-white/5 hover:border-pink-500/50 transition text-[10px] font-bold text-slate-400 hover:text-white">
              Fill Master ID
            </button>
          </div>
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
