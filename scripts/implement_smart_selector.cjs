const fs = require('fs');
const path = 'src/components/TagSelector.jsx';

console.log('🧠 Making TagSelector Smart...');

const content = `import React from 'react';
import { TAG_CATEGORIES } from '../data/constants';

/**
 * データ駆動型タグ選択コンポーネント
 * constants.js の selectionMode ('single'|'multiple') に従って挙動を変える
 */
export default function TagSelector({ selectedTags, setSelectedTags }) {
  
  const handleTagClick = (category, tag) => {
    const isSingle = category.selectionMode === 'single';
    const isSelected = selectedTags.includes(tag);

    if (isSingle) {
      // --- 単一選択モード (Radio) ---
      // 同じカテゴリの他のタグを解除して、新しいのをセット
      // もし既に選ばれている自分自身を押したら、解除する（トグル）
      
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
    <div className="space-y-6">
      {TAG_CATEGORIES.map((category) => (
        <div key={category.id}>
          {/* カテゴリヘッダー */}
          <div className="flex items-end gap-2 mb-3 px-1">
            <h4 className="text-xs font-bold text-pink-400 border-b border-pink-500/30 pb-1 leading-none">
              {category.title}
            </h4>
            <span className="text-[10px] text-slate-500 pb-1 leading-none">
              {category.subtitle}
              {category.selectionMode === 'single' && <span className="ml-2 text-pink-500/50 text-[9px] border border-pink-500/20 px-1 rounded">1つのみ</span>}
            </span>
          </div>

          {/* タグボタン */}
          <div className="flex flex-wrap gap-2">
            {category.tags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(category, tag)}
                  className={\`
                    px-3 py-1.5 text-xs rounded-lg border transition-all duration-200
                    \${isSelected 
                      ? 'bg-pink-600 border-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)] font-medium scale-105' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 hover:border-slate-600'
                    }
                  \`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
`;

fs.writeFileSync(path, content);
console.log('✅ TagSelector is now Smart (respects selectionMode).');
