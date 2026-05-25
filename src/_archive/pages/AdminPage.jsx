import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.tsx";
import LazyImage from "../components/LazyImage.jsx";

export default function AdminPage() {
  const navigate = useNavigate();
  const { currentUser, shops = [] } = useAppContext();
  
  const [reviews, setReviews] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("shops_edit");
  const [searchQuery, setSearchQuery] = useState("");

  // フォーム用ステート
  const [editingShop, setEditingShop] = useState(null);

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      alert("管理者権限が必要です");
      navigate("/");
    }
  }, [currentUser, navigate]);

  const fetchData = () => {
    fetch('http://localhost:3001/api/reviews').then(res => res.json()).then(setReviews).catch(console.error);
    fetch('http://localhost:3001/api/shop_requests').then(res => res.json()).then(setRequests).catch(console.error);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (type, id, action, payload = null) => {
    if (!window.confirm(`${action === 'delete' ? '削除' : '実行'}しますか？`)) return;

    let endpoint = `http://localhost:3001/api/${type}/${id}`;
    let method = action === 'update' ? 'PUT' : 'DELETE';
    if (action === 'approve') { endpoint += '/status'; method = 'PUT'; payload = { status: 'approved' }; }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : null
      });
      if (res.ok) {
        alert("完了しました");
        fetchData();
        setEditingShop(null);
        if (type === 'shops') window.location.reload();
      }
    } catch (err) {
      alert("サーバー通信エラー");
    }
  };

  const filteredShops = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return (shops || []).filter(s => 
      s?.name?.toLowerCase().includes(query) || s?.prefecture?.toLowerCase().includes(query)
    );
  }, [shops, searchQuery]);

  if (!currentUser || !currentUser.isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-20 px-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🛠️ 運営ダッシュボード</h1>

      <div className="flex gap-2 mb-8 bg-slate-800 p-1 rounded-xl border border-slate-700">
        <button onClick={() => setActiveTab("shops_edit")} className={`flex-1 py-3 rounded-lg font-bold transition ${activeTab === "shops_edit" ? "bg-slate-700 shadow-lg" : "text-gray-400"}`}>店舗管理</button>
        <button onClick={() => setActiveTab("requests")} className={`flex-1 py-3 rounded-lg font-bold transition ${activeTab === "requests" ? "bg-slate-700 shadow-lg" : "text-gray-400"}`}>店舗申請</button>
        <button onClick={() => setActiveTab("reviews")} className={`flex-1 py-3 rounded-lg font-bold transition ${activeTab === "reviews" ? "bg-slate-700 shadow-lg" : "text-gray-400"}`}>口コミ承認</button>
      </div>

      {activeTab === "shops_edit" && (
        <div className="space-y-6">
          <input type="text" placeholder="店名検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredShops.slice(0, 20).map(shop => (
              <div key={shop.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-4">
                <div className="w-20 h-20 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                  <LazyImage src={shop.image_url || shop.image} alt={shop.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{shop.name || "未設定"}</h3>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setEditingShop(shop)} className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg font-bold">編集</button>
                    <button onClick={() => handleAction('shops', shop.id, 'delete')} className="text-xs bg-red-900/30 text-red-400 px-3 py-1.5 rounded-lg">削除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📝 編集モーダル (第13条対応：安全な参照) */}
      {editingShop && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h2 className="text-xl font-bold border-b border-slate-700 pb-3">店舗情報の編集</h2>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-500 font-bold uppercase">店名</label>
              <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 mt-1" value={editingShop?.name || ""} onChange={e => setEditingShop({...editingShop, name: e.target.value})} /></div>
              <div><label className="text-xs text-gray-500 font-bold uppercase">画像URL</label>
              <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 mt-1 text-sm" value={editingShop?.image || ""} onChange={e => setEditingShop({...editingShop, image: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 font-bold uppercase">価格帯</label>
                <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 mt-1 text-sm" value={editingShop?.price || ""} onChange={e => setEditingShop({...editingShop, price: e.target.value})} /></div>
                <div><label className="text-xs text-gray-500 font-bold uppercase">営業時間</label>
                <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 mt-1 text-sm" value={editingShop?.hours || ""} onChange={e => setEditingShop({...editingShop, hours: e.target.value})} /></div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setEditingShop(null)} className="flex-1 py-3 bg-slate-700 rounded-xl font-bold">キャンセル</button>
              <button onClick={() => handleAction('shops', editingShop.id, 'update', editingShop)} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold">保存する</button>
            </div>
          </div>
        </div>
      )}

      {/* 申請・口コミタブ (既存のまま) */}
      {activeTab === "requests" && (
        <div className="space-y-4">{requests.filter(r => r.status === 'pending').map(req => (
          <div key={req.id} className="bg-slate-800 p-6 rounded-xl border border-blue-500/30">
            <h3 className="font-bold">{req.shopName}</h3>
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleAction('shop_requests', req.id, 'approve')} className="flex-1 bg-blue-600 py-2 rounded-lg font-bold">承認</button>
              <button onClick={() => handleAction('shop_requests', req.id, 'reject')} className="flex-1 bg-slate-700 py-2 rounded-lg font-bold">却下</button>
            </div>
          </div>
        ))}</div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-4">{reviews.filter(r => r.status === 'pending').map(rev => (
          <div key={rev.id} className="bg-slate-800 p-6 rounded-xl border border-pink-500/30">
            <h3 className="font-bold text-pink-300">{rev.shopName}</h3>
            <p className="bg-slate-900 p-3 rounded mt-2 text-sm italic">"{rev.content}"</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleAction('reviews', rev.id, 'approve')} className="flex-1 bg-green-600 py-2 rounded-lg font-bold">公開</button>
              <button onClick={() => handleAction('reviews', rev.id, 'reject')} className="flex-1 bg-slate-700 py-2 rounded-lg font-bold">削除</button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
