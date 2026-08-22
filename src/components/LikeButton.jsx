import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../context/AppContext.tsx';
import { useNavigate } from '../compat/router';

export default function LikeButton({ id, className = "" }) {
  const { favorites, toggleFavorite } = useAppContext();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const isLoggedIn = !!authUser;
  const isFavorite = favorites.includes(String(id));

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      // 旧AppContextにはaddToastが存在せず、未ログイン時のハートタップで
      // TypeErrorになっていた。ログイン後に戻れる正規導線へ送る。
      navigate('/login?redirect=%2F');
      return;
    }
    
    toggleFavorite(id);
  };

  return (
    <button 
      type="button"
      onClick={handleClick}
      aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
      aria-pressed={isFavorite}
      className={`transition-all duration-300 transform active:scale-125 flex items-center justify-center ${className} ${
        isFavorite ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}
