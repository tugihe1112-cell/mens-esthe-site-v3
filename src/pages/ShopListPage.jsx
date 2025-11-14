// src/pages/ShopListPage.jsx (新規作成)
import React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ShopListPage() {
  const [searchParams] = useSearchParams();

  return (
    <div className="text-white p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">店舗一覧ページ</h1>
      <p className="text-lg mt-2">
        ここは、指定された条件の店舗一覧を表示するページです。
      </p>
      <div className="mt-4 p-4 bg-slate-800 rounded-md">
        <h3 className="font-bold">現在のURLクエリ:</h3>
        <p>都道府県: {searchParams.get('pref') || '未指定'}</p>
        <p>地域: {searchParams.get('city') || '未指定'}</p>
      </div>
    </div>
  );
}