import React, { memo } from 'react';

export const RatingSlider = memo(({ label, icon, value, colorClass, onChange }) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm font-bold mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className={colorClass}>{label}</span>
        </div>
        <span className="text-white text-lg">{value.toFixed(1)}</span>
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
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative z-10">
          <div
            className="h-full bg-gradient-to-r from-slate-700 to-white transition-all duration-100 ease-out"
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </div>
        <div
          className="absolute w-6 h-6 bg-white rounded-full shadow-lg z-10 pointer-events-none transition-all duration-100 ease-out flex items-center justify-center text-[8px] font-bold text-black"
          style={{ left: `calc(${(value / 5) * 100}% - 12px)` }}
        >
          {value}
        </div>
      </div>
    </div>
  );
});
RatingSlider.displayName = 'RatingSlider';
