import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from '../compat/router';
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
          isScrolled || mobileMenuOpen
            ? 'bg-slate-950 backdrop-blur-xl shadow-lg border-b border-white/10 py-3' // スクロール時・メニュー開放時: 完全不透明
            : isTransparentPage
              ? 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-6' // 透明時: 黒グラデーションで文字を見やすく
              : 'bg-slate-900/80 backdrop-blur-md py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between gap-4">

            {/* ロゴエリア */}
            <Link to="/" className="flex items-center gap-2 group relative z-50 shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-pink-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition"></div>
                <div className="relative bg-gradient-to-br from-pink-600 to-rose-600 text-white w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition duration-300">
                  <span className="text-base md:text-xl">💎</span>
                </div>
              </div>
              <h1 className={`font-black text-base md:text-xl tracking-tighter whitespace-nowrap transition duration-300 ${isScrolled || !isTransparentPage ? 'text-white' : 'text-white drop-shadow-md'}`}>
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

            {/* モバイル用 認証ボタン */}
            {!(currentUser || authUser) && (
              <div className="lg:hidden flex items-center gap-2 shrink-0">
                <Link to="/login"
                  className="text-[11px] font-bold text-white border border-white/25 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-white/10 transition">
                  ログイン
                </Link>
                <Link to="/register"
                  className="text-[11px] font-bold text-white bg-pink-600 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-pink-500 transition">
                  会員登録
                </Link>
              </div>
            )}

          </div>
        </div>

      </header>

    </>
  );
}
