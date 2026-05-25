// src/components/FilterPanel.jsx
// 2025.11.22 デザイン統一 & エリア並び順最適化版

import { useState, useEffect, useMemo } from 'react';
import { LOCATION_DATA } from '../data/locations'; // ▼ 並び順のために読み込み

export default function FilterPanel({ 
  availableAreas = [],
  availableTags = [],
  onFilterChange,
  onSortChange,
  resultCount = 0
}) {
  const [filters, setFilters] = useState({
    area: 'all',
    tags: [],
    priceRange: 'all',
    minRating: 0
  });
  const [sortBy, setSortBy] = useState('rating-desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  useEffect(() => {
    onSortChange(sortBy);
  }, [sortBy]);

  // ▼ availableAreas を locations.js の並び順に合わせてソートする
  const sortedAreas = useMemo(() => {
    // マスタデータから全エリアのフラットなリストを作成（正しい順序）
    const masterOrder = Object.values(LOCATION_DATA).flat();
    
    // 親から渡されたエリアリストを、マスタデータの順序で並び替え
    return [...availableAreas].sort((a, b) => {
      const indexA = masterOrder.indexOf(a);
      const indexB = masterOrder.indexOf(b);
      // マスタにないものは末尾へ
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [availableAreas]);

  const handleAreaChange = (e) => {
    setFilters(prev => ({ ...prev, area: e.target.value }));
  };

  const handleTagToggle = (tag) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handlePriceRangeChange = (e) => {
    setFilters(prev => ({ ...prev, priceRange: e.target.value }));
  };

  const handleRatingChange = (rating) => {
    setFilters(prev => ({ 
      ...prev, 
      minRating: prev.minRating === rating ? 0 : rating 
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      area: 'all',
      tags: [],
      priceRange: 'all',
      minRating: 0
    });
    setSortBy('rating-desc');
  };

  const hasActiveFilters = 
    filters.area !== 'all' || 
    filters.tags.length > 0 || 
    filters.priceRange !== 'all' || 
    filters.minRating > 0;

  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-4 mb-6 border border-slate-700">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-white">
            検索結果: <span className="text-pink-400 font-bold text-lg">{resultCount}</span>件
          </h3>
          
          {/* 並び替え */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-600 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="rating-desc">評価が高い順</option>
            <option value="rating-asc">評価が低い順</option>
            <option value="reviews-desc">口コミが多い順</option>
            <option value="price-asc">料金が安い順</option>
            <option value="price-desc">料金が高い順</option>
            <option value="newest">新着順</option>
          </select>
        </div>

        {/* フィルター表示切替 */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
            showFilters 
              ? "bg-pink-600 text-white" 
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          絞り込み
          {hasActiveFilters && (
            <span className="bg-white text-pink-600 font-bold text-xs px-2 py-0.5 rounded-full ml-1">
              {filters.tags.length + (filters.area !== 'all' ? 1 : 0) + (filters.priceRange !== 'all' ? 1 : 0) + (filters.minRating > 0 ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* フィルターパネル */}
      {showFilters && (
        <div className="border-t border-slate-700 pt-4 space-y-4 animate-fadeIn">
          {/* 地域フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              📍 地域
            </label>
            <select
              value={filters.area}
              onChange={handleAreaChange}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">すべての地域</option>
              {/* ソート済みのエリアリストを表示 */}
              {sortedAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* 価格帯フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              💰 価格帯
            </label>
            <select
              value={filters.priceRange}
              onChange={handlePriceRangeChange}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">すべての価格帯</option>
              <option value="low">〜9,999円</option>
              <option value="medium">10,000円〜19,999円</option>
              <option value="high">20,000円〜</option>
            </select>
          </div>

          {/* 評価フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              ⭐ 評価
            </label>
            <div className="flex gap-2">
              {[5, 4, 3].map(rating => (
                <button
                  key={rating}
                  onClick={() => handleRatingChange(rating)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors border ${
                    filters.minRating === rating
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-slate-700 text-gray-300 border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  ⭐ {rating}以上
                </button>
              ))}
            </div>
          </div>

          {/* タグフィルター */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                🏷️ タグ
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors border ${
                      filters.tags.includes(tag)
                        ? 'bg-pink-600 text-white border-pink-600'
                        : 'bg-slate-700 text-gray-300 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* クリアボタン */}
          {hasActiveFilters && (
            <div className="pt-2">
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 text-sm text-gray-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
              >
                フィルターをクリア
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}