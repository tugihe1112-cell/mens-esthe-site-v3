// src/pages/AdminPendingPage.jsx (新規作成)
import React from 'react';
import { useAppContext } from '../context/AppContext';

export default function AdminPendingPage() {
  const { pendingReviews } = useAppContext();

  return (
    <div className="text-white p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">承認待ち一覧</h1>
      {pendingReviews.length === 0 ? (
        <p>承認待ちの口コミはありません。</p>
      ) : (
        <div className="space-y-4">
          {pendingReviews.map(review => (
            <div key={review.id} className="bg-slate-800 p-4 rounded-lg">
              <p><strong>セラピスト:</strong> {review.requestedTherapistName}</p>
              <p><strong>店舗:</strong> {review.shopHint || '未指定'}</p>
              <p><strong>内容:</strong> {review.postContent.substring(0, 100)}...</p>
              {/* TODO: 承認UIをここに実装 (仕様書 4.2) */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}