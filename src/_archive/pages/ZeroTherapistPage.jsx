import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx';
import Header from '../components/Header.jsx';

export default function ZeroTherapistPage() {
  const { shops, therapists, loading } = useShopData();

  // ★修正: リレーショナルデータ構造に対応した「0人判定」ロジック
  const zeroShops = useMemo(() => {
    if (!shops.length || !therapists.length) return [];
    
    // 1. セラピストが存在する店舗IDのリストを作成 (Setで高速化)
    const activeShopIds = new Set(therapists.map(t => t.shop_id || t.shopId));
    
    // 2. そのリストに含まれていない店舗だけを抽出
    return shops.filter(shop => !activeShopIds.has(shop.id));
  }, [shops, therapists]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200">
      <Header />
      <div className="pt-24 px-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">GHOST SHOPS CHECKER</h1>
          <p className="text-slate-400 font-bold">
            セラピスト未登録: <span className="text-pink-500 text-xl">{zeroShops.length}</span> / {shops.length} 店
          </p>
          <p className="text-xs text-slate-500 mt-2">※データ構造: リレーショナル照合済み</p>
        </div>

        {zeroShops.length > 0 ? (
          <div className="grid gap-4">
            {zeroShops.slice(0, 100).map(shop => (
              <div key={shop.id} className="bg-slate-900/50 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-slate-900 transition">
                <div>
                  <h3 className="text-lg font-bold text-white">{shop.name}</h3>
                  <div className="flex gap-2 text-xs text-slate-500">
                    <span>ID: {shop.id}</span>
                    <span>📍 {shop.address || shop.prefecture}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link 
                    to={`/shops/${shop.id}`}
                    className="px-3 py-1 bg-pink-600 text-xs font-bold text-white rounded hover:bg-pink-500"
                  >
                    詳細確認
                  </Link>
                </div>
              </div>
            ))}
            {zeroShops.length > 100 && (
              <p className="text-center text-slate-500 text-xs mt-4">他 {zeroShops.length - 100} 件...</p>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
            <span className="text-4xl">🎉</span>
            <p className="mt-4 text-slate-500 font-bold">全店舗にセラピストが紐付いています！</p>
          </div>
        )}
      </div>
    </div>
  );
}
