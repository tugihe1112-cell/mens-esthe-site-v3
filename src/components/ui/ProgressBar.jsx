import React from 'react';

export const ProgressBar = ({ current, total }) => {
  return (
    <div className="fixed top-[70px] left-0 w-full h-1 bg-slate-900 z-40">
      <div 
        className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(236,72,153,0.8)]" 
        style={{ width: `${(current / total) * 100}%` }} 
      />
    </div>
  );
};
