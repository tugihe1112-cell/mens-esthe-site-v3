// src/pages/ShopDetailPage.jsx (新規作成)
import React from 'react';
import { useParams } from 'react-router-dom';

export default function ShopDetailPage() {
  const { shopId } = useParams();

  return (
    <div className="text-white p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">店舗詳細ページ</h1>
      <p className="text-lg mt-2">
        ここは、店舗ID: <span className="text-yellow-400">{shopId}</span> の詳細と、
        その店舗に所属するセラピスト一覧を表示するページです。
      </p>
    </div>
  );
}