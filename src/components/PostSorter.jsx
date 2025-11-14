// src/components/PostSorter.jsx (新規作成)

import React from 'react';

/**
 * 口コミ一覧用のソートコンポーネント
 * @param {object} props
 * @param {string} props.sortKey - 現在のソートキー (e.g., 'newest')
 * @param {function} props.setSortKey - ソートキーを変更する関数
 */
export default function PostSorter({ sortKey, setSortKey }) {
  return (
    <div className="flex items-center gap-2 my-4">
      <label htmlFor="post-sort" className="text-sm text-gray-300">並び替え:</label>
      <select
        id="post-sort"
        value={sortKey}
        onChange={(e) => setSortKey(e.target.value)}
        className="p-2 rounded bg-slate-800 text-white border border-slate-700 focus:ring-pink-500 focus:border-pink-500"
      >
        <option value="newest">新着順</option>
        <option value="likes">いいね数順</option>
        <option value="rating">評価順</option>
        <option value="length">文字数順</option>
      </select>
    </div>
  );
}