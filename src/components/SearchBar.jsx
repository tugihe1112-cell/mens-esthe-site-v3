import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.tsx';
import { useShopData } from '../contexts/DataContext.jsx';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(''); // 実際の検索に使う遅延クエリ
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const navigate = useNavigate();
  const { shops, getTherapistsByShopId } = useShopData();
  const wrapperRef = useRef(null);

  // ⏳ 1. デバウンス処理
  // ユーザーがタイピングしている間は検索を待機し、300ms止まったら実行
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // ⚡️ 2. 高速検索ロジック (ループ打ち切り対応)
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const q = debouncedQuery.toLowerCase();
    const results = [];
    const LIMIT = 8; // 最大件数

    // データ読み込み前なら何もしない
    if (!shops || !Array.isArray(shops)) return;

    // for...of ループを使うことで break (途中終了) を可能にする
    for (const shop of shops) {
      if (results.length >= LIMIT) break; // 全体の上限チェック

      // --- 店舗検索 ---
      if (shop?.name?.toLowerCase().includes(q)) {
        results.push({ 
          type: 'shop', 
          id: shop.id, 
          name: shop.name, 
          sub: `🏢 ${shop.prefecture}${shop.city}` 
        });
      }

      if (results.length >= LIMIT) break; // 店舗追加後の上限チェック

      // --- セラピスト検索 ---
      const therapists = getTherapistsByShopId(shop.id) || [];
      for (const t of therapists) {
        if (t?.name?.toLowerCase().includes(q)) {
          results.push({ 
            type: 'therapist', 
            id: t.id, 
            shopId: shop.id, 
            name: t.name, 
            sub: `💃 ${shop.name}` 
          });
        }
        if (results.length >= LIMIT) break; // セラピスト追加後の上限チェック
      }
    }

    setSuggestions(results);
  }, [debouncedQuery, shops, getTherapistsByShopId]);

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="店舗名やセラピスト名を入力..."
          className="w-full px-6 py-4 md:py-5 pl-14 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white/20 transition-all backdrop-blur-xl text-lg"
        />
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl group-focus-within:scale-110 transition-transform">🔍</div>
        <button 
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-pink-600 hover:bg-pink-500 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-pink-900/40"
        >
          検索
        </button>
      </form>

      {/* 🔮 予測変換ドロップダウン */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 w-full mt-3 bg-slate-900/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => {
                    const path = item.type === 'shop' 
                      ? `/shops/${item.id}` 
                      : `/shops/${item.shopId}/threads/${item.id}`;
                    navigate(path);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition rounded-xl group text-left"
                >
                  <div>
                    <div className="text-white font-bold group-hover:text-pink-400 transition">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.sub}</div>
                  </div>
                  <div className="text-slate-700 group-hover:text-slate-400">›</div>
                </button>
              ))
            ) : (
              // 検索中または結果なし
               <div className="p-4 text-center text-slate-500 text-sm">
                 {query === debouncedQuery ? "該当なし" : "検索中..."}
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
