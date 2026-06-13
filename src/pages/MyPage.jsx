import React from "react";
import { Link, useNavigate } from '../compat/router';
import { useAuth } from "../contexts/AuthContext";
import { User, LogOut } from "lucide-react";
import Header from "../components/Header"; // 👈 ヘッダーをインポート！
import SeoHead from '../components/SeoHead.jsx';

export default function MyPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    return (
      <>
        <Header /> {/* 👈 ヘッダーを表示！ */}
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-pink-600/10 to-transparent"></div>
          <div className="max-w-md mx-auto relative z-10">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 text-center shadow-2xl">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-4xl border border-white/5 mb-6">🔒</div>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Guest User</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  マイページを利用するには<br/>ログインが必要です。
                </p>
              </div>
              <Link to="/login" className="block w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black text-lg shadow-lg shadow-pink-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                LOGIN / SIGN UP
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead title="マイページ"
        noindex />
      <Header /> {/* 👈 ヘッダーを表示！ */}
      <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition">
              <User size={80} className="text-white" />
            </div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-20 h-20 bg-gradient-to-tr from-pink-600 to-rose-400 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/10">👤</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-white">{user.email.split('@')[0]}</h2>
                  <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-[10px] font-black rounded-full border border-pink-500/30">MASTER</span>
                </div>
                <p className="text-slate-400 text-xs font-medium tracking-wide">{user.email}</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-4 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-400 font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all flex items-center justify-center gap-2 group">
            <LogOut size={18} className="group-hover:translate-x-1 transition" />
            LOGOUT
          </button>
        </div>
      </div>
    </>
  );
}
