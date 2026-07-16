import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from '../compat/router';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import LazyImage from '../components/LazyImage.jsx';
import SeoHead from '../components/SeoHead.jsx';

const ADMIN_EMAILS = ['tugihe1112@gmail.com', 'master@mens-esthe.jp'];

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

// ─── クレジット付与モーダル ───────────────────────────
function GrantModal({ review, onClose, onGrant }) {
  const [days, setDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const PRESETS = [3, 7, 15, 25];

  const [emailStatus, setEmailStatus] = useState(null); // null | 'sending' | 'sent' | 'failed'

  const grant = async () => {
    if (!review?.user_id) return;
    setIsLoading(true);
    try {
      // ── ① 管理者の JWT を取得（サーバーサイド検証に使う）──
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) throw new Error('ログインセッションが見つかりません。再ログインしてください。');

      // ── ② サーバーサイド API でクレジット付与（admin-grant-credit.js が管理者メールを検証）──
      const grantRes = await fetch('/api/admin-grant-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ target_user_id: review.user_id, days }),
      });
      const grantData = await grantRes.json();
      if (!grantRes.ok) throw new Error(grantData.error || '付与に失敗しました');

      onGrant(review.id, days);

      // ── ③ メール通知（非同期・失敗しても付与は完了扱い）──
      setEmailStatus('sending');
      try {
        const emailRes = await fetch('/api/notify-credit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: review.user_id,
            days,
            credits_days: grantData.credits_days,
            expires_at: grantData.expires_at,
          }),
        });
        const emailData = await emailRes.json();
        setEmailStatus(emailData.ok ? 'sent' : 'failed');
      } catch {
        setEmailStatus('failed');
      }

      // メールステータス表示後に閉じる
      await new Promise(r => setTimeout(r, 1500));
      onClose();
    } catch (e) {
      alert(e.message || '付与に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <SeoHead title="管理画面" noindex />
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-black text-lg mb-1">閲覧日数を付与</h3>
        <p className="text-slate-400 text-sm mb-4">
          <span className="text-pink-400">{review?.therapist_name || '不明'}</span> への口コミ投稿者に付与
        </p>
        <div className="bg-slate-800/50 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto">
          <p className="text-slate-300 text-xs leading-relaxed">{review?.content}</p>
          <p className="text-slate-600 text-[10px] mt-2 text-right">{(review?.content || '').length}文字</p>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {PRESETS.map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`py-2.5 rounded-xl font-black text-sm transition ${days === d ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {d}日
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-slate-400 text-sm">カスタム:</span>
          <input type="number" value={days}
            onChange={e => setDays(Math.max(1, Math.min(90, parseInt(e.target.value) || 1)))}
            className="w-20 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-center font-black focus:outline-none focus:border-pink-500/50" />
          <span className="text-slate-400 text-sm">日間</span>
        </div>
        {/* メール送信ステータス */}
        {emailStatus && (
          <div className={`mb-3 text-center text-xs font-bold rounded-xl py-2 ${
            emailStatus === 'sending' ? 'bg-blue-500/10 text-blue-400' :
            emailStatus === 'sent'    ? 'bg-emerald-500/10 text-emerald-400' :
                                        'bg-red-500/10 text-red-400'
          }`}>
            {emailStatus === 'sending' && '📧 メール送信中...'}
            {emailStatus === 'sent'    && '✅ メール送信完了！'}
            {emailStatus === 'failed'  && '⚠️ メール送信できませんでした（付与は完了）'}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:text-white border border-white/10 font-bold transition">キャンセル</button>
          <button onClick={grant} disabled={isLoading || emailStatus === 'sending'}
            className="flex-1 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black transition disabled:opacity-50">
            {isLoading ? '付与中...' : `${days}日付与する`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 店舗編集モーダル ───────────────────────────
function ShopEditModal({ shop, onClose, onSave }) {
  const [form, setForm] = useState({
    name: shop.name || '',
    image_url: shop.image_url || '',
    website_url: shop.website_url || '',
    schedule_url: shop.schedule_url || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    try {
      await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify(form),
      });
      onSave({ ...shop, ...form });
      onClose();
    } catch (e) {
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold border-b border-slate-700 pb-3 mb-4">店舗情報の編集</h2>
        <div className="space-y-3">
          {[
            { label: '店名', key: 'name' },
            { label: '画像URL', key: 'image_url' },
            { label: '公式サイトURL', key: 'website_url' },
            { label: 'スケジュールURL', key: 'schedule_url' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">{label}</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-sm focus:border-blue-500 outline-none"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {form.image_url && (
          <div className="mt-3 w-full h-32 rounded-xl overflow-hidden border border-slate-700">
            <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-700 rounded-xl font-bold text-sm">キャンセル</button>
          <button onClick={save} disabled={isSaving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition disabled:opacity-50">
            {isSaving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ───────────────────────────
export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('reviews');

  // 口コミ
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [grantedIds, setGrantedIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState('new');

  // クレジット
  const [credits, setCredits] = useState([]);

  // 店舗
  const [shops, setShops] = useState([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [shopSearch, setShopSearch] = useState('');
  const [editingShop, setEditingShop] = useState(null);

  // 管理者チェック
  useEffect(() => {
    if (user === null) return;
    if (!user || !ADMIN_EMAILS.includes(user.email)) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email)) return;
    fetchReviews();
    fetchCredits();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'shops' && shops.length === 0) fetchShops();
  }, [activeTab]);

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const res = await fetch(`${url}/rest/v1/reviews?select=*&order=created_at.desc&limit=200`, { headers });
      const data = await res.json();
      if (Array.isArray(data)) setReviews(data);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const fetchCredits = async () => {
    const res = await fetch(`${url}/rest/v1/user_credits?select=*&order=updated_at.desc`, { headers });
    const data = await res.json();
    if (Array.isArray(data)) setCredits(data);
  };

  const fetchShops = async () => {
    setIsLoadingShops(true);
    try {
      const res = await fetch(`${url}/rest/v1/shops?select=id,name,image_url,website_url,schedule_url,raw_data&order=name.asc&limit=1000`, { headers });
      const data = await res.json();
      if (Array.isArray(data)) setShops(data);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('この口コミを削除しますか？')) return;
    await fetch(`${url}/rest/v1/reviews?id=eq.${reviewId}`, { method: 'DELETE', headers });
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  const deleteShop = async (shopId) => {
    if (!window.confirm('この店舗を削除しますか？（元に戻せません）')) return;
    await fetch(`${url}/rest/v1/shops?id=eq.${shopId}`, { method: 'DELETE', headers });
    setShops(prev => prev.filter(s => s.id !== shopId));
  };

  if (!user || !ADMIN_EMAILS.includes(user.email)) return null;

  // 口コミ仕分け
  const SCRAPED_IDS = ['owner_manual', 'menesthe_import', 'menesthe_rewritten', 'mensest_user'];
  const realReviews = reviews.filter(r => r.user_id && !SCRAPED_IDS.includes(r.user_id));
  const sorted = (list) => [...list].sort((a, b) => {
    if (sortBy === 'ungranted') {
      const ag = grantedIds.has(a.id), bg = grantedIds.has(b.id);
      if (ag !== bg) return ag ? 1 : -1;
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const displayReviews = sorted(activeTab === 'reviews' ? realReviews : reviews);

  // 店舗フィルター
  const filteredShops = useMemo(() => {
    const q = shopSearch.toLowerCase();
    return shops.filter(s => !q || s.name?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q));
  }, [shops, shopSearch]);

  const TABS = [
    { key: 'reviews', label: '📝 ユーザー口コミ', count: realReviews.length },
    { key: 'all', label: '📋 全口コミ', count: reviews.length },
    { key: 'credits', label: '🎫 クレジット', count: credits.length },
    { key: 'shops', label: '🏪 店舗管理', count: shops.length || null },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">

      {/* ヘッダー */}
      <div className="bg-slate-950 border-b border-white/5 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 💎ロゴ→トップ（管理ツールなので共通Headerは重ねず、既存バーに導線を追加） */}
            <Link to="/" aria-label="トップへ" className="shrink-0">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center text-lg shadow">💎</span>
            </Link>
            <div>
              <h1 className="text-xl font-black">🛠️ 運営ダッシュボード</h1>
              <p className="text-slate-500 text-xs">{user.email}</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm border border-white/10 px-3 py-1.5 rounded-lg transition">
            ← サイトへ戻る
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">

        {/* タブ */}
        <div className="flex gap-2 mb-6 bg-slate-800 p-1 rounded-2xl border border-slate-700 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex-shrink-0 py-2.5 px-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${
                activeTab === tab.key ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}{tab.count != null ? <span className="ml-1 text-xs opacity-60">({tab.count})</span> : ''}
            </button>
          ))}
        </div>

        {/* ── 口コミタブ ── */}
        {(activeTab === 'reviews' || activeTab === 'all') && (
          <>
            <div className="flex gap-2 mb-4">
              {[['new', '🕐 新着順'], ['ungranted', '⏳ 未付与を先に']].map(([k, l]) => (
                <button key={k} onClick={() => setSortBy(k)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${sortBy === k ? 'bg-slate-700 text-white border-slate-600' : 'text-slate-500 border-transparent hover:text-white'}`}>
                  {l}
                </button>
              ))}
              <button onClick={fetchReviews} className="ml-auto px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-white transition">↻ 更新</button>
            </div>

            {isLoadingReviews ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />)}</div>
            ) : displayReviews.length === 0 ? (
              <div className="text-center py-20 text-slate-500">口コミはありません</div>
            ) : (
              <div className="space-y-3">
                {displayReviews.map(r => {
                  const isGranted = grantedIds.has(r.id);
                  const isExpanded = expandedId === r.id;
                  const charCount = (r.content || '').length;
                  const isScraped = SCRAPED_IDS.includes(r.user_id);

                  return (
                    <div key={r.id}
                      className={`border rounded-xl overflow-hidden transition ${isGranted ? 'bg-emerald-950/30 border-emerald-700/30' : 'bg-slate-800 border-slate-700'}`}>

                      {/* 折りたたみヘッダー */}
                      <div className="p-4 cursor-pointer hover:bg-white/5" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                charCount >= 700 ? 'bg-emerald-500/20 text-emerald-300' :
                                charCount >= 300 ? 'bg-amber-500/20 text-amber-300' :
                                'bg-red-500/20 text-red-300'}`}>
                                {charCount}字
                              </span>
                              {isGranted && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">✓ 付与済</span>}
                              {isScraped && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-600/50 text-slate-400">自動</span>}
                              <span className="text-[10px] text-slate-500">{timeAgo(r.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-sm">{r.therapist_name || '不明'}</span>
                              <span className="text-yellow-400 text-xs">★ {Number(r.rating || 0).toFixed(1)}</span>
                            </div>
                            <p className="text-slate-500 text-xs truncate mt-0.5">{r.shop_id}</p>
                          </div>
                          <span className="text-slate-600 text-xs flex-shrink-0">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* 展開エリア */}
                      {isExpanded && (
                        <div className="border-t border-slate-700 p-4 space-y-3">
                          {r.detailed_ratings && (
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(r.detailed_ratings).map(([k, v]) => (
                                <span key={k} className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{k}: {v}</span>
                              ))}
                            </div>
                          )}
                          {r.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {r.tags.map(tag => (
                                <span key={tag} className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">{tag}</span>
                              ))}
                            </div>
                          )}
                          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-900/60 rounded-xl p-3">
                            {r.content}
                          </p>
                          <div className="flex gap-2 justify-end pt-1">
                            <button onClick={() => deleteReview(r.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition">
                              🗑 削除
                            </button>
                            {!isScraped && (
                              <button onClick={() => setSelectedReview(r)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition ${
                                  isGranted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                    : 'bg-pink-500 text-white hover:bg-pink-600'}`}>
                                🎫 {isGranted ? '追加付与' : '閲覧日数を付与'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── クレジットタブ ── */}
        {activeTab === 'credits' && (
          <div className="space-y-3">
            {credits.length === 0 ? (
              <div className="text-center py-20 text-slate-500">付与済みクレジットはありません</div>
            ) : credits.map(c => (
              <div key={c.user_id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-bold font-mono">{c.user_id.slice(0, 20)}...</p>
                  <p className="text-slate-500 text-xs">投稿数: {c.total_reviews_posted} | 更新: {timeAgo(c.updated_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-black ${c.credits_days > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{c.credits_days}日</p>
                  <p className="text-slate-600 text-[10px]">
                    {c.expires_at ? `期限: ${new Date(c.expires_at).toLocaleDateString('ja-JP')}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 店舗管理タブ ── */}
        {activeTab === 'shops' && (
          <>
            <div className="flex gap-3 mb-5">
              <input
                type="text"
                placeholder="店名・IDで検索..."
                value={shopSearch}
                onChange={e => setShopSearch(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
              />
              <button onClick={fetchShops} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 border border-slate-700 hover:text-white transition">↻</button>
            </div>

            {isLoadingShops ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <>
                <p className="text-slate-500 text-xs mb-3">{filteredShops.length}件表示</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredShops.slice(0, 100).map(shop => (
                    <div key={shop.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex gap-3">
                      <div className="w-16 h-16 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 border border-slate-600">
                        {shop.image_url
                          ? <img src={shop.image_url} alt={shop.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{shop.name}</p>
                        <p className="text-slate-500 text-[10px] truncate">{shop.id}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {shop.website_url && <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">HP</span>}
                          {shop.schedule_url && <span className="text-[9px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">予約</span>}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setEditingShop(shop)}
                            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg font-bold transition">編集</button>
                          <button onClick={() => deleteShop(shop.id)}
                            className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-400/40 px-3 py-1 rounded-lg font-bold transition">削除</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* モーダル群 */}
      {selectedReview && (
        <GrantModal review={selectedReview} onClose={() => setSelectedReview(null)}
          onGrant={(id, days) => { setGrantedIds(prev => new Set([...prev, id])); fetchCredits(); }} />
      )}
      {editingShop && (
        <ShopEditModal shop={editingShop} onClose={() => setEditingShop(null)}
          onSave={(updated) => setShops(prev => prev.map(s => s.id === updated.id ? updated : s))} />
      )}
    </div>
  );
}
