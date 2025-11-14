// src/components/TagSelector.jsx (新規作成)

import React from 'react';

// 仕様書 3.3 で指定された利用可能なタグ
const AVAILABLE_TAGS = [
  '巨乳', 'スレンダー', 'グラマー', '美脚', '小柄', '高身長', '美人系', 
  '可愛い系', '清楚系', 'ギャル系', 'お姉さん系', '色白', '健康的', 
  '10代', '20代', '20代前半', '20代後半', '30代', '40代', '新人', 
  'ベテラン', '日本人', '外国人', '人気', 'おすすめ'
];

/**
 * タグ選択コンポーネント
 * @param {object} props
 * @param {string[]} props.selectedTags - 現在選択されているタグの配列
 * @param {function} props.setSelectedTags - タグ配列を更新する関数
 */
export default function TagSelector({ selectedTags, setSelectedTags }) {
  
  const toggleTag = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag) // 既に選択されていれば削除
        : [...prevTags, tag] // 選択されていなければ追加
    );
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-slate-800 rounded-md">
      {AVAILABLE_TAGS.map((tag) => (
        <button
          key={tag}
          type="button" // form の submit を防ぐ
          onClick={() => toggleTag(tag)}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            selectedTags.includes(tag)
              ? 'bg-pink-600 text-white font-medium' // 選択中のスタイル
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600' // 未選択のスタイル
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}