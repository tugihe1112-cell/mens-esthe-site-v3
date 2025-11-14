// src/pages/NotFoundPage.jsx (新規作成)
import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-white p-10 max-w-6xl mx-auto text-center">
      <h1 className="text-6xl font-bold text-pink-400">404</h1>
      <p className="text-2xl mt-4">ページが見つかりません</p>
      <p className="text-gray-400 mt-2">
        お探しのページは削除されたか、URLが変更された可能性があります。
      </p>
      <Link 
        to="/"
        className="mt-8 inline-block px-6 py-3 rounded-lg bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors"
      >
        ホームに戻る
      </Link>
    </div>
  );
}