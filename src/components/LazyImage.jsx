import React, { useState } from 'react';

export default function LazyImage({ src, alt, className = '', fallback = 'https://placehold.co/600x400/333/999?text=No+Image' }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 読み込み中のスケルトン */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-700 animate-pulse z-10" />
      )}
      
      <img
        src={error ? fallback : src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
