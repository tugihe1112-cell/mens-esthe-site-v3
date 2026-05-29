import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const navItems = [
    {
      path: '/',
      label: 'ホーム',
      icon: (isActive) => (
        <svg className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/search',
      label: 'キャスト',
      icon: (isActive) => (
        <svg className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      path: '/post-review',
      label: '投稿',
      highlight: true,
      icon: (isActive) => (
        <svg className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    },
    {
      path: '/ranking',
      label: 'ランキング',
      icon: (isActive) => (
        <svg className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 0 : 2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      path: user ? '/mypage' : '/login',
      label: user ? 'マイページ' : 'ログイン',
      icon: (isActive) => (
        <svg className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} fill={isActive ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 0 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 md:hidden pointer-events-none">
      {/* 背景のグラデーションフェード（コンテンツが消える演出） */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none"></div>

      {/* フローティングドック本体 */}
      <nav
        className="pointer-events-auto relative mx-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        style={{ marginBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* 上部のハイライトライン */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <div className="flex justify-around items-center h-16 relative">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => {
                if (item.highlight && !user) {
                  e.preventDefault();
                  navigate('/login', { state: { redirect: '/post-review' } });
                }
              }}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center w-full h-full cursor-pointer group select-none active:scale-90 transition-transform duration-200
                ${item.highlight ? 'text-pink-400' : isActive ? 'text-pink-400' : 'text-slate-500 hover:text-slate-300'}
              `}
            >
              {({ isActive }) => (
                <>
                  {/* 投稿ボタン: 常時ピンク強調 */}
                  {item.highlight && (
                    <div className="absolute inset-x-2 inset-y-1.5 bg-pink-600/20 rounded-xl border border-pink-500/30" />
                  )}

                  {/* アクティブ時の背景光 */}
                  {isActive && !item.highlight && (
                    <div className="absolute inset-0 bg-pink-500/10 blur-xl rounded-full transform scale-50 opacity-50"></div>
                  )}

                  {/* アイコン */}
                  <div className="relative z-10 mb-0.5 filter drop-shadow-md">
                    {item.icon(isActive)}
                  </div>

                  {/* ラベル */}
                  <span className={`relative z-10 text-[8px] font-black tracking-tight transition-all duration-300 ${isActive || item.highlight ? 'text-white scale-105' : ''}`}>
                    {item.label}
                  </span>

                  {/* ネオンインジケーターバー */}
                  {isActive && (
                    <div className="absolute bottom-0 w-8 h-1 bg-pink-500 rounded-t-full shadow-[0_-2px_10px_rgba(236,72,153,0.8)] animate-pulse"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
