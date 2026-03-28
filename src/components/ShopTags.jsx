import React from "react";

const TAG_LABELS = {
  'dominant_tendency': 'S',
};

const TAG_STYLES = {
  'dominant_tendency': 'bg-red-900/40 text-red-300 border-red-800',
  'グラマー': 'bg-purple-900/40 text-purple-300 border-purple-800',
  'スレンダー': 'bg-blue-900/40 text-blue-300 border-blue-800',
  '清楚系': 'bg-teal-900/40 text-teal-300 border-teal-800',
  'ギャル系': 'bg-pink-900/40 text-pink-300 border-pink-800',
  'ぽっちゃり': 'bg-orange-900/40 text-orange-300 border-orange-800',
  '大人っぽい': 'bg-indigo-900/40 text-indigo-300 border-indigo-800',
  'default': 'bg-slate-800 text-gray-300 border-slate-700'
};

export default function ShopTags({ tags }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tags.map((tag, index) => {
        const label = TAG_LABELS[tag] || tag;
        const style = TAG_STYLES[tag] || TAG_STYLES['default'];
        
        return (
          <span 
            key={index} 
            className={`text-[10px] px-2 py-0.5 rounded border ${style} backdrop-blur-sm`}
          >
            #{label}
          </span>
        );
      })}
    </div>
  );
}
