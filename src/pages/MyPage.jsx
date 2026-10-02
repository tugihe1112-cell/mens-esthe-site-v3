import React, { useMemo } from 'react';
import LineIcon from '../components/LineIcon.jsx';
import { Link, useNavigate } from '../compat/router';
import { useAuth } from '../contexts/AuthContext';
import { useViewingCredits } from '../hooks/useViewingCredits.js';
import { usePostedReviewCount } from '../hooks/usePostedReviewCount.js';
import { LogOut, PenLine, Heart, History, Shield } from 'lucide-react';
import Header from '../components/Header';
import SeoHead from '../components/SeoHead.jsx';

const ADMIN_EMAILS = ['tugihe1112@gmail.com'];

export default function MyPage() {
  const { user, userPlan, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const viewing = useViewingCredits();
  const posted = usePostedReviewCount();

  const displayName = useMemo(() => {
    const metadataName = user?.user_metadata?.display_name;
    return String(metadataName || user?.email?.split('@')[0] || 'ユーザー').trim();
  }, [user]);

  const expiry = viewing.expiresAt ? new Date(viewing.expiresAt) : null;
  const premium = userPlan === 'vip' || userPlan === 'premium';
  const entitlement = {
    active: viewing.status === 'active',
    label: viewing.status === 'loading' ? '確認中…' : viewing.status === 'error' ? '確認できませんでした'
      : viewing.status === 'active' ? premium ? '読み放題プラン' : `あと${Math.max(1, Math.ceil((expiry.getTime() - Date.now()) / 86_400_000))}日` : '閲覧権の期限切れ',
    expiry: expiry && viewing.status === 'active' ? expiry.toLocaleDateString('ja-JP') : null,
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return <><SeoHead title="マイページ" noindex /><div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">ログイン状態を確認中…</div></>;
  }

  if (!user) {
    return (
      <>
        <SeoHead title="マイページ" noindex />
        <Header />
        <main className="min-h-screen bg-slate-950 pt-24 pb-28 px-4">
          <div className="max-w-md mx-auto rounded-sm border border-white/10 bg-slate-900/50 p-7 text-center">
            <div className="mb-5 flex justify-center text-slate-500"><LineIcon name="lock" size={40} strokeWidth={1.5} /></div>
            <h1 className="text-2xl font-black text-white mb-2">マイページ</h1>
            <p className="text-slate-400 text-sm mb-7">利用するにはログインが必要です。</p>
            <Link to="/login?redirect=%2Fmypage" className="flex min-h-12 items-center justify-center rounded-sm bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black">ログイン</Link>
            <Link to="/register" className="mt-3 flex min-h-11 items-center justify-center text-sm font-bold text-pink-300">無料会員登録</Link>
          </div>
        </main>
      </>
    );
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email);
  const actions = [
    { to: '/my-reviews', label: '投稿した口コミ', sub: posted.status === 'ready' ? `${posted.count}件` : posted.status === 'error' ? '件数を取得できませんでした' : '件数を確認中…', icon: PenLine },
    { to: '/favorites', label: 'お気に入り', sub: '保存した店舗・セラピスト', icon: Heart },
    { to: '/history', label: '閲覧履歴', sub: '最近見たセラピスト', icon: History },
  ];

  return (
    <>
      <SeoHead title="マイページ" noindex />
      <Header />
      <main className="min-h-screen bg-slate-950 pt-20 md:pt-24 pb-28 px-4 text-white">
        <div className="max-w-lg mx-auto space-y-5">
          <section className="rounded-sm border border-white/10 bg-gradient-to-br from-slate-900 to-slate-900/60 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-sm border border-slate-600 bg-slate-800 text-slate-300 flex items-center justify-center"><LineIcon name="person" size={28} strokeWidth={1.5} /></div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-black">{displayName}</h1>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
                <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300">
                  {userPlan === 'vip' ? 'VIP' : userPlan === 'premium' ? 'プレミアム' : '無料会員'}
                </span>
              </div>
            </div>
          </section>

          <section className={`rounded-sm border p-5 ${entitlement.active ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-slate-900/60'}`}>
            <p className="text-xs font-bold text-slate-400">口コミの閲覧権</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <p className={`text-2xl font-black ${entitlement.active ? 'text-emerald-300' : 'text-slate-300'}`}>{entitlement.label}</p>
              {entitlement.expiry && <p className="text-xs text-slate-400">{entitlement.expiry}まで</p>}
            </div>
            {viewing.status === 'error' && <div role="alert" className="mt-3 text-sm text-slate-300"><p>通信状況を確認して、もう一度お試しください。</p><button type="button" onClick={viewing.retry} className="mt-2 min-h-11 text-pink-300 underline">閲覧権を再確認</button></div>}
            {viewing.status === 'expired' && (
              <Link to="/post-review" className="mt-4 flex min-h-11 items-center justify-center rounded-sm bg-pink-600 px-4 text-sm font-black">口コミを書いて閲覧権を得る</Link>
            )}
          </section>

          <nav className="overflow-hidden rounded-sm border border-white/10 bg-slate-900/60">
            {actions.map(({ to, label, sub, icon: Icon }) => (
              <Link key={to} to={to} className="flex min-h-16 items-center gap-4 border-b border-white/5 px-4 last:border-b-0 hover:bg-white/5">
                <Icon size={20} className="text-pink-400" />
                <span className="flex-1"><b className="block text-sm">{label}</b><small className="text-slate-500">{sub}</small></span>
                <span className="text-slate-600">→</span>
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="flex min-h-16 items-center gap-4 border-t border-white/5 px-4 hover:bg-white/5">
                <Shield size={20} className="text-amber-400" />
                <span className="flex-1"><b className="block text-sm">運営ダッシュボード</b><small className="text-slate-500">口コミ・店舗・クレジット管理</small></span>
                <span className="text-slate-600">→</span>
              </Link>
            )}
          </nav>
          {posted.status === 'error' && <button type="button" onClick={posted.retry} className="min-h-11 text-sm text-pink-300 underline">投稿件数を再取得</button>}

          <button onClick={handleLogout} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border border-red-500/20 bg-red-500/5 font-bold text-red-300 hover:bg-red-500/10">
            <LogOut size={18} /> ログアウト
          </button>
        </div>
      </main>
    </>
  );
}
