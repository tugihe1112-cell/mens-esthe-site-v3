import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TagSelector from './TagSelector';
import { useShopData } from '../contexts/DataContext.jsx';
import { AVAILABLE_TAGS } from '../data/constants';

export default function TagSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { reviews } = useShopData();
  const [selectedTags, setSelectedTags] = useState([]);
  const [isClosing, setIsClosing] = useState(false);

  // -----------------------------------------------------
  // 📊 リアルタイム件数計算
  // -----------------------------------------------------
  const { tagCounts, filteredCount } = useMemo(() => {
    if (!reviews) return { tagCounts: {}, filteredCount: 0 };

    const counts = {};
    const tMap = {};
    AVAILABLE_TAGS.forEach(tag => counts[tag] = 0);

    // 1. 全タグの出現数をカウント
    reviews.forEach(r => {
      if (r.tags && Array.isArray(r.tags)) {
        // ★修正ポイント: ここにあった不正なバックスラッシュを削除しました
        const key = `${r.shop_id}_${r.therapistName}`;
        
        if (!tMap[key]) tMap[key] = new Set();
        r.tags.forEach(tag => {
          if (AVAILABLE_TAGS.includes(tag)) tMap[key].add(tag);
        });
      }
    });

    Object.values(tMap).forEach(tagsSet => {
      tagsSet.forEach(tag => {
        if (counts[tag] !== undefined) counts[tag]++;
      });
    });

    // 2. 選択中のタグにマッチするセラピスト数を計算
    let matchCount = 0;
    if (selectedTags.length > 0) {
      const processedKeys = new Set();
      reviews.forEach(r => {
        const key = `${r.shop_id}_${r.therapistName}`; // ★ここも修正
        if (processedKeys.has(key)) return;
        
        const therapistTags = tMap[key] || new Set();
        if (selectedTags.every(tag => therapistTags.has(tag))) {
           processedKeys.add(key);
           matchCount++;
        }
      });
    } else {
      matchCount = 0;
    }

    return { tagCounts: counts, filteredCount: matchCount };
  }, [reviews, selectedTags]);

  // -----------------------------------------------------
  // ✨ ハンドラ
  // -----------------------------------------------------
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      // モーダルを閉じたときにタグ選択をリセットするかはお好みで
      // setSelectedTags([]); 
    }, 300);
  };

  const handleSearch = () => {
    navigate(`/tag-search?tags=${selectedTags.join(',')}`);
    onClose(); // 画面遷移後に閉じる
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* 背景 (Backdrop) */}
      <div 
        className={`absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      {/* モーダル本体 */}
      <div 
        className={`
          relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl 
          flex flex-col max-h-[85vh] overflow-hidden
          transition-all duration-300 transform
          ${isClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0 animate-modal-slide-up'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🔍</span> こだわり検索
            </h2>
            <p className="text-xs text-slate-400 mt-1">お好みの条件を選択してください</p>
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <TagSelector 
            selectedTags={selectedTags} 
            setSelectedTags={setSelectedTags} 
            counts={tagCounts}
          />
          <div className="h-10"></div>
        </div>

        {/* Footer (Floating Action) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur absolute bottom-0 left-0 right-0 z-10">
          <button
            onClick={handleSearch}
            disabled={selectedTags.length === 0 || filteredCount === 0}
            className={`
              w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-200
              ${selectedTags.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : filteredCount === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:scale-[1.02] shadow-pink-900/50'
              }
            `}
          >
            {selectedTags.length === 0 ? (
              'タグを選択してください'
            ) : filteredCount === 0 ? (
              '該当するセラピストがいません'
            ) : (
              <>
                <span>該当するセラピストを見る</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-sm ml-1">{filteredCount}名</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modal-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-slide-up { animation: modal-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
}
