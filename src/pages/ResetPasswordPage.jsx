import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from '../compat/router';
import { supabase } from '../lib/supabase';
import SeoHead from '../components/SeoHead.jsx';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(Boolean(data.session));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setHasSession(Boolean(session));
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 8 || password.length > 128) {
      setError('パスワードは8〜128文字で入力してください');
      return;
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError('パスワードを変更できませんでした。リンクを開き直してください。');
      return;
    }
    setDone(true);
    window.setTimeout(() => navigate('/mypage'), 1200);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white flex items-center justify-center">
      <SeoHead title="パスワード再設定" noindex />
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-7 shadow-2xl">
        <h1 className="text-2xl font-black mb-2">パスワード再設定</h1>
        {hasSession === null ? (
          <p className="text-slate-400">リンクを確認しています…</p>
        ) : !hasSession ? (
          <div>
            <p className="text-slate-300 mb-5">リンクの有効期限が切れているか、すでに使用済みです。</p>
            <Link to="/login" className="inline-flex min-h-11 items-center rounded-xl bg-pink-600 px-5 font-bold">再設定メールを送り直す</Link>
          </div>
        ) : done ? (
          <div className="text-center py-5">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-black">パスワードを変更しました</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-6">
            {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            <label className="block text-sm font-bold">
              新しいパスワード
              <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-800 p-3 text-base outline-none focus:border-pink-500" />
            </label>
            <label className="block text-sm font-bold">
              新しいパスワード（確認）
              <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-800 p-3 text-base outline-none focus:border-pink-500" />
            </label>
            <button disabled={saving} className="min-h-12 w-full rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-black disabled:opacity-50">{saving ? '変更中…' : 'パスワードを変更する'}</button>
          </form>
        )}
      </section>
    </main>
  );
}
