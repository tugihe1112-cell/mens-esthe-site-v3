import React from 'react';

export const ProgressBar = ({ current, total }) => {
  return (
    // ⚠️ 以前は `top-[70px]` 固定だった（2026-08-17 修正）。
    //    Header は fixed だが高さが可変（スクロール時 py-3 / 通常 py-4 / 透明時 py-6）で、
    //    実機ではスクロール中にヘッダーが縮み、ピンクの線だけが本文の上に取り残されて
    //    「採点」画面のスコア円を横切っていた（＝雑に見える原因）。
    //    ヘッダーの高さに依存しないよう、ビューポート最上部に貼る方式に変更。
    //    z は Header(z-50) より上。高さ4pxなのでヘッダーの意匠を損なわない。
    <div className="fixed top-0 left-0 w-full h-1 bg-slate-900/80 z-[60]">
      <div 
        className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(236,72,153,0.8)]" 
        style={{ width: `${(current / total) * 100}%` }} 
      />
    </div>
  );
};
