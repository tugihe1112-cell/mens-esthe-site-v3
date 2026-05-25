import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppContext } from "../context/AppContext.tsx";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAppContext();
  const { user: authUser } = useAuth(); // 👈 Supabaseの本物ユーザー
  
  // --- スクロール & 表示制御 ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // スクロール検知
      setIsScrolled(currentScrollY > 10);

      // 下スクロールで隠し、上スクロールで表示
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- モバイルメニュー制御 ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ページ遷移時にメニューを閉じる
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // トップページなど、初期状態で背景を透過させたいページ
  const isTransparentPage = ['/', '/shops/', '/login', '/register'].some(path => location.pathname === path || location.pathname.startsWith(path));

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled
            ? 'bg-slate-900/95 backdrop-blur-xl shadow-lg border-b border-white/10 py-3' // スクロール時: 濃い背景
            : isTransparentPage && !mobileMenuOpen 
              ? 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-6' // 透明時: 黒グラデーションで文字を見やすく
              : 'bg-slate-900/80 backdrop-blur-md py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between gap-4">

            {/* ロゴエリア */}
            <Link to="/" className="flex items-center gap-2.5 group relative z-50">
              <div className="relative">
                <div className="absolute inset-0 bg-pink-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition"></div>
                <div className="relative bg-gradient-to-br from-pink-600 to-rose-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition duration-300">
                  <span className="text-xl">💎</span>
                </div>
              </div>
              <h1 className={`font-black text-xl tracking-tighter transition duration-300 ${isScrolled || !isTransparentPage ? 'text-white' : 'text-white drop-shadow-md'}`}>
                Mens Esthe<span className="text-pink-500">.Map</span>
              </h1>
            </Link>

            {/* PC用 ナビゲーション (日本語化 & 視認性強化) */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/search" className="text-sm font-bold text-white hover:text-pink-400 transition relative group drop-shadow-md">
                キャスト検索
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-500 transition-all group-hover:w-full"></span>
              </Link>
              <Link to="/ranking" className="text-sm font-bold text-white hover:text-pink-400 transition relative group drop-shadow-md">
                ランキング
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-500 transition-all group-hover:w-full"></span>
              </Link>

              {currentUser || authUser ? (
                <div className="flex items-center gap-4 pl-4 border-l border-white/20">
                  <Link to="/mypage" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 p-[1px] shadow-lg">
                       <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs">👤</div>
                    </div>
                    <span className="text-sm font-bold text-white group-hover:text-pink-400 transition drop-shadow-md">マイページ</span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3 pl-2">
                  <Link to="/login" className="text-sm font-bold text-white hover:text-pink-400 transition drop-shadow-md">ログイン</Link>
                  <Link to="/register" className="bg-white text-slate-900 px-5 py-2 rounded-full text-sm font-black hover:bg-slate-100 transition shadow-lg shadow-white/10 hover:shadow-white/20">
                    会員登録
                  </Link>
                </div>
              )}
            </nav>

            {/* モバイル用 ハンバーガーボタン */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden p-2 text-white relative z-50 w-10 h-10 flex items-center justify-center bg-black/20 rounded-full backdrop-blur-sm border border-white/10"
            >
              <div className="space-y-1.5">
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>

          </div>
        </div>

        {/* モバイルメニュー (日本語化) */}
        <div className={`fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-40 transition-all duration-500 lg:hidden flex flex-col pt-24 px-6 ${
          mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}>
          
          {/* モバイルナビゲーション */}
          <nav className="flex flex-col gap-6">
            <Link to="/" className="text-xl font-bold text-white hover:text-pink-500 transition flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="text-2xl">🏠</span> ホーム
            </Link>
            <Link to="/search" className="text-xl font-bold text-white hover:text-pink-500 transition flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="text-2xl">🔍</span> キャスト検索
            </Link>
            <Link to="/ranking" className="text-xl font-bold text-white hover:text-pink-500 transition flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="text-2xl">📊</span> ランキング
            </Link>

            {currentUser || authUser ? (
              <>
                <Link to="/mypage" className="text-xl font-bold text-pink-400 hover:text-pink-300 transition flex items-center gap-3 pt-2">
                  <span className="text-2xl">👤</span> マイページ
                </Link>
                <button onClick={handleLogout} className="text-left text-lg font-bold text-slate-400 hover:text-white mt-4 pl-1">
                  → ログアウト
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Link to="/login" className="text-center py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition">
                  ログイン
                </Link>
                <Link to="/register" className="text-center py-3 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-500 transition shadow-lg shadow-pink-900/30">
                  会員登録
                </Link>
              </div>
            )}
          </nav>

          <div className="absolute bottom-10 left-0 w-full text-center">
            <p className="text-slate-600 text-xs font-bold tracking-[0.3em]">MENS ESTHE MAP</p>
          </div>
        </div>
      </header>
    </>
  );
}
