import React, { memo } from 'react';

// ⚠️ 2026-09-30（デザインA案）: 項目ごとの絵文字と色分け（ピンク・青・黄・赤・緑）をやめた。
//    icon / colorClass は呼び出し側との互換のため受け取るが使わない。
// eslint-disable-next-line no-unused-vars
export const RatingSlider = memo(({ label, icon, value, colorClass, onChange }) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-3 px-1">
        <span className="text-sm font-bold text-slate-100">{label}</span>
        <span className="font-numeral text-2xl text-slate-50">{value.toFixed(1)}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <input
          type="range"
          min="1"
          max="5"
          step="0.5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full absolute z-20 opacity-0 cursor-pointer h-full"
        />
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative z-10">
          <div
            className="h-full bg-pink-500 transition-all duration-100 ease-out"
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </div>
        <div
          className="absolute w-6 h-6 bg-slate-50 rounded-full shadow-lg z-10 pointer-events-none transition-all duration-100 ease-out flex items-center justify-center text-[9px] font-bold text-slate-950"
          style={{ left: `calc(${(value / 5) * 100}% - 12px)` }}
        >
          {value}
        </div>
      </div>
    </div>
  );
});
RatingSlider.displayName = 'RatingSlider';
