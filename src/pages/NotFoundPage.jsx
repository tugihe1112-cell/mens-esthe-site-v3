import React from 'react';
import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead.jsx';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-4">
      <SeoHead title="ページが見つかりません" noindex />
      <h1 className="text-[120px] font-black text-slate-900 leading-none select-none">404</h1>
      <p className="text-white text-xl font-bold -mt-10 mb-4 relative z-10">Page Not Found</p>
      <Link to="/" className="inline-block bg-pink-600 text-white px-8 py-3 rounded-full font-bold">ホームに戻る</Link>
    </div>
  );
}
