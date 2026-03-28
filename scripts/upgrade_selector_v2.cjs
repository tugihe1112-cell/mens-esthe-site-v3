const fs = require('fs');
const path = 'src/components/TagSelector.jsx';

console.log('🆙 Upgrading TagSelector to support "Hit Counts"...');

const content = `import React from 'react';
import { TAG_CATEGORIES } from '../data/constants';

/**
 * データ駆動型タグ選択コンポーネント (Universal)
 * @param {object} counts - (Optional) タグごとの該当件数 { '巨乳': 5, ... }。渡されると検索モードになる。
 */
export default function TagSelector({ selectedTags, setSelectedTags, counts = null }) {
  
  const handleTagClick = (category, tag) => {
    // 件数データがあり、かつ0件ならクリック無効
    if (counts && (counts[tag] || 0) === 0) return;

    const isSingle = category.selectionMode === 'single';
    const isSelected = selectedTags.includes(tag);

    if (isSingle) {
      // --- 単一選択モード (Radio) ---
      const categoryTags = category.tags;
      const otherTags = selectedTags.filter(t => !categoryTags.includes(t));
      
      if (isSelected) {
        setSelectedTags(otherTags); // 解除
      } else {
        setSelectedTags([...otherTags, tag]); // 上書き
      }
    } else {
      // --- 複数選択モード (Checkbox) ---
      if (isSelected) {
        setSelectedTags(selectedTags.filter(t => t !== tag));
      } else {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  return (
    <div className="space-y-8">
      {TAG_CATEGORIES.map((category) => (
        <div key={category.id} className="animate-fade-in">
          {/* カテゴリヘッダー */}
          <div className="flex items-end gap-2 mb-3 px-1 border-l-4 border-pink-500 pl-3">
            <h4 className="text-sm font-bold text-white leading-none">
              {category.title}
            </h4>
            <span className="text-[10px] text-slate-400 leading-none">
              {category.subtitle}
              {category.selectionMode === 'single' && <span className="ml-2 text-pink-500 text-[10px] border border-pink-500/20 px-1 rounded bg-pink-500/10">1つのみ</span>}
            </span>
          </div>

          {/* タグボタン */}
          <div className="flex flex-wrap gap-2">
            {category.tags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              const count = counts ? (counts[tag] || 0) : null;
              const isZero = counts && count === 0;

              return (
                <button
                  key={tag}
                  type="button"
                  disabled={isZero}
                  onClick={() => handleTagClick(category, tag)}
                  className={\`
                    relative group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border
                    \${isSelected 
                      ? 'bg-gradient-to-r from-pink-600 to-rose-500 border-transparent text-white shadow-lg shadow-pink-500/30 transform scale-105 z-10' 
                      : isZero
                        ? 'bg-slate-800/30 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-pink-400 hover:text-white hover:bg-slate-700'
                    }
                  \`}
                >
                  <span>{tag}</span>
                  {counts && !isZero && (
                     <span className={\`ml-2 text-[10px] px-1.5 py-0.5 rounded-full \${isSelected ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400'}\`}>
                       {count}
                     </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <style>{\`
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      \`}</style>
    </div>
  );
}
`;

fs.writeFileSync(path, content);
console.log('✅ TagSelector Upgraded (Version 2.0 with Counts).');
