import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const [shopInput, setShopInput] = useState('');
  const [castInput, setCastInput] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (shopInput.trim()) params.set('shop', shopInput.trim());
    if (castInput.trim()) params.set('cast', castInput.trim());
    navigate(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">

        {/* 🏢 店舗・エリア */}
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">🏢</span>
          <input
            type="text"
            value={shopInput}
            onChange={e => setShopInput(e.target.value)}
            placeholder="店舗名・エリアで検索..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white/20 transition-all backdrop-blur-xl text-sm font-bold"
          />
        </div>

        {/* 区切り */}
        <div className="hidden sm:flex items-center text-slate-500 font-bold text-sm flex-shrink-0">×</div>

        {/* 💃 キャスト名 */}
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">💃</span>
          <input
            type="text"
            value={castInput}
            onChange={e => setCastInput(e.target.value)}
            placeholder="キャスト名で検索..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/20 transition-all backdrop-blur-xl text-sm font-bold"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-sm transition-all shadow-lg shadow-pink-900/40 active:scale-[0.98]"
      >
        検索する
      </button>
    </form>
  );
}
