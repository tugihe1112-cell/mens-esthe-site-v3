import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext.tsx';

export default function AdminPendingPage() {
  const { pendingReviews, shopRequests, fetchReviews, fetchShopRequests } = useAppContext();
  const [activeTab, setActiveTab] = useState('shops'); // 'shops' or 'reviews'
  const [processingId, setProcessingId] = useState(null);

  // データ更新用
  useEffect(() => {
    fetchShopRequests?.();
    fetchReviews?.();
  }, []);

  // サーバーAPIを叩いてステータスを更新する関数
  const handleStatusUpdate = async (type, id, status) => {
    if (!window.confirm(`${status === 'approved' ? '承認' : '却下'}してよろしいですか？`)) return;
    
    setProcessingId(id);
    try {
      const endpoint = type === 'shop' ? 'shop_requests' : 'reviews';
      const response = await fetch(`http://localhost:3001/api/${endpoint}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        alert(`${status === 'approved' ? '承認' : '却下'}しました！\n${status === 'approved' && type === 'shop' ? '✨ 店舗が自動作成され、サイトに反映されました！' : ''}`);
        // リストを再取得して画面を更新
        fetchShopRequests?.();
        fetchReviews?.();
      } else {
        alert('エラーが発生しました');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('通信エラーが発生しました');
    } finally {
      setProcessingId(null);
    }
  };

  // 表示データの切り替え
  // コンテキストから取得できない場合は直接APIから取ってくるフォールバックも考慮すべきだが、
  // 一旦コンテキスト依存で実装。もし表示されなければfetchを追加する。
  const displayShops = shopRequests?.filter(r => r.status === 'pending') || [];
  const displayReviews = pendingReviews || [];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
            申請管理ダッシュボード
          </h1>
          <div className="text-sm text-gray-400">
            未処理: 店舗 <span className="text-white font-bold">{displayShops.length}</span> / 
            口コミ <span className="text-white font-bold">{displayReviews.length}</span>
          </div>
        </header>

        {/* タブ切り替え */}
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          <button 
            onClick={() => setActiveTab('shops')}
            className={`pb-3 px-4 font-bold transition relative ${activeTab === 'shops' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            🏢 新規店舗申請
            {activeTab === 'shops' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-4 font-bold transition relative ${activeTab === 'reviews' ? 'text-pink-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            💬 口コミ承認待ち
            {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-400"></div>}
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="space-y-4">
          
          {/* --- 店舗申請リスト --- */}
          {activeTab === 'shops' && (
            displayShops.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-slate-800 rounded-xl border border-slate-700">
                承認待ちの店舗申請はありません
              </div>
            ) : (
              displayShops.map(req => (
                <div key={req.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded border border-blue-500/30">店舗申請</span>
                      <span className="text-xs text-gray-400">{new Date(req.timestamp).toLocaleString()}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{req.shopName}</h3>
                    <div className="text-sm text-gray-300 flex flex-wrap gap-4">
                      <span>📍 {req.prefecture} {req.city}</span>
                      <span>💆‍♀️ {req.therapistName}</span>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg text-sm text-gray-400 mt-3 border border-slate-700/50">
                      <p className="font-bold text-xs text-gray-500 mb-1">投稿された口コミ:</p>
                      {req.content}
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-2 justify-center min-w-[120px]">
                    <button 
                      onClick={() => handleStatusUpdate('shop', req.id, 'approved')}
                      disabled={processingId === req.id}
                      className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition disabled:opacity-50"
                    >
                      {processingId === req.id ? '処理中...' : '承認する'}
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate('shop', req.id, 'rejected')}
                      disabled={processingId === req.id}
                      className="bg-slate-700 hover:bg-slate-600 text-gray-300 py-2 px-4 rounded-lg font-bold transition disabled:opacity-50"
                    >
                      却下
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* --- 口コミ申請リスト --- */}
          {activeTab === 'reviews' && (
            displayReviews.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-slate-800 rounded-xl border border-slate-700">
                承認待ちの口コミはありません
              </div>
            ) : (
              displayReviews.map(review => (
                <div key={review.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-pink-500/20 text-pink-300 text-xs px-2 py-1 rounded border border-pink-500/30">口コミ</span>
                      <span className="text-xs text-gray-400">{new Date(review.timestamp).toLocaleString()}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">To: {review.therapistName || review.requestedTherapistName} <span className="text-sm font-normal text-gray-400">(@{review.shopName || review.shopHint})</span></h3>
                    <div className="bg-slate-900/50 p-3 rounded-lg text-sm text-gray-300 mt-2 border border-slate-700/50">
                      {review.content || review.postContent}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 justify-center min-w-[120px]">
                    <button 
                      onClick={() => handleStatusUpdate('review', review.id, 'approved')}
                      disabled={processingId === review.id}
                      className="bg-pink-600 hover:bg-pink-500 text-white py-2 px-4 rounded-lg font-bold shadow-lg shadow-pink-900/20 transition disabled:opacity-50"
                    >
                      承認する
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate('review', review.id, 'rejected')}
                      disabled={processingId === review.id}
                      className="bg-slate-700 hover:bg-slate-600 text-gray-300 py-2 px-4 rounded-lg font-bold transition disabled:opacity-50"
                    >
                      却下
                    </button>
                  </div>
                </div>
              ))
            )
          )}

        </div>
      </div>
    </div>
  );
}
