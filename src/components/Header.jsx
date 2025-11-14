// src/components/Header.jsx (新規作成)

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.tsx';
import toast from 'react-hot-toast'; // 通知用

export default function Header() {
  const { isLoggedIn, currentUser, mockLogout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    mockLogout();
    toast.success('ログアウトしました');
    navigate('/'); // ログアウトしたらホームに戻る
  };
  
  // 仕様書 3.1: PostReviewButton
  const handleOpenReviewModal = () => {
    if (!isLoggedIn) {
      toast.error('この操作にはログインが必要です');
      navigate('/login'); // 仕様書 4.1: LoginModal を開く（今はLogin Pageに遷移）
      return;
    }
    // TODO: 仕様書 4.2 / 4.3 の ReviewPickerModal / ReviewRequestModal を開く
    // navigate('/new-request'); // NewRequestPage がある場合
    toast('（未実装）口コミ投稿モーダルを開きます', { icon: '🚧' });
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-700">
      <nav className="max-w-6xl mx-auto p-4 flex justify-between items-center">
        
        <div className="flex items-center gap-6">
          {/* 1. サイトロゴ (Homeへのリンク) */}
          <Link to="/" className="text-2xl font-bold text-white">
            MEN'S <span className="text-pink-400">ESTHE</span>
          </Link>

          {/* 2. 店舗一覧 / 新規口コミ投稿ボタン (仕様書 3.1) */}
          <Link 
            to="/shops"
            className="text-sm font-medium text-gray-300 hover:text-pink-400 transition-colors"
          >
            店舗一覧
          </Link>
          <button
            onClick={handleOpenReviewModal}
            className="text-sm font-medium bg-white/10 text-white px-3 py-2 rounded-md hover:bg-white/20 transition-colors"
          >
            新規口コミ投稿
          </button>
        </div>

        {/* 3. ログイン状態に応じた表示 (仕様書 9) */}
        <div className="flex items-center gap-4">
          {isLoggedIn && currentUser ? (
            // --- ログイン中の表示 ---
            <>
              {/* マイページへのリンク (仕様書 3.1) */}
              <Link to="/mypage" className="text-gray-300 hover:text-pink-400 transition-colors">
                ようこそ, <span className="font-bold text-pink-400">{currentUser.name}</span> さん
              </Link>
              
              {currentUser.isPremium && (
                <span className="px-2 py-0.5 text-xs font-bold text-yellow-900 bg-yellow-400 rounded">
                  PREMIUM
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded-md transition"
              >
                ログアウト
              </button>
            </>
          ) : (
            // --- ログアウト中の表示 (ログインページへのリンク) ---
            <Link 
              to="/login"
              className="px-4 py-1.5 text-sm bg-pink-600 hover:bg-pink-700 rounded-md transition"
            >
              ログイン / 新規登録
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}